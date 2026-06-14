# BowlSmart — Start both backend and frontend
# Run from the project root:  .\start.ps1

Write-Host "`n=== Starting BowlSmart ===" -ForegroundColor Cyan

# Start backend
Write-Host "`n[1/2] Starting Backend (FastAPI)..." -ForegroundColor Yellow
$backend = Start-Process -PassThru -NoNewWindow -FilePath "cmd" -ArgumentList "/c cd backend && .venv\Scripts\activate && python -m uvicorn app.main:app --reload" -WorkingDirectory $PSScriptRoot

Start-Sleep -Seconds 3

# Start frontend
Write-Host "[2/2] Starting Frontend (Next.js)..." -ForegroundColor Yellow
$frontend = Start-Process -PassThru -NoNewWindow -FilePath "cmd" -ArgumentList "/c cd frontend && npm run dev" -WorkingDirectory $PSScriptRoot

Write-Host "`n=== BowlSmart is running ===" -ForegroundColor Green
Write-Host "  Backend:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Press Ctrl+C to stop`n" -ForegroundColor DarkGray

# Wait for Ctrl+C, then clean up
try {
    Wait-Process -Id $backend.Id
} finally {
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    Write-Host "`nBowlSmart stopped." -ForegroundColor Yellow
}
