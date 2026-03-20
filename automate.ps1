# livescoreFree.online Stadium Broadcast Automation
# One-click launch for the kinetic sports platform

Write-Host "--- livescoreFree.online Broadcast System ---" -ForegroundColor Red
Write-Host "Initializing Kinetic Sync Engines..." -ForegroundColor Gray

# 1. Check for Node.js
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js/NPM not found. Please install Node.js to run the arena." -ForegroundColor Yellow
    Exit
}

# 2. Install dependencies (serve) if missing
Write-Host "Validating Infrastructure..."
npm install --no-save serve

# 3. Launch the Stadium Spectacle
Write-Host "Launching The Stadium Spectacle at http://localhost:3000..." -ForegroundColor Green
npm start



