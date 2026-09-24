package com.careersync.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;

import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
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
            if ((fixedDbUrl.startsWith("\"") && fixedDbUrl.endsWith("\"")) ||
                (fixedDbUrl.startsWith("'") && fixedDbUrl.endsWith("'"))) {
                fixedDbUrl = fixedDbUrl.substring(1, fixedDbUrl.length() - 1).trim();
            }

            Map<String, Object> dbProps = new HashMap<>();

            // Handle libpq URI format: postgresql://user:pass@host/db or jdbc:postgresql://user:pass@host/db
            String parseable = fixedDbUrl;
            if (parseable.startsWith("jdbc:")) {
                parseable = parseable.substring("jdbc:".length());
            }
            if (parseable.startsWith("postgres://")) {
                parseable = "postgresql://" + parseable.substring("postgres://".length());
            }

            if (parseable.contains("@")) {
                try {
                    URI uri = URI.create(parseable);
                    String userInfo = uri.getUserInfo();
                    if (userInfo != null) {
                        String[] parts = userInfo.split(":", 2);
                        String user = URLDecoder.decode(parts[0], StandardCharsets.UTF_8);
                        dbProps.put("spring.datasource.username", user);
                        dbProps.put("SPRING_DATASOURCE_USERNAME", user);
                        if (parts.length > 1) {
                            String pass = URLDecoder.decode(parts[1], StandardCharsets.UTF_8);
                            dbProps.put("spring.datasource.password", pass);
                            dbProps.put("SPRING_DATASOURCE_PASSWORD", pass);
                        }
                    }

                    String host = uri.getHost();
                    int port = uri.getPort();
                    String path = uri.getPath();
                    String query = uri.getQuery();

                    StringBuilder cleanUrl = new StringBuilder("jdbc:postgresql://").append(host);
                    if (port > 0) {
                        cleanUrl.append(":").append(port);
                    }
                    if (path != null && !path.isBlank()) {
                        cleanUrl.append(path);
                    } else {
                        cleanUrl.append("/careersync");
                    }

                    if (query != null && !query.isBlank()) {
                        String[] params = query.split("&");
                        StringBuilder cleanQuery = new StringBuilder();
                        for (String p : params) {
                            if (p.startsWith("channel_binding=")) {
                                continue;
                            }
                            if (cleanQuery.length() > 0) {
                                cleanQuery.append("&");
                            }
                            cleanQuery.append(p);
                        }
                        if (cleanQuery.length() > 0) {
                            cleanUrl.append("?").append(cleanQuery);
                        }
                    }

                    fixedDbUrl = cleanUrl.toString();
                    log.info("Extracted database credentials and sanitized URL to: {}", 
                        fixedDbUrl.replaceAll(":[^/@]+@", ":****@"));

                } catch (Exception e) {
                    log.warn("URI parsing failed ({}), applying fallback regex...", e.getMessage());
                    Pattern credPattern = Pattern.compile("^(?:jdbc:)?(?:postgres|postgresql)://([^:]+):([^@]+)@([^:/?#]+)(?::(\\d+))?(/[^?#]*)?(?:\\?(.*))?$");
                    Matcher m = credPattern.matcher(fixedDbUrl);
                    if (m.matches()) {
                        String user = m.group(1);
                        String pass = m.group(2);
                        String host = m.group(3);
                        String port = m.group(4);
                        String path = m.group(5) != null ? m.group(5) : "/careersync";
                        String query = m.group(6);

                        dbProps.put("spring.datasource.username", user);
                        dbProps.put("SPRING_DATASOURCE_USERNAME", user);
                        dbProps.put("spring.datasource.password", pass);
                        dbProps.put("SPRING_DATASOURCE_PASSWORD", pass);

                        StringBuilder cleanUrl = new StringBuilder("jdbc:postgresql://").append(host);
                        if (port != null) cleanUrl.append(":").append(port);
                        cleanUrl.append(path);
                        if (query != null) {
                            query = query.replace("channel_binding=require", "").replaceAll("&+", "&").replaceAll("^&|&$", "");
                            if (!query.isBlank()) {
                                cleanUrl.append("?").append(query);
                            }
                        }
                        fixedDbUrl = cleanUrl.toString();
                    }
                }
            } else {
                if (fixedDbUrl.startsWith("postgres://")) {
                    fixedDbUrl = "jdbc:postgresql://" + fixedDbUrl.substring("postgres://".length());
                } else if (fixedDbUrl.startsWith("postgresql://")) {
                    fixedDbUrl = "jdbc:postgresql://" + fixedDbUrl.substring("postgresql://".length());
                } else if (!fixedDbUrl.startsWith("jdbc:")) {
                    fixedDbUrl = "jdbc:" + fixedDbUrl;
                }
                if (fixedDbUrl.contains("channel_binding=")) {
                    fixedDbUrl = fixedDbUrl.replace("channel_binding=require", "").replaceAll("&+", "&").replaceAll("^&|&$|\\?$", "");
                }
            }

            dbProps.put("spring.datasource.url", fixedDbUrl);
            dbProps.put("SPRING_DATASOURCE_URL", fixedDbUrl);
            dbProps.put("DATABASE_URL", fixedDbUrl);
            environment.getPropertySources().addFirst(new MapPropertySource("sanitizedDatasourceUrl", dbProps));
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
