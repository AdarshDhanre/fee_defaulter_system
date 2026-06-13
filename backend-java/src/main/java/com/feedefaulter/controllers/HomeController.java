package com.feedefaulter.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> home() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "message", "Fee Defaulter System Java API is active and running successfully!",
            "database", "Connected to Supabase PostgreSQL"
        ));
    }
}
