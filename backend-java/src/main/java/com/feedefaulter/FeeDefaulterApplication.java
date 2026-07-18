package com.feedefaulter;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FeeDefaulterApplication {

    public static void main(String[] args) {
        try {
            // Load dotenv from root project dir
            Dotenv dotenv = Dotenv.configure()
                    .directory("../")
                    .ignoreIfMalformed()
                    .ignoreIfMissing()
                    .load();
            
            // Register standard dotenv variables into System Properties
            dotenv.entries().forEach(entry -> {
                System.setProperty(entry.getKey(), entry.getValue());
            });

            // Parse DATABASE_URL if present (e.g. postgresql://user:pass@host:port/db)
            String dbUrl = dotenv.get("DATABASE_URL");
            if (dbUrl == null || dbUrl.isEmpty()) {
                dbUrl = System.getenv("DATABASE_URL");
            }
            if (dbUrl != null && !dbUrl.isEmpty()) {
                System.out.println("[INIT] Found DATABASE_URL in .env, parsing connection details...");
                String cleanUrl = dbUrl.replace("postgresql://", "").replace("postgres://", "");
                int lastAtIndex = cleanUrl.lastIndexOf("@");
                if (lastAtIndex != -1) {
                    String credentials = cleanUrl.substring(0, lastAtIndex);
                    String connection = cleanUrl.substring(lastAtIndex + 1);
                    
                    if (credentials.contains(":")) {
                        String[] credParts = credentials.split(":", 2);
                        String decodedUsername = java.net.URLDecoder.decode(credParts[0], java.nio.charset.StandardCharsets.UTF_8);
                        String rawPassword = credParts[1];
                        String decodedPassword = java.net.URLDecoder.decode(rawPassword, java.nio.charset.StandardCharsets.UTF_8);
                        
                        String jdbcUrl = "jdbc:postgresql://" + connection + "?sslmode=require&prepareThreshold=0";
                        
                        // Test connection with decoded password
                        boolean decodedWorks = false;
                        try {
                            // Load driver explicitly just in case
                            Class.forName("org.postgresql.Driver");
                            try (java.sql.Connection conn = java.sql.DriverManager.getConnection(jdbcUrl, decodedUsername, decodedPassword)) {
                                decodedWorks = true;
                                System.out.println("[INIT] Database connection test succeeded with URL-decoded password.");
                            }
                        } catch (Exception e) {
                            System.out.println("[INIT] Database connection test with URL-decoded password failed: " + e.getMessage());
                        }
                        
                        String finalPassword = decodedWorks ? decodedPassword : rawPassword;
                        if (!decodedWorks) {
                            System.out.println("[INIT] Falling back to raw password (preserving literal characters like %40).");
                        }
                        
                        System.setProperty("spring.datasource.username", decodedUsername);
                        System.setProperty("spring.datasource.password", finalPassword);
                    } else {
                        String decodedUsername = java.net.URLDecoder.decode(credentials, java.nio.charset.StandardCharsets.UTF_8);
                        System.setProperty("spring.datasource.username", decodedUsername);
                    }
                    
                    System.setProperty("spring.datasource.url", "jdbc:postgresql://" + connection + "?sslmode=require&prepareThreshold=0");
                } else {
                    System.setProperty("spring.datasource.url", "jdbc:postgresql://" + cleanUrl + "?sslmode=require&prepareThreshold=0");
                }
                System.out.println("[INIT] spring.datasource.url set to: " + System.getProperty("spring.datasource.url"));
            } else {
                System.out.println("[INIT] DATABASE_URL not found in .env, falling back to individual parameters.");
            }
        } catch (Exception e) {
            System.out.println("[WARN] Dotenv loading/parsing failed: " + e.getMessage());
        }

        SpringApplication.run(FeeDefaulterApplication.class, args);
    }

}

