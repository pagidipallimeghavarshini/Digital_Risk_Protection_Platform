-- Digital Shield AI: Realistic Sample Telemetry Seed Data
-- Useful for initial hackathon demos to populate charts and scan history

USE digital_shield_ai;

INSERT INTO scan_records (scan_type, target_input, risk_level, risk_score, detection_method, summary, details_json, language, status, created_at)
VALUES 
('URL', 'https://secure-login-hdfc-kyc.update-account.biz/verify.php', 'HIGH', 94, 'ML Baseline + Lexical Analysis', 'Phishing domain impersonating HDFC Bank with deceptive subdomain', '{"domain":"update-account.biz","reputation":"Malicious","flags":["Bank Impersonation (HDFC)","High Entropy URL","Deceptive Subdomain","Suspicious TLD (.biz)","No Valid SSL Organization"]}', 'en', 'COMPLETED', NOW() - INTERVAL 2 HOUR),

('MESSAGE', 'మీ కరెంట్ బిల్లు చెల్లించనందున ఈరోజు రాత్రి విద్యుత్ సరఫరా నిలిపివేయబడుతుంది. వెంటనే ఈ నంబర్‌కు కాల్ చేయండి: 9848022338', 'HIGH', 89, 'NLP Baseline + Regional Scam Heuristics', 'Electricity disconnection fraud targeting Telugu regional users', '{"detected_keywords":["కరెంట్ బిల్లు","విద్యుత్ సరఫరా నిలిపివేయబడుతుంది","వెంటనే కాల్ చేయండి"],"urgency_level":"High","sentiment":"Coercive/Fear-based","scam_type":"Utility Disconnection Scam"}', 'te', 'COMPLETED', NOW() - INTERVAL 4 HOUR),

('QR', 'upi://pay?pa=fake.electricity.board@ybl&pn=APCPDCL_BILL_PAY&am=0&cu=INR', 'HIGH', 86, 'QR Payload Parser + UPI Fraud Heuristics', 'Spoofed APCPDCL electricity bill collector using personal VPA handle', '{"upi_id":"fake.electricity.board@ybl","merchant_name":"APCPDCL_BILL_PAY","flags":["Non-verified PSP handle","Spoofed utility board name","Zero amount flexible pull request"]}', 'en', 'COMPLETED', NOW() - INTERVAL 7 HOUR),

('URL', 'https://github.com/torvalds/linux', 'LOW', 4, 'ML Baseline + Lexical Analysis', 'Legitimate open-source code repository with clean reputation', '{"domain":"github.com","reputation":"Clean","flags":["Verified Domain Authority","Standard HTTPS Certificate","High Global Alexa Rank"]}', 'en', 'COMPLETED', NOW() - INTERVAL 12 HOUR),

('MESSAGE', 'URGENT: Your SBI YONO account has been suspended due to pending PAN KYC. Submit documents now at https://sbi-kyc-reactivate.info', 'HIGH', 96, 'NLP Baseline + Phishing Pattern Matcher', 'State Bank of India credential harvesting and urgent KYC scam', '{"detected_keywords":["URGENT","suspended","KYC","SBI YONO"],"urgency_level":"Critical","target_brand":"State Bank of India","phishing_link_detected":true}', 'en', 'COMPLETED', NOW() - INTERVAL 18 HOUR),

('MESSAGE', 'Hi Priya, the client meeting has been moved to Thursday 3:00 PM. Please review the updated deck on Google Drive.', 'LOW', 8, 'NLP Baseline + Natural Language Analysis', 'Benign conversational scheduling message', '{"detected_keywords":[],"urgency_level":"Low","sentiment":"Professional","scam_type":"None"}', 'en', 'COMPLETED', NOW() - INTERVAL 1 DAY),

('QR', 'https://en.wikipedia.org/wiki/Computer_security', 'LOW', 5, 'QR Payload Parser + URL Analysis', 'Legitimate informational link to Wikipedia encyclopedia', '{"domain":"wikipedia.org","reputation":"Safe","flags":["Known Authority Domain","Valid TLS 1.3"]}', 'en', 'COMPLETED', NOW() - INTERVAL 1 DAY),

('URL', 'http://free-iphone16-giveaway.claim-now.xyz/spin', 'HIGH', 91, 'ML Baseline + Lexical Analysis', 'Social engineering giveaway lure on untrusted TLD without SSL', '{"domain":"claim-now.xyz","reputation":"Malicious","flags":["Missing HTTPS Encryption","High-risk TLD (.xyz)","Lure Keywords: free, giveaway, claim"]}', 'en', 'COMPLETED', NOW() - INTERVAL 2 DAY),

('MESSAGE', 'అభినందనలు! మీకు లక్కీ డ్రాలో రూ. 25,00,000 నగదు లభించింది. మీ ప్రైజ్ మనీ క్లెయిమ్ చేయడానికి ఈ లింక్‌ను ఓపెన్ చేయండి.', 'HIGH', 93, 'NLP Baseline + Regional Scam Heuristics', 'Telugu lottery and prize reward fraud message', '{"detected_keywords":["అభినందనలు","లక్కీ డ్రా","నగదు","క్లెయిమ్"],"urgency_level":"High","scam_type":"Lottery / Fake Prize Fraud"}', 'te', 'COMPLETED', NOW() - INTERVAL 2 DAY),

('URL', 'https://docs.python.org/3/library/index.html', 'LOW', 2, 'ML Baseline + Lexical Analysis', 'Official Python documentation website', '{"domain":"python.org","reputation":"Safe","flags":["Official Foundation Domain","Valid SSL"]}', 'en', 'COMPLETED', NOW() - INTERVAL 3 DAY);
