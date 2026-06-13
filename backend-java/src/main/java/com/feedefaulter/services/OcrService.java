package com.feedefaulter.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OcrService {

    private final String apiKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public OcrService() {
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();

        // Load dotenv from root project dir
        String key = null;
        try {
            Dotenv dotenv = Dotenv.configure()
                    .directory("../")
                    .ignoreIfMalformed()
                    .ignoreIfMissing()
                    .load();
            key = dotenv.get("GEMINI_API_KEY");
        } catch (Exception e) {
            System.out.println("[WARN] Dotenv load failed, trying system env: " + e.getMessage());
        }

        if (key == null) {
            key = System.getenv("GEMINI_API_KEY");
        }

        this.apiKey = key;
        System.out.println("[INIT] OcrService loaded API key: " + (apiKey != null ? "FOUND" : "NOT FOUND"));
    }

    public Map<String, Object> extractReceiptData(MultipartFile file) {
        try {
            byte[] fileBytes = file.getBytes();
            String mimeType = file.getContentType();
            if (mimeType == null) {
                mimeType = "image/jpeg";
            }
            return extractReceiptDataFromBytes(fileBytes, mimeType);
        } catch (Exception e) {
            System.err.println("[ERROR] Failed to read multipart file: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to read file: " + e.getMessage());
            return error;
        }
    }

    public Map<String, Object> extractReceiptDataFromPath(String filePath) {
        try {
            File localFile = new File(filePath);
            byte[] fileBytes = Files.readAllBytes(localFile.toPath());
            String mimeType = Files.probeContentType(localFile.toPath());
            if (mimeType == null) {
                mimeType = "image/jpeg";
            }
            return extractReceiptDataFromBytes(fileBytes, mimeType);
        } catch (Exception e) {
            System.err.println("[ERROR] Failed to read local file: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to read file: " + e.getMessage());
            return error;
        }
    }

    private Map<String, Object> extractReceiptDataFromBytes(byte[] fileBytes, String mimeType) {
        Map<String, Object> result = new HashMap<>();

        if (apiKey == null || apiKey.isEmpty()) {
            System.out.println("[WARN] No Gemini API key found, returning mock OCR data");
            result.put("transaction_id", "MOCK_UTR_" + System.currentTimeMillis());
            result.put("amount", 5000);
            result.put("date", "31/05/2026");
            result.put("confidence", "High");
            return result;
        }

        try {
            String base64Data = Base64.getEncoder().encodeToString(fileBytes);

            String prompt = "Analyze this bank transaction receipt/challan.\n" +
                    "Extract the following information and return ONLY a valid JSON object. Do not include markdown formatting or extra text.\n\n" +
                    "Required JSON format:\n" +
                    "{\n" +
                    "    \"transaction_id\": \"Extract the 12 to 16 digit UTR or Transaction/Reference Number\",\n" +
                    "    \"amount\": \"Extract the numeric amount paid (just the number without commas or currency symbols)\",\n" +
                    "    \"date\": \"Extract the date of transaction in DD/MM/YYYY format\",\n" +
                    "    \"confidence\": \"High, Medium, or Low depending on how clearly you can read it\"\n" +
                    "}\n\n" +
                    "If a field is missing or unreadable, set its value to null.";

            // Build request body manually or using map
            Map<String, Object> inlineData = Map.of(
                    "mime_type", mimeType,
                    "data", base64Data
            );
            Map<String, Object> part1 = Map.of("text", prompt);
            Map<String, Object> part2 = Map.of("inline_data", inlineData);
            Map<String, Object> content = Map.of("parts", List.of(part1, part2));
            Map<String, Object> requestBody = Map.of("contents", List.of(content));

            String jsonPayload = objectMapper.writeValueAsString(requestBody);

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("API request failed with status: " + response.statusCode() + " " + response.body());
            }

            Map<?, ?> jsonResponse = objectMapper.readValue(response.body(), Map.class);
            List<?> candidates = (List<?>) jsonResponse.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new RuntimeException("No candidates returned from Gemini");
            }

            Map<?, ?> candidate = (Map<?, ?>) candidates.get(0);
            Map<?, ?> responseContent = (Map<?, ?>) candidate.get("content");
            List<?> parts = (List<?>) responseContent.get("parts");
            if (parts == null || parts.isEmpty()) {
                throw new RuntimeException("No parts returned from Gemini candidate");
            }

            Map<?, ?> part = (Map<?, ?>) parts.get(0);
            String rawText = ((String) part.get("text")).strip();

            // Clean markdown block wrappers if present
            if (rawText.startsWith("```json")) {
                rawText = rawText.replace("```json", "");
            } else if (rawText.startsWith("```")) {
                rawText = rawText.replace("```", "");
            }
            if (rawText.endsWith("```")) {
                rawText = rawText.substring(0, rawText.length() - 3);
            }

            rawText = rawText.strip();
            Map<?, ?> ocrData = objectMapper.readValue(rawText, Map.class);

            // Populate output result map
            result.put("transaction_id", ocrData.get("transaction_id"));
            result.put("amount", ocrData.get("amount"));
            result.put("date", ocrData.get("date"));
            result.put("confidence", ocrData.get("confidence"));

            return result;

        } catch (Exception e) {
            System.err.println("[ERROR] OCR Processing failed: " + e.getMessage());
            result.put("error", e.getMessage());
            // Fallback mock values
            result.put("transaction_id", "MOCK_UTR_" + System.currentTimeMillis());
            result.put("amount", 5000);
            result.put("date", "31/05/2026");
            result.put("confidence", "Low");
            return result;
        }
    }
}
