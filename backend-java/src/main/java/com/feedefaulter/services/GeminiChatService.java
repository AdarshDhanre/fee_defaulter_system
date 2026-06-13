package com.feedefaulter.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.feedefaulter.models.Student;
import com.feedefaulter.models.Fee;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@Service
public class GeminiChatService {

    private final String apiKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public GeminiChatService() {
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();

        String key = null;
        try {
            Dotenv dotenv = Dotenv.configure()
                    .directory("../")
                    .ignoreIfMalformed()
                    .ignoreIfMissing()
                    .load();
            key = dotenv.get("GEMINI_API_KEY");
        } catch (Exception e) {
            System.out.println("[WARN] Dotenv load failed for Chat: " + e.getMessage());
        }

        if (key == null) {
            key = System.getenv("GEMINI_API_KEY");
        }

        this.apiKey = key;
    }

    public String generateChatResponse(Student student, List<Fee> fees, String userMessage) {
        if (apiKey == null || apiKey.isEmpty()) {
            return getFallbackResponse(student, fees, userMessage);
        }

        try {
            // Calculate totals
            int totalFee = fees.stream().mapToInt(f -> f.getTotalFee() != null ? f.getTotalFee() : 0).sum();
            int paidFee = fees.stream().mapToInt(f -> f.getPaidAmount() != null ? f.getPaidAmount() : 0).sum();
            int remainingFee = fees.stream().mapToInt(Fee::getDueAmount).sum();
            int totalFine = fees.stream().mapToInt(Fee::getLateFine).sum();
            int totalPayable = fees.stream().mapToInt(Fee::getTotalDue).sum();

            String systemContext = String.format(
                    "You are 'EduAI Assistant', a helpful student support bot for the EduPortal Fee System.\n" +
                    "Current Student Data:\n" +
                    "- Name: %s\n" +
                    "- Roll No: %s\n" +
                    "- Course/Branch: %s (%s)\n" +
                    "- Total Fee: ₹%d\n" +
                    "- Paid: ₹%d\n" +
                    "- Remaining Due: ₹%d\n" +
                    "- Late Fine: ₹%d\n" +
                    "- Total Payable: ₹%d\n\n" +
                    "Guidelines:\n" +
                    "1. Be professional, polite, and helpful.\n" +
                    "2. If the student asks about their fee or due, give them the exact numbers from above.\n" +
                    "3. If they ask about how to pay, tell them to click the 'Pay Fees' tab.\n" +
                    "4. Keep answers concise. Use emojis occasionally.",
                    student.getName(), student.getRollNo(), student.getCourse(), student.getBranch(),
                    totalFee, paidFee, remainingFee, totalFine, totalPayable
            );

            // Construct JSON request for Gemini
            Map<String, Object> part1 = Map.of("text", systemContext + "\n\nStudent says: " + userMessage);
            Map<String, Object> content = Map.of("parts", List.of(part1));
            Map<String, Object> requestBody = Map.of("contents", List.of(content));

            String jsonPayload = objectMapper.writeValueAsString(requestBody);

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                Map<?, ?> jsonResponse = objectMapper.readValue(response.body(), Map.class);
                List<?> candidates = (List<?>) jsonResponse.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<?, ?> candidate = (Map<?, ?>) candidates.get(0);
                    Map<?, ?> responseContent = (Map<?, ?>) candidate.get("content");
                    List<?> parts = (List<?>) responseContent.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        Map<?, ?> part = (Map<?, ?>) parts.get(0);
                        return ((String) part.get("text")).strip();
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[ERROR] Gemini Chat generation failed: " + e.getMessage());
        }

        return getFallbackResponse(student, fees, userMessage);
    }

    private String getFallbackResponse(Student student, List<Fee> fees, String userMessage) {
        String msg = userMessage.toLowerCase();
        int totalPayable = fees.stream().mapToInt(Fee::getTotalDue).sum();
        int totalFine = fees.stream().mapToInt(Fee::getLateFine).sum();

        if (msg.contains("hi") || msg.contains("hello") || msg.contains("hey")) {
            String firstName = student.getName().split(" ")[0];
            return String.format("Hello %s! 👋 I am your EduPortal AI Assistant. How can I help you today?", firstName);
        } else if (msg.contains("fee") || msg.contains("due") || msg.contains("pending") || msg.contains("balance") || msg.contains("amount")) {
            if (totalPayable > 0) {
                return String.format("You have a total payable amount of ₹%d (including ₹%d fine). You can pay it in the 'Pay Fees' tab.", totalPayable, totalFine);
            } else {
                return "Great news! 🎉 You have no pending dues.";
            }
        } else if (msg.contains("pay") || msg.contains("how") || msg.contains("make payment")) {
            return "To make a payment, click on the **'Pay Fees'** tab in the sidebar.";
        } else if (msg.contains("thank") || msg.contains("thanks") || msg.contains("ok")) {
            return "You're welcome! 😊";
        }
        return "I'm sorry, I'm having trouble thinking clearly right now. You can ask me about your 'pending fee', 'how to pay', or 'receipts'.";
    }
}
