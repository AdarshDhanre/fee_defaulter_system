package com.feedefaulter.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.feedefaulter.models.Student;
import com.feedefaulter.models.Fee;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

import java.io.File;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Properties;

@Service
public class AlertService {

    private String senderEmail;
    private String senderPassword;
    private JavaMailSenderImpl mailSender;
    private boolean isConfigured = false;

    public AlertService() {
        loadCredentials();
    }

    private void loadCredentials() {
        try {
            // Path relative to java-app directory
            File configFile = new File("../email_config.json");
            if (configFile.exists()) {
                ObjectMapper mapper = new ObjectMapper();
                Map<?, ?> config = mapper.readValue(configFile, Map.class);
                this.senderEmail = (String) config.get("email");
                this.senderPassword = (String) config.get("password");

                if (this.senderEmail != null && this.senderPassword != null && !this.senderEmail.contains("your_")) {
                    this.mailSender = new JavaMailSenderImpl();
                    this.mailSender.setHost("smtp.gmail.com");
                    this.mailSender.setPort(587);
                    this.mailSender.setUsername(this.senderEmail);
                    this.mailSender.setPassword(this.senderPassword);

                    Properties props = this.mailSender.getJavaMailProperties();
                    props.put("mail.transport.protocol", "smtp");
                    props.put("mail.smtp.auth", "true");
                    props.put("mail.smtp.starttls.enable", "true");
                    props.put("mail.debug", "false");

                    this.isConfigured = true;
                    System.out.println("[INIT] Email AlertService configured with " + this.senderEmail);
                }
            }
        } catch (Exception e) {
            System.err.println("[ERROR] Failed to load email configuration: " + e.getMessage());
        }
    }

    public boolean sendEmail(String receiverEmail, String subject, String messageContent, boolean isHtml) {
        String n8nPrimaryUrl = System.getenv("N8N_WEBHOOK_URL");
        if (n8nPrimaryUrl == null || n8nPrimaryUrl.isEmpty()) {
            n8nPrimaryUrl = System.getProperty("N8N_WEBHOOK_URL");
        }

        String n8nSecondaryUrl = System.getenv("N8N_RENDER_WEBHOOK_URL");
        if (n8nSecondaryUrl == null || n8nSecondaryUrl.isEmpty()) {
            n8nSecondaryUrl = System.getProperty("N8N_RENDER_WEBHOOK_URL");
        }

        java.util.List<java.util.Map.Entry<String, String>> webhooksToTry = new java.util.ArrayList<>();
        if (n8nPrimaryUrl != null && !n8nPrimaryUrl.isEmpty()) {
            webhooksToTry.add(new java.util.AbstractMap.SimpleEntry<>("Primary n8n Cloud", n8nPrimaryUrl));
        }
        if (n8nSecondaryUrl != null && !n8nSecondaryUrl.isEmpty()) {
            webhooksToTry.add(new java.util.AbstractMap.SimpleEntry<>("Secondary n8n Render", n8nSecondaryUrl));
        }

        boolean webhookSuccess = false;

        if (!webhooksToTry.isEmpty()) {
            try {
                // Determine email type based on subject
                String emailType = "generic";
                String subjLower = subject.toLowerCase();
                String studentName = "User";
                String otpCode = "";

                if (subjLower.contains("overdue") || subjLower.contains("payment required")) {
                    emailType = "overdue";
                } else if (subjLower.contains("friendly reminder") || subjLower.contains("remaining")) {
                    emailType = "partial";
                } else if (subjLower.contains("payment received") || subjLower.contains("successful") || subjLower.contains("fully paid")) {
                    emailType = "payment_success";
                } else if (subjLower.contains("challan") || subjLower.contains("receipt")) {
                    emailType = "challan_status";
                } else if (subjLower.contains("otp for fee system")) {
                    emailType = "otp_verify";
                } else if (subjLower.contains("reset your admin password")) {
                    emailType = "otp_reset";
                }

                // Extract OTP and name for verification/reset if plain text
                if ("otp_verify".equals(emailType) || "otp_reset".equals(emailType)) {
                    try {
                        String[] lines = messageContent.split("\n");
                        if (lines.length > 0 && lines[0].startsWith("Hello ")) {
                            studentName = lines[0].substring(6).replace(",", "").trim();
                        }
                        java.util.regex.Pattern p = java.util.regex.Pattern.compile("\\b\\d{6}\\b");
                        for (String line : lines) {
                            java.util.regex.Matcher m = p.matcher(line);
                            if (m.find()) {
                                otpCode = m.group(0);
                                break;
                            }
                        }
                    } catch (Exception e) {
                        // ignore parsing errors
                    }
                }

                // Extract student name from HTML if Dear <strong>Name</strong> is present
                String htmlContent = messageContent;
                if (!isHtml) {
                    htmlContent = "<p>" + messageContent.replace("\n", "<br>") + "</p>";
                } else {
                    if ("User".equals(studentName)) {
                        java.util.regex.Pattern p = java.util.regex.Pattern.compile("Dear <strong>(.*?)</strong>", java.util.regex.Pattern.CASE_INSENSITIVE);
                        java.util.regex.Matcher m = p.matcher(messageContent);
                        if (m.find()) {
                            studentName = m.group(1);
                        }
                    }
                }

                // Construct JSON payload
                ObjectMapper mapper = new ObjectMapper();
                java.util.Map<String, Object> payload = new java.util.HashMap<>();
                payload.put("email_type", emailType);
                payload.put("student_email", receiverEmail);
                payload.put("student_name", studentName);
                payload.put("subject", subject);
                payload.put("html_message", htmlContent);
                payload.put("otp_code", otpCode);

                String jsonPayload = mapper.writeValueAsString(payload);

                for (java.util.Map.Entry<String, String> webhook : webhooksToTry) {
                    String name = webhook.getKey();
                    String urlString = webhook.getValue();
                    try {
                        System.out.println("[" + name + "] Java sending email via webhook to: " + urlString + " (Type: " + emailType + ")");
                        
                        java.net.URL url = new java.net.URL(urlString);
                        java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json; utf-8");
                        conn.setRequestProperty("Accept", "application/json");
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(5000);
                        conn.setReadTimeout(5000);

                        try (java.io.OutputStream os = conn.getOutputStream()) {
                            byte[] input = jsonPayload.getBytes("utf-8");
                            os.write(input, 0, input.length);
                        }

                        int code = conn.getResponseCode();
                        if (code >= 200 && code < 300) {
                            System.out.println("[" + name + " Success] Java email webhook triggered successfully!");
                            webhookSuccess = true;
                            break;
                        } else {
                            System.err.println("[" + name + " Error] Webhook returned status code: " + code);
                        }
                    } catch (Exception e) {
                        System.err.println("[" + name + " Exception] Java failed to trigger webhook: " + e.getMessage());
                    }
                }
            } catch (Exception e) {
                System.err.println("[Error] JSON serialization or extraction failed: " + e.getMessage());
            }
        }

        if (webhookSuccess) {
            return true;
        }


        if (!isConfigured) {
            System.out.println("============================================================");
            System.out.println("[SIMULATED EMAIL]");
            System.out.println("TO: " + receiverEmail);
            System.out.println("SUBJECT: " + subject);
            System.out.println("CONTENT: " + messageContent.substring(0, Math.min(200, messageContent.length())) + "...");
            System.out.println("============================================================");
            return true;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            helper.setText(messageContent, isHtml);
            helper.setTo(receiverEmail);
            helper.setSubject(subject);
            helper.setFrom(senderEmail);

            mailSender.send(mimeMessage);
            System.out.println("[SUCCESS] Email sent to " + receiverEmail);
            return true;
        } catch (Exception e) {
            System.err.println("[ERROR] Email sending failed: " + e.getMessage());
            return false;
        }
    }

    public boolean alertStudent(Student student, Fee fee) {
        if (student == null || fee == null) return false;

        String subject;
        String introTitle;
        String introText;
        String color;

        if (fee.getPaidAmount() == 0 && !"Overdue".equals(fee.getStatus())) {
            subject = "🚨 Urgent: Fee Payment Required";
            introTitle = "Fee Payment Required";
            introText = "Our records indicate that you have not made any payment towards your academic fees. Please clear your dues immediately.";
            color = "#ef4444";
        } else {
            subject = "🚨 URGENT: Fee Payment Overdue";
            introTitle = "Fee Payment Overdue";
            introText = "This is a strict reminder that your fee payment deadline has passed. Your account is now marked as Overdue.";
            color = "#dc2626";
        }

        String deadlineStr = fee.getDeadline() != null 
            ? fee.getDeadline().format(DateTimeFormatter.ofPattern("dd MMM yyyy")) 
            : "N/A";

        String htmlMessage = "<html>" +
            "<body style=\"font-family: Arial, sans-serif; background-color: #f4f7fe; padding: 20px;\">" +
            "    <div style=\"max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);\">" +
            "        <div style=\"background-color: " + color + "; color: white; padding: 20px; text-align: center;\">" +
            "            <h2 style=\"margin: 0;\">" + introTitle + "</h2>" +
            "        </div>" +
            "        <div style=\"padding: 30px; color: #333;\">" +
            "            <p style=\"font-size: 16px;\">Dear <strong>" + student.getName() + "</strong>,</p>" +
            "            <p style=\"font-size: 15px; color: #555; line-height: 1.6;\">" + introText + "</p>" +
            "            " +
            "            <div style=\"background: #f8fafc; border-left: 4px solid " + color + "; padding: 15px; margin: 25px 0;\">" +
            "                <p style=\"margin: 5px 0;\"><strong>Total Base Fee:</strong> ₹" + fee.getTotalFee() + "</p>" +
            "                <p style=\"margin: 5px 0;\"><strong>Paid Amount:</strong> ₹" + fee.getPaidAmount() + "</p>" +
            "                <p style=\"margin: 5px 0;\"><strong>Late Fine Accrued:</strong> ₹" + fee.getLateFine() + "</p>" +
            "                <hr style=\"border: 0; border-top: 1px solid #eee; margin: 10px 0;\">" +
            "                <p style=\"margin: 5px 0; font-size: 18px; color: " + color + ";\"><strong>Total Payable: ₹" + fee.getTotalDue() + "</strong></p>" +
            "                <p style=\"margin: 5px 0;\"><strong>Deadline Was:</strong> " + deadlineStr + "</p>" +
            "            </div>" +
            "            " +
            "            <p style=\"font-size: 15px; color: #555;\">To avoid any strict administrative actions or late fees, please pay your pending dues immediately via the student portal.</p>" +
            "            " +
            "            <div style=\"text-align: center; margin-top: 30px;\">" +
            "                <a href=\"http://localhost:3000/student-login\" style=\"background-color: #4318FF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;\">Login to Pay Fees</a>" +
            "            </div>" +
            "        </div>" +
            "        <div style=\"background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;\">" +
            "            This is an automated message from the Fee Administration System. Please do not reply directly to this email." +
            "        </div>" +
            "    </div>" +
            "</body>" +
            "</html>";

        return sendEmail(student.getEmail(), subject, htmlMessage, true);
    }

    public boolean alertPartialStudent(Student student, Fee fee) {
        if (student == null || fee == null) return false;

        String subject = "🔔 Friendly Reminder: Remaining Fee Balance";

        String htmlMessage = "<html>" +
            "<body style=\"font-family: Arial, sans-serif; background-color: #f4f7fe; padding: 20px;\">" +
            "    <div style=\"max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);\">" +
            "        <div style=\"background-color: #f59e0b; color: white; padding: 20px; text-align: center;\">" +
            "            <h2 style=\"margin: 0;\">Fee Payment Reminder</h2>" +
            "        </div>" +
            "        <div style=\"padding: 30px; color: #333;\">" +
            "            <p style=\"font-size: 16px;\">Dear <strong>" + student.getName() + "</strong>,</p>" +
            "            <p style=\"font-size: 15px; color: #555; line-height: 1.6;\">We hope you are doing well! This is a friendly reminder regarding your remaining fee balance.</p>" +
            "            " +
            "            <div style=\"background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0;\">" +
            "                <p style=\"margin: 5px 0;\"><strong>Total Fee:</strong> ₹" + fee.getTotalFee() + "</p>" +
            "                <p style=\"margin: 5px 0;\"><strong>Amount Received:</strong> ₹" + fee.getPaidAmount() + "</p>" +
            "                <p style=\"margin: 5px 0; font-size: 18px; color: #d97706;\"><strong>Remaining Balance: ₹" + fee.getDueAmount() + "</strong></p>" +
            "            </div>" +
            "            " +
            "            <p style=\"font-size: 15px; color: #555;\">You can easily clear your remaining balance by logging into your student portal.</p>" +
            "            " +
            "            <div style=\"text-align: center; margin-top: 30px;\">" +
            "                <a href=\"http://localhost:3000/student-login\" style=\"background-color: #4318FF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;\">Pay Remaining Fee</a>" +
            "            </div>" +
            "        </div>" +
            "        <div style=\"background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;\">" +
            "            If you have any questions, please feel free to reach out to the administration.<br>" +
            "            This is an automated message." +
            "        </div>" +
            "    </div>" +
            "</body>" +
            "</html>";

        return sendEmail(student.getEmail(), subject, htmlMessage, true);
    }

    public boolean sendPaymentSuccessEmail(Student student, Fee fee, Integer amountPaid, Long paymentId) {
        if (student == null || fee == null) return false;

        boolean isFullyPaid = fee.getDueAmount() <= 0;
        String subject = isFullyPaid 
            ? "🎊 Congratulations! Your Fees are Fully Paid" 
            : "🎉 Payment Received: Receipt #" + paymentId;
        String statusMsg = isFullyPaid 
            ? "Your fee has been fully paid. Thank you!" 
            : "We have successfully received your partial payment.";

        String htmlMessage = "<html>" +
            "<body style=\"font-family: Arial, sans-serif; background-color: #f4f7fe; padding: 20px;\">" +
            "    <div style=\"max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);\">" +
            "        <div style=\"background-color: #10b981; color: white; padding: 30px; text-align: center;\">" +
            "            <div style=\"font-size: 40px; margin-bottom: 10px;\">" + (isFullyPaid ? "🎊" : "✅") + "</div>" +
            "            <h2 style=\"margin: 0; font-size: 24px;\">" + (isFullyPaid ? "Fees Fully Paid!" : "Payment Successful!") + "</h2>" +
            "            <p style=\"margin-top: 10px; opacity: 0.9;\">" + statusMsg + "</p>" +
            "        </div>" +
            "        <div style=\"padding: 30px; color: #333;\">" +
            "            <p style=\"font-size: 16px;\">Dear <strong>" + student.getName() + "</strong>,</p>" +
            "            <p style=\"font-size: 15px; color: #555; line-height: 1.6;\">Thank you for your payment. Below are the transaction and balance details:</p>" +
            "            " +
            "            <div style=\"background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0;\">" +
            "                <p style=\"margin: 5px 0;\"><strong>Receipt ID:</strong> #" + paymentId + "</p>" +
            "                <p style=\"margin: 5px 0; font-size: 20px; color: #047857;\"><strong>Amount Paid: ₹" + amountPaid + "</strong></p>" +
            "                <hr style=\"border: 0; border-top: 1px solid #a7f3d0; margin: 15px 0;\">" +
            "                <p style=\"margin: 5px 0;\"><strong>Total Fee:</strong> ₹" + fee.getTotalFee() + "</p>" +
            "                <p style=\"margin: 5px 0; font-size: 16px; color: " + (isFullyPaid ? "#047857" : "#333") + ";\">" +
            "                    <strong>Remaining Balance: ₹" + (fee.getDueAmount() > 0 ? fee.getDueAmount() : 0) + "</strong>" +
            "                </p>" +
            "            </div>" +
            "            " +
            "            <p style=\"font-size: 15px; color: #555;\">You can download your official payment receipt anytime from the student portal.</p>" +
            "            " +
            "            <div style=\"text-align: center; margin-top: 30px;\">" +
            "                <a href=\"http://localhost:3000/student-login\" style=\"background-color: #4318FF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;\">Login to Student Portal</a>" +
            "            </div>" +
            "        </div>" +
            "        <div style=\"background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;\">" +
            "            This is an automated confirmation from the Fee Administration System.<br>" +
            "            For any queries, please contact the administration." +
            "        </div>" +
            "    </div>" +
            "</body>" +
            "</html>";

        return sendEmail(student.getEmail(), isFullyPaid ? "🎊 Fees Fully Paid" : "🎉 Payment Success", htmlMessage, true);
    }

    public boolean sendReceiptStatusEmail(Student student, Long receiptId, String action, Integer extractedAmount, String extractedUtr) {
        if (student == null) return false;

        boolean isApproved = "approve".equalsIgnoreCase(action);
        String subject;
        String headerColor;
        String headerIcon;
        String headerTitle;
        String statusBadgeBg;
        String statusBadgeBorder;
        String statusBadgeColor;
        String statusText;
        String bodyText;
        String nextStep;
        String btnText;

        if (isApproved) {
            subject = "✅ Challan Approved: Receipt #" + receiptId;
            headerColor = "#10b981";
            headerIcon = "✅";
            headerTitle = "Payment Verified!";
            statusBadgeBg = "#ecfdf5";
            statusBadgeBorder = "#10b981";
            statusBadgeColor = "#047857";
            statusText = "APPROVED";
            bodyText = "Great news! Your offline bank challan receipt has been verified and <strong>approved</strong> by the administration. Your fee records have been updated accordingly.";
            nextStep = "You can now view your updated fee status and payment history in the student portal.";
            btnText = "View My Fee Status";
        } else {
            subject = "❌ Challan Rejected: Receipt #" + receiptId;
            headerColor = "#ef4444";
            headerIcon = "❌";
            headerTitle = "Payment Rejected";
            statusBadgeBg = "#fef2f2";
            statusBadgeBorder = "#ef4444";
            statusBadgeColor = "#b91c1c";
            statusText = "REJECTED";
            bodyText = "Unfortunately, your offline bank challan receipt (Receipt #" + receiptId + ") has been <strong>rejected</strong> by the administration. This may be due to an unreadable image, incorrect details, or a duplicate submission.";
            nextStep = "Please re-upload a clear, valid challan image or contact the accounts office for assistance.";
            btnText = "Re-upload Challan";
        }

        String htmlMessage = "<html>" +
            "<body style=\"font-family: Arial, sans-serif; background-color: #f4f7fe; padding: 20px; margin: 0;\">" +
            "    <div style=\"max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);\">" +
            "        <div style=\"background-color: " + headerColor + "; color: white; padding: 35px 30px; text-align: center;\">" +
            "            <div style=\"font-size: 48px; margin-bottom: 12px;\">" + headerIcon + "</div>" +
            "            <h2 style=\"margin: 0; font-size: 26px; font-weight: 700;\">" + headerTitle + "</h2>" +
            "            <p style=\"margin-top: 8px; opacity: 0.9; font-size: 15px;\">Challan Receipt #" + receiptId + " — Status Update</p>" +
            "        </div>" +
            "        <div style=\"padding: 35px 30px; color: #333;\">" +
            "            <p style=\"font-size: 16px; margin-bottom: 20px;\">Dear <strong>" + student.getName() + "</strong>,</p>" +
            "            <p style=\"font-size: 15px; color: #555; line-height: 1.7;\">" + bodyText + "</p>" +
            "            " +
            "            <div style=\"background: " + statusBadgeBg + "; border-left: 4px solid " + statusBadgeBorder + "; border-radius: 8px; padding: 20px; margin: 25px 0;\">" +
            "                <p style=\"margin: 6px 0; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px;\">Status</p>" +
            "                <p style=\"margin: 6px 0; font-size: 22px; font-weight: 800; color: " + statusBadgeColor + ";\">" + statusText + "</p>" +
            "                <hr style=\"border: 0; border-top: 1px solid " + statusBadgeBorder + "; opacity: 0.3; margin: 15px 0;\">" +
            "                <p style=\"margin: 5px 0; font-size: 14px;\"><strong>Receipt ID:</strong> #" + receiptId + "</p>" +
            "                <p style=\"margin: 5px 0; font-size: 14px;\"><strong>UTR / Transaction ID:</strong> " + (extractedUtr != null ? extractedUtr : "N/A") + "</p>" +
            "                <p style=\"margin: 5px 0; font-size: 14px;\"><strong>Extracted Amount:</strong> Rs. " + (extractedAmount != null ? extractedAmount : "N/A") + "</p>" +
            "            </div>" +
            "            " +
            "            <p style=\"font-size: 15px; color: #555; line-height: 1.7;\">" + nextStep + "</p>" +
            "            " +
            "            <div style=\"text-align: center; margin-top: 30px;\">" +
            "                <a href=\"http://localhost:3000/student-login\" style=\"background-color: #4318FF; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; letter-spacing: 0.5px;\">" + btnText + "</a>" +
            "            </div>" +
            "        </div>" +
            "        <div style=\"background-color: #f8fafc; padding: 18px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;\">" +
            "            This is an automated message from the Fee Administration System.<br>For any queries, please contact the accounts office directly." +
            "        </div>" +
            "    </div>" +
            "</body>" +
            "</html>";

        return sendEmail(student.getEmail(), subject, htmlMessage, true);
    }
}
