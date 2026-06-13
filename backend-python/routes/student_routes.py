from flask import Blueprint, render_template, request, redirect, url_for
from models.student_model import Student
from models.fee_model import Fee
from models.payment_model import Payment
from extensions import db

student_bp = Blueprint('student', __name__)

# 📌 View All Students + Search
@student_bp.route("/students")
def students():
    search = request.args.get("search")

    if search:
        data = Student.query.filter(Student.name.contains(search)).all()
    else:
        data = Student.query.all()

    return render_template("students.html", students=data)


# 📌 Add Student
@student_bp.route("/add_student", methods=["GET", "POST"])
def add_student():
    if request.method == "POST":
        student = Student(
            name=request.form["name"],
            roll_no=request.form["roll"],
            course=request.form.get("course", ""),
            year=request.form.get("year", ""),
            branch=request.form["branch"],
            category=request.form.get("category", ""),
            email=request.form["email"]
        )

        db.session.add(student)
        db.session.commit()

        return redirect(url_for("student.students"))

    return render_template("add_student.html")


# 📌 Edit Student
@student_bp.route("/edit_student/<int:id>", methods=["GET", "POST"])
def edit_student(id):
    student = Student.query.get_or_404(id)

    if request.method == "POST":
        student.name = request.form["name"]
        student.roll_no = request.form["roll"]
        student.course = request.form.get("course", "")
        student.year = request.form.get("year", "")
        student.branch = request.form["branch"]
        student.category = request.form.get("category", "")
        student.email = request.form["email"]

        db.session.commit()

        return redirect(url_for("student.students"))

    return render_template("add_student.html", student=student)


# 📌 Delete Student
@student_bp.route("/delete_student/<int:id>")
def delete_student(id):
    student = Student.query.get_or_404(id)
    
    # 🗑️ Delete associated Data (Now handled by SQLAlchemy Cascade)
    db.session.delete(student)
    db.session.commit()

    return redirect(url_for("student.students"))