import os
from flask import Blueprint, request, jsonify
from extensions import db
from models.payment_model import Payment, OfflineReceipt
from models.fee_model import Fee

api_bp = Blueprint('api', __name__, url_prefix='/api')

def require_api_token(f):
    """
    Decorator to enforce bearer token authentication.
    Compares the incoming Bearer token with the API_TOKEN environment variable.
    """
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        # 1. Fetch API token from environment
        configured_token = os.environ.get("API_TOKEN")
        if not configured_token:
            return jsonify({"error": "API Token is not configured on the server."}), 500

        # 2. Get auth header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header is missing."}), 401
            
        # 3. Check for Bearer prefix
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"error": "Authorization header must be in 'Bearer <token>' format."}), 401
            
        token = parts[1]
        
        # 4. Compare tokens
        if token != configured_token:
            return jsonify({"error": "Unauthorized: Invalid API Token."}), 401
            
        return f(*args, **kwargs)
    return decorated

@api_bp.route("/verify_receipt", methods=["POST"])
@require_api_token
def verify_receipt_api():
    """
    Secure endpoint for n8n or external integrations to verify offline receipts.
    Payload:
    {
        "receipt_id": <int>,
        "action": "approve" | "reject"
    }
    """
    data = request.get_json() or {}
    receipt_id = data.get("receipt_id")
    action = data.get("action")
    
    if not receipt_id or action not in ["approve", "reject"]:
        return jsonify({"error": "Invalid request parameters. 'receipt_id' and 'action' ('approve'/'reject') are required."}), 400
        
    receipt = OfflineReceipt.query.get(receipt_id)
    if not receipt:
        return jsonify({"error": "Receipt not found."}), 404
        
    # Check if receipt is already processed
    if receipt.status in ["Approved", "Rejected"]:
        return jsonify({"error": f"Receipt has already been processed. Current status: {receipt.status}."}), 409

    if action == "approve":
        receipt.status = "Approved"
        
        # Check if payment with this UTR already exists to prevent duplicate constraint violation
        utr = receipt.extracted_utr
        payment_exists = False
        if utr and utr.strip():
            payment_exists = Payment.query.filter_by(transaction_id=utr).first() is not None
            
        if not payment_exists:
            # Add to payment history
            new_payment = Payment(
                student_id=receipt.student_id,
                amount=receipt.extracted_amount,
                method="Offline Challan (n8n)",
                transaction_id=utr or f"OFFLINE_N8N_{receipt.id}"
            )
            db.session.add(new_payment)
            
            # Update student fee record
            fee_record = Fee.query.filter_by(student_id=receipt.student_id).first()
            if fee_record:
                fee_record.paid_amount = (fee_record.paid_amount or 0) + receipt.extracted_amount
        else:
            print(f"[INFO] Payment with UTR {utr} already exists in Python API endpoint. Skipping duplicate registration.")
            
    elif action == "reject":
        receipt.status = "Rejected"
        
    db.session.commit()

    # Send status email notification to student
    try:
        from services.alert_service import send_receipt_status_email
        send_receipt_status_email(
            student_id=receipt.student_id,
            receipt_id=receipt.id,
            action=action,
            extracted_amount=receipt.extracted_amount,
            extracted_utr=receipt.extracted_utr
        )
        email_sent = True
    except Exception as e:
        print(f"[EMAIL ERROR] Could not send receipt status email: {e}")
        email_sent = False

    return jsonify({
        "success": True,
        "message": f"Receipt #{receipt_id} has been {action}d successfully.",
        "email_sent": email_sent,
        "status": receipt.status
    }), 200
