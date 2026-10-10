"""
Digital Shield AI - Scam Message Detector
Supports Telugu (తెలుగు) and English with NLP baseline feature extraction,
regional cyber scam keyword matching, sentiment urgency analysis, and explainable risk scoring.
"""

import math
import re
from typing import Dict, List, Tuple

# Telugu scam keywords categorized by attack pattern
TELUGU_SCAM_PATTERNS = {
    "utility_disconnection": {
        "keywords": [
            "కరెంట్ బిల్లు", "విద్యుత్ సరఫరా", "విద్యుత్", "నిలిపివేయబడుతుంది", "కట్ చేయబడుతుంది",
            "రాత్రి 9:30", "కరెంట్ ఆఫీసర్", "డిస్కనెక్ట్", "బిల్లు చెల్లించనందున"
        ],
        "category": "Electricity / Utility Disconnection Scam",
        "weight": 35
    },
    "bank_kyc": {
        "keywords": [
            "ఖాతా బ్లాక్", "బ్యాంక్ ఖాతా", "పాన్ కార్డ్", "ఆధార్ కార్డ్", "కేవైసీ", "కెవైసి",
            "నవీకరించండి", "వెంటనే అప్‌డేట్", "ఓటీపీ", "ఖాతా నిలిపివేయబడింది", "ఎస్బీఐ", "హెచ్‌డీఎఫ్‌సీ"
        ],
        "category": "Bank KYC & Credential Harvesting",
        "weight": 40
    },
    "lottery_prize": {
        "keywords": [
            "అభినందనలు", "లక్కీ డ్రా", "నగదు బహుమతి", "బహుమతి", "గెలుచుకున్నారు",
            "రూ.", "లక్షలు", "కోట్లు", "ప్రైజ్ మనీ", "ఉచితం", "క్లెయిమ్ చేసుకోండి"
        ],
        "category": "Fake Lottery & Prize Money Fraud",
        "weight": 35
    },
    "job_task": {
        "keywords": [
            "పార్ట్ టైమ్ జాబ్", "ఇంటి నుండే పని", "రోజుకు సంపాదించండి", "టెలిగ్రామ్ టాస్క్",
            "పెట్టుబడి", "డబుల్ డబ్బులు", "యూట్యూబ్ లైక్ చేసి డబ్బులు"
        ],
        "category": "Work-From-Home / Task Fraud",
        "weight": 30
    },
    "urgency_action": {
        "keywords": [
            "వెంటనే కాల్ చేయండి", "ఇప్పుడే క్లిక్ చేయండి", "ఆఖరి అవకాశం", "24 గంటల్లో",
            "ఆలస్యం చేయకండి", "పోలీస్ కేసు", "డిజిటల్ అరెస్ట్"
        ],
        "category": "Urgency & Coercion Tactic",
        "weight": 25
    }
}

# English scam patterns categorized by attack pattern
ENGLISH_SCAM_PATTERNS = {
    "bank_kyc_suspension": {
        "keywords": [
            "account suspended", "account blocked", "kyc pending", "update pan", "verify aadhaar",
            "sbi yono", "hdfc netbanking", "icici bank", "debit card blocked", "unauthorized transaction",
            "reactivate account", "submit documents"
        ],
        "category": "Banking KYC & Account Suspension Scam",
        "weight": 40
    },
    "utility_disconnection": {
        "keywords": [
            "electricity will be disconnected", "power cutoff", "bill unpaid", "electricity officer",
            "power supply will be terminated", "tonight 9:30 pm", "call officer immediately"
        ],
        "category": "Electricity / Utility Disconnection Scam",
        "weight": 38
    },
    "lottery_lottery": {
        "keywords": [
            "congratulations you won", "lottery winner", "cash prize", "claim reward", "claim bonus",
            "selected for prize", "free gift card", "won 25,00,000", "lucky draw"
        ],
        "category": "Lottery & Cash Prize Scam",
        "weight": 35
    },
    "part_time_job": {
        "keywords": [
            "work from home", "daily earnings", "telegram task", "like youtube videos",
            "earn 3000 to 8000 daily", "part-time job vacancy", "crypto investment", "double your money"
        ],
        "category": "Telegram / Part-Time Job Task Scam",
        "weight": 32
    },
    "digital_arrest_legal": {
        "keywords": [
            "digital arrest", "customs parcel seized", "illegal parcel", "mumbai police", "cbi officer",
            "narcotics parcel", "warrant issued", "court appearance"
        ],
        "category": "Digital Arrest / Law Enforcement Impersonation",
        "weight": 45
    },
    "urgency_coercion": {
        "keywords": [
            "urgent", "immediately", "within 24 hours", "final notice", "immediate action required",
            "act now", "limited time", "don't delay", "last chance"
        ],
        "category": "High Pressure / Coercion Indicator",
        "weight": 22
    }
}

# Baseline labeled training corpus for TF-IDF baseline classification
BASELINE_CORPUS = [
    # (text, label: 1=scam, 0=benign, language)
    ("URGENT: Your SBI account has been suspended due to pending KYC. Click to reactivate: http://sbi.info", 1, "en"),
    ("Electricity bill unpaid. Your power will be disconnected at 9:30 PM. Contact officer immediately.", 1, "en"),
    ("Congratulations! You won ₹25,00,000 in KBC Lucky Draw. Send bank details to claim cash.", 1, "en"),
    ("Earn ₹5000 per day by rating hotels on Telegram. No qualification required. WhatsApp now.", 1, "en"),
    ("Customs notice: Parcel in your name contains illegal substances. Call CBI inspector on Skype.", 1, "en"),
    ("Dear customer, please update your PAN card on HDFC portal to prevent transaction block.", 1, "en"),
    ("Final warning: Your Netflix subscription failed. Update credit card immediately to avoid cancellation.", 1, "en"),
    ("Your electricity connection will be disconnected tonight. Call electricity board helpline immediately.", 1, "en"),
    ("మీ కరెంట్ బిల్లు చెల్లించనందున ఈరోజు రాత్రి విద్యుత్ సరఫరా నిలిపివేయబడుతుంది. వెంటనే ఈ నంబర్‌కు కాల్ చేయండి", 1, "te"),
    ("అభినందనలు! మీరు ₹50,000 నగదు బహుమతిని గెలుచుకున్నారు. మీ బ్యాంక్ వివరాలను నమోదు చేయడానికి ఇక్కడ క్లిక్ చేయండి", 1, "te"),
    ("మీ ఎస్బీఐ బ్యాంక్ ఖాతా బ్లాక్ చేయబడింది. కేవైసీ అప్‌డేట్ చేయడానికి వెంటనే ఈ లింక్‌ను నొక్కండి", 1, "te"),
    ("ఇంటి నుండే పని చేస్తూ రోజుకు ₹3000 సంపాదించండి. టెలిగ్రామ్‌లో మెసేజ్ చేయండి", 1, "te"),
    ("మీ ఆధార్ మరియు పాన్ కార్డ్ లింక్ చేయకపోతే మీ ఖాతా రద్దు చేయబడుతుంది. వెంటనే కాల్ చేయండి", 1, "te"),
    # Benign messages
    ("Hey Ramesh, are we still meeting for lunch at 1 PM today? Let me know.", 0, "en"),
    ("Please find attached the quarterly project review slides for our team meeting.", 0, "en"),
    ("Your grocery order has been delivered by BigBasket. Thank you for shopping with us.", 0, "en"),
    ("Hi, can you share the notes from yesterday's computer science lecture?", 0, "en"),
    ("Doctor appointment confirmed for Saturday 10:00 AM at Apollo Hospitals.", 0, "en"),
    ("The train will depart from platform number 4 on time. Safe journey!", 0, "en"),
    ("హాయ్ రమేష్, ఈరోజు సాయంత్రం 5 గంటలకు కలుద్దామా? ప్రాజెక్ట్ గురించి మాట్లాడాలి.", 0, "te"),
    ("రేపటి పరీక్షకు సంబంధించిన సిలబస్ నోట్స్ ఇక్కడ ఉన్నాయి. చూసుకోండి.", 0, "te"),
    ("మా ఇంటికి ఈ ఆదివారం భోజనానికి తప్పకుండా రండి.", 0, "te"),
    ("ఆఫీస్ మీటింగ్ టైమింగ్స్ మారాయి. రేపు ఉదయం 10 గంటలకు ప్రారంభమవుతుంది.", 0, "te")
]


def detect_language(text: str) -> str:
    """Detects whether text contains Telugu unicode characters or English."""
    # Telugu Unicode block: U+0C00 to U+0C7F
    telugu_chars = re.findall(r"[\u0C00-\u0C7F]", text)
    if len(telugu_chars) >= 3:
        # Check if also contains substantial English
        english_words = re.findall(r"[a-zA-Z]{3,}", text)
        if len(english_words) >= 4:
            return "te-en"
        return "te"
    return "en"


class BaselineMessageClassifier:
    """
    NLP Baseline Message Classifier.
    Computes TF-IDF vocabulary weights from training corpus and scores message likelihood.
    Clearly labelled as an explainable baseline ML model.
    """
    def __init__(self):
        self.scam_vocab = {}
        self.benign_vocab = {}
        self.doc_count = len(BASELINE_CORPUS)
        self._fit()

    def _tokenize(self, text: str) -> List[str]:
        # Split tokens preserving Telugu characters and alphanumeric English words
        words = re.findall(r"[\u0C00-\u0C7F]+|[a-zA-Z0-9]+", text.lower())
        return [w for w in words if len(w) > 1]

    def _fit(self):
        for text, label, _ in BASELINE_CORPUS:
            tokens = set(self._tokenize(text))
            for tok in tokens:
                if label == 1:
                    self.scam_vocab[tok] = self.scam_vocab.get(tok, 0) + 1
                else:
                    self.benign_vocab[tok] = self.benign_vocab.get(tok, 0) + 1

    def predict_score(self, text: str) -> float:
        tokens = self._tokenize(text)
        if not tokens:
            return 0.0
        scam_hits = 0.0
        benign_hits = 0.0
        for tok in tokens:
            if tok in self.scam_vocab:
                scam_hits += self.scam_vocab[tok]
            if tok in self.benign_vocab:
                benign_hits += self.benign_vocab[tok]
        total = scam_hits + benign_hits
        if total == 0:
            return 0.2  # neutral prior
        return round(scam_hits / total, 3)


# Initialize singleton baseline classifier
baseline_model = BaselineMessageClassifier()


def analyze_message(message_text: str, forced_lang: str = "auto") -> dict:
    """
    Analyzes message content in Telugu, English, or mixed languages.
    Returns risk level, detected keywords, threat category, and recommended defensive actions.
    """
    if not message_text or not isinstance(message_text, str) or not message_text.strip():
        return {
            "risk_level": "UNKNOWN",
            "risk_score": 0,
            "language": "unknown",
            "summary": "Message is empty or invalid.",
            "flags": ["Empty input text"],
            "recommendations": ["Paste an SMS, WhatsApp message, or email body to scan."]
        }

    raw_text = message_text.strip()
    detected_lang = detect_language(raw_text) if forced_lang == "auto" else forced_lang
    text_lower = raw_text.lower()

    flags = []
    positive_signals = []
    detected_keywords = []
    matched_categories = []
    accumulated_score = 0

    # 1. Check for Embedded Links/URLs
    url_matches = re.findall(r"https?://[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:xyz|top|info|biz|tk|ml|ga|link|club)[^\s]*", raw_text)
    if url_matches:
        accumulated_score += 25
        flags.append(f"Contains {len(url_matches)} embedded link(s): Phishing messages frequently use links to harvest credentials")
        for u in url_matches:
            detected_keywords.append(f"Link: {u[:35]}...")

    # 2. Check for Phone numbers or Call Triggers
    phone_matches = re.findall(r"(?:\+91[-\s]?)?[6-9]\d{9}|\b\d{10}\b", raw_text)
    if phone_matches and ("call" in text_lower or "కాల్" in text_lower or "నంబర్" in text_lower or "contact" in text_lower):
        accumulated_score += 18
        flags.append(f"Phone contact trigger found ({phone_matches[0]}): Used to funnel victims to fake call-center operatives")

    # 3. Telugu Pattern Checks
    if "te" in detected_lang or any(ord(c) >= 0x0C00 and ord(c) <= 0x0C7F for c in raw_text):
        for pattern_id, data in TELUGU_SCAM_PATTERNS.items():
            matched_kws = [kw for kw in data["keywords"] if kw in raw_text]
            if matched_kws:
                accumulated_score += data["weight"]
                detected_keywords.extend(matched_kws)
                if data["category"] not in matched_categories:
                    matched_categories.append(data["category"])
                flags.append(f"Telugu {data['category']}: matches '{', '.join(matched_kws[:3])}'")

    # 4. English Pattern Checks
    for pattern_id, data in ENGLISH_SCAM_PATTERNS.items():
        matched_kws = [kw for kw in data["keywords"] if kw in text_lower]
        if matched_kws:
            accumulated_score += data["weight"]
            detected_keywords.extend(matched_kws)
            if data["category"] not in matched_categories:
                matched_categories.append(data["category"])
            flags.append(f"{data['category']}: matches indicator '{', '.join(matched_kws[:3])}'")

    # 5. Baseline ML Model Probability
    ml_probability = baseline_model.predict_score(raw_text)
    if ml_probability > 0.65:
        accumulated_score += int(ml_probability * 25)
    elif ml_probability < 0.25:
        accumulated_score = max(5, accumulated_score - 15)
        positive_signals.append("NLP baseline token distribution resembles legitimate conversational text")

    # Financial amount check (₹, Rs, INR, Lakhs)
    if re.search(r"(?:rs\.?|inr|₹)\s*[\d,]+|\b[\d,]+\s*(?:లక్షలు|కోట్లు|rupees|lakhs|crores)", text_lower):
        accumulated_score += 12
        flags.append("High financial stakes lure / specific currency figure mentioned")

    # Normalize score
    risk_score = min(max(accumulated_score, 4), 98)

    # Determine risk category & primary scam type
    primary_category = matched_categories[0] if matched_categories else ("Benign / Legitimate" if risk_score < 35 else "Suspicious Message")

    recommendations = []
    if risk_score >= 65:
        risk_level = "HIGH"
        summary = f"High-Confidence Cyber Scam Detected: {primary_category}. Strong coercive or fraudulent intent."
        recommendations.append("DO NOT click any link or call the provided number.")
        recommendations.append("Never share OTP, ATM PIN, UPI PIN, or bank passwords with anyone.")
        recommendations.append("Report this number/sender on National Cyber Crime Portal (cybercrime.gov.in) or call 1930.")
    elif risk_score >= 35:
        risk_level = "MEDIUM"
        summary = f"Potentially Suspicious Message: {primary_category}. Contains pressure or lure indicators."
        recommendations.append("Verify directly through the company's official website or customer care app.")
        recommendations.append("Do not reply directly to unsolicited SMS or WhatsApp messages.")
    else:
        risk_level = "LOW"
        summary = "Safe / Low Risk: No significant social engineering or phishing threat indicators detected."
        positive_signals.append("No coercive urgency phrases")
        positive_signals.append("No credential harvesting tokens")
        recommendations.append("Message appears benign. Always stay cautious of unexpected attachments.")

    lang_display = "Telugu (తెలుగు)" if detected_lang == "te" else ("Multilingual (Telugu + English)" if detected_lang == "te-en" else "English")

    return {
        "text_snippet": raw_text[:120] + ("..." if len(raw_text) > 120 else ""),
        "full_text": raw_text,
        "language": detected_lang,
        "language_display": lang_display,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "detection_method": "NLP Baseline Classifier + Multilingual Regional Heuristics",
        "primary_category": primary_category,
        "summary": summary,
        "flags": flags,
        "positive_signals": positive_signals,
        "detected_keywords": list(set(detected_keywords)),
        "ml_baseline_confidence": round(ml_probability * 100, 1),
        "recommendations": recommendations
    }
