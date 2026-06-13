import os
import sys

# Add virtual environment to path if present
for venv_name in [".venv", "venv"]:
    venv_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), venv_name, "Lib", "site-packages")
    if os.path.exists(venv_path) and venv_path not in sys.path:
        sys.path.insert(0, venv_path)

from app import create_app
from extensions import db
from models.student_model import Student
from models.fee_model import Fee
from models.payment_model import Payment, OfflineReceipt

app = create_app()
with app.app_context():
    try:
        # Delete in order of foreign key dependencies to prevent violations
        num_receipts = db.session.query(OfflineReceipt).delete()
        num_payments = db.session.query(Payment).delete()
        num_fees = db.session.query(Fee).delete()
        num_students = db.session.query(Student).delete()
        db.session.commit()
        print(f"Successfully cleared: {num_students} students, {num_fees} fees, {num_payments} payments, and {num_receipts} offline receipts.")
    except Exception as e:
        db.session.rollback()
        print(f"Error clearing database: {e}")
