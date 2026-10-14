Write-Host "Starting AI SEO Dashboard..." -ForegroundColor Cyan

$projectDir = Join-Path $PSScriptRoot "ai-seo-dashboard-main"
$pythonPath = Join-Path $projectDir "venv\Scripts\python.exe"

# Start backend
Write-Host "[1/2] Starting Flask Backend Server on port 5000..." -ForegroundColor Green
Start-Process -FilePath $pythonPath -ArgumentList "backend\app.py" -WorkingDirectory $projectDir

# Start frontend
Write-Host "[2/2] Starting Frontend Web Server on port 8080..." -ForegroundColor Green
Start-Process -FilePath $pythonPath -ArgumentList "-m http.server 8080" -WorkingDirectory $projectDir

Start-Sleep -Seconds 2
Start-Process "http://localhost:8080/index.html"

Write-Host "Application is running!" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:8080" -ForegroundColor Yellow
Write-Host "- Backend:  http://127.0.0.1:5000" -ForegroundColor Yellow
