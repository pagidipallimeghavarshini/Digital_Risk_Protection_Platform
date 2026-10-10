"""
Digital Shield AI - Automated Security Engine & API Verification Suite
Tests ML baselines, URL entropy calculations, Telugu NLP classification,
QR/UPI exploit detection, and database persistence.
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from ml_engine.url_detector import analyze_url
from ml_engine.message_detector import analyze_message
from ml_engine.qr_detector import analyze_qr_payload
from database import init_database, save_scan, get_history, get_stats


def run_tests():
    print("=" * 65)
    print(" DIGITAL SHIELD AI - AUTOMATED VERIFICATION SUITE")
    print("=" * 65)

    passed = 0
    total = 0

    # Test 1: URL Detection - Malicious Bank Phishing
    total += 1
    print("\n[TEST 1] Testing URL Detector on Bank Phishing Lure...")
    test_url = "https://secure-login-hdfc-kyc.update-account.biz/verify.php"
    res1 = analyze_url(test_url)
    print(f" -> Scanned URL: {test_url}")
    print(f" -> Risk Level: {res1['risk_level']}, Score: {res1['risk_score']}/100")
    print(f" -> Flags Detected: {len(res1['flags'])}")
    assert res1['risk_level'] == 'HIGH', "Expected HIGH risk for deceptive bank phishing domain"
    assert res1['risk_score'] >= 70, "Expected high risk score"
    print(" [PASS] URL Malicious Bank Phishing caught with high severity.")
    passed += 1

    # Test 2: URL Detection - Legitimate Clean Website
    total += 1
    print("\n[TEST 2] Testing URL Detector on Legitimate Authority Domain...")
    safe_url = "https://github.com/torvalds/linux"
    res2 = analyze_url(safe_url)
    print(f" -> Scanned URL: {safe_url}")
    print(f" -> Risk Level: {res2['risk_level']}, Score: {res2['risk_score']}/100")
    assert res2['risk_level'] == 'LOW', "Expected LOW risk for github.com"
    print(" [PASS] Clean domain correctly recognized as low risk.")
    passed += 1

    # Test 3: Telugu Scam Message Detection (Electricity Disconnection)
    total += 1
    print("\n[TEST 3] Testing Telugu Scam Message (Electricity Disconnection)...")
    telugu_msg = "మీ కరెంట్ బిల్లు చెల్లించనందున ఈరోజు రాత్రి విద్యుత్ సరఫరా నిలిపివేయబడుతుంది. వెంటనే ఈ నంబర్‌కు కాల్ చేయండి: 9848022338"
    res3 = analyze_message(telugu_msg)
    print(f" -> Language: {res3['language']} ({res3['language_display']})")
    print(f" -> Risk: {res3['risk_level']}, Score: {res3['risk_score']}/100")
    print(f" -> Category: {res3['primary_category']}")
    print(f" -> Detected Keywords: {res3['detected_keywords']}")
    assert res3['risk_level'] == 'HIGH', "Expected HIGH risk for Telugu electricity threat"
    assert "కరెంట్ బిల్లు" in res3['detected_keywords'] or "విద్యుత్ సరఫరా" in res3['detected_keywords']
    print(" [PASS] Telugu regional cyber threat accurately classified.")
    passed += 1

    # Test 4: English Urgent Bank KYC Suspension
    total += 1
    print("\n[TEST 4] Testing English Urgent Bank KYC Phishing...")
    en_msg = "URGENT: Your SBI YONO account has been suspended due to pending PAN KYC. Submit documents now at https://sbi-kyc-reactivate.info"
    res4 = analyze_message(en_msg)
    print(f" -> Risk: {res4['risk_level']}, Score: {res4['risk_score']}/100")
    print(f" -> Category: {res4['primary_category']}")
    assert res4['risk_level'] == 'HIGH', "Expected HIGH risk for urgent SBI phishing"
    print(" [PASS] English phishing message accurately classified.")
    passed += 1

    # Test 5: Benign Conversational Message
    total += 1
    print("\n[TEST 5] Testing Benign Conversational Message...")
    benign_msg = "Hi Ramesh, the project meeting is rescheduled to 4 PM on Google Meet. See you there."
    res5 = analyze_message(benign_msg)
    print(f" -> Risk: {res5['risk_level']}, Score: {res5['risk_score']}/100")
    assert res5['risk_level'] == 'LOW', "Expected LOW risk for normal meeting message"
    print(" [PASS] Benign message recognized as safe.")
    passed += 1

    # Test 6: QR Code & UPI Payment Fraud Exploit
    total += 1
    print("\n[TEST 6] Testing QR Code UPI Utility Fraud URI...")
    upi_payload = "upi://pay?pa=fake.electricity.board@ybl&pn=APCPDCL_BILL_PAY&am=0&cu=INR"
    res6 = analyze_qr_payload(upi_payload)
    print(f" -> Payload Type: {res6['payload_type']}")
    print(f" -> Extracted Target: {res6['extracted_target']}")
    print(f" -> Risk: {res6['risk_level']}, Score: {res6['risk_score']}/100")
    assert res6['risk_level'] == 'HIGH', "Expected HIGH risk for spoofed utility VPA with flexible amount"
    print(" [PASS] Fraudulent UPI collect exploit caught.")
    passed += 1

    # Test 7: Database Initialization & Persistence
    total += 1
    print("\n[TEST 7] Testing Database Storage & History Retrieval...")
    engine_name = init_database()
    print(f" -> Active Database Storage: {engine_name}")
    
    test_scan_id = save_scan(
        scan_type="URL",
        target_input="https://unit-test-verification.shield",
        risk_level="LOW",
        risk_score=5,
        detection_method="Automated Test Suite",
        summary="Automated verification record",
        details_json={"test": True},
        language="en"
    )
    print(f" -> Saved scan record ID: {test_scan_id}")
    assert test_scan_id > 0, "Expected valid record ID"

    history = get_history(limit=5)
    print(f" -> Retrieved history records: {len(history['records'])}, Total count: {history['total']}")
    assert history['total'] > 0, "Expected non-empty history count"

    stats = get_stats()
    print(f" -> Database Telemetry Stats: Total Scans={stats['total_scans']}, High Risk={stats['high_risk']}, Clean Ratio={stats['clean_ratio']}%")
    assert stats['total_scans'] > 0, "Expected stats total scans > 0"
    print(" [PASS] Database persistence and retrieval verified.")
    passed += 1

    print("\n" + "=" * 65)
    print(f" ALL {passed}/{total} VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)


if __name__ == "__main__":
    run_tests()
