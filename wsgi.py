"""
WSGI Production Entry Point for Render & Gunicorn
Digital Shield AI / Digital Risk Protection Platform
"""

import os
import sys

# Ensure backend directory is in the Python search path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Import the core Flask application
from backend.app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
