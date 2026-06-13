from extensions import db

class FeeStructure(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course = db.Column(db.String(50), nullable=False)
    year = db.Column(db.String(50), nullable=False)
    branch = db.Column(db.String(100), nullable=False)
    
    # Category based fees
    fee_mgmt = db.Column(db.Float, nullable=False)
    fee_open = db.Column(db.Float, nullable=False)
    fee_obc = db.Column(db.Float, nullable=False)
    fee_vjnt = db.Column(db.Float, nullable=False)
    fee_scst = db.Column(db.Float, nullable=False)
    fee_oms = db.Column(db.Float, nullable=False)
