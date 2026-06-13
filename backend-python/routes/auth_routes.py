from flask import Blueprint, render_template, request, redirect, session
from models.admin_model import Admin
from extensions import db
import random
from services.alert_service import send_email

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        admin = Admin.query.filter_by(username=username).first()
        if admin and admin.check_password(password):
            if not admin.is_verified:
                return render_template("login.html", error="Account not verified! Please register again or verify.")
            # Direct login without OTP
            session['admin_id'] = admin.id
            return redirect("/dashboard")
        else:
            return render_template("login.html", error="Invalid username or password!")

    msg = request.args.get('msg')
    return render_template("login.html", msg=msg)

@auth_bp.route("/student_login", methods=["GET", "POST"])
def student_login():
    if request.method == "POST":
        from models.student_model import Student
        roll_no = request.form["roll_no"]
        email = request.form["email"]

        student = Student.query.filter_by(roll_no=roll_no, email=email).first()
        if student:
            session['student_id'] = student.id
            return redirect("/student/dashboard")
        else:
            return render_template("student_login.html", error="Invalid Roll Number or Email!")
            
    msg = request.args.get('msg')
    return render_template("student_login.html", msg=msg)

@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        email = request.form["email"]
        password = request.form["password"]
        
        if Admin.query.filter_by(username=username).first() or Admin.query.filter_by(email=email).first():
            return render_template("register.html", error="Username or Email already exists!")
            
        otp = str(random.randint(100000, 999999))
        
        new_admin = Admin(username=username, email=email, otp=otp, is_verified=False)
        new_admin.set_password(password)
        db.session.add(new_admin)
        db.session.commit()
        
        # Send OTP Email
        subject = "🔐 Your OTP for Fee System"
        message = f"Hello {username},\n\nYour OTP for account verification is: {otp}\n\nPlease enter this on the verification screen to complete your registration."
        send_email(email, subject, message, is_html=False)
        
        session['verify_email'] = email
        return redirect("/verify_otp")
        
    return render_template("register.html")

@auth_bp.route("/verify_otp", methods=["GET", "POST"])
def verify_otp():
    email = session.get('verify_email')
    if not email:
        return redirect("/register")
        
    if request.method == "POST":
        otp_entered = request.form["otp"]
        admin = Admin.query.filter_by(email=email).first()
        
        if admin and admin.otp == otp_entered:
            admin.is_verified = True
            admin.otp = None
            db.session.commit()
            session.pop('verify_email', None)
            # If coming from login, log them in
            if session.get('login_flow'):
                session.pop('login_flow', None)
                session['admin_id'] = admin.id
                return redirect("/dashboard")
                
            return redirect("/?msg=verified")
        else:
            return render_template("verify_otp.html", error="Invalid OTP! Please try again.", email=email)
            
    return render_template("verify_otp.html", email=email)

@auth_bp.route("/logout")
def logout():
    is_student = 'student_id' in session
    session.clear()
    if is_student:
        return redirect("/student_login?msg=logged_out")
    return redirect("/?msg=logged_out")

@auth_bp.route("/forgot_password", methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        email = request.form["email"]
        admin = Admin.query.filter_by(email=email).first()
        if admin:
            otp = str(random.randint(100000, 999999))
            admin.otp = otp
            db.session.commit()
            
            # Send Reset OTP Email
            subject = "🔑 Reset Your Admin Password"
            message = f"Hello {admin.username},\n\nYou requested to reset your admin password. Your reset OTP code is: {otp}\n\nPlease enter this code on the password reset page to choose a new password."
            send_email(email, subject, message, is_html=False)
            
            session['reset_email'] = email
            return redirect("/reset_password")
        else:
            return render_template("forgot_password.html", error="Email address not found!")
            
    return render_template("forgot_password.html")

@auth_bp.route("/reset_password", methods=["GET", "POST"])
def reset_password():
    email = session.get('reset_email')
    if not email:
        return redirect("/forgot_password")
        
    if request.method == "POST":
        otp_entered = request.form["otp"]
        password = request.form["password"]
        confirm_password = request.form["confirm_password"]
        
        if password != confirm_password:
            return render_template("reset_password.html", email=email, error="Passwords do not match!")
            
        admin = Admin.query.filter_by(email=email).first()
        if admin and admin.otp == otp_entered:
            admin.set_password(password)
            admin.otp = None
            db.session.commit()
            session.pop('reset_email', None)
            return redirect("/?msg=password_reset")
        else:
            return render_template("reset_password.html", email=email, error="Invalid OTP! Please try again.")
            
    return render_template("reset_password.html", email=email)
