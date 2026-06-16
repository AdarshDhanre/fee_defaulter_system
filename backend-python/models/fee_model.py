from extensions import db
from datetime import datetime

class Fee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), index=True)  # ✅ Indexed for fast lookups
    total_fee = db.Column(db.Integer)
    paid_amount = db.Column(db.Integer, default=0)
    deadline = db.Column(db.DateTime)

    @property
    def due_amount(self):
        return self.total_fee - self.paid_amount

    @property
    def late_fine(self):
        if self.due_amount > 0 and self.deadline and datetime.now() > self.deadline:
            days_late = (datetime.now() - self.deadline).days
            return max(0, days_late * 50)  # ₹50 per day
        return 0

    @property
    def total_due(self):
        return self.due_amount + self.late_fine

    @property
    def status(self):
        if self.due_amount <= 0:
            return "Paid"
        elif self.deadline and datetime.now() > self.deadline:
            return "Overdue"
        else:
            return "Partial"