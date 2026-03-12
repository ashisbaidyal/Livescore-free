#!/usr/bin/env pwsh

# Deployment Verification Script for LiveScoreFree
# Run this after deploying to verify everything is working

Write-Host ""
Write-Host "============================================================"
Write-Host "LiveScoreFree Deployment Verification"
Write-Host "============================================================"
Write-Host ""

# Check Git Status
Write-Host "[1/8] Checking Git Status..."
git status
Write-Host ""

# Check Git Log
Write-Host "[2/8] Recent Commits:"
git log --oneline -3
Write-Host ""

# Check Domain File
Write-Host "[3/8] Checking CNAME File..."
if (Test-Path "CNAME") {
    Write-Host "CNAME File Contents:"
    Get-Content "CNAME"
} else {
    Write-Host "ERROR: CNAME file not found!" -ForegroundColor Red
}
Write-Host ""

# Validate HTML
Write-Host "[4/8] Checking index.html..."
$htmlContent = Get-Content "index.html" -Raw
if ($htmlContent -match 'og:url.*content="https://livescorefree.online"') {
    Write-Host "✓ og:url tag is properly formatted" -ForegroundColor Green
} else {
    Write-Host "✗ og:url tag may have issues" -ForegroundColor Red
}
Write-Host ""

# Check vercel.json
Write-Host "[5/8] Checking vercel.json..."
if (Test-Path "vercel.json") {
    $vercelContent = Get-Content "vercel.json"
    if ($vercelContent -match "ALLOWED_ORIGINS") {
        Write-Host "✓ ALLOWED_ORIGINS configured" -ForegroundColor Green
    }
} else {
    Write-Host "WARNING: vercel.json not found!" -ForegroundColor Yellow
}
Write-Host ""

# Check Service Worker version
Write-Host "[6/8] Checking Service Worker Version..."
$swContent = Get-Content "sw.js" -Raw
if ($swContent -match 'CACHE_NAME = "lsf-v43"') {
    Write-Host "✓ Service Worker version: v43" -ForegroundColor Green
} else {
    Write-Host "Current Service Worker version found" -ForegroundColor Yellow
}
Write-Host ""

# Check API Config
Write-Host "[7/8] Checking API Configuration..."
$apiContent = Get-Content "api-config.js" -Raw
if ($apiContent -match "PRODUCTION_DOMAINS") {
    Write-Host "✓ Production domains configured" -ForegroundColor Green
} else {
    Write-Host "WARNING: Production domains not configured!" -ForegroundColor Yellow
}
Write-Host ""

# Check for uncommitted changes
Write-Host "[8/8] Checking for uncommitted changes..."
$status = git status --short
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "✓ Repository is clean - Ready for deployment!" -ForegroundColor Green
} else {
    Write-Host "⚠ Uncommitted changes detected:" -ForegroundColor Yellow
    Write-Host $status
}
Write-Host ""

Write-Host "============================================================"
Write-Host "Verification Complete"
Write-Host "============================================================"
Write-Host ""
Write-Host "Next Steps:"
Write-Host "  1. Push changes: git push origin main"
Write-Host "  2. Check Vercel Dashboard: https://vercel.com/dashboard"
Write-Host "  3. Verify: https://livescorefree.online"
Write-Host "  4. Test API: https://api.livescorefree.online/live"
Write-Host "  5. Verify service worker updates in browser DevTools"
Write-Host ""
