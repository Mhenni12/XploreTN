# XploreTN Quick Setup Script (PowerShell)
# This script automates the installation of dependencies and starts all services in separate terminals.

$root = Get-Location
Write-Host "Starting XploreTN Environment Setup..." -ForegroundColor Cyan

# -----------------------------
# 1. ENV FILES SETUP
# -----------------------------
Write-Host "`n Checking environment files..." -ForegroundColor Yellow
if (-not (Test-Path "ai-service/.env")) {
    Copy-Item "ai-service/.env.example" "ai-service/.env" -ErrorAction SilentlyContinue
    Write-Host "Created ai-service/.env"
}
if (-not (Test-Path "backend/.env")) {
    Copy-Item "backend/.env.example" "backend/.env" -ErrorAction SilentlyContinue
    Write-Host "Created backend/.env"
}
if (-not (Test-Path "frontend/.env")) {
    if (Test-Path "frontend/.env.example") {
        Copy-Item "frontend/.env.example" "frontend/.env"
    } else {
        New-Item "frontend/.env" -ItemType File -Force | Out-Null
        Add-Content "frontend/.env" "VITE_API_URL=http://localhost:5000`nVITE_GOOGLE_MAPS_API_KEY="
    }
    Write-Host "Created frontend/.env"
}

Write-Host "Please ensure you fill in the secrets in your .env files!" -ForegroundColor Magenta

# -----------------------------
# 2. BACKEND SETUP
# -----------------------------
Write-Host "`n Setting up Backend..." -ForegroundColor Yellow
cd backend
npm install
npx prisma generate
# npx prisma migrate deploy # Optional: Run this once you've configured your DATABASE_URL
cd $root

# -----------------------------
# 3. AI SERVICE SETUP
# -----------------------------
Write-Host "`n Setting up AI Service..." -ForegroundColor Yellow
cd ai-service
if (-not (Test-Path ".venv")) {
    python -m venv .venv
}
& ".\.venv\Scripts\Activate.ps1"
python -m pip install --upgrade pip
pip install -r requirements.txt
cd $root

# -----------------------------
# 4. FRONTEND SETUP
# -----------------------------
Write-Host "`n Setting up Frontend..." -ForegroundColor Yellow
cd frontend
npm install
cd $root

# -----------------------------
# 5. START ALL SERVICES
# -----------------------------
Write-Host "`n Starting all services in separate windows..." -ForegroundColor Cyan

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -Title "XploreTN Backend"

# Start AI Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-service; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000" -Title "XploreTN AI Service"

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -Title "XploreTN Frontend"

Write-Host "`n All services are now launching!" -ForegroundColor Green
Write-Host "  - Frontend:   http://localhost:5173"
Write-Host "  - Backend:    http://localhost:5000"
Write-Host "  - AI Service: http://localhost:8000/docs (Swagger UI)"