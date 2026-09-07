package com.sih.casemanagement.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    private static final Logger log = LoggerFactory.getLogger(RedisConfig.class);

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Value("${spring.data.redis.username:default}")
    private String redisUsername;

    @Value("${spring.data.redis.ssl.enabled:false}")
    private boolean sslEnabled;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        String cleanHost = (redisHost != null) ? redisHost.trim() : "localhost";
        int cleanPort = redisPort;

        // Clean any protocol prefixes like https://, rediss://, redis://
        if (cleanHost.startsWith("https://")) {
            cleanHost = cleanHost.substring("https://".length());
        } else if (cleanHost.startsWith("http://")) {
            cleanHost = cleanHost.substring("http://".length());
        } else if (cleanHost.startsWith("rediss://")) {
            cleanHost = cleanHost.substring("rediss://".length());
        } else if (cleanHost.startsWith("redis://")) {
            cleanHost = cleanHost.substring("redis://".length());
        }

        // Clean trailing slashes or paths
        if (cleanHost.contains("/")) {
            cleanHost = cleanHost.substring(0, cleanHost.indexOf('/'));
        }

        // Clean port if embedded in hostname e.g. host:6379
        if (cleanHost.contains(":")) {
            String[] parts = cleanHost.split(":");
            cleanHost = parts[0];
            try {
                cleanPort = Integer.parseInt(parts[1]);
            } catch (NumberFormatException ignored) {}
        }

        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(cleanHost, cleanPort);
        if (redisUsername != null && !redisUsername.isBlank()) {
            config.setUsername(redisUsername);
        }
        if (redisPassword != null && !redisPassword.isBlank()) {
            config.setPassword(redisPassword);
        }
        
        org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration.LettuceClientConfigurationBuilder clientConfigBuilder =
            org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration.builder();
        if (sslEnabled || (redisHost != null && redisHost.contains("upstash.io"))) {
            clientConfigBuilder.useSsl();
        }
        
        LettuceConnectionFactory factory = new LettuceConnectionFactory(config, clientConfigBuilder.build());
        log.info("Configured Upstash/Redis connection factory for {}:{} (ssl={})", redisHost, redisPort, sslEnabled);
        return factory;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        return template;
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }
}
