from flask import Blueprint, render_template, send_file
import os
from services.alert_service import alert_all_defaulters, alert_all_partials
from services.report_service import get_summary, get_full_report, generate_csv

report_bp = Blueprint('report', __name__)

@report_bp.route("/send_alerts")
def send_alerts():
    result = alert_all_defaulters()
    return render_template("send_alerts_result.html", message=result)

@report_bp.route("/send_partial_alerts")
def send_partial_alerts():
    result = alert_all_partials()
    return render_template("send_alerts_result.html", message=result)

@report_bp.route("/reports")
def reports():
    return render_template(
        "reports.html",
        summary=get_summary(),
        report=get_full_report()
    )

@report_bp.route("/download_report")
def download_report():
    # Save the CSV in the current directory and send it
    filepath = generate_csv(os.path.abspath("report.csv"))
    return send_file(filepath, as_attachment=True, download_name="fee_report.csv")