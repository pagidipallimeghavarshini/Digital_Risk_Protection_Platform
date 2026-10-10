"""
Digital Shield AI - Core Flask REST API Server
Integrates URL, Message, and QR scanners with ML detection baseline and MySQL persistence.
Also serves frontend HTML/CSS/JS with full CORS support.
"""

import json
import os
import sys
from flask import Flask, request, jsonify, send_from_directory, make_response

# Ensure backend root is in Python module path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_database, save_scan, get_history, get_stats, delete_record, clear_all_records
from ml_engine.url_detector import analyze_url
from ml_engine.message_detector import analyze_message
from ml_engine.qr_detector import analyze_qr_payload, decode_qr_image

# Path to frontend directory
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")

# Initialize database on startup
active_db = init_database()


# CORS Middleware for all responses
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    return response


@app.route("/api/options", methods=["OPTIONS"])
def handle_options():
    res = make_response()
    return res


# ----------------------------------------------------
# 1. System Health API
# ----------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health_check():
    """Returns system status, active database engine, and ML pipeline status."""
    return jsonify({
        "status": "ONLINE",
        "service": "Digital Shield AI Core v2.4",
        "active_database": active_db,
        "capabilities": {
            "url_scanner": "Lexical + Heuristic + Entropy Analysis",
            "message_scanner": "NLP Baseline + Multilingual (Telugu & English)",
            "qr_scanner": "Quishing Exploit + UPI Fraud Detection",
            "database_persistence": "MySQL 8.0+ (Auto-Resilient Fallback)"
        }
    })


# ----------------------------------------------------
# 2. URL Scanner API
# ----------------------------------------------------
@app.route("/api/scan/url", methods=["POST", "OPTIONS"])
def scan_url_endpoint():
    if request.method == "OPTIONS":
        return make_response("", 200)

    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()

    if not url:
        return jsonify({"error": "Missing 'url' parameter in request body."}), 400

    # Perform analysis
    result = analyze_url(url)

    # Persist in Database
    scan_id = save_scan(
        scan_type="URL",
        target_input=url,
        risk_level=result["risk_level"],
        risk_score=result["risk_score"],
        detection_method=result["detection_method"],
        summary=result["summary"],
        details_json=result,
        language="en"
    )

    result["scan_id"] = scan_id
    return jsonify(result), 200


# ----------------------------------------------------
# 3. Message Scanner API (Telugu + English)
# ----------------------------------------------------
@app.route("/api/scan/message", methods=["POST", "OPTIONS"])
def scan_message_endpoint():
    if request.method == "OPTIONS":
        return make_response("", 200)

    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    language = data.get("language", "auto")

    if not message:
        return jsonify({"error": "Missing 'message' text in request body."}), 400

    # Perform ML & Heuristic Analysis
    result = analyze_message(message, forced_lang=language)

    # Persist in Database
    scan_id = save_scan(
        scan_type="MESSAGE",
        target_input=message,
        risk_level=result["risk_level"],
        risk_score=result["risk_score"],
        detection_method=result["detection_method"],
        summary=result["summary"],
        details_json=result,
        language=result["language"]
    )

    result["scan_id"] = scan_id
    return jsonify(result), 200


# ----------------------------------------------------
# 4. QR Code Scanner API
# ----------------------------------------------------
@app.route("/api/scan/qr", methods=["POST", "OPTIONS"])
def scan_qr_endpoint():
    if request.method == "OPTIONS":
        return make_response("", 200)

    qr_payload = ""

    # Check if multipart file upload
    if "qr_image" in request.files:
        file = request.files["qr_image"]
        image_bytes = file.read()
        success, decoded_str, err_msg = decode_qr_image(image_bytes)
        if not success:
            return jsonify({
                "error": err_msg or "Failed to decode QR code from the uploaded image.",
                "hint": "Try using the in-browser live camera scanner or provide a clearer image."
            }), 400
        qr_payload = decoded_str
    else:
        # Check JSON payload
        data = request.get_json(silent=True) or {}
        qr_payload = data.get("qr_content", "").strip()

    if not qr_payload:
        return jsonify({"error": "No QR payload string or image file provided."}), 400

    # Perform analysis
    result = analyze_qr_payload(qr_payload)

    # Persist in Database
    scan_id = save_scan(
        scan_type="QR",
        target_input=qr_payload,
        risk_level=result["risk_level"],
        risk_score=result["risk_score"],
        detection_method=result["detection_method"],
        summary=result["summary"],
        details_json=result,
        language="en"
    )

    result["scan_id"] = scan_id
    return jsonify(result), 200


# ----------------------------------------------------
# 5. Dashboard Security Telemetry & Stats API
# ----------------------------------------------------
@app.route("/api/stats", methods=["GET"])
def stats_endpoint():
    """Returns actual real scan statistics from the database."""
    stats = get_stats()
    return jsonify(stats), 200


# ----------------------------------------------------
# 6. Scan History Records API
# ----------------------------------------------------
@app.route("/api/history", methods=["GET"])
def history_endpoint():
    """Retrieves paginated and filtered historical scan records."""
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    scan_type = request.args.get("type", None)
    risk_level = request.args.get("risk", None)
    search = request.args.get("search", None)

    history_data = get_history(limit=limit, offset=offset, scan_type=scan_type, risk_level=risk_level, search=search)
    return jsonify(history_data), 200


@app.route("/api/history/<int:record_id>", methods=["DELETE", "OPTIONS"])
def delete_history_endpoint(record_id):
    if request.method == "OPTIONS":
        return make_response("", 200)

    success = delete_record(record_id)
    return jsonify({"success": success, "deleted_id": record_id}), 200


@app.route("/api/history/clear", methods=["DELETE", "POST", "OPTIONS"])
def clear_history_endpoint():
    if request.method == "OPTIONS":
        return make_response("", 200)

    success = clear_all_records()
    return jsonify({"success": success, "message": "All history records cleared."}), 200


# ----------------------------------------------------
# 7. Frontend Page Serving Routes
# ----------------------------------------------------
@app.route("/")
def serve_home():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/dashboard")
@app.route("/dashboard.html")
def serve_dashboard():
    return send_from_directory(FRONTEND_DIR, "dashboard.html")

@app.route("/url-scanner")
@app.route("/url-scanner.html")
def serve_url_scanner():
    return send_from_directory(FRONTEND_DIR, "url-scanner.html")

@app.route("/message-scanner")
@app.route("/message-scanner.html")
def serve_message_scanner():
    return send_from_directory(FRONTEND_DIR, "message-scanner.html")

@app.route("/qr-scanner")
@app.route("/qr-scanner.html")
def serve_qr_scanner():
    return send_from_directory(FRONTEND_DIR, "qr-scanner.html")

@app.route("/history")
@app.route("/history.html")
def serve_history():
    return send_from_directory(FRONTEND_DIR, "history.html")

@app.route("/about")
@app.route("/about.html")
def serve_about():
    return send_from_directory(FRONTEND_DIR, "about.html")

@app.route("/<path:path>")
def serve_static(path):
    if os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, "index.html")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"\n=======================================================")
    print(f" Digital Shield AI Server Running on http://127.0.0.1:{port}")
    print(f" Active Database: {active_db}")
    print(f" Frontend Serving from: {FRONTEND_DIR}")
    print(f"=======================================================\n")
    app.run(host="0.0.0.0", port=port, debug=True)
