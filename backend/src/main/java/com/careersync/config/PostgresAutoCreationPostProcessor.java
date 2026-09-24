package com.careersync.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;

import org.springframework.core.env.MapPropertySource;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Automatically creates the target PostgreSQL database (e.g. 'careersync')
 * on the local/configured PostgreSQL server if it does not already exist.
 * Runs before HikariCP and Flyway connect.
 */
public class PostgresAutoCreationPostProcessor implements EnvironmentPostProcessor {

    private static final Logger log = LoggerFactory.getLogger(PostgresAutoCreationPostProcessor.class);
    private static final Pattern PG_URL_PATTERN = Pattern.compile("^jdbc:postgresql://([^:/]+)(?::(\\d+))?/([^?]+)(?:\\?.*)?$");

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Map REDIS_URL or SPRING_DATA_REDIS_URL if provided
        String redisUrl = environment.getProperty("REDIS_URL");
        if (redisUrl == null || redisUrl.isBlank()) {
            redisUrl = environment.getProperty("SPRING_DATA_REDIS_URL");
        }
        if (redisUrl != null && !redisUrl.isBlank()) {
            Map<String, Object> redisProps = new HashMap<>();
            redisProps.put("spring.data.redis.url", redisUrl);
            environment.getPropertySources().addFirst(new MapPropertySource("redisUrlMapping", redisProps));
        }

        // Sanitize database URL if provided without jdbc: prefix (common in cloud providers like Neon / Render)
        String rawDbUrl = environment.getProperty("SPRING_DATASOURCE_URL");
        if (rawDbUrl == null || rawDbUrl.isBlank()) {
            rawDbUrl = environment.getProperty("DATABASE_URL");
        }
        if (rawDbUrl == null || rawDbUrl.isBlank()) {
            rawDbUrl = environment.getProperty("spring.datasource.url");
        }

        if (rawDbUrl != null && !rawDbUrl.isBlank()) {
            String fixedDbUrl = rawDbUrl.trim();
            if (fixedDbUrl.startsWith("postgres://")) {
                fixedDbUrl = "jdbc:postgresql://" + fixedDbUrl.substring("postgres://".length());
            } else if (fixedDbUrl.startsWith("postgresql://")) {
                fixedDbUrl = "jdbc:postgresql://" + fixedDbUrl.substring("postgresql://".length());
            } else if (!fixedDbUrl.startsWith("jdbc:")) {
                fixedDbUrl = "jdbc:" + fixedDbUrl;
            }

            if (!fixedDbUrl.equals(rawDbUrl)) {
                log.info("Automatically sanitized datasource URL to include 'jdbc:' prefix.");
                Map<String, Object> dbProps = new HashMap<>();
                dbProps.put("spring.datasource.url", fixedDbUrl);
                environment.getPropertySources().addFirst(new MapPropertySource("sanitizedDatasourceUrl", dbProps));
            }
        }

        String url = environment.getProperty("spring.datasource.url");
        String username = environment.getProperty("spring.datasource.username");
        String password = environment.getProperty("spring.datasource.password");

        if (url == null || !url.startsWith("jdbc:postgresql://")) {
            return;
        }

        // Do not attempt auto-create on managed cloud DBs (e.g. Neon, Render, Supabase)
        if (url.contains("neon.tech") || url.contains("render.com") || url.contains("supabase.co")
                || Boolean.parseBoolean(environment.getProperty("app.db.auto-create.disabled", "false"))) {
            return;
        }

        Matcher matcher = PG_URL_PATTERN.matcher(url);
        if (!matcher.matches()) {
            return;
        }

        String host = matcher.group(1);
        String port = matcher.group(2) != null ? matcher.group(2) : "5432";
        String targetDb = matcher.group(3);

        // Don't auto-create default 'postgres' database
        if ("postgres".equalsIgnoreCase(targetDb)) {
            return;
        }

        String maintenanceUrl = String.format("jdbc:postgresql://%s:%s/postgres", host, port);

        log.info("Checking if PostgreSQL database '{}' exists at {}:{}...", targetDb, host, port);

        try {
            // Load driver explicitly in post-processor context
            Class.forName("org.postgresql.Driver");

            try (Connection conn = DriverManager.getConnection(maintenanceUrl, username, password);
                 Statement stmt = conn.createStatement()) {

                try (ResultSet rs = stmt.executeQuery(
                        "SELECT 1 FROM pg_database WHERE datname = '" + targetDb.replace("'", "''") + "'")) {
                    if (rs.next()) {
                        log.info("PostgreSQL database '{}' already exists.", targetDb);
                        return;
                    }
                }

                log.info("Database '{}' does not exist. Creating it automatically...", targetDb);
                stmt.executeUpdate("CREATE DATABASE \"" + targetDb.replace("\"", "\"\"") + "\"");
                log.info("Successfully created database '{}'.", targetDb);

            }
        } catch (Exception e) {
            log.warn("Could not auto-create database '{}' (will proceed to normal DataSource startup): {}", 
                     targetDb, e.getMessage());
        }
    }
}
