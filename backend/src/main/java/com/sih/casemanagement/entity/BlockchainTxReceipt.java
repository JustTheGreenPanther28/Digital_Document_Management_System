package com.sih.casemanagement.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "blockchain_tx_receipts")
public class BlockchainTxReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tx_hash", nullable = false, unique = true, length = 100)
    private String txHash;

    @Column(name = "block_number", nullable = false)
    private Long blockNumber;

    @Column(name = "contract_address", nullable = false, length = 100)
    private String contractAddress;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType; // EVIDENCE, DOCUMENT, AUDIT_BATCH

    @Column(name = "entity_id", nullable = false, length = 100)
    private String entityId;

    @Column(name = "case_id")
    private UUID caseId;

    @Column(name = "sha256_hash", nullable = false, length = 64)
    private String sha256Hash;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    @Column(name = "signer_address", nullable = false, length = 100)
    private String signerAddress;

    @Column(name = "gas_used", nullable = false)
    private Long gasUsed;

    @Column(name = "block_timestamp", nullable = false)
    private Instant blockTimestamp;

    @Column(name = "network_name", nullable = false, length = 100)
    private String networkName;

    @Column(name = "raw_payload_json", columnDefinition = "TEXT")
    private String rawPayloadJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public BlockchainTxReceipt() {}

    public BlockchainTxReceipt(
        String txHash,
        Long blockNumber,
        String contractAddress,
        String entityType,
        String entityId,
        UUID caseId,
        String sha256Hash,
        String actionType,
        String signerAddress,
        Long gasUsed,
        Instant blockTimestamp,
        String networkName,
        String rawPayloadJson
    ) {
        this.txHash = txHash;
        this.blockNumber = blockNumber;
        this.contractAddress = contractAddress;
        this.entityType = entityType;
        this.entityId = entityId;
        this.caseId = caseId;
        this.sha256Hash = sha256Hash;
        this.actionType = actionType;
        this.signerAddress = signerAddress;
        this.gasUsed = gasUsed;
        this.blockTimestamp = blockTimestamp;
        this.networkName = networkName;
        this.rawPayloadJson = rawPayloadJson;
        this.createdAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTxHash() { return txHash; }
    public void setTxHash(String txHash) { this.txHash = txHash; }

    public Long getBlockNumber() { return blockNumber; }
    public void setBlockNumber(Long blockNumber) { this.blockNumber = blockNumber; }

    public String getContractAddress() { return contractAddress; }
    public void setContractAddress(String contractAddress) { this.contractAddress = contractAddress; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }

    public String getSha256Hash() { return sha256Hash; }
    public void setSha256Hash(String sha256Hash) { this.sha256Hash = sha256Hash; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getSignerAddress() { return signerAddress; }
    public void setSignerAddress(String signerAddress) { this.signerAddress = signerAddress; }

    public Long getGasUsed() { return gasUsed; }
    public void setGasUsed(Long gasUsed) { this.gasUsed = gasUsed; }

    public Instant getBlockTimestamp() { return blockTimestamp; }
    public void setBlockTimestamp(Instant blockTimestamp) { this.blockTimestamp = blockTimestamp; }

    public String getNetworkName() { return networkName; }
    public void setNetworkName(String networkName) { this.networkName = networkName; }

    public String getRawPayloadJson() { return rawPayloadJson; }
    public void setRawPayloadJson(String rawPayloadJson) { this.rawPayloadJson = rawPayloadJson; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
