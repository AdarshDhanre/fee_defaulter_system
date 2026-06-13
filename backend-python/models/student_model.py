from extensions import db 

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    roll_no = db.Column(db.String(50))
    course = db.Column(db.String(50))
    year = db.Column(db.String(50))
    branch = db.Column(db.String(50))
    category = db.Column(db.String(50))
    email = db.Column(db.String(100))
    
    # Relationships
    fees = db.relationship('Fee', backref='student', lazy=True, cascade="all, delete-orphan")
    payments = db.relationship('Payment', backref='student', lazy=True, cascade="all, delete-orphan")
    offline_receipts = db.relationship('OfflineReceipt', backref='student', lazy=True, cascade="all, delete-orphan")