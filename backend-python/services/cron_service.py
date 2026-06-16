from apscheduler.schedulers.background import BackgroundScheduler
import datetime
from services.alert_service import alert_all_defaulters, alert_all_partials
import logging
import os

# Set up logging for scheduler
logging.basicConfig()
logging.getLogger('apscheduler').setLevel(logging.WARNING)  # Reduced noise

def monthly_fee_reminder_job(app):
    """
    This function will run automatically on the 1st of every month.
    It needs the Flask app context to query the database.
    """
    with app.app_context():
        print("============================================================")
        print(f"⏰ [CRON JOB TRIGGERED] - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("Starting automated fee reminders...")
        
        # 1. Send warning emails to severe defaulters (Overdue / 0 paid)
        print("-> Alerting Defaulters...")
        defaulter_res = alert_all_defaulters()
        print(defaulter_res)
        
        # 2. Send polite reminders to partial payers
        print("-> Alerting Partial Payers...")
        partial_res = alert_all_partials()
        print(partial_res)
        
        print("✅ [CRON JOB COMPLETED]")
        print("============================================================")


def self_ping_job():
    """
    🏓 Keep-alive ping for Render Free Tier.
    Render free services spin down after 15 min of inactivity.
    This job pings /health every 14 minutes to prevent cold starts.
    """
    ping_url = os.environ.get("RENDER_EXTERNAL_URL", "")
    if not ping_url:
        return  # Only run on Render (when env var is set)
    try:
        import requests
        resp = requests.get(f"{ping_url}/health", timeout=10)
        print(f"[KeepAlive] Ping → {resp.status_code}", flush=True)
    except Exception as e:
        print(f"[KeepAlive] Ping failed: {e}", flush=True)


def start_scheduler(app):
    """
    Initializes and starts the background scheduler.
    """
    scheduler = BackgroundScheduler(daemon=True)
    
    # Schedule the job to run on the 1st day of every month at 09:00 AM
    scheduler.add_job(
        func=monthly_fee_reminder_job, 
        trigger='cron', 
        day='1', 
        hour='9', 
        minute='0', 
        args=[app],
        id='monthly_fee_reminder'
    )

    # ✅ Self-ping every 14 min to prevent Render free tier cold starts
    scheduler.add_job(
        func=self_ping_job,
        trigger='interval',
        minutes=14,
        id='render_keep_alive'
    )
    
    # FOR TESTING/DEMO PURPOSES: 
    # If you uncomment the line below, it will run every 2 minutes so you can see it working right now!
    # scheduler.add_job(func=monthly_fee_reminder_job, trigger='interval', minutes=2, args=[app], id='test_job')

    scheduler.start()
    print("[CRON] Background Scheduler Started. Automated fee reminders are active.")
    print("[CRON] Keep-alive ping scheduled every 14 minutes.")

