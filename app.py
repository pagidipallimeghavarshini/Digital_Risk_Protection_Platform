"""
Digital Shield AI / Digital Risk Protection Platform
Root Application Entry Point for Render, Gunicorn, and local execution.
Provides seamless compatibility for:
  - `gunicorn wsgi:app` (Recommended Render Production Start Command)
  - `gunicorn app:app`
  - `python app.py` (Render default fallback command)
"""

import os
import sys

# Ensure repository root and backend directory are in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Import Flask instance from wsgi entrypoint
from wsgi import app

if __name__ == "__main__":
    # Render provides the port in the PORT environment variable
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "0") in ("1", "true", "True")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
