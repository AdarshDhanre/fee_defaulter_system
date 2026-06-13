from extensions import db
from datetime import datetime

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'))
    amount = db.Column(db.Integer)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    method = db.Column(db.String(50))
    transaction_id = db.Column(db.String(100), unique=True)

class OfflineReceipt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'))
    file_path = db.Column(db.String(255), nullable=False)
    
    # AI Extracted Data
    extracted_utr = db.Column(db.String(100))
    extracted_amount = db.Column(db.Integer)
    extracted_date = db.Column(db.String(50))
    
    # Status: 'Pending', 'Approved', 'Rejected', 'Fraud_Flagged'
    status = db.Column(db.String(50), default='Pending')
    
    # AI Confidence or Notes
    ai_confidence = db.Column(db.String(20))
    
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)