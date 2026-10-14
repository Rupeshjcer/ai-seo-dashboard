@echo off
echo Starting AI SEO Dashboard...

cd /d "%~dp0ai-seo-dashboard-main"

echo [1/2] Starting Flask Backend Server on port 5000...
start "AI SEO Backend" "venv\Scripts\python.exe" backend\app.py

echo [2/2] Starting Frontend Web Server on port 8080...
start "AI SEO Frontend" "venv\Scripts\python.exe" -m http.server 8080

timeout /t 2 >nul
echo Opening dashboard in default browser...
start http://localhost:8080/index.html

echo.
echo Application is running!
echo - Frontend: http://localhost:8080
echo - Backend:  http://127.0.0.1:5000
echo.
