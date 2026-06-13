package com.feedefaulter.controllers;

import com.feedefaulter.models.Fee;
import com.feedefaulter.models.OfflineReceipt;
import com.feedefaulter.models.Payment;
import com.feedefaulter.models.Student;
import com.feedefaulter.repositories.FeeRepository;
import com.feedefaulter.repositories.OfflineReceiptRepository;
import com.feedefaulter.repositories.PaymentRepository;
import com.feedefaulter.repositories.StudentRepository;
import com.feedefaulter.services.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final StudentRepository studentRepository;
    private final FeeRepository feeRepository;
    private final OfflineReceiptRepository offlineReceiptRepository;
    private final PaymentRepository paymentRepository;
    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalStudents = studentRepository.count();

        List<Fee> fees = feeRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        long paidCount = fees.stream()
                .filter(f -> f.getTotalFee() != null && f.getPaidAmount() != null && f.getPaidAmount() >= f.getTotalFee())
                .count();

        long overdueCount = fees.stream()
                .filter(f -> f.getTotalFee() != null && f.getPaidAmount() != null && f.getPaidAmount() < f.getTotalFee()
                        && f.getDeadline() != null && now.isAfter(f.getDeadline()))
                .count();

        long partialCount = fees.stream()
                .filter(f -> f.getTotalFee() != null && f.getPaidAmount() != null && f.getPaidAmount() < f.getTotalFee()
                        && (f.getDeadline() == null || !now.isAfter(f.getDeadline())))
                .count();

        int totalFinePending = fees.stream()
                .mapToInt(Fee::getLateFine)
                .sum();

        int totalDueAmount = fees.stream()
                .mapToInt(Fee::getDueAmount)
                .sum();

        int totalFeesCollected = fees.stream()
                .mapToInt(f -> f.getPaidAmount() != null ? f.getPaidAmount() : 0)
                .sum();

        // Branch-wise revenue breakdown
        Map<String, Integer> branchRevenueMap = new HashMap<>();
        for (Fee fee : fees) {
            if (fee.getStudent() != null && fee.getPaidAmount() != null) {
                String branch = fee.getStudent().getBranch();
                if (branch == null || branch.isEmpty()) {
                    branch = "Unknown";
                }
                branchRevenueMap.put(branch, branchRevenueMap.getOrDefault(branch, 0) + fee.getPaidAmount());
            }
        }

        List<String> branchLabels = new ArrayList<>(branchRevenueMap.keySet());
        List<Integer> branchRevenue = new ArrayList<>(branchRevenueMap.values());

        // Fetch pending receipts
        List<OfflineReceipt> pendingReceipts = offlineReceiptRepository.findByStatus("Pending");

        // Convert pending receipts to simple map response to avoid lazy loading issues
        List<Map<String, Object>> receiptList = pendingReceipts.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("filePath", r.getFilePath());
            map.put("extractedUtr", r.getExtractedUtr());
            map.put("extractedAmount", r.getExtractedAmount());
            map.put("extractedDate", r.getExtractedDate());
            map.put("aiConfidence", r.getAiConfidence());
            map.put("status", r.getStatus());
            map.put("uploadDate", r.getUploadDate());
            if (r.getStudent() != null) {
                map.put("studentId", r.getStudent().getId());
                map.put("studentName", r.getStudent().getName());
                map.put("studentRollNo", r.getStudent().getRollNo());
                map.put("studentEmail", r.getStudent().getEmail());
            }
            return map;
        }).collect(Collectors.toList());

        stats.put("totalStudents", totalStudents);
        stats.put("paidCount", paidCount);
        stats.put("overdueCount", overdueCount);
        stats.put("partialCount", partialCount);
        stats.put("totalFinePending", totalFinePending);
        stats.put("totalDueAmount", totalDueAmount);
        stats.put("totalFeesCollected", totalFeesCollected);
        stats.put("branchLabels", branchLabels);
        stats.put("branchRevenue", branchRevenue);
        stats.put("pendingReceipts", receiptList);

        return ResponseEntity.ok(stats);
    }

    @PostMapping("/verify-receipt")
    public ResponseEntity<Map<String, String>> verifyReceipt(@RequestBody Map<String, Object> body) {
        Long receiptId = Long.valueOf(body.get("receipt_id").toString());
        String action = (String) body.get("action"); // 'approve' or 'reject'

        Map<String, String> response = new HashMap<>();
        Optional<OfflineReceipt> receiptOpt = offlineReceiptRepository.findById(receiptId);

        if (receiptOpt.isEmpty()) {
            response.put("error", "Receipt not found");
            return ResponseEntity.status(404).body(response);
        }

        OfflineReceipt receipt = receiptOpt.get();
        Student student = receipt.getStudent();

        if ("approve".equalsIgnoreCase(action)) {
            receipt.setStatus("Approved");

            String utr = receipt.getExtractedUtr();
            boolean paymentExists = false;
            if (utr != null && !utr.trim().isEmpty()) {
                paymentExists = paymentRepository.findByTransactionId(utr).isPresent();
            }

            if (!paymentExists) {
                // Add to payment history
                Payment payment = new Payment();
                payment.setStudent(student);
                payment.setAmount(receipt.getExtractedAmount());
                payment.setMethod("Offline Challan");
                payment.setTransactionId(utr != null ? utr : "OFFLINE_" + receipt.getId());
                payment.setDate(LocalDateTime.now());
                paymentRepository.save(payment);

                // Update student fee record
                List<Fee> studentFees = feeRepository.findByStudentId(student.getId());
                if (!studentFees.isEmpty()) {
                    Fee fee = studentFees.get(0);
                    fee.setPaidAmount((fee.getPaidAmount() != null ? fee.getPaidAmount() : 0) + receipt.getExtractedAmount());
                    feeRepository.save(fee);
                }
            } else {
                System.out.println("[INFO] Payment with UTR " + utr + " already exists. Skipping duplicate registration.");
            }
        } else if ("reject".equalsIgnoreCase(action)) {
            receipt.setStatus("Rejected");
        }

        offlineReceiptRepository.save(receipt);

        // Send email notification to student
        try {
            alertService.sendReceiptStatusEmail(
                    student,
                    receipt.getId(),
                    action,
                    receipt.getExtractedAmount(),
                    receipt.getExtractedUtr()
            );
        } catch (Exception e) {
            System.err.println("[EMAIL ERROR] Could not send receipt status email: " + e.getMessage());
        }

        response.put("success", String.format("Receipt %sd successfully!", action));
        return ResponseEntity.ok(response);
    }
}
