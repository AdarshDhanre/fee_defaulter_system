from flask import Blueprint, request, redirect, url_for, render_template
from models.payment_model import Payment
from models.fee_model import Fee
from extensions import db
from datetime import datetime

payment_bp = Blueprint('payment', __name__)

from models.student_model import Student
from services.alert_service import send_email

# 📌 Payment Page (UI open karne ke liye)
@payment_bp.route("/payment")
def payment_page():
    students = Student.query.all()
    return render_template("payment.html", students=students)


# 📌 Make Payment
@payment_bp.route("/pay", methods=["POST"])
def pay():
    student_id = request.form["student_id"]
    try:
        amount = int(float(request.form["amount"]))
    except (ValueError, TypeError):
        return "❌ Invalid amount provided", 400

    # Fee record find karo
    fee = Fee.query.filter_by(student_id=student_id).first()

    if not fee:
        return "❌ Fee record not found for this student"

    # 🔥 VALIDATION (important)
    if amount <= 0:
        return "❌ Invalid amount"

    if amount > fee.due_amount:
        return f"❌ Amount exceeds due fee (Due: {fee.due_amount})"

    # 📌 Payment record save
    import random
    payment = Payment(
        student_id=student_id,
        amount=amount,
        method="Manual",
        transaction_id=f"MANUAL_{int(datetime.now().timestamp())}_{random.randint(1000, 9999)}",
        date=datetime.now()
    )

    # 📌 Fee update
    fee.paid_amount += amount

    db.session.add(payment)
    db.session.commit()

    # 🔥 Send Thank You Email (HTML Version)
    from services.alert_service import send_payment_success_email, log_payment_to_sheets
    try:
        send_payment_success_email(
            student_id, amount, payment.id,
            transaction_id=payment.transaction_id,
            payment_method="Manual"
        )
    except Exception as e:
        print(f"Failed to send email: {e}")

    # 📊 Log payment to Google Sheets (dedicated call)
    try:
        log_payment_to_sheets(
            student_id=student_id,
            amount_paid=amount,
            payment_id=payment.id,
            transaction_id=payment.transaction_id,
            payment_method="Manual"
        )
    except Exception as sheets_err:
        print(f"[Sheets Log Error] {sheets_err}")

    return redirect(url_for("payment.payment_history"))


# 📌 Payment History (🔥 bonus feature)
@payment_bp.route("/payments")
def payment_history():
    payments = Payment.query.all()
    return render_template("payments_list.html", payments=payments)