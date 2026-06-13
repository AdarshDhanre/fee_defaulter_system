"""
fix_admin.py - Run this ONCE to fix the admin account and ensure all tables exist.
Usage: venv\Scripts\python.exe fix_admin.py
"""
import sys
import os
for venv_name in [".venv", "venv"]:
    venv_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), venv_name, "Lib", "site-packages")
    if os.path.exists(venv_path) and venv_path not in sys.path:
        sys.path.insert(0, venv_path)

from app import create_app
from extensions import db
from models.admin_model import Admin
from models.payment_model import OfflineReceipt

app = create_app()

with app.app_context():
    # Ensure ALL tables are created (including OfflineReceipt)
    db.create_all()
    print("[OK] All database tables ensured.")
    
    # Check if 'admin' user exists
    admin = Admin.query.filter_by(username='admin').first()
    
    if admin:
        # Fix: mark as verified + reset password to 'admin123'
        admin.is_verified = True
        admin.set_password('admin123')
        admin.otp = None
        db.session.commit()
        print(f"[OK] Admin '{admin.username}' is now VERIFIED. Password set to 'admin123'")
    else:
        # Create a fresh verified admin
        new_admin = Admin(
            username='admin',
            email='admin@college.com',
            is_verified=True,
            otp=None
        )
        new_admin.set_password('admin123')
        db.session.add(new_admin)
        db.session.commit()
        print("[OK] New admin created. Username: 'admin', Password: 'admin123'")

    # Show all admins in DB
    all_admins = Admin.query.all()
    print(f"\n--- All Admins in DB ---")
    for a in all_admins:
        print(f"  ID={a.id} | username='{a.username}' | email='{a.email}' | verified={a.is_verified}")
    
    # Show pending receipts count
    pending = OfflineReceipt.query.filter_by(status='Pending').count()
    total = OfflineReceipt.query.count()
    print(f"\n--- OfflineReceipt Stats ---")
    print(f"  Total Receipts: {total}")
    print(f"  Pending: {pending}")
    
    print("\n[SUCCESS] Fix complete! Login with: username='admin', password='admin123'")
