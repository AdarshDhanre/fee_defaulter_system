package com.feedefaulter.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Configuration
public class DatabaseInitializer {

    @Bean
    public CommandLineRunner initDatabaseSchema(DataSource dataSource) {
        return args -> {
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                
                System.out.println("[DB-INIT] Checking and migrating schema for 'admin' table...");
                
                // Add failed_attempts column if not exists
                try {
                    stmt.execute("ALTER TABLE admin ADD COLUMN IF NOT EXISTS failed_attempts INT DEFAULT 0");
                    System.out.println("[DB-INIT] Column 'failed_attempts' verified/added.");
                } catch (Exception e) {
                    System.out.println("[DB-INIT] Info on failed_attempts column: " + e.getMessage());
                }

                // Add lockout_until column if not exists
                try {
                    stmt.execute("ALTER TABLE admin ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP");
                    System.out.println("[DB-INIT] Column 'lockout_until' verified/added.");
                } catch (Exception e) {
                    System.out.println("[DB-INIT] Info on lockout_until column: " + e.getMessage());
                }

                System.out.println("[DB-INIT] Schema migration completed successfully.");
            } catch (Exception e) {
                System.err.println("[DB-INIT] Database schema migration warning: " + e.getMessage());
            }
        };
    }
}
