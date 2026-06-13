import sys
import os
for venv_name in [".venv", "venv"]:
    venv_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), venv_name, "Lib", "site-packages")
    if os.path.exists(venv_path) and venv_path not in sys.path:
        sys.path.insert(0, venv_path)

from app import create_app
from extensions import db
from models.fee_structure_model import FeeStructure

# Provided Fee Structure Data
fee_data = [
    # Course, Year, Branch, Mgmt, Open, OBC, VJ/NT, SC/ST, OMS
    ("B. Tech", "First Year", "AI/CSE/CYS/ME/CE/IT/ETC/EE/DSE", 138745.00, 138745.00, 85050.00, 31354.00, 15245.00, 138745.00),
    ("B. Tech", "Direct Second Yr.", "AI/CSE/CYS/ME/CE/IT/ETC/EE/DSE", 124998.00, 124998.00, 77172.00, 29346.00, 14998.00, 124998.00),
    ("M.Tech", "First Year", "CAD/CAM/VLSI/CSE/SRT", 100792.00, 100792.00, 100792.00, 100792.00, 14792.00, 100792.00),
    ("MBA", "First Year", "MBA", 117836.00, 117836.00, 74358.00, 30880.00, 17836.00, 117836.00),
    ("MCA", "First Year", "MCA", 100498.00, 100498.00, 63324.00, 26150.00, 14998.00, 100498.00),
    ("BCCA", "First Year", "BCCA", 37000.00, 37000.00, 37000.00, 37000.00, 12458.00, 37000.00),
    ("BSC", "First Year", "CS/CYBER SECURITY", 55000.00, 55000.00, 55000.00, 55000.00, 32801.00, 55000.00),
    ("M.SC", "First Year", "CS", 51500.00, 51500.00, 51500.00, 51500.00, 14805.00, 51500.00),
    ("Polytechnic", "First Year", "ME/CSE/Civil/ETC/EE", 67139.00, 67139.00, 39019.50, 10900.00, 3139.00, 67139.00),
    ("Polytechnic", "Direct Second Yr.", "ME/CSE/Civil/ETC/EE", 66927.00, 66927.00, 38807.50, 10688.00, 2927.00, 66927.00)
]

app = create_app()

with app.app_context():
    # Clear existing data just in case
    db.session.query(FeeStructure).delete()

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
    print("[SUCCESS] Fee structure successfully seeded into the database.")
