from flask import Blueprint, render_template
from models.fee_model import Fee
from models.student_model import Student
from datetime import datetime

defaulter_bp = Blueprint('defaulter', __name__)

# 📌 View Defaulters
@defaulter_bp.route("/defaulters")
def defaulters():
    fees = Fee.query.all()

    defaulter_list = []

    for f in fees:
        # Logic: Strictly Overdue (Deadline passed)
        if f.due_amount > 0 and f.deadline and datetime.now() > f.deadline:
            student = Student.query.get(f.student_id)
            status = "Overdue"


            defaulter_list.append({
                "student_id": f.student_id,
                "name": student.name if student else "Unknown",
                "total_fee": f.total_fee,
                "paid": f.paid_amount,
                "due": f.due_amount,
                "status": status,
                "deadline": f.deadline
            })

    return render_template("defaulters.html", data=defaulter_list)