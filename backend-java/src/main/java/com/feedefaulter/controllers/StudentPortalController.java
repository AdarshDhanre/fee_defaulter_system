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
import com.feedefaulter.services.GeminiChatService;
import com.feedefaulter.services.OcrService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student-portal")
@RequiredArgsConstructor
public class StudentPortalController {

    private final StudentRepository studentRepository;
    private final FeeRepository feeRepository;
    private final PaymentRepository paymentRepository;
    private final OfflineReceiptRepository offlineReceiptRepository;
    private final OcrService ocrService;
    private final GeminiChatService geminiChatService;
    private final AlertService alertService;

    private static final String RAZORPAY_KEY_ID = "rzp_test_Siz0DM75yKVLRd";
    private static final String RAZORPAY_KEY_SECRET = "DK4EXJsSjwq0coBhkEUQjTdf";
    private static final String UPLOAD_DIR = "src/main/resources/static/uploads/receipts/";

    @GetMapping("/dashboard/{studentId}")
    public ResponseEntity<?> getDashboardStats(@PathVariable Long studentId) {
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Student student = studentOpt.get();
        List<Fee> fees = feeRepository.findByStudentId(studentId);

        int totalFee = fees.stream().mapToInt(f -> f.getTotalFee() != null ? f.getTotalFee() : 0).sum();
        int paidFee = fees.stream().mapToInt(f -> f.getPaidAmount() != null ? f.getPaidAmount() : 0).sum();
        int remainingFee = fees.stream().mapToInt(Fee::getDueAmount).sum();
        int totalFine = fees.stream().mapToInt(Fee::getLateFine).sum();
        int totalPayable = fees.stream().mapToInt(Fee::getTotalDue).sum();

        List<Payment> payments = paymentRepository.findByStudentId(studentId);
        // Sort descending by date
        payments.sort((a, b) -> b.getDate().compareTo(a.getDate()));

        List<OfflineReceipt> offlineReceipts = offlineReceiptRepository.findByStudentId(studentId);
        offlineReceipts.sort((a, b) -> b.getUploadDate().compareTo(a.getUploadDate()));

        // Map responses to clean structures
        List<Map<String, Object>> paymentHistory = payments.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("amount", p.getAmount());
            m.put("date", p.getDate());
            m.put("method", p.getMethod());
            m.put("transactionId", p.getTransactionId());
            return m;
        }).collect(Collectors.toList());

        List<Map<String, Object>> receiptHistory = offlineReceipts.stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("filePath", r.getFilePath());
            m.put("extractedUtr", r.getExtractedUtr());
            m.put("extractedAmount", r.getExtractedAmount());
            m.put("extractedDate", r.getExtractedDate());
            m.put("aiConfidence", r.getAiConfidence());
            m.put("status", r.getStatus());
            m.put("uploadDate", r.getUploadDate());
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("student", student);
        response.put("totalFee", totalFee);
        response.put("paidFee", paidFee);
        response.put("remainingFee", remainingFee);
        response.put("totalFine", totalFine);
        response.put("totalPayable", totalPayable);
        response.put("payments", paymentHistory);
        response.put("offlineReceipts", receiptHistory);
        response.put("razorpayKeyId", RAZORPAY_KEY_ID);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        Long studentId = Long.valueOf(body.get("student_id").toString());
        double amount = Double.parseDouble(body.get("amount").toString());

        if (amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid Amount"));
        }

        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Student student = studentOpt.get();
        List<Fee> fees = feeRepository.findByStudentId(studentId);
        List<Fee> activeFees = fees.stream().filter(f -> f.getDueAmount() > 0).collect(Collectors.toList());

        if (activeFees.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No dues pending"));
        }

        Fee fee = activeFees.get(0);
        if (amount > fee.getTotalDue()) {
            amount = fee.getTotalDue();
        }

        try {
            RazorpayClient razorpayClient = new RazorpayClient(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET);

            int orderAmount = (int) (amount * 100); // in paise

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", orderAmount);
            orderRequest.put("currency", "INR");
            orderRequest.put("payment_capture", 1);

            Order paymentOrder = razorpayClient.orders.create(orderRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("order_id", paymentOrder.get("id"));
            response.put("amount", orderAmount);
            response.put("currency", "INR");
            response.put("name", student.getName());
            response.put("email", student.getEmail());
            response.put("contact", "9999999999");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("[RAZORPAY ERROR] Failed to create order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Something went wrong while creating payment order."));
        }
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, Object> body) {
        Long studentId = Long.valueOf(body.get("student_id").toString());
        String razorpayPaymentId = (String) body.get("razorpay_payment_id");
        String razorpayOrderId = (String) body.get("razorpay_order_id");
        String razorpaySignature = (String) body.get("razorpay_signature");
        double amountPaid = Double.parseDouble(body.get("amount_paid").toString());

        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", razorpayOrderId);
            attributes.put("razorpay_payment_id", razorpayPaymentId);
            attributes.put("razorpay_signature", razorpaySignature);

            boolean isValid = Utils.verifyPaymentSignature(attributes, RAZORPAY_KEY_SECRET);
            if (!isValid) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Payment Verification Failed! Signature Mismatch."));
            }

            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (studentOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Student student = studentOpt.get();
            List<Fee> fees = feeRepository.findByStudentId(studentId);
            List<Fee> activeFees = fees.stream().filter(f -> f.getDueAmount() > 0).collect(Collectors.toList());

            if (activeFees.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No pending fees found"));
            }

            Fee fee = activeFees.get(0);
            fee.setPaidAmount(fee.getPaidAmount() + (int) amountPaid);
            feeRepository.save(fee);

            Payment payment = new Payment();
            payment.setStudent(student);
            payment.setAmount((int) amountPaid);
            payment.setMethod("Razorpay");
            payment.setTransactionId(razorpayPaymentId);
            payment.setDate(LocalDateTime.now());

            paymentRepository.save(payment);

            // Send confirmation email
            try {
                alertService.sendPaymentSuccessEmail(student, fee, (int) amountPaid, payment.getId());
            } catch (Exception e) {
                System.err.println("[EMAIL ERROR] Failed to send payment confirmation email: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of("success", true, "payment_id", payment.getId()));
        } catch (Exception e) {
            System.err.println("[RAZORPAY ERROR] Verification failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/receipt/{paymentId}")
    public ResponseEntity<?> getReceipt(@PathVariable Long paymentId) {
        Optional<Payment> paymentOpt = paymentRepository.findById(paymentId);
        if (paymentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Payment payment = paymentOpt.get();
        Student student = payment.getStudent();
        List<Fee> fees = feeRepository.findByStudentId(student.getId());
        Fee fee = fees.isEmpty() ? null : fees.get(0);

        Map<String, Object> map = new HashMap<>();
        map.put("paymentId", payment.getId());
        map.put("amount", payment.getAmount());
        map.put("date", payment.getDate());
        map.put("method", payment.getMethod());
        map.put("transactionId", payment.getTransactionId());
        map.put("studentName", student.getName());
        map.put("studentRollNo", student.getRollNo());
        map.put("studentEmail", student.getEmail());
        map.put("studentCourse", student.getCourse());
        map.put("studentBranch", student.getBranch());
        map.put("totalFee", fee != null ? fee.getTotalFee() : 0);
        map.put("dueAmount", fee != null ? fee.getDueAmount() : 0);

        return ResponseEntity.ok(map);
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, Object> body) {
        Long studentId = Long.valueOf(body.get("student_id").toString());
        String message = (String) body.get("message");

        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("reply", "Session expired. Please login again."));
        }

        Student student = studentOpt.get();
        List<Fee> fees = feeRepository.findByStudentId(studentId);

        String reply = geminiChatService.generateChatResponse(student, fees, message);
        return ResponseEntity.ok(Map.of("reply", reply));
    }

    @PostMapping("/upload-receipt")
    public ResponseEntity<?> uploadReceipt(@RequestParam("student_id") Long studentId,
                                           @RequestParam("receipt") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file selected"));
        }

        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Student session expired"));
        }

        Student student = studentOpt.get();

        try {
            // Save upload file
            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.lastIndexOf(".") != -1) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String filename = "student_" + studentId + "_" + (System.currentTimeMillis() / 1000) + extension;
            Path path = Paths.get(UPLOAD_DIR + filename);
            Files.write(path, file.getBytes());

            // Run OCR Service
            Map<String, Object> ocrResult = ocrService.extractReceiptDataFromPath(UPLOAD_DIR + filename);

            if (ocrResult.containsKey("error")) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to scan receipt: " + ocrResult.get("error")));
            }

            // Save OfflineReceipt object to DB
            String utr = (String) ocrResult.get("transaction_id");
            Integer amount = 0;
            Object amtObj = ocrResult.get("amount");
            if (amtObj != null) {
                try {
                    amount = Integer.valueOf(amtObj.toString().replaceAll("[^0-9]", ""));
                } catch (NumberFormatException ignored) {}
            }

            String dateStr = (String) ocrResult.get("date");
            String confidence = (String) ocrResult.get("confidence");

            OfflineReceipt receipt = new OfflineReceipt();
            receipt.setStudent(student);
            // Save the URL path that can be retrieved
            receipt.setFilePath("/uploads/receipts/" + filename);
            receipt.setExtractedUtr(utr);
            receipt.setExtractedAmount(amount);
            receipt.setExtractedDate(dateStr);
            receipt.setAiConfidence(confidence);
            receipt.setStatus("Pending");
            receipt.setUploadDate(LocalDateTime.now());

            offlineReceiptRepository.save(receipt);

            return ResponseEntity.ok(Map.of(
                    "message", "Receipt uploaded and scanned successfully! Pending Admin verification.",
                    "data", ocrResult
            ));

        } catch (IOException e) {
            System.err.println("[FILE ERROR] Failed to save receipt file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to upload file"));
        }
    }
}
