from flask import Blueprint, render_template
from models.student_model import Student
from models.fee_model import Fee

from extensions import db
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route("/dashboard")
def dashboard():
    from datetime import datetime

    students_count = Student.query.count()
    
    # 🚀 HIGH PERFORMANCE QUERYING
    # Calculate counts using actual DB columns, since 'status' is a python property
    paid_count = Fee.query.filter(Fee.total_fee <= Fee.paid_amount).count()
    overdue_count = Fee.query.filter(Fee.total_fee > Fee.paid_amount, Fee.deadline.is_not(None), Fee.deadline < datetime.now()).count()
    partial_count = Fee.query.filter(Fee.total_fee > Fee.paid_amount, (Fee.deadline.is_(None)) | (Fee.deadline >= datetime.now())).count()

    # 📊 Fetch Branch-wise Revenue for Bar Chart
    branch_revenue_data = db.session.query(
        Student.branch, 
        func.sum(Fee.paid_amount)
    ).join(Fee, Student.id == Fee.student_id).group_by(Student.branch).all()

    # Convert to lists for JSON serialization in the template
    branch_labels = [row[0] if row[0] else 'Unknown' for row in branch_revenue_data]
    branch_revenue = [float(row[1]) if row[1] else 0 for row in branch_revenue_data]

    # Calculate total fine pending
    all_fees = Fee.query.all()
    total_fine_pending = sum([f.late_fine for f in all_fees])
    
    # 🧾 Fetch Pending Offline Receipts for Verification
    from models.payment_model import OfflineReceipt
    pending_receipts = OfflineReceipt.query.filter_by(status='Pending').all()

    return render_template("dashboard.html",
                           total=students_count,
                           paid=paid_count,
                           overdue=overdue_count,
                           partial=partial_count,
                           total_fine=total_fine_pending,
                           branch_labels=branch_labels,
                           branch_revenue=branch_revenue,
                           pending_receipts=pending_receipts)

from flask import request, jsonify
from models.payment_model import Payment, OfflineReceipt

@dashboard_bp.route("/verify_receipt", methods=["POST"])
def verify_receipt():
    data = request.get_json()
    receipt_id = data.get("receipt_id")
    action = data.get("action") # 'approve' or 'reject'
    
    receipt = OfflineReceipt.query.get(receipt_id)
    if not receipt:
        return jsonify({"error": "Receipt not found"}), 404
        
    if action == "approve":
        receipt.status = "Approved"
        
        # Check if payment with this UTR already exists to prevent duplicate constraint violation
        utr = receipt.extracted_utr
        payment_exists = False
        if utr and utr.strip():
            payment_exists = Payment.query.filter_by(transaction_id=utr).first() is not None
            
        if not payment_exists:
            # Add to payment history
            new_payment = Payment(
                student_id=receipt.student_id,
                amount=receipt.extracted_amount,
                method="Offline Challan",
                transaction_id=utr or f"OFFLINE_{receipt.id}"
            )
            db.session.add(new_payment)
            
            # Update student fee record
            fee_record = Fee.query.filter_by(student_id=receipt.student_id).first()
            if fee_record:
                fee_record.paid_amount = (fee_record.paid_amount or 0) + receipt.extracted_amount
        else:
            print(f"[INFO] Payment with UTR {utr} already exists in Python backend. Skipping duplicate registration.")
            
    elif action == "reject":
        receipt.status = "Rejected"
        
    db.session.commit()

    # Send email notification to student
    try:
        from services.alert_service import send_receipt_status_email
        send_receipt_status_email(
            student_id=receipt.student_id,
            receipt_id=receipt.id,
            action=action,
            extracted_amount=receipt.extracted_amount,
            extracted_utr=receipt.extracted_utr
        )
    except Exception as e:
        print(f"[EMAIL ERROR] Could not send receipt status email: {e}")

    return jsonify({"success": f"Receipt {action}d successfully!"})


