package com.feedefaulter.controllers;

import com.feedefaulter.models.Admin;
import com.feedefaulter.models.Student;
import com.feedefaulter.repositories.AdminRepository;
import com.feedefaulter.repositories.StudentRepository;
import com.feedefaulter.services.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AdminRepository adminRepository;
    private final StudentRepository studentRepository;
    private final AlertService alertService;
    private final PasswordEncoder passwordEncoder;
    private static final Map<String, Integer> inMemoryFailedAttempts = new java.util.concurrent.ConcurrentHashMap<>();
    private static final Map<String, LocalDateTime> inMemoryLockoutUntil = new java.util.concurrent.ConcurrentHashMap<>();

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String username = credentials != null ? credentials.get("username") : null;
        String password = credentials != null ? credentials.get("password") : null;

        Map<String, Object> response = new HashMap<>();

        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            response.put("error", "Username and password are required!");
            return ResponseEntity.status(400).body(response);
        }

        Optional<Admin> adminOpt = Optional.empty();
        try {
            adminOpt = adminRepository.findByUsername(username);
        } catch (Exception e) {
            System.err.println("[WARN] Database query failed: " + e.getMessage());
        }

        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();

            // 1. Check if account is locked out (from DB or in-memory fallback)
            LocalDateTime lockoutTime = admin.getLockoutUntil();
            if (lockoutTime == null) {
                lockoutTime = inMemoryLockoutUntil.get(username.toLowerCase());
            }

            if (lockoutTime != null) {
                if (lockoutTime.isAfter(LocalDateTime.now())) {
                    long remainingSeconds = Duration.between(LocalDateTime.now(), lockoutTime).getSeconds();
                    long remainingMinutes = Math.max(1, (remainingSeconds + 59) / 60);
                    response.put("error", String.format("Account is locked due to 5 unsuccessful login attempts! Try again in %d minute(s) or reset your password.", remainingMinutes));
                    return ResponseEntity.status(429).body(response);
                } else {
                    // Lockout period expired
                    admin.setLockoutUntil(null);
                    admin.setFailedAttempts(0);
                    inMemoryLockoutUntil.remove(username.toLowerCase());
                    inMemoryFailedAttempts.remove(username.toLowerCase());
                    try { adminRepository.save(admin); } catch (Exception ignored) {}
                }
            }

            boolean matches = passwordEncoder.matches(password, admin.getPassword());
            boolean isWerkzeug = false;

            if (!matches) {
                if (com.feedefaulter.utils.WerkzeugPasswordEncoder.checkPassword(password, admin.getPassword())) {
                    matches = true;
                    isWerkzeug = true;
                }
            }

            if (matches) {
                // Successful login -> Reset failed attempts
                admin.setFailedAttempts(0);
                admin.setLockoutUntil(null);
                inMemoryFailedAttempts.remove(username.toLowerCase());
                inMemoryLockoutUntil.remove(username.toLowerCase());

                if (Boolean.FALSE.equals(admin.getIsVerified())) {
                    try { adminRepository.save(admin); } catch (Exception ignored) {}
                    response.put("error", "Account not verified! Please verify OTP.");
                    response.put("email", admin.getEmail());
                    return ResponseEntity.status(403).body(response);
                }

                if (isWerkzeug) {
                    try {
                        admin.setPassword(passwordEncoder.encode(password));
                        System.out.println("[INFO] Upgraded admin '" + admin.getUsername() + "' password hash from Werkzeug to BCrypt.");
                    } catch (Exception e) {
                        System.err.println("[WARN] Failed to upgrade Werkzeug password hash to BCrypt: " + e.getMessage());
                    }
                }

                try { adminRepository.save(admin); } catch (Exception ignored) {}

                response.put("token", "mock-jwt-admin-token-" + admin.getId());
                response.put("role", "ADMIN");
                response.put("username", admin.getUsername());
                response.put("id", admin.getId());
                return ResponseEntity.ok(response);
            } else {
                // Increment failed attempts
                int dbAttempts = admin.getFailedAttempts() != null ? admin.getFailedAttempts() : 0;
                int memAttempts = inMemoryFailedAttempts.getOrDefault(username.toLowerCase(), 0);
                int currentAttempts = Math.max(dbAttempts, memAttempts) + 1;

                inMemoryFailedAttempts.put(username.toLowerCase(), currentAttempts);
                admin.setFailedAttempts(currentAttempts);

                if (currentAttempts >= 5) {
                    LocalDateTime until = LocalDateTime.now().plusMinutes(15);
                    admin.setLockoutUntil(until);
                    inMemoryLockoutUntil.put(username.toLowerCase(), until);
                    try { adminRepository.save(admin); } catch (Exception ignored) {}

                    response.put("error", "You have reached 5 unsuccessful login attempts! Account is locked for 15 minutes.");
                    return ResponseEntity.status(429).body(response);
                } else {
                    try { adminRepository.save(admin); } catch (Exception ignored) {}
                    int remainingAttempts = 5 - currentAttempts;
                    response.put("error", String.format("Invalid username or password! You have %d unsuccessful attempt(s). %d attempt(s) remaining before 15-min lockout.", currentAttempts, remainingAttempts));
                    return ResponseEntity.status(401).body(response);
                }
            }
        }

        response.put("error", "Invalid username or password!");
        return ResponseEntity.status(401).body(response);
    }

    @PostMapping("/student-login")
    public ResponseEntity<Map<String, Object>> studentLogin(@RequestBody Map<String, String> credentials) {
        String rollNo = credentials.get("roll_no");
        String email = credentials.get("email");

        Map<String, Object> response = new HashMap<>();

        Optional<Student> studentOpt = studentRepository.findByRollNo(rollNo);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            if (student.getEmail().equalsIgnoreCase(email)) {
                response.put("token", "mock-jwt-student-token-" + student.getId());
                response.put("role", "STUDENT");
                response.put("name", student.getName());
                response.put("id", student.getId());
                return ResponseEntity.ok(response);
            }
        }

        response.put("error", "Invalid Roll Number or Email!");
        return ResponseEntity.status(401).body(response);
    }

    private boolean isValidPassword(String password) {
        if (password == null || password.length() < 6) {
            return false;
        }
        // First letter must be uppercase (A-Z)
        if (!Character.isUpperCase(password.charAt(0))) {
            return false;
        }
        // Must contain at least one special character
        return java.util.regex.Pattern.compile("[^a-zA-Z0-9]").matcher(password).find();
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String email = body.get("email");
        String password = body.get("password");

        Map<String, Object> response = new HashMap<>();

        if (!isValidPassword(password)) {
            response.put("error", "Password must start with a Capital letter (A-Z) and contain at least 1 special character!");
            return ResponseEntity.status(400).body(response);
        }

        if (adminRepository.findByUsername(username).isPresent() || adminRepository.findByEmail(email).isPresent()) {
            response.put("error", "Username or Email already exists!");
            return ResponseEntity.status(400).body(response);
        }

        String otp = String.format("%06d", random.nextInt(1000000));

        Admin admin = new Admin();
        admin.setUsername(username);
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setOtp(otp);
        admin.setIsVerified(false);

        adminRepository.save(admin);

        // Send OTP Email
        String subject = "🔐 Your OTP for Fee System";
        String message = String.format("Hello %s,\n\nYour OTP for account verification is: %s\n\nPlease enter this on the verification screen to complete your registration.", username, otp);
        alertService.sendEmail(email, subject, message, false);

        response.put("success", true);
        response.put("email", email);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");

        Map<String, Object> response = new HashMap<>();
        Optional<Admin> adminOpt = adminRepository.findByEmail(email);

        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            if (otp.equals(admin.getOtp())) {
                admin.setIsVerified(true);
                admin.setOtp(null);
                adminRepository.save(admin);

                response.put("success", true);
                return ResponseEntity.ok(response);
            }
        }

        response.put("error", "Invalid OTP! Please try again.");
        return ResponseEntity.status(400).body(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");

        Map<String, Object> response = new HashMap<>();
        Optional<Admin> adminOpt = adminRepository.findByEmail(email);

        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            String otp = String.format("%06d", random.nextInt(1000000));
            admin.setOtp(otp);
            adminRepository.save(admin);

            // Send reset OTP
            String subject = "🔑 Reset Your Admin Password";
            String message = String.format("Hello %s,\n\nYou requested to reset your admin password. Your reset OTP code is: %s\n\nPlease enter this code on the password reset page to choose a new password.", admin.getUsername(), otp);
            alertService.sendEmail(email, subject, message, false);

            response.put("success", true);
            response.put("email", email);
            return ResponseEntity.ok(response);
        }

        response.put("error", "Email address not found!");
        return ResponseEntity.status(404).body(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        String password = body.get("password");

        Map<String, Object> response = new HashMap<>();

        if (!isValidPassword(password)) {
            response.put("error", "Password must start with a Capital letter (A-Z) and contain at least 1 special character!");
            return ResponseEntity.status(400).body(response);
        }

        Optional<Admin> adminOpt = adminRepository.findByEmail(email);

        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            if (otp.equals(admin.getOtp())) {
                admin.setPassword(passwordEncoder.encode(password));
                admin.setIsVerified(true);
                admin.setOtp(null);
                adminRepository.save(admin);

                response.put("success", true);
                return ResponseEntity.ok(response);
            }
        }

        response.put("error", "Invalid OTP! Please try again.");
        return ResponseEntity.status(400).body(response);
    }
}
