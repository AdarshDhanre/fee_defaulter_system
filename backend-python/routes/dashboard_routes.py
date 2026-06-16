from flask import Blueprint, render_template
from models.student_model import Student
from models.fee_model import Fee

from extensions import db
from sqlalchemy import func
from datetime import datetime
import time

dashboard_bp = Blueprint('dashboard', __name__)

# ⚡ Simple in-memory cache (60 second TTL) to avoid re-computing on every request
_dashboard_cache = {"data": None, "expires_at": 0}
CACHE_TTL_SECONDS = 60


def _get_dashboard_stats():
    """Compute heavy dashboard stats with a short-lived cache."""
    now_ts = time.time()
    if _dashboard_cache["data"] and now_ts < _dashboard_cache["expires_at"]:
        return _dashboard_cache["data"]

    now = datetime.now()

    students_count = Student.query.count()

    # ✅ Efficient counts via SQL — avoids loading all rows
    paid_count = Fee.query.filter(Fee.total_fee <= Fee.paid_amount).count()
    overdue_count = Fee.query.filter(
        Fee.total_fee > Fee.paid_amount,
        Fee.deadline.isnot(None),
        Fee.deadline < now,
    ).count()
    partial_count = Fee.query.filter(
        Fee.total_fee > Fee.paid_amount,
        (Fee.deadline.is_(None)) | (Fee.deadline >= now),
    ).count()

    # 📊 Branch-wise revenue via SQL GROUP BY
    branch_revenue_data = (
        db.session.query(Student.branch, func.sum(Fee.paid_amount))
        .join(Fee, Student.id == Fee.student_id)
        .group_by(Student.branch)
        .all()
    )
    branch_labels = [row[0] if row[0] else "Unknown" for row in branch_revenue_data]
    branch_revenue = [float(row[1]) if row[1] else 0 for row in branch_revenue_data]

    # ✅ Total fine: calculate only for overdue records (avoids loading all fees into Python)
    overdue_fees = Fee.query.filter(
        Fee.total_fee > Fee.paid_amount,
        Fee.deadline.isnot(None),
        Fee.deadline < now,
    ).all()
    total_fine_pending = sum(f.late_fine for f in overdue_fees)

    from models.payment_model import OfflineReceipt
    pending_receipts = OfflineReceipt.query.filter_by(status="Pending").all()

    stats = {
        "students_count": students_count,
        "paid_count": paid_count,
        "overdue_count": overdue_count,
        "partial_count": partial_count,
        "branch_labels": branch_labels,
        "branch_revenue": branch_revenue,
        "total_fine_pending": total_fine_pending,
        "pending_receipts": pending_receipts,
    }

    _dashboard_cache["data"] = stats
    _dashboard_cache["expires_at"] = now_ts + CACHE_TTL_SECONDS
    return stats


@dashboard_bp.route("/dashboard")
def dashboard():
    s = _get_dashboard_stats()
    return render_template(
        "dashboard.html",
        total=s["students_count"],
        paid=s["paid_count"],
        overdue=s["overdue_count"],
        partial=s["partial_count"],
        total_fine=s["total_fine_pending"],
        branch_labels=s["branch_labels"],
        branch_revenue=s["branch_revenue"],
        pending_receipts=s["pending_receipts"],
    )


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


