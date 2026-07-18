from flask import Blueprint, render_template, session, redirect, request, jsonify
import os
from models.student_model import Student
from models.fee_model import Fee
from models.payment_model import Payment
from extensions import db
import datetime
import razorpay

student_portal_bp = Blueprint('student_portal', __name__, url_prefix='/student')

# ==========================================
# RAZORPAY CREDENTIALS (set in .env file)
# Get these from dashboard.razorpay.com -> Settings -> API Keys
# ==========================================
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_Siz0DM75yKVLRd")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "DK4EXJsSjwq0coBhkEUQjTdf")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

@student_portal_bp.route("/dashboard")
def dashboard():
    student_id = session.get('student_id')
    student = Student.query.get(student_id)
    if not student:
        return redirect("/")

    fees = Fee.query.filter_by(student_id=student.id).all()
    
    total_fee = sum([f.total_fee for f in fees])
    paid_fee = sum([f.paid_amount for f in fees])
    remaining_fee = sum([f.due_amount for f in fees])
    total_fine = sum([f.late_fine for f in fees])
    total_payable = sum([f.total_due for f in fees])
    
    payments = Payment.query.filter_by(student_id=student.id).order_by(Payment.date.desc()).all()

    # Fetch student's offline challan submissions
    from models.payment_model import OfflineReceipt
    offline_receipts = OfflineReceipt.query.filter_by(student_id=student.id).order_by(OfflineReceipt.upload_date.desc()).all()

    return render_template("student_portal/dashboard.html", 
                           student=student, 
                           fees=fees, 
                           total_fee=total_fee, 
                           paid_fee=paid_fee,
                           remaining_fee=remaining_fee,
                           total_fine=total_fine,
                           total_payable=total_payable,
                           payments=payments,
                           offline_receipts=offline_receipts,
                           razorpay_key_id=RAZORPAY_KEY_ID)

@student_portal_bp.route("/create_order", methods=["POST"])
def create_order():
    student_id = session.get('student_id')
    amount = float(request.form.get("amount", 0))
    
    if amount <= 0:
        return jsonify({"error": "Invalid Amount"}), 400
        
    student = Student.query.get(student_id)
    all_fees = Fee.query.filter_by(student_id=student.id).all()
    fees = [f for f in all_fees if f.due_amount > 0]
    
    if not fees:
        return jsonify({"error": "No dues pending"}), 400
        
    fee = fees[0]
    if amount > fee.total_due:
        amount = fee.total_due

    # Create Order in Razorpay
    # Amount is in paise (₹1 = 100 paise)
    order_amount = int(amount * 100)
    order_currency = "INR"
    
    try:
        payment_order = razorpay_client.order.create({
            "amount": order_amount,
            "currency": order_currency,
            "payment_capture": "1" # Auto capture
        })
        
        # Save order info in session to verify later
        session['razorpay_order_id'] = payment_order['id']
        session['paying_amount'] = amount
        
        return jsonify({
            "order_id": payment_order['id'],
            "amount": order_amount,
            "currency": order_currency,
            "name": student.name,
            "email": student.email,
            "contact": "9999999999" # Can be dynamic if student has phone number
        })
    except Exception as e:
        print("Razorpay Error:", e)
        return jsonify({"error": "Something went wrong while creating payment link."}), 500

@student_portal_bp.route("/verify_payment", methods=["POST"])
def verify_payment():
    student_id = session.get('student_id')
    razorpay_payment_id = request.form.get('razorpay_payment_id')
    razorpay_order_id = request.form.get('razorpay_order_id')
    razorpay_signature = request.form.get('razorpay_signature')
    amount_paid = session.get('paying_amount', 0)
    
    # Verify signature
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
        
        # Signature is valid, update database
        student = Student.query.get(student_id)
        all_fees = Fee.query.filter_by(student_id=student.id).all()
        fees = [f for f in all_fees if f.due_amount > 0]
        
        if fees:
            fee = fees[0]
            fee.paid_amount += amount_paid
            
            # Create payment record
            new_payment = Payment(
                student_id=student.id,
                amount=amount_paid,
                method="Razorpay",
                transaction_id=razorpay_payment_id,
                date=datetime.datetime.utcnow()
            )
            db.session.add(new_payment)
            db.session.commit()
            
            # 🔥 Send "Thank You" Success Email (with transaction details for Google Sheets)
            from services.alert_service import send_payment_success_email, log_payment_to_sheets
            try:
                send_payment_success_email(
                    student.id, amount_paid, new_payment.id,
                    transaction_id=razorpay_payment_id,
                    payment_method="Razorpay"
                )
            except Exception as email_err:
                print(f"[Email Error] Failed to send success email: {email_err}")
            
            # 📊 Log payment to Google Sheets (dedicated call - email se alag)
            try:
                log_payment_to_sheets(
                    student_id=student.id,
                    amount_paid=amount_paid,
                    payment_id=new_payment.id,
                    transaction_id=razorpay_payment_id,
                    payment_method="Razorpay"
                )
            except Exception as sheets_err:
                print(f"[Sheets Log Error] {sheets_err}")
            
            # Clear session
            session.pop('razorpay_order_id', None)
            session.pop('paying_amount', None)
            
            return redirect(f"/student/receipt/{new_payment.id}")
            
    except razorpay.errors.SignatureVerificationError:
        return "Payment Verification Failed! Signature Mismatch.", 400

@student_portal_bp.route("/receipt/<int:payment_id>")
def receipt(payment_id):
    student_id = session.get('student_id')
    payment = Payment.query.get(payment_id)
    
    if not payment or payment.student_id != student_id:
        return redirect("/student/dashboard")
        
    student = Student.query.get(student_id)
    
    return render_template("student_portal/receipt.html", student=student, payment=payment)

from google import genai
import os

# Configure Gemini (Get your API key from aistudio.google.com)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") # Recommended to set in .env
gemini_client = None
if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print("Gemini Init Error:", e)

@student_portal_bp.route("/chat", methods=["POST"])
def chat():
    student_id = session.get('student_id')
    if not student_id:
        return jsonify({"reply": "Session expired. Please login again."})
        
    student = Student.query.get(student_id)
    fees = Fee.query.filter_by(student_id=student.id).all()
    
    # Calculate totals for AI context
    total_fee = sum([f.total_fee for f in fees])
    paid_fee = sum([f.paid_amount for f in fees])
    remaining_fee = sum([f.due_amount for f in fees])
    total_fine = sum([f.late_fine for f in fees])
    total_payable = sum([f.total_due for f in fees])
    
    data = request.get_json()
    user_message = data.get("message", "")

    # If Gemini API Key is available, use Smart AI
    if gemini_client:
        try:
            # 🚀 Provide Context to Gemini
            system_context = f"""
            You are 'EduAI Assistant', a helpful student support bot for the EduPortal Fee System.
            Current Student Data:
            - Name: {student.name}
            - Roll No: {student.roll_no}
            - Course/Branch: {student.course} ({student.branch})
            - Total Fee: ₹{total_fee}
            - Paid: ₹{paid_fee}
            - Remaining Due: ₹{remaining_fee}
            - Late Fine: ₹{total_fine}
            - Total Payable: ₹{total_payable}
            
            Guidelines:
            1. Be professional, polite, and helpful.
            2. If the student asks about their fee or due, give them the exact numbers from above.
            3. If they ask about how to pay, tell them to click the 'Pay Fees' tab.
            4. Keep answers concise. Use emojis occasionally.
            """
            
            response = gemini_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=f"{system_context}\n\nStudent says: {user_message}"
            )
            return jsonify({"reply": response.text})
            
        except Exception as e:
            print("Gemini Error:", e)
            # Fallback to simple logic if Gemini fails
            pass

    # 🛠️ FALLBACK (SIMPLE LOGIC)
    message = user_message.lower()
    reply = "I'm sorry, I'm having trouble thinking clearly right now. You can ask me about your 'pending fee', 'how to pay', or 'receipts'."
    
    if any(word in message for word in ["hi", "hello", "hey"]):
        reply = f"Hello {student.name.split()[0]}! 👋 I am your EduPortal AI Assistant. How can I help you today?"
    elif any(word in message for word in ["fee", "due", "pending", "balance", "amount"]):
        if total_payable > 0:
            reply = f"You have a total payable amount of ₹{total_payable} (including ₹{total_fine} fine). You can pay it in the 'Pay Fees' tab."
        else:
            reply = "Great news! 🎉 You have no pending dues."
    elif any(word in message for word in ["pay", "how", "make payment"]):
        reply = "To make a payment, click on the **'Pay Fees'** tab in the sidebar."
    elif any(word in message for word in ["thank", "thanks", "ok"]):
        reply = "You're welcome! 😊"
        
    return jsonify({"reply": reply})

import datetime
from werkzeug.utils import secure_filename
from services.ocr_service import extract_receipt_data
from models.payment_model import OfflineReceipt

UPLOAD_FOLDER = os.path.join('static', 'uploads', 'receipts')

@student_portal_bp.route("/upload_receipt", methods=["POST"])
def upload_receipt():
    # Accept student_id from session (web UI) OR from request body (Next.js API)
    student_id = session.get('student_id')
    if not student_id:
        # Try JSON body first, then form data
        if request.is_json:
            student_id = request.get_json().get('student_id')
        else:
            student_id = request.form.get('student_id')
    
    if not student_id:
        return jsonify({"error": "Session expired or student_id missing"}), 401
        
    if 'receipt' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files['receipt']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    if file:
        # Create upload directory if it doesn't exist
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        filename = secure_filename(f"student_{student_id}_{int(datetime.datetime.now().timestamp())}_{file.filename}")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Call OCR Service
        ocr_result = extract_receipt_data(filepath)
        
        if "error" in ocr_result:
            return jsonify({"error": "Failed to process image. Try again."}), 500
            
        # Extract Data
        extracted_utr = str(ocr_result.get("transaction_id", ""))
        extracted_amount = str(ocr_result.get("amount", "")).replace(',', '')
        
        # Convert amount to int if possible
        try:
            amt = int(extracted_amount) if extracted_amount and extracted_amount.lower() != "null" else 0
        except ValueError:
            amt = 0
            
        # Create Database Entry
        new_receipt = OfflineReceipt(
            student_id=student_id,
            file_path=f"/static/uploads/receipts/{filename}",
            extracted_utr=extracted_utr if extracted_utr != "None" else None,
            extracted_amount=amt,
            extracted_date=str(ocr_result.get("date", "")),
            ai_confidence=str(ocr_result.get("confidence", "Low")),
            status="Pending"
        )
        
        db.session.add(new_receipt)
        db.session.commit()
        
        # Trigger n8n webhook if configured
        n8n_webhook_url = os.environ.get("N8N_WEBHOOK_URL")
        if n8n_webhook_url:
            student = Student.query.get(student_id)
            if student:
                # Extract database data into raw primitive dict inside the request thread
                payload = {
                    "event": "receipt.uploaded",
                    "receipt_id": new_receipt.id,
                    "student_id": student.id,
                    "student_name": student.name,
                    "student_email": student.email,
                    "file_path": new_receipt.file_path,
                    "extracted_utr": new_receipt.extracted_utr,
                    "extracted_amount": new_receipt.extracted_amount,
                    "extracted_date": new_receipt.extracted_date,
                    "ai_confidence": new_receipt.ai_confidence,
                    "status": new_receipt.status
                }
                
                def trigger_webhook(payload_to_send):
                    try:
                        import requests
                        requests.post(n8n_webhook_url, json=payload_to_send, timeout=5)
                        print(f"[n8n Webhook] Outgoing webhook triggered successfully for Receipt #{payload_to_send['receipt_id']}")
                    except Exception as ex:
                        print(f"[n8n Webhook Error] Failed to trigger webhook: {ex}")

                import threading
                threading.Thread(target=trigger_webhook, args=(payload,)).start()
        
        return jsonify({
            "message": "Receipt uploaded and scanned successfully! Pending Admin verification.",
            "data": ocr_result
        })
