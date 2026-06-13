import sys
import os

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
from models.fee_structure_model import FeeStructure
from seed_fees import fee_data

app = create_app()

with app.app_context():
    # Make sure all tables exist
    db.create_all()

    # Clear existing data in order of dependency constraints (and restart identity sequences to 1)
    print("Clearing existing student, fee, payment, and fee structure data...")
    try:
        db.session.execute(db.text("TRUNCATE TABLE offline_receipt, payment, fee, student, fee_structure RESTART IDENTITY CASCADE;"))
        db.session.commit()
        print("[DATABASE] Tables truncated and sequences reset successfully.")
    except Exception as e:
        db.session.rollback()
        print(f"[DATABASE] Truncate failed ({e}), falling back to delete queries...")
        db.session.query(OfflineReceipt).delete()
        db.session.query(Payment).delete()
        db.session.query(Fee).delete()
        db.session.query(Student).delete()
        db.session.query(FeeStructure).delete()
        db.session.commit()

    print("Seeding Fee Structure from seed_fees.py...")
    for row in fee_data:
        record = FeeStructure(
            course=row[0],
            year=row[1],
            branch=row[2],
            fee_mgmt=row[3],
            fee_open=row[4],
            fee_obc=row[5],
            fee_vjnt=row[6],
            fee_scst=row[7],
            fee_oms=row[8]
        )
        db.session.add(record)
    
    db.session.commit()
    print("[SUCCESS] Fee structures seeded successfully!")
    print("[INFO] Dummy student, fee, and payment data cleared (no dummy students seeded).")
