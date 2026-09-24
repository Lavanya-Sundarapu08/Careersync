package com.careersync.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Generates short-lived pre-signed PUT and GET URLs so the React client uploads and downloads
 * resume PDFs directly to/from S3/MinIO — the Spring Boot JVM never buffers file bytes in heap.
 */
@Service
public class S3PresignService {

    private final S3Presigner presigner;
    private final S3Client s3Client;

    @Value("${app.s3.bucket}") private String bucket;
    @Value("${app.s3.presign-expiry-minutes}") private long expiryMinutes;
    @Value("${app.s3.endpoint:http://localhost:9000}") private String endpoint;

    public S3PresignService(S3Presigner presigner, S3Client s3Client) {
        this.presigner = presigner;
        this.s3Client = s3Client;
    }

    public boolean isS3Reachable() {
        if (endpoint == null) return false;
        if (!endpoint.contains("localhost") && !endpoint.contains("127.0.0.1")) {
            return true;
        }
        try (java.net.Socket socket = new java.net.Socket()) {
            java.net.URI uri = java.net.URI.create(endpoint);
            int port = uri.getPort() > 0 ? uri.getPort() : 9000;
            socket.connect(new java.net.InetSocketAddress(uri.getHost(), port), 100);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public byte[] getObjectBytes(String objectKey) {
        if (!isS3Reachable()) {
            throw new RuntimeException("S3 / MinIO storage is not running on configured endpoint: " + endpoint);
        }
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .build();
        try {
            return s3Client.getObject(getRequest).readAllBytes();
        } catch (Exception e) {
            throw new RuntimeException("S3 object fetch failed: " + e.getMessage(), e);
        }
    }

    public record PresignResult(String uploadUrl, String objectKey, Instant expiresAt) {}
    public record DownloadResult(String downloadUrl, String objectKey, Instant expiresAt) {}

    public PresignResult presignResumeUpload(UUID candidateId, String originalFilename) {
        String safeName = originalFilename == null ? "resume.pdf" : originalFilename.replaceAll("[^a-zA-Z0-9.\\-_]", "_");
        String objectKey = "resumes/%s/%s-%s".formatted(candidateId, UUID.randomUUID(), safeName);
        Duration expiry = Duration.ofMinutes(expiryMinutes);

        if (!isS3Reachable()) {
            // S3/MinIO is not reachable. Return null uploadUrl so the frontend does not hang on connection timeouts.
            return new PresignResult(null, objectKey, Instant.now().plus(expiry));
        }

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .contentType("application/pdf")
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(expiry)
                .putObjectRequest(putRequest)
                .build();

        PresignedPutObjectRequest presigned = presigner.presignPutObject(presignRequest);
        return new PresignResult(presigned.url().toString(), objectKey, Instant.now().plus(expiry));
    }

    public DownloadResult presignResumeDownload(String objectKey) {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .build();

        Duration expiry = Duration.ofMinutes(expiryMinutes);
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(expiry)
                .getObjectRequest(getRequest)
                .build();

        PresignedGetObjectRequest presigned = presigner.presignGetObject(presignRequest);
        return new DownloadResult(presigned.url().toString(), objectKey, Instant.now().plus(expiry));
    }
}
