import smtplib
import json
import os
import re
import requests
from dotenv import load_dotenv
from email.mime.text import MIMEText
from models.student_model import Student
from models.fee_model import Fee

load_dotenv()

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'email_config.json')


# ============================================================
# 📊 Google Sheets Payment Logger
# ============================================================
def log_payment_to_sheets(student_id, amount_paid, payment_id, transaction_id=None, payment_method=None):
    """
    Jab bhi payment successful hoti hai, is function se Google Sheets mein
    ek dedicated webhook call jata hai.
    N8N_SHEETS_WEBHOOK_URL environment variable set karo n8n ke Google Sheets webhook ke liye.
    """
    sheets_webhook_url = os.environ.get("N8N_SHEETS_WEBHOOK_URL")
    
    if not sheets_webhook_url:
        print("[Sheets Logger] N8N_SHEETS_WEBHOOK_URL not set, skipping Google Sheets log.", flush=True)
        return False

    try:
        student = Student.query.get(student_id)
        fee = Fee.query.filter_by(student_id=student_id).first()

        if not student:
            print(f"[Sheets Logger] Student {student_id} not found.", flush=True)
            return False

        from datetime import datetime
        payload = {
            # Event type (n8n mein filter ke liye)
            "event": "payment_success",

            # Student Info
            "student_id":       student.id,
            "student_name":     student.name,
            "student_email":    student.email,
            "student_roll":     student.roll_no,
            "student_course":   student.course,
            "student_branch":   student.branch,
            "student_year":     student.year,
            "student_category": student.category,

            # Payment Info
            "payment_id":       payment_id,
            "amount_paid":      amount_paid,
            "transaction_id":   transaction_id or "N/A",
            "payment_method":   payment_method or "Online",
            "payment_date":     datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "payment_status":   "Success",

            # Fee Info
            "fee_total":        fee.total_fee if fee else 0,
            "fee_paid":         fee.paid_amount if fee else 0,
            "fee_due":          fee.due_amount if fee else 0,
            "fee_status":       fee.status if fee else "Unknown",
        }

        print(f"[Sheets Logger] Sending payment log to Google Sheets webhook...", flush=True)
        print(f"[Sheets Logger] Payload: {payload}", flush=True)

        res = requests.post(sheets_webhook_url, json=payload, timeout=10)

        if res.status_code in [200, 201]:
            print(f"[Sheets Logger ✅] Google Sheets log successful! Receipt #{payment_id}", flush=True)
            return True
        else:
            print(f"[Sheets Logger ❌] Webhook returned {res.status_code}: {res.text}", flush=True)
            return False

    except Exception as e:
        print(f"[Sheets Logger ❌] Exception: {e}", flush=True)
        return False





# 📌 Load email credentials
def get_email_credentials():
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)
            email = config.get('email')
            password = config.get('password')
            return email, password
    except Exception as e:
        print("[ERROR] Config Error:", e)
        return None, None


# 🌐 Get Frontend URL
def get_frontend_url():
    url = os.environ.get("FRONTEND_URL")
    if not url:
        return "http://127.0.0.1:5000"
    url = url.strip()
    if url.endswith("/"):
        url = url[:-1]
    return url


def get_student_login_url():
    frontend_url = get_frontend_url()
    login_path = "/student-login" if "3000" in frontend_url or "vercel" in frontend_url.lower() or "onrender" in frontend_url.lower() else "/student_login"
    return f"{frontend_url}{login_path}"


# 📧 Send Email Function
def send_email(receiver_email, subject, message, is_html=True, student=None, fee=None, amount_paid=None, payment_id=None, transaction_id=None, payment_method=None):
    # Check if primary or secondary n8n webhook URL is set
    n8n_primary_url = os.environ.get("N8N_WEBHOOK_URL")
    n8n_secondary_url = os.environ.get("N8N_RENDER_WEBHOOK_URL")
    
    webhooks_to_try = []
    if n8n_primary_url:
        webhooks_to_try.append(("Primary n8n Cloud", n8n_primary_url))
    if n8n_secondary_url:
        webhooks_to_try.append(("Secondary n8n Render", n8n_secondary_url))

    webhook_success = False

    if webhooks_to_try:
        email_type = "generic"
        subject_lower = subject.lower()
        student_name = "User"
        otp_code = ""
        
        if "overdue" in subject_lower or "payment required" in subject_lower:
            email_type = "overdue"
        elif "friendly reminder" in subject_lower or "remaining" in subject_lower:
            email_type = "partial"
        elif "payment received" in subject_lower or "successful" in subject_lower or "fully paid" in subject_lower or "payment success" in subject_lower or "success" in subject_lower:
            email_type = "payment_success"
        elif "challan" in subject_lower or "receipt" in subject_lower:
            email_type = "challan_status"
        elif "otp for fee system" in subject_lower:
            email_type = "otp_verify"
        elif "reset your admin password" in subject_lower:
            email_type = "otp_reset"

        # Parse OTP and username if it's an OTP mail
        if email_type in ["otp_verify", "otp_reset"]:
            try:
                lines = message.split("\n")
                if lines and lines[0].startswith("Hello "):
                    student_name = lines[0][6:].rstrip(",")
                for line in lines:
                    match = re.search(r'\b\d{6}\b', line)
                    if match:
                        otp_code = match.group(0)
                        break
            except Exception as ex:
                print(f"[n8n Parsing Error] {ex}")

        # Try to extract student name from HTML message if possible
        if not is_html:
            html_content = f"<p>{message.replace('\n', '<br>')}</p>"
        else:
            html_content = message
            if student_name == "User":
                name_match = re.search(r'Dear <strong>(.*?)</strong>', message)
                if name_match:
                    student_name = name_match.group(1)
                else:
                    name_match_2 = re.search(r'Dear <strong>(.*?)</strong>', message, re.IGNORECASE)
                    if name_match_2:
                        student_name = name_match_2.group(1)

        payload = {
            "email_type": email_type,
            "student_email": receiver_email,
            "student_name": student_name,
            "subject": subject,
            "html_message": html_content,
            "otp_code": otp_code
        }

        if student:
            payload["student_id"] = student.id
            payload["student_roll"] = student.roll_no
            payload["student_name"] = student.name
            payload["student_email"] = student.email
            payload["student_course"] = student.course
            payload["student_branch"] = student.branch
            payload["student_year"] = student.year
            payload["student_category"] = student.category
        if fee:
            payload["fee_total"] = fee.total_fee
            payload["fee_paid"] = fee.paid_amount
            payload["fee_due"] = fee.due_amount
            payload["fee_status"] = fee.status
        if amount_paid is not None:
            payload["amount_paid"] = amount_paid
        if payment_id is not None:
            payload["payment_id"] = payment_id
        if transaction_id is not None:
            payload["transaction_id"] = transaction_id
        if payment_method is not None:
            payload["payment_method"] = payment_method
        
        # 📊 Google Sheets logging ke liye extra payment fields (payment_success type ke liye)
        if email_type == "payment_success" and payment_id is not None:
            from datetime import datetime
            payload["payment_date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            payload["payment_status"] = "Success"

        for name, url in webhooks_to_try:
            try:
                print(f"[{name}] Triggering webhook for {receiver_email} (Type: {email_type})...", flush=True)
                res = requests.post(url, json=payload, timeout=10)
                if res.status_code in [200, 201]:
                    print(f"[{name} Success] Email webhook triggered successfully!", flush=True)
                    webhook_success = True
                    break
                else:
                    print(f"[{name} Error] Webhook returned status code {res.status_code}: {res.text}", flush=True)
            except Exception as e:
                print(f"[{name} Exception] Failed to send email via webhook: {e}", flush=True)

    if webhook_success:
        return True


    # Fallback to SMTP or simulation
    sender_email, sender_password = get_email_credentials()

    # 🔥 If config not set or uses placeholders → simulation mode
    if not sender_email or not sender_password or "your_" in sender_email:
        print("============================================================", flush=True)
        print("[SIMULATED EMAIL]", flush=True)
        print(f"TO: {receiver_email}", flush=True)
        print(f"SUBJECT: {subject}", flush=True)
        print("============================================================", flush=True)
        return True

    try:
        # Use HTML format if requested, otherwise plain text
        msg_type = "html" if is_html else "plain"
        msg = MIMEText(message, msg_type, 'utf-8')
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = receiver_email

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, receiver_email, msg.as_string())
        server.quit()

        print(f"[SUCCESS] Email sent to {receiver_email}")
        return True

    except smtplib.SMTPAuthenticationError:
        print("[ERROR] Auth Error: Invalid App Password or Email in email_config.json")
        return False
    except Exception as e:
        print("[ERROR] Email error:", e)
        if "timeout" in str(e).lower() or "connection timed out" in str(e).lower() or "connection refused" in str(e).lower():
            print("[NOTE] Outbound SMTP ports (587, 465, 25) are blocked by default on cloud hosting providers like Render. If you are deployed on Render, please make sure your n8n service is configured correctly (so that Python uses Webhook rather than falling back to SMTP), or run this backend locally.")
        return False


# 📌 Alert Single Student
def alert_student(student_id):
    student = Student.query.get(student_id)
    fee = Fee.query.filter_by(student_id=student_id).first()

    if not student or not fee:
        return False

    login_url = get_student_login_url()

    if fee.status == "Overdue" or fee.paid_amount == 0:
        if fee.paid_amount == 0 and fee.status != "Overdue":
            subject = "🚨 Urgent: Fee Payment Required"
            intro_title = "Fee Payment Required"
            intro_text = "Our records indicate that you have not made any payment towards your academic fees. Please clear your dues immediately."
            color = "#ef4444"
        else:
            subject = "🚨 URGENT: Fee Payment Overdue"
            intro_title = "Fee Payment Overdue"
            intro_text = "This is a strict reminder that your fee payment deadline has passed. Your account is now marked as Overdue."
            color = "#dc2626"

        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f7fe; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="background-color: {color}; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">{intro_title}</h2>
                </div>
                <div style="padding: 30px; color: #333;">
                    <p style="font-size: 16px;">Dear <strong>{student.name}</strong>,</p>
                    <p style="font-size: 15px; color: #555; line-height: 1.6;">{intro_text}</p>
                    
                    <div style="background: #f8fafc; border-left: 4px solid {color}; padding: 15px; margin: 25px 0;">
                        <p style="margin: 5px 0;"><strong>Total Base Fee:</strong> ₹{fee.total_fee}</p>
                        <p style="margin: 5px 0;"><strong>Paid Amount:</strong> ₹{fee.paid_amount}</p>
                        <p style="margin: 5px 0;"><strong>Late Fine Accrued:</strong> ₹{fee.late_fine}</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
                        <p style="margin: 5px 0; font-size: 18px; color: {color};"><strong>Total Payable: ₹{fee.total_due}</strong></p>
                        <p style="margin: 5px 0;"><strong>Deadline Was:</strong> {fee.deadline.strftime('%d %b %Y') if fee.deadline else 'N/A'}</p>
                    </div>
                    
                    <p style="font-size: 15px; color: #555;">To avoid any strict administrative actions or late fees, please pay your pending dues immediately via the student portal.</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="{login_url}" style="background-color: #4318FF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Login to Pay Fees</a>
                    </div>
                </div>
                <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
                    This is an automated message from the Fee Administration System. Please do not reply directly to this email.
                </div>
            </div>
        </body>
        </html>
        """

        return send_email(student.email, subject, html_message, is_html=True, student=student, fee=fee)

    return False

# 📌 Alert All Defaulters
def alert_all_defaulters():
    fees = Fee.query.all()
    defaulters_exist = any(f.status == "Overdue" for f in fees)

    if not defaulters_exist:
        return "✅ No defaulters found in the database!"

    sender_email, sender_password = get_email_credentials()
    
    success_count = 0
    fail_count = 0

    for f in fees:
        if f.status == "Overdue":
            if alert_student(f.student_id):
                success_count += 1
            else:
                fail_count += 1


    if fail_count > 0:
        return f"❌ ERROR: Email sending failed. Please check if your Gmail APP PASSWORD is correct in email_config.json! (Sent: {success_count}, Failed: {fail_count})"

    if not sender_email or not sender_password or "your_" in sender_email:
        return f"✅ SUCCESS: Simulated Alert Emails sent to {success_count} defaulters! (Check terminal to view them)"

    return f"📧 SUCCESS: Emails successfully sent to {success_count} defaulters!"


# 📌 Alert Single Partial Student (Polite Reminder)
def alert_partial_student(student_id):
    student = Student.query.get(student_id)
    fee = Fee.query.filter_by(student_id=student_id).first()

    if not student or not fee:
        return False

    login_url = get_student_login_url()

    if fee.status == "Partial":
        subject = "🔔 Friendly Reminder: Remaining Fee Balance"

        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f7fe; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">Fee Payment Reminder</h2>
                </div>
                <div style="padding: 30px; color: #333;">
                    <p style="font-size: 16px;">Dear <strong>{student.name}</strong>,</p>
                    <p style="font-size: 15px; color: #555; line-height: 1.6;">We hope you are doing well! This is a friendly reminder regarding your remaining fee balance.</p>
                    
                    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0;">
                        <p style="margin: 5px 0;"><strong>Total Fee:</strong> ₹{fee.total_fee}</p>
                        <p style="margin: 5px 0;"><strong>Amount Received:</strong> ₹{fee.paid_amount}</p>
                        <p style="margin: 5px 0; font-size: 18px; color: #d97706;"><strong>Remaining Balance: ₹{fee.due_amount}</strong></p>
                    </div>
                    
                    <p style="font-size: 15px; color: #555;">You can easily clear your remaining balance by logging into your student portal.</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="{login_url}" style="background-color: #4318FF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Pay Remaining Fee</a>
                    </div>
                </div>
                <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
                    If you have any questions, please feel free to reach out to the administration.<br>
                    This is an automated message.
                </div>
            </div>
        </body>
        </html>
        """
        
        return send_email(student.email, subject, html_message, is_html=True, student=student, fee=fee)

    return False


# 📌 Send Payment Success Thank You Email
def send_payment_success_email(student_id, amount_paid, payment_id, transaction_id=None, payment_method=None):
    student = Student.query.get(student_id)
    fee = Fee.query.filter_by(student_id=student_id).first()

    if not student or not fee:
        return False

    login_url = get_student_login_url()

    is_fully_paid = fee.due_amount <= 0
    subject = f"🎉 Payment Received: Receipt #{payment_id}" if not is_fully_paid else "🎊 Congratulations! Your Fees are Fully Paid"
    status_msg = "Your fee has been fully paid. Thank you!" if is_fully_paid else "We have successfully received your partial payment."

    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f7fe; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="background-color: #10b981; color: white; padding: 30px; text-align: center;">
                <div style="font-size: 40px; margin-bottom: 10px;">{'🎊' if is_fully_paid else '✅'}</div>
                <h2 style="margin: 0; font-size: 24px;">{ 'Fees Fully Paid!' if is_fully_paid else 'Payment Successful!'}</h2>
                <p style="margin-top: 10px; opacity: 0.9;">{status_msg}</p>
            </div>
            <div style="padding: 30px; color: #333;">
                <p style="font-size: 16px;">Dear <strong>{student.name}</strong>,</p>
                <p style="font-size: 15px; color: #555; line-height: 1.6;">Thank you for your payment. Below are the transaction and balance details:</p>
                
                <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0;">
                    <p style="margin: 5px 0;"><strong>Receipt ID:</strong> #{payment_id}</p>
                    <p style="margin: 5px 0; font-size: 20px; color: #047857;"><strong>Amount Paid: ₹{amount_paid}</strong></p>
                    {f'<p style="margin: 5px 0;"><strong>Transaction ID:</strong> {transaction_id}</p>' if transaction_id else ''}
                    {f'<p style="margin: 5px 0;"><strong>Payment Method:</strong> {payment_method}</p>' if payment_method else ''}
                    <hr style="border: 0; border-top: 1px solid #a7f3d0; margin: 15px 0;">
                    <p style="margin: 5px 0;"><strong>Total Fee:</strong> ₹{fee.total_fee}</p>
                    <p style="margin: 5px 0; font-size: 16px; color: {'#047857' if is_fully_paid else '#333'};">
                        <strong>Remaining Balance: ₹{fee.due_amount if fee.due_amount > 0 else 0}</strong>
                    </p>
                </div>
                
                <p style="font-size: 15px; color: #555;">You can download your official payment receipt anytime from the student portal.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{login_url}" style="background-color: #4318FF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Login to Student Portal</a>
                </div>
            </div>
            <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
                This is an automated confirmation from the Fee Administration System.<br>
                For any queries, please contact the administration.
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(
        student.email, subject, html_message, is_html=True,
        student=student, fee=fee,
        amount_paid=amount_paid, payment_id=payment_id,
        transaction_id=transaction_id, payment_method=payment_method
    )

# 📌 Alert All Partial Students
def alert_all_partials():
    fees = Fee.query.all()
    partials_exist = any(f.status == "Partial" for f in fees)

    if not partials_exist:
        return "✅ No partial fees found in the database!"

    sender_email, sender_password = get_email_credentials()
    
    success_count = 0
    fail_count = 0

    for f in fees:
        if f.status == "Partial":
            if alert_partial_student(f.student_id):
                success_count += 1
            else:
                fail_count += 1

    if fail_count > 0:
        return f"❌ ERROR: Email sending failed. Please check your config. (Sent: {success_count}, Failed: {fail_count})"

    if not sender_email or not sender_password or "your_" in sender_email:
        return f"✅ SUCCESS: Simulated Reminders sent to {success_count} students! (Check terminal)"

    return f"📧 SUCCESS: reminders successfully sent to {success_count} students!"


# 📌 Send Receipt Approved / Rejected Email to Student
def send_receipt_status_email(student_id, receipt_id, action, extracted_amount, extracted_utr):
    student = Student.query.get(student_id)
    if not student:
        return False

    login_url = get_student_login_url()

    is_approved = (action == "approve")

    if is_approved:
        subject = f"✅ Challan Approved: Receipt #{receipt_id}"
        header_color = "#10b981"
        header_icon = "✅"
        header_title = "Payment Verified!"
        status_badge_bg = "#ecfdf5"
        status_badge_border = "#10b981"
        status_badge_color = "#047857"
        status_text = "APPROVED"
        body_text = (
            "Great news! Your offline bank challan receipt has been verified and "
            "<strong>approved</strong> by the administration. Your fee records have been "
            "updated accordingly."
        )
        next_step = "You can now view your updated fee status and payment history in the student portal."
        btn_text = "View My Fee Status"
    else:
        subject = f"❌ Challan Rejected: Receipt #{receipt_id}"
        header_color = "#ef4444"
        header_icon = "❌"
        header_title = "Payment Rejected"
        status_badge_bg = "#fef2f2"
        status_badge_border = "#ef4444"
        status_badge_color = "#b91c1c"
        status_text = "REJECTED"
        body_text = (
            "Unfortunately, your offline bank challan receipt (Receipt #" + str(receipt_id) + ") "
            "has been <strong>rejected</strong> by the administration. This may be due to an "
            "unreadable image, incorrect details, or a duplicate submission."
        )
        next_step = "Please re-upload a clear, valid challan image or contact the accounts office for assistance."
        btn_text = "Re-upload Challan"

    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f7fe; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

            <!-- Header -->
            <div style="background-color: {header_color}; color: white; padding: 35px 30px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">{header_icon}</div>
                <h2 style="margin: 0; font-size: 26px; font-weight: 700;">{header_title}</h2>
                <p style="margin-top: 8px; opacity: 0.9; font-size: 15px;">
                    Challan Receipt #{receipt_id} — Status Update
                </p>
            </div>

            <!-- Body -->
            <div style="padding: 35px 30px; color: #333;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Dear <strong>{student.name}</strong>,
                </p>
                <p style="font-size: 15px; color: #555; line-height: 1.7;">
                    {body_text}
                </p>

                <!-- Status Badge -->
                <div style="background: {status_badge_bg}; border-left: 4px solid {status_badge_border}; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <p style="margin: 6px 0; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Status</p>
                    <p style="margin: 6px 0; font-size: 22px; font-weight: 800; color: {status_badge_color};">
                        {status_text}
                    </p>
                    <hr style="border: 0; border-top: 1px solid {status_badge_border}; opacity: 0.3; margin: 15px 0;">
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Receipt ID:</strong> #{receipt_id}</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>UTR / Transaction ID:</strong> {extracted_utr or 'N/A'}</p>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>Extracted Amount:</strong> Rs. {extracted_amount or 'N/A'}</p>
                </div>

                <p style="font-size: 15px; color: #555; line-height: 1.7;">{next_step}</p>

                <!-- CTA Button -->
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{login_url}"
                       style="background-color: #4318FF; color: white; padding: 14px 30px;
                              text-decoration: none; border-radius: 8px; font-weight: 700;
                              font-size: 15px; display: inline-block; letter-spacing: 0.5px;">
                        {btn_text}
                    </a>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 18px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
                This is an automated message from the Fee Administration System.<br>
                For any queries, please contact the accounts office directly.
            </div>
        </div>
    </body>
    </html>
    """

    return send_email(student.email, subject, html_message, is_html=True, student=student, amount_paid=extracted_amount, payment_id=receipt_id)