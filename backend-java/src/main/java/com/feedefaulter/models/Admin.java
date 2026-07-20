package com.feedefaulter.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "admin")
public class Admin {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 200)
    private String password;

    @Column(length = 10)
    private String otp;

    @Column(name = "is_verified", columnDefinition = "boolean default false")
    private Boolean isVerified = false;

    @Column(name = "failed_attempts", columnDefinition = "integer default 0")
    private Integer failedAttempts = 0;

    @Column(name = "lockout_until")
    private LocalDateTime lockoutUntil;
}
