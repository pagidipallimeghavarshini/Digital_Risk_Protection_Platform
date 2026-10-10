"""
Digital Shield AI - QR Code Exploit & Quishing Detector
Decodes QR payloads, detects QR phishing (Quishing), UPI payment fraud strings,
rogue Wi-Fi networks, and executes deep security analysis on extracted URLs.
"""

import io
import re
from typing import Dict, Any
from urllib.parse import parse_qs, urlparse

from .url_detector import analyze_url

# Optional imports for server-side QR image decoding
try:
    from PIL import Image
    import pyzbar.pyzbar as pyzbar
    HAS_PYZBAR = True
except ImportError:
    HAS_PYZBAR = False


def decode_qr_image(image_bytes: bytes) -> tuple:
    """
    Attempts to decode a QR code image on the server using pyzbar/PIL if available.
    Returns (success: bool, payload: str, error_message: str).
    """
    if not HAS_PYZBAR:
        return False, "", "Server-side image decoding library (pyzbar/Pillow) optional. Frontend client-side decoding active."

    try:
        image = Image.open(io.BytesIO(image_bytes))
        decoded_objects = pyzbar.decode(image)
        if decoded_objects:
            payload = decoded_objects[0].data.decode("utf-8", errors="replace")
            return True, payload, ""
        return False, "", "No QR code could be detected in the provided image file."
    except Exception as e:
        return False, "", f"Image processing error: {str(e)}"


def analyze_upi_payload(upi_uri: str) -> dict:
    """
    Analyzes Indian UPI payment strings (upi://pay?...) for fraudulent collect tricks,
    spoofed utility merchant names, and unverified VPAs.
    """
    parsed = urlparse(upi_uri)
    params = parse_qs(parsed.query)

    pa = params.get("pa", [""])[0]  # Payee VPA address (e.g. user@ybl)
    pn = params.get("pn", [""])[0]  # Payee display name
    am = params.get("am", [""])[0]  # Amount
    cu = params.get("cu", ["INR"])[0]

    flags = []
    score = 25
    suspicious_utility_words = ["electricity", "power", "bill", "apdcl", "tsspdcl", "tneb", "bescom", "traffic", "challan"]

    # Check for spoofed utility name on personal VPA
    pn_lower = pn.lower()
    is_claiming_utility = any(word in pn_lower for word in suspicious_utility_words)
    is_personal_psp = any(pa.endswith(handle) for handle in ["@ybl", "@paytm", "@okaxis", "@oksbi", "@okicici", "@ibl"])

    if is_claiming_utility and is_personal_psp:
        score += 55
        flags.append(f"UPI Utility Impersonation: Merchant name claims to be '{pn}' but VPA handle '{pa}' is a private personal account!")

    # Check zero or missing amount (fraudulent collect/flexible amount trick)
    if not am or am == "0" or am == "0.00":
        score += 20
        flags.append("Zero/Unspecified payment amount: Allows scammer to trigger arbitrary or flexible fund deductions.")

    if not pa:
        score += 30
        flags.append("Missing Payee VPA parameter ('pa') in UPI request.")

    risk_score = min(score, 95)
    risk_level = "HIGH" if risk_score >= 65 else ("MEDIUM" if risk_score >= 35 else "LOW")

    return {
        "payload_type": "UPI Payment Request",
        "upi_vpa": pa,
        "payee_name": pn,
        "requested_amount": am if am else "Open / Flexible",
        "currency": cu,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "summary": f"UPI Payment String ({pn or 'Unknown Payee'}) - {risk_level} Risk",
        "flags": flags,
        "recommendations": [
            "Entering your UPI PIN ALWAYS DEDUCTS money from your account. You NEVER need a PIN to receive funds!",
            "Verify the official merchant VPA on the bill before authorizing any payment."
        ]
    }


def analyze_qr_payload(raw_payload: str) -> dict:
    """
    Inspects decoded QR payload string. Determines whether it is a URL (Quishing),
    a UPI payment link, Wi-Fi credential string, or raw text, and produces full security report.
    """
    if not raw_payload or not isinstance(raw_payload, str) or not raw_payload.strip():
        return {
            "risk_level": "UNKNOWN",
            "risk_score": 0,
            "payload_type": "Empty",
            "summary": "QR payload is empty.",
            "flags": ["No data decoded"],
            "recommendations": ["Scan or upload a clear, legible QR code."]
        }

    payload = raw_payload.strip()

    # 1. UPI Payment URI
    if payload.lower().startswith("upi://pay"):
        upi_analysis = analyze_upi_payload(payload)
        return {
            "qr_raw_payload": payload,
            "payload_type": "UPI_PAYMENT",
            "extracted_target": upi_analysis["upi_vpa"],
            "risk_level": upi_analysis["risk_level"],
            "risk_score": upi_analysis["risk_score"],
            "detection_method": "UPI Payment Schema Parser & Fraud Heuristics",
            "summary": upi_analysis["summary"],
            "flags": upi_analysis["flags"],
            "recommendations": upi_analysis["recommendations"],
            "details": upi_analysis
        }

    # 2. URL Payload (QR Phishing / Quishing)
    is_url = bool(re.match(r"^https?://", payload, re.IGNORECASE) or re.match(r"^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:/.*)?$", payload))
    if is_url:
        url_report = analyze_url(payload)
        # Add Quishing specific context
        quishing_flags = list(url_report["flags"])
        quishing_flags.insert(0, "Physical/Digital Quishing vector: QR codes conceal the destination URL from visual inspection")
        quishing_score = min(url_report["risk_score"] + 5, 99)
        quishing_level = "HIGH" if quishing_score >= 65 else ("MEDIUM" if quishing_score >= 35 else "LOW")

        recs = list(url_report["recommendations"])
        recs.insert(0, "Never scan unverified QR stickers pasted over legitimate parking meters, menus, or posters.")

        return {
            "qr_raw_payload": payload,
            "payload_type": "URL",
            "extracted_target": url_report["url"],
            "risk_level": quishing_level,
            "risk_score": quishing_score,
            "detection_method": "Quishing Exploit Analyzer + URL ML Baseline",
            "summary": f"QR Phishing (Quishing) Target: {url_report['domain']}",
            "flags": quishing_flags,
            "positive_signals": url_report.get("positive_signals", []),
            "recommendations": recs,
            "details": url_report
        }

    # 3. Wi-Fi Configuration QR
    if payload.upper().startswith("WIFI:"):
        match_ssid = re.search(r"S:([^;]+);", payload)
        match_type = re.search(r"T:([^;]+);", payload)
        ssid = match_ssid.group(1) if match_ssid else "Unknown"
        auth_type = match_type.group(1) if match_type else "Open"
        
        flags = []
        score = 15
        if auth_type.upper() in ["NOPASS", "OPEN", ""]:
            score = 65
            flags.append("Unsecured open Wi-Fi network: vulnerable to Man-in-the-Middle (MitM) eavesdropping")
        else:
            flags.append(f"Wi-Fi credentials payload for network: {ssid} ({auth_type})")

        risk_level = "HIGH" if score >= 65 else ("MEDIUM" if score >= 35 else "LOW")
        return {
            "qr_raw_payload": payload,
            "payload_type": "WIFI_CONFIG",
            "extracted_target": ssid,
            "risk_level": risk_level,
            "risk_score": score,
            "detection_method": "Wireless Profile Threat Analyzer",
            "summary": f"Wi-Fi Access Point Payload: SSID '{ssid}'",
            "flags": flags,
            "recommendations": [
                "Only connect to trusted, authorized wireless networks.",
                "Use a reliable VPN if connecting to public or unencrypted networks."
            ],
            "details": {"ssid": ssid, "auth_type": auth_type}
        }

    # 4. Plain Text or General Data
    return {
        "qr_raw_payload": payload,
        "payload_type": "TEXT",
        "extracted_target": payload[:80],
        "risk_level": "LOW",
        "risk_score": 10,
        "detection_method": "QR Payload Content Inspector",
        "summary": "Plain text QR code. No malicious redirect or payment payload detected.",
        "flags": ["Static text payload"],
        "recommendations": ["Check if text contains instructions to call untrusted numbers or visit external sites."],
        "details": {"length": len(payload)}
    }
