package com.feedefaulter.controllers;

import com.feedefaulter.models.Fee;
import com.feedefaulter.models.Payment;
import com.feedefaulter.models.Student;
import com.feedefaulter.repositories.FeeRepository;
import com.feedefaulter.repositories.PaymentRepository;
import com.feedefaulter.repositories.StudentRepository;
import com.feedefaulter.services.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final FeeRepository feeRepository;
    private final StudentRepository studentRepository;
    private final AlertService alertService;
    private final Random random = new Random();

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> paymentHistory() {
        List<Payment> payments = paymentRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();

        for (Payment payment : payments) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", payment.getId());
            map.put("amount", payment.getAmount());
            map.put("date", payment.getDate());
            map.put("method", payment.getMethod());
            map.put("transactionId", payment.getTransactionId());

            if (payment.getStudent() != null) {
                map.put("studentId", payment.getStudent().getId());
                map.put("studentName", payment.getStudent().getName());
                map.put("studentRollNo", payment.getStudent().getRollNo());
                map.put("studentEmail", payment.getStudent().getEmail());
            }
            response.add(map);
        }

        // Sort descending by date
        response.sort((a, b) -> ((LocalDateTime) b.get("date")).compareTo((LocalDateTime) a.get("date")));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/pay")
    public ResponseEntity<?> pay(@RequestBody Map<String, Object> body) {
        Long studentId = Long.valueOf(body.get("student_id").toString());
        Integer amount = Integer.valueOf(body.get("amount").toString());

        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Student not found"));
        }

        Student student = studentOpt.get();

        List<Fee> feeRecords = feeRepository.findByStudentId(studentId);
        if (feeRecords.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fee record not found for this student"));
        }

        Fee fee = feeRecords.get(0);

        if (amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid amount"));
        }

        if (amount > fee.getDueAmount()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Amount exceeds due fee (Due: " + fee.getDueAmount() + ")"));
        }

        // Record payment
        Payment payment = new Payment();
        payment.setStudent(student);
        payment.setAmount(amount);
        payment.setMethod("Manual");
        payment.setTransactionId("MANUAL_" + (System.currentTimeMillis() / 1000) + "_" + (1000 + random.nextInt(9000)));
        payment.setDate(LocalDateTime.now());

        paymentRepository.save(payment);

        // Update fee balance
        fee.setPaidAmount(fee.getPaidAmount() + amount);
        feeRepository.save(fee);

        // Send payment success email
        try {
            alertService.sendPaymentSuccessEmail(student, fee, amount, payment.getId());
        } catch (Exception e) {
            System.err.println("[EMAIL ERROR] Failed to send payment confirmation email: " + e.getMessage());
        }

        return ResponseEntity.ok(payment);
    }

    @PostMapping("/alerts/overdue")
    public ResponseEntity<Map<String, String>> sendOverdueAlerts() {
        List<Fee> fees = feeRepository.findAll();
        long overdueCount = fees.stream()
                .filter(f -> "Overdue".equals(f.getStatus()))
                .count();

        if (overdueCount == 0) {
            return ResponseEntity.ok(Map.of("message", "✅ No overdue defaulters found in the database!"));
        }

        int successCount = 0;
        int failCount = 0;

        for (Fee fee : fees) {
            if ("Overdue".equals(fee.getStatus())) {
                if (alertService.alertStudent(fee.getStudent(), fee)) {
                    successCount++;
                } else {
                    failCount++;
                }
            }
        }


        Map<String, String> response = new HashMap<>();
        if (failCount > 0) {
            response.put("message", String.format("❌ Email sending failed for some students. (Sent: %d, Failed: %d)", successCount, failCount));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }

        response.put("message", String.format("📧 SUCCESS: Emails successfully sent to %d overdue defaulters!", successCount));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/alerts/partial")
    public ResponseEntity<Map<String, String>> sendPartialAlerts() {
        List<Fee> fees = feeRepository.findAll();
        long partialCount = fees.stream()
                .filter(f -> "Partial".equals(f.getStatus()))
                .count();

        if (partialCount == 0) {
            return ResponseEntity.ok(Map.of("message", "✅ No partial fees found in the database!"));
        }

        int successCount = 0;
        int failCount = 0;

        for (Fee fee : fees) {
            if ("Partial".equals(fee.getStatus())) {
                if (alertService.alertPartialStudent(fee.getStudent(), fee)) {
                    successCount++;
                } else {
                    failCount++;
                }
            }
        }

        Map<String, String> response = new HashMap<>();
        if (failCount > 0) {
            response.put("message", String.format("❌ Email sending failed for some students. (Sent: %d, Failed: %d)", successCount, failCount));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }

        response.put("message", String.format("📧 SUCCESS: Reminder emails successfully sent to %d partial fee students!", successCount));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/export-csv")
    public ResponseEntity<byte[]> exportCsv() {
        List<Fee> fees = feeRepository.findAll();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(out)) {

            // CSV Header
            writer.println("Student (Roll No),Total Fee,Paid Amount,Due Amount,Status");

            // CSV Body
            for (Fee f : fees) {
                String studentText = f.getStudent() != null
                        ? String.format("%s (%s)", f.getStudent().getName(), f.getStudent().getRollNo())
                        : "Unknown";
                writer.println(String.format("\"%s\",%d,%d,%d,%s",
                        studentText.replace("\"", "\"\""),
                        f.getTotalFee(),
                        f.getPaidAmount(),
                        f.getDueAmount(),
                        f.getStatus()
                ));
            }

            writer.flush();
            byte[] data = out.toByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "fee_report.csv");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return new ResponseEntity<>(data, headers, HttpStatus.OK);

        } catch (Exception e) {
            System.err.println("[ERROR] Failed to export CSV: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
