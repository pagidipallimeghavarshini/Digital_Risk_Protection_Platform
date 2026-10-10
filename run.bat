@echo off
title Digital Shield AI - Startup Launcher
color 0B

echo =====================================================================
echo                 DIGITAL SHIELD AI CYBER DEFENSE PLATFORM
echo                Real-Time Threat Detection & Defense System
echo =====================================================================
echo.

:: 1. Verify Python Installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in your system PATH.
    echo Please install Python 3.8+ from https://www.python.org/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

echo [1/3] Python detected. Checking dependencies...
pip install -r backend\requirements.txt --quiet --no-warn-script-location

echo.
echo [2/3] Checking Database and Initializing ML Models...
echo (MySQL will be used if running, with auto-resilient fallback)

echo.
echo [3/3] Launching Flask REST Backend on http://127.0.0.1:5000...
echo.

:: Start browser after brief pause
start "" http://127.0.0.1:5000

:: Run Flask App
python backend\app.py

pause
