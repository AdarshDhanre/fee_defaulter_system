from flask import Blueprint, request, redirect, url_for, render_template
from models.fee_model import Fee
from models.student_model import Student
from extensions import db
from datetime import datetime

fee_bp = Blueprint('fee', __name__)

# 📌 Fee Page (Form open)
@fee_bp.route("/fee")
def fee_page():
    students = Student.query.all()
    last_fee = Fee.query.order_by(Fee.id.desc()).first()
    last_deadline = last_fee.deadline.strftime("%Y-%m-%d") if last_fee and last_fee.deadline else ""
    return render_template("fee.html", students=students, last_deadline=last_deadline)


# 📌 Add / Update Fee
@fee_bp.route("/add_fee", methods=["POST"])
def add_fee():
    student_id = request.form["student_id"]
    total_fee = int(request.form["total_fee"])
    paid = int(request.form["paid"])
    deadline = datetime.strptime(request.form["deadline"], "%Y-%m-%d")

    # 🔍 Check student exists
    student = Student.query.get(student_id)
    if not student:
        return "❌ Student not found"

    # 🔍 Check existing fee record
    fee = Fee.query.filter_by(student_id=student_id).first()

    if fee:
        # 🔥 Update existing record
        fee.total_fee = total_fee
        fee.paid_amount = paid
        fee.deadline = deadline
    else:
        # 🔥 Create new record
        fee = Fee(
            student_id=student_id,
            total_fee=total_fee,
            paid_amount=paid,
            deadline=deadline
        )
        db.session.add(fee)

    db.session.commit()

    return redirect(url_for("student.students"))


# 📌 View All Fees (🔥 useful for admin)
@fee_bp.route("/fees")
def view_fees():
    fees = Fee.query.all()
    return render_template("fees_list.html", fees=fees)


# 📌 Delete Fee Record
@fee_bp.route("/delete_fee/<int:id>")
def delete_fee(id):
    fee = Fee.query.get_or_404(id)

    db.session.delete(fee)
    db.session.commit()

    return redirect(url_for("fee.view_fees"))

@fee_bp.route("/get_student_fee/<int:student_id>")
def get_student_fee(student_id):
    student = Student.query.get(student_id)
    if not student:
        return {"error": "Student not found"}, 404
        
    from models.fee_structure_model import FeeStructure
    
    # Map the dropdown values to database seeded values
    mapped_year = "First Year"
    if student.year == "DSY":
        mapped_year = "Direct Second Yr."

    # Normalize branch to match seeded fee structures (abbreviations)
    search_branch = student.branch or ""
    branch_map = {
        "computer science": "CSE",
        "information tech": "IT",
        "electronics": "ETC",
        "mechanical": "ME",
        "civil": "CE",
        "electrical": "EE",
        "cyber security": "CYS"
    }
    for full_name, abbrev in branch_map.items():
        if full_name in search_branch.lower():
            search_branch = abbrev
            break

    # Find matching fee structure
    fee_struct = FeeStructure.query.filter(
        FeeStructure.course == student.course,
        FeeStructure.year == mapped_year,
        FeeStructure.branch.contains(search_branch)
    ).first()
    
    if not fee_struct:
        return {"total_fee": 0, "message": "No specific fee structure found"}
        
    cat = student.category
    fee = 0
    if cat == 'Open': fee = fee_struct.fee_open
    elif cat == 'OBC': fee = fee_struct.fee_obc
    elif cat == 'VJ/NT': fee = fee_struct.fee_vjnt
    elif cat == 'SC/ST': fee = fee_struct.fee_scst
    elif cat == 'OMS': fee = fee_struct.fee_oms
    elif cat == 'Mgmt.Quota': fee = fee_struct.fee_mgmt
    
    return {"total_fee": fee}