@echo off
title AI SEO Growth Dashboard Launcher
echo ===================================================
echo Starting AI SEO Growth Dashboard...
echo ===================================================

cd /d "%~dp0"

echo [1/3] Starting Backend API (Flask on http://127.0.0.1:5000)...
start "AI SEO Backend" cmd /k ".\venv\Scripts\python.exe backend\app.py"

echo [2/3] Starting Frontend Server (HTTP on http://localhost:8080)...
start "AI SEO Frontend" cmd /k ".\venv\Scripts\python.exe -m http.server 8080"

timeout /t 2 >nul

echo [3/3] Opening Dashboard in your browser...
start http://localhost:8080/dashboard.html

echo ===================================================
echo Project is running successfully!
echo Backend:  http://127.0.0.1:5000
echo Frontend: http://localhost:8080/dashboard.html
echo ===================================================
pause
