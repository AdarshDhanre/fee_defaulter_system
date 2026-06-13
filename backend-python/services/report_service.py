from models.fee_model import Fee
import csv

# 📌 Dashboard Summary
def get_summary():
    fees = Fee.query.all()

    total = len(fees)
    paid = sum(1 for f in fees if f.status == "Paid")
    partial = sum(1 for f in fees if f.status == "Partial")
    overdue = sum(1 for f in fees if f.status == "Overdue")

    return {
        "total_students": total,
        "paid": paid,
        "partial": partial,
        "overdue": overdue
    }


# 📌 Defaulter List
def get_defaulters():
    fees = Fee.query.all()
    return [f for f in fees if f.status == "Overdue"]


# 📌 Full Report Data
def get_full_report():
    fees = Fee.query.all()

    report = []
    for f in fees:
        student_text = f"{f.student.name} ({f.student.roll_no})" if f.student else f"Unknown ({f.student_id})"
        report.append({
            "student_id": student_text,
            "total_fee": f.total_fee,
            "paid": f.paid_amount,
            "due": f.due_amount,
            "status": f.status
        })

    return report


# 📌 Generate CSV (🔥 Winning Feature)
def generate_csv(filepath="report.csv"):
    fees = Fee.query.all()

    with open(filepath, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)

        # Header
        writer.writerow([
            "Student (Roll No)",
            "Total Fee",
            "Paid Amount",
            "Due Amount",
            "Status"
        ])

        # Data
        for f in fees:
            student_text = f"{f.student.name} ({f.student.roll_no})" if f.student else f"Unknown ({f.student_id})"
            writer.writerow([
                student_text,
                f.total_fee,
                f.paid_amount,
                f.due_amount,
                f.status
            ])

    return filepath