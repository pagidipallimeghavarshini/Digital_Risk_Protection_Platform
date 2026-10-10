-- Digital Shield AI: Database Schema (MySQL 8.0+)
-- Database: digital_shield_ai

CREATE DATABASE IF NOT EXISTS digital_shield_ai
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE digital_shield_ai;

-- 1. Scan Records Table
CREATE TABLE IF NOT EXISTS scan_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scan_type VARCHAR(20) NOT NULL, -- 'URL', 'MESSAGE', 'QR'
    target_input TEXT NOT NULL,      -- Scanned URL, Message body, or QR raw payload
    risk_level VARCHAR(10) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH'
    risk_score INT NOT NULL,         -- 0 to 100
    detection_method VARCHAR(100) NOT NULL, -- 'ML Baseline + Heuristic', etc.
    summary VARCHAR(255) NOT NULL,
    details_json LONGTEXT,           -- Full structured breakdown (JSON format)
    language VARCHAR(20) DEFAULT 'en', -- 'en', 'te', 'multilingual', 'n/a'
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_scan_type (scan_type),
    INDEX idx_risk_level (risk_level),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Daily Threat Aggregates (Optional cache table for fast analytics)
CREATE TABLE IF NOT EXISTS threat_stats_cache (
    stat_date DATE PRIMARY KEY,
    total_scans INT DEFAULT 0,
    high_risk_count INT DEFAULT 0,
    medium_risk_count INT DEFAULT 0,
    low_risk_count INT DEFAULT 0,
    url_scans INT DEFAULT 0,
    message_scans INT DEFAULT 0,
    qr_scans INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
