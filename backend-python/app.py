import sys
import os
for venv_name in [".venv", "venv"]:
    venv_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), venv_name, "Lib", "site-packages")
    if os.path.exists(venv_path) and venv_path not in sys.path:
        sys.path.insert(0, venv_path)

from flask import Flask
from extensions import db
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Ensure config is loaded first
    app.config.from_pyfile('config.py')

    # Ensure database directory exists
    db_path = app.config.get('SQLALCHEMY_DATABASE_URI')
    if db_path and db_path.startswith('sqlite:///'):
        db_file = db_path.replace('sqlite:///', '')
        db_dir = os.path.dirname(db_file)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)
            print(f"[INIT] Created database directory: {db_dir}")

    db.init_app(app)

    # Register blueprints inside function to avoid circular imports
    from routes.dashboard_routes import dashboard_bp
    from routes.student_routes import student_bp
    from routes.fee_routes import fee_bp
    from routes.payment_routes import payment_bp
    from routes.defaulter_routes import defaulter_bp
    from routes.report_routes import report_bp
    from routes.auth_routes import auth_bp
    from routes.student_portal_routes import student_portal_bp
    from routes.api_routes import api_bp

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(fee_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(defaulter_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(student_portal_bp)
    app.register_blueprint(api_bp)

    @app.before_request
    def require_login():
        from flask import request, session, redirect
        # Bypass session checks for programmatic API endpoints (secured separately via token)
        if request.path.startswith('/api/'):
            return
        # Allow static files and auth routes
        allowed_endpoints = ['auth.login', 'auth.student_login', 'auth.student_login_page', 'auth.register', 'auth.verify_otp', 'auth.logout', 'static', 'auth.forgot_password', 'auth.reset_password']
        
        if request.endpoint and request.endpoint not in allowed_endpoints:
            # If accessing student portal routes, check for student_id
            if request.blueprint == 'student_portal':
                if 'student_id' not in session:
                    return redirect('/')
            # Otherwise it's admin routes, check for admin_id
            else:
                if 'admin_id' not in session:
                    return redirect('/')

    # Import models to ensure they are registered with SQLAlchemy
    with app.app_context():
        # Importing from models package (which we will create)
        from models.student_model import Student
        from models.fee_model import Fee
        from models.payment_model import Payment, OfflineReceipt
        from models.admin_model import Admin
        from models.fee_structure_model import FeeStructure
        db.create_all()

    # Start Background Scheduler
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or not app.debug:
        from services.cron_service import start_scheduler
        start_scheduler(app)

    # ✅ Health check endpoint for Render keep-alive ping
    from flask import jsonify

    @app.route("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    return app

# Main entry point for gunicorn/production
app = create_app()

if __name__ == "__main__":
    app.run(debug=True)