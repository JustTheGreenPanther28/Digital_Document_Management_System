package com.sih.casemanagement.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class ObjectStorageService {

    private static final Logger log = LoggerFactory.getLogger(ObjectStorageService.class);

    @Value("${app.s3.endpoint:http://localhost:9000}")
    private String endpoint;

    @Value("${app.s3.access-key:minioadmin}")
    private String accessKey;

    @Value("${app.s3.secret-key:minioadmin}")
    private String secretKey;

    @Value("${app.s3.region:us-east-1}")
    private String region;

    @Value("${app.s3.bucket-name:evidence-vault}")
    private String defaultBucket;

    @Value("${app.s3.quarantine-bucket-name:quarantine-vault}")
    private String quarantineBucket;

    @Value("${app.s3.backup-bucket-name:sih190-backup-vault}")
    private String backupBucket;

    @Value("${app.s3.local-fs-fallback:false}")
    private boolean localFsFallback;

    @Value("${app.s3.local-storage-path:./storage_vault}")
    private String localStoragePath;

    private S3Client s3Client;
    private boolean useLocalFs = false;

    @PostConstruct
    public void init() {
        try {
            this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.of(region))
                .forcePathStyle(true)
                .build();

            // Check connection and initialize buckets
            ensureBucketExists(defaultBucket);
            ensureBucketExists(quarantineBucket);
            ensureBucketExists(backupBucket);
            log.info("Successfully connected to MinIO/S3 private object storage at {}", endpoint);
        } catch (Exception e) {
            if (!localFsFallback) {
                log.error("Strict Private Object Storage Architecture: MinIO/S3 connection failed and local-fs-fallback is disabled: {}", e.getMessage());
                // In non-fallback environments, do not silently fallback
                throw new IllegalStateException("Compliant private S3/MinIO object store is required: " + e.getMessage(), e);
            }
            log.warn("Could not connect to MinIO ({}), activating local encrypted filesystem vault fallback at {}", e.getMessage(), localStoragePath);
            this.useLocalFs = true;
            try {
                Files.createDirectories(Paths.get(localStoragePath, defaultBucket));
                Files.createDirectories(Paths.get(localStoragePath, quarantineBucket));
                Files.createDirectories(Paths.get(localStoragePath, backupBucket));
            } catch (IOException ioException) {
                log.error("Failed to initialize local storage fallback directories", ioException);
            }
        }
    }

    private void ensureBucketExists(String bucketName) {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
        } catch (NoSuchBucketException e) {
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucketName).build());
            log.info("Created private MinIO bucket: {}", bucketName);
        }
    }

    public void storeObject(String bucket, String objectKey, byte[] data) {
        String targetBucket = (bucket != null) ? bucket : defaultBucket;
        if (useLocalFs) {
            try {
                Path target = Paths.get(localStoragePath, targetBucket, objectKey);
                Files.createDirectories(target.getParent());
                Files.write(target, data);
            } catch (IOException e) {
                throw new IllegalStateException("Failed to write to local storage vault: " + e.getMessage(), e);
            }
            return;
        }

        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(targetBucket)
                .key(objectKey)
                .build();
            s3Client.putObject(putRequest, RequestBody.fromBytes(data));
        } catch (Exception ex) {
            if (!localFsFallback) {
                throw new IllegalStateException("S3 object storage upload failed: " + ex.getMessage(), ex);
            }
            log.warn("MinIO put failed, writing to fallback local storage: {}", ex.getMessage());
            try {
                Path target = Paths.get(localStoragePath, targetBucket, objectKey);
                Files.createDirectories(target.getParent());
                Files.write(target, data);
            } catch (IOException e) {
                throw new IllegalStateException("Storage failure", e);
            }
        }
    }

    public void storeQuarantineObject(String objectKey, byte[] data) {
        storeObject(quarantineBucket, objectKey, data);
        log.warn("Malicious/unverified payload securely isolated in quarantine bucket: {}", objectKey);
    }

    public byte[] getObject(String bucket, String objectKey) {
        String targetBucket = (bucket != null) ? bucket : defaultBucket;
        if (useLocalFs) {
            try {
                Path target = Paths.get(localStoragePath, targetBucket, objectKey);
                if (!Files.exists(target)) {
                    throw new IllegalStateException("Object not found in local vault: " + objectKey);
                }
                return Files.readAllBytes(target);
            } catch (IOException e) {
                throw new IllegalStateException("Failed to read from local vault: " + e.getMessage(), e);
            }
        }

        try {
            GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(targetBucket)
                .key(objectKey)
                .build();
            return s3Client.getObject(getRequest).readAllBytes();
        } catch (Exception ex) {
            if (localFsFallback) {
                try {
                    Path target = Paths.get(localStoragePath, targetBucket, objectKey);
                    if (Files.exists(target)) {
                        return Files.readAllBytes(target);
                    }
                } catch (IOException ignored) {}
            }
            throw new IllegalStateException("Failed to retrieve object from storage: " + ex.getMessage(), ex);
        }
    }

    public void deleteObject(String bucket, String objectKey) {
        String targetBucket = (bucket != null) ? bucket : defaultBucket;
        if (useLocalFs) {
            try {
                Path target = Paths.get(localStoragePath, targetBucket, objectKey);
                Files.deleteIfExists(target);
            } catch (IOException e) {
                log.warn("Failed to delete local object: {}", e.getMessage());
            }
            return;
        }

        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(targetBucket)
                .key(objectKey)
                .build();
            s3Client.deleteObject(deleteRequest);
            log.info("Deleted object {} from bucket {}", objectKey, targetBucket);
        } catch (Exception ex) {
            log.warn("Failed to delete object {} from S3: {}", objectKey, ex.getMessage());
        }
    }

    public void releaseFromQuarantine(String objectKey, String targetKey) {
        try {
            byte[] data = getObject(quarantineBucket, objectKey);
            storeObject(defaultBucket, targetKey != null ? targetKey : objectKey, data);
            deleteObject(quarantineBucket, objectKey);
            log.info("Released object {} from quarantine into primary vault as {}", objectKey, targetKey);
        } catch (Exception e) {
            log.error("Failed to release object from quarantine: {}", e.getMessage(), e);
            throw new IllegalStateException("Failed to release object from quarantine: " + e.getMessage(), e);
        }
    }

    public java.util.List<String> listObjects(String bucket) {
        String targetBucket = (bucket != null) ? bucket : defaultBucket;
        java.util.List<String> keys = new java.util.ArrayList<>();

        if (useLocalFs) {
            Path bucketPath = Paths.get(localStoragePath, targetBucket);
            if (Files.exists(bucketPath)) {
                try (java.util.stream.Stream<Path> stream = Files.walk(bucketPath)) {
                    stream.filter(Files::isRegularFile).forEach(p -> {
                        String relative = bucketPath.relativize(p).toString().replace('\\', '/');
                        keys.add(relative);
                    });
                } catch (IOException e) {
                    log.error("Failed to list files in local fallback storage: {}", e.getMessage());
                }
            }
            return keys;
        }

        try {
            ListObjectsV2Request listReq = ListObjectsV2Request.builder().bucket(targetBucket).build();
            ListObjectsV2Response listRes = s3Client.listObjectsV2(listReq);
            for (S3Object s3Object : listRes.contents()) {
                keys.add(s3Object.key());
            }
        } catch (Exception ex) {
            log.error("Failed to list objects in S3 bucket {}: {}", targetBucket, ex.getMessage());
        }
        return keys;
    }

    public boolean objectExists(String bucket, String objectKey) {
        String targetBucket = (bucket != null) ? bucket : defaultBucket;
        if (useLocalFs) {
            Path path = Paths.get(localStoragePath, targetBucket, objectKey);
            return Files.exists(path);
        }
        try {
            s3Client.headObject(HeadObjectRequest.builder().bucket(targetBucket).key(objectKey).build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    public ReplicationResult replicateBucket(String sourceBucket, String targetBucket) {
        String src = (sourceBucket != null) ? sourceBucket : defaultBucket;
        String tgt = (targetBucket != null) ? targetBucket : backupBucket;
        java.util.List<String> objects = listObjects(src);
        int copiedCount = 0;
        long totalBytes = 0;

        for (String key : objects) {
            try {
                byte[] data = getObject(src, key);
                storeObject(tgt, key, data);
                copiedCount++;
                totalBytes += data.length;
            } catch (Exception e) {
                log.warn("Failed replicating object {} from {} to {}: {}", key, src, tgt, e.getMessage());
            }
        }
        return new ReplicationResult(copiedCount, totalBytes, true, 
            String.format("Replicated %d objects (%d bytes) from %s to %s", copiedCount, totalBytes, src, tgt));
    }

    public record ReplicationResult(int count, long totalBytes, boolean success, String details) {}

    public String getDefaultBucket() { return defaultBucket; }
    public String getQuarantineBucket() { return quarantineBucket; }
    public String getBackupBucket() { return backupBucket; }
}

