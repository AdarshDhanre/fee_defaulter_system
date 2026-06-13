from app import app
from waitress import serve
import logging

if __name__ == "__main__":
    print("================================================================")
    print("🚀 STARTING PRODUCTION SERVER (WAITRESS)")
    print("================================================================")
    print("System is now ready to handle heavy traffic and concurrent users.")
    print("Listening on http://0.0.0.0:5000")
    print("Press Ctrl+C to stop.")
    
    # Waitress is a production WSGI server. 
    # It doesn't crash under heavy load like the default Flask development server.
    serve(app, host='0.0.0.0', port=5000, threads=6)
