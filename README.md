# 🛡️ Digital Shield AI — Real-Time Cyber Threat Defense Platform

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask%20REST%20API-000000?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%208.0+-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20CSS%20%26%20JS-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![Cybersecurity](https://img.shields.io/badge/Cybersecurity-National%20Helpline%201930-red?style=flat)](https://cybercrime.gov.in)

> **Digital Shield AI** is a complete, hackathon-ready cybersecurity intelligence platform engineered to detect zero-day phishing websites, regional Indian multilingual scam messages (specifically in **Telugu (తెలుగు)** and **English**), and rogue physical-to-digital QR code / UPI payment exploits.

---

## 📑 Table of Contents

1. [Features & The 7 Connected Pages](#-the-7-connected-pages)
2. [How a Beginner Can Run the Application (Windows)](#-how-a-beginner-can-run-the-application)
3. [Project Structure](#-project-structure)
4. [Database Architecture (MySQL 8.0+)](#-database-architecture)
5. [Machine Learning & Detection Engines](#-machine-learning--detection-engines)
6. [Hackathon Demo Test Cases](#-hackathon-demo-test-cases)
7. [REST API Documentation](#-rest-api-documentation)
8. [Cybersecurity Reporting & Helplines](#-incident-response--helpline)

---

## 🌐 The 7 Connected Pages

| # | Page File | Route | Description |
|---|---|---|---|
| **1** | [`index.html`](file:///c:/Users/megha/OneDrive/Desktop/Digital_Shield_AI/frontend/index.html) | `/` | **Home**: Hero section, quick universal threat triage launcher, real-time threat metrics preview, and core architectural defense pillars. |
| **2** | [`dashboard.html`](file:///c:/Users/megha/OneDrive/Desktop/Digital_Shield_AI/frontend/dashboard.html) | `/dashboard` | **Security Dashboard (SOC)**: Live analytics queried from database, Threat Severity split (Doughnut), 7-Day Timeline trend, Defense Posture gauge, and Recent Telemetry table. |
| **3** | [`url-scanner.html`](file:///c:/Users/megha/OneDrive/Desktop/Digital_Shield_AI/frontend/url-scanner.html) | `/url-scanner` | **URL Scanner**: Lexical entropy, brand impersonation, suspicious TLD detection, homograph checks, and explainable safety breakdown. |
| **4** | [`message-scanner.html`](file:///c:/Users/megha/OneDrive/Desktop/Digital_Shield_AI/frontend/message-scanner.html) | `/message-scanner` | **Scam Message Scanner**: Native **Telugu (తెలుగు) and English** support for electricity bill cutoff fraud, urgent KYC suspension extortion, and lottery lures. |
| **5** | [`qr-scanner.html`](file:///c:/Users/megha/OneDrive/Desktop/Digital_Shield_AI/frontend/qr-scanner.html) | `/qr-scanner` | **QR Code Scanner**: Image file drag-and-drop, live webcam scanning via `jsQR`, Quishing URL extraction, and UPI payment scheme fraud inspection. |
| **6** | [`history.html`](file:///c:/Users/megha/OneDrive/Desktop/Digital_Shield_AI/frontend/history.html) | `/history` | **Scan History**: Full database audit trail with filtering by Scan Vector and Risk Level, search bar, CSV/JSON export, and inspect modal. |
| **7** | [`about.html`](file:///c:/Users/megha/OneDrive/Desktop/Digital_Shield_AI/frontend/about.html) | `/about` | **About & Cybersecurity Safety Guide**: Platform mission, transparent ML baseline methodology, Indian regional scam playbooks, and National Cyber Crime Portal helpline details. |

---

## 🚀 How a Beginner Can Run the Application

### Option A: 1-Click Windows Launcher (Easiest)
1. Open the project folder `Digital_Shield_AI`.
2. Double-click **`run.bat`**.
3. The script will:
   - Check your Python installation.
   - Install required dependencies automatically.
   - Connect to MySQL (or activate the resilient local storage).
   - Start the Flask REST server at `http://127.0.0.1:5000`.
   - Automatically launch your default web browser to the application!

---

### Option B: Step-by-Step Manual Setup

#### Step 1: Open Terminal / Command Prompt
Open PowerShell or Command Prompt inside the `Digital_Shield_AI` directory:
```bash
cd "c:\Users\megha\OneDrive\Desktop\Digital_Shield_AI"
```

#### Step 2: Install Python Dependencies
```bash
pip install -r backend/requirements.txt
```

#### Step 3 (Optional): Configure MySQL
If you have MySQL (via XAMPP, WAMP, or MySQL Server):
```bash
# Set environment variables if your MySQL credentials differ:
set MYSQL_HOST=localhost
set MYSQL_USER=root
set MYSQL_PASSWORD=your_password

# Run the automated setup script to create database and tables:
python backend/setup_mysql.py
```
> **Resilient Engine Note:** If MySQL is not running on your machine, **the application will seamlessly engage its built-in fallback engine** (`database/digital_shield.db`). You will experience **zero crashes and zero downtime**!

#### Step 4: Start the Application Server
```bash
python backend/app.py
```

#### Step 5: Open in Your Browser
Visit: **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🗂️ Project Structure

```
Digital_Shield_AI/
├── run.bat                          # 1-Click Windows Launcher
├── README.md                        # Documentation & Guide
├── backend/
│   ├── app.py                       # Main Flask Server & REST APIs
│   ├── database.py                  # MySQL Connector & Resilient Storage
│   ├── setup_mysql.py               # Automated MySQL Setup Utility
│   ├── requirements.txt             # Python Package Dependencies
│   └── ml_engine/
│       ├── __init__.py              # ML Package Exports
│       ├── url_detector.py          # Lexical Entropy & Phishing Engine
│       ├── message_detector.py      # Multilingual Telugu & English NLP
│       └── qr_detector.py           # Quishing & UPI Fraud Parser
├── database/
│   ├── schema.sql                   # MySQL 8.0+ Table Definitions
│   └── seed_data.sql                # Initial Telemetry Records
├── frontend/
│   ├── index.html                   # 1. Home Page
│   ├── dashboard.html               # 2. Security Dashboard
│   ├── url-scanner.html             # 3. URL Scanner
│   ├── message-scanner.html         # 4. Scam Message Scanner (Telugu & EN)
│   ├── qr-scanner.html              # 5. QR Code & UPI Scanner
│   ├── history.html                 # 6. Scan History
│   ├── about.html                   # 7. About & Cyber Safety Tips
│   ├── css/
│   │   ├── style.css                # Master Cyber Navy Design System
│   │   └── dashboard.css            # SOC Metrics & Chart Styling
│   └── js/
│       ├── config.js                # API Configuration & Helpers
│       ├── nav.js                   # Navigation & Health Indicator
│       ├── home.js                  # Home Logic & Quick Launcher
│       ├── dashboard.js             # Telemetry & Chart.js Integration
│       ├── url-scanner.js           # URL Scanner Controller
│       ├── message-scanner.js       # Message Scanner Controller
│       ├── qr-scanner.js            # QR Scanner & Webcam Controller
│       └── history.js               # History Audit & Export Controller
└── scripts/
    ├── start_windows.bat            # Secondary Windows Launcher
    └── test_api.py                  # Automated Test & Verification Suite
```

---

## 💾 Database Architecture

### MySQL Database: `digital_shield_ai`
Table: `scan_records`
- `id` (INT PRIMARY KEY AUTO_INCREMENT)
- `scan_type` (VARCHAR: `URL`, `MESSAGE`, `QR`)
- `target_input` (TEXT: Target URL, Message text, or QR payload)
- `risk_level` (VARCHAR: `LOW`, `MEDIUM`, `HIGH`)
- `risk_score` (INT: 0 to 100)
- `detection_method` (VARCHAR: e.g. `ML Baseline + Lexical Analysis`)
- `summary` (VARCHAR(255))
- `details_json` (LONGTEXT: Structured flags, metrics, and recommendations)
- `language` (VARCHAR(20): `en`, `te`, `te-en`)
- `status` (VARCHAR(20): `COMPLETED`)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

---

## 🧠 Machine Learning & Detection Engines

### 1. Transparent Baseline Philosophy
We adhere strictly to ethical, transparent cybersecurity principles: **we never invent model accuracy numbers or claim unverified black-box results**. 

### 2. URL Threat Detection
- **Shannon Entropy**: Measures algorithmic randomness in domain and path strings (`> 4.2 bits` flags machine-generated evasion).
- **Brand Impersonation**: Detects famous brands (SBI, HDFC, ICICI, PayPal, Google, Netflix) placed deceptively in subdomains or paths when the registered domain is unaffiliated.
- **Top-Level Domain (TLD) Profiling**: Tracks high-abuse TLDs (`.xyz`, `.top`, `.tk`, `.click`, `.biz`, `.buzz`).
- **Lexical Anomalies**: Excessive nesting, raw IP hosts, `@` redirection tricks, punycode (`xn--`).

### 3. Scam Message Detection (Telugu & English)
- **Telugu (తెలుగు) Regional Threats**: Identifies electricity disconnection scams (`కరెంట్ బిల్లు`, `విద్యుత్ సరఫరా నిలిపివేయబడుతుంది`), bank KYC account suspension threats (`ఖాతా బ్లాక్`, `కేవైసీ`), lottery cash traps (`అభినందనలు`, `లక్కీ డ్రా`), and task scams.
- **English Phishing Patterns**: Analyzes coercive urgency, financial lures, and digital arrest impersonations.
- **NLP Baseline Model**: Uses an explainable TF-IDF token-frequency baseline classifier to measure scam likelihood.

### 4. QR Code & UPI Exploit Detection
- **Quishing Detection**: Concealed URLs inside QR codes are automatically routed through our deep URL scanner.
- **UPI Payment Fraud Parsing**: Inspects `upi://pay` strings to flag personal VPAs (`@ybl`, `@paytm`) impersonating government utility boards, and alerts on flexible zero-amount collect requests.

---

## 🎯 Hackathon Demo Test Cases

Use these preset examples directly on the website for quick live demonstration:

### 1. URL Phishing Demo
- **Malicious HDFC Bank Phishing**:
  `https://secure-login-hdfc-kyc.update-account.biz/verify.php`
  *(Result: HIGH Risk 94/100 — Deceptive Subdomain, Insecure TLD, Brand Impersonation)*
- **Clean Legitimate Link**:
  `https://github.com/torvalds/linux`
  *(Result: LOW Risk 4/100 — Authority Domain)*

### 2. Telugu Scam Message Demo
- **Telugu Electricity Cutoff Scam**:
  `మీ కరెంట్ బిల్లు చెల్లించనందున ఈరోజు రాత్రి విద్యుత్ సరఫరా నిలిపివేయబడుతుంది. వెంటనే ఈ నంబర్‌కు కాల్ చేయండి: 9848022338`
  *(Result: HIGH Risk 89/100 — Regional Utility Cutoff Extortion)*
- **Telugu Lottery Scam**:
  `అభినందనలు! మీరు ₹50,000 నగదు బహుమతిని గెలుచుకున్నారు. మీ బ్యాంక్ వివరాలను నమోదు చేయడానికి ఇక్కడ క్లిక్ చేయండి: http://lottery-win.biz`
  *(Result: HIGH Risk 93/100 — Fake Cash Prize Fraud)*
- **Telugu Safe Conversational Message**:
  `హాయ్ రమేష్, ఈరోజు సాయంత్రం 5 గంటలకు కలుద్దామా? ప్రాజెక్ట్ గురించి మాట్లాడాలి.`
  *(Result: LOW Risk 6/100 — Benign Conversational Chat)*

### 3. QR / UPI Exploit Demo
- **Fraudulent Electricity Board UPI QR**:
  `upi://pay?pa=fake.electricity.board@ybl&pn=APCPDCL_BILL_PAY&am=0&cu=INR`
  *(Result: HIGH Risk 86/100 — Personal VPA impersonating APCPDCL board)*

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns system health, active database engine, and module status |
| `POST` | `/api/scan/url` | Scans a website link, returns risk analysis, and saves to database |
| `POST` | `/api/scan/message` | Scans Telugu or English text, returns NLP risk classification |
| `POST` | `/api/scan/qr` | Analyzes decoded QR payload or uploaded image file |
| `GET` | `/api/stats` | Returns real telemetry metrics, risk breakdown, and 7-day timeline |
| `GET` | `/api/history` | Retrieves paginated and filtered scan history records |
| `DELETE` | `/api/history/<id>` | Deletes a single scan record |
| `DELETE` | `/api/history/clear` | Clears all scan history |

---

## 🚨 Incident Response & Helpline

If you or someone you know has been targeted by financial cyber fraud:
- **Call National Cyber Crime Helpline:** **`1930`** (Toll-Free in India)
- **Official Reporting Portal:** [https://cybercrime.gov.in](https://cybercrime.gov.in)
- **Act within the "Golden Hour":** Contact your bank immediately to request an immediate freeze on the transaction UTR number.
- **The Golden Rule:** You **NEVER** need to enter your UPI PIN to receive money.

---

*Developed for Cyber Security Hackathon 2026. Built with Python, Flask, MySQL, and Modern Web Standards.*
