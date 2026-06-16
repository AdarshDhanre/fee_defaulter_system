from flask import Blueprint, render_template
from models.fee_model import Fee
from models.student_model import Student
from extensions import db
from datetime import datetime

defaulter_bp = Blueprint('defaulter', __name__)

# 📌 View Defaulters — Optimized: single JOIN query (no N+1)
@defaulter_bp.route("/defaulters")
def defaulters():
    now = datetime.now()

    # ✅ Single JOIN query instead of N+1 Student lookups inside loop
    results = (
        db.session.query(Fee, Student)
        .join(Student, Fee.student_id == Student.id)
        .filter(
            Fee.paid_amount < Fee.total_fee,
            Fee.deadline.isnot(None),
            Fee.deadline < now,
        )
        .all()
    )

    defaulter_list = [
        {
            "student_id": fee.student_id,
            "name": student.name,
            "total_fee": fee.total_fee,
            "paid": fee.paid_amount,
            "due": fee.due_amount,
            "status": "Overdue",
            "deadline": fee.deadline,
        }
        for fee, student in results
    ]

    return render_template("defaulters.html", data=defaulter_list)