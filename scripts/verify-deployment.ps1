#!/usr/bin/env pwsh

# Deployment Verification Script for LiveScoreFree (Cloudflare)
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

# Check Cloudflare Config Files
Write-Host "[3/8] Checking Cloudflare config files..."
if (Test-Path "wrangler.toml") {
    Write-Host "Found wrangler.toml" -ForegroundColor Green
} else {
    Write-Host "ERROR: wrangler.toml not found!" -ForegroundColor Red
}
if (Test-Path "_headers") {
    Write-Host "Found _headers" -ForegroundColor Green
} else {
    Write-Host "ERROR: _headers not found!" -ForegroundColor Red
}
if (Test-Path "_redirects") {
    Write-Host "Found _redirects" -ForegroundColor Green
} else {
    Write-Host "ERROR: _redirects not found!" -ForegroundColor Red
}
Write-Host ""

# Validate HTML
Write-Host "[4/8] Checking index.html..."
$htmlContent = Get-Content "index.html" -Raw
if ($htmlContent -match 'og:url.*content="https://livescorefree.online"') {
    Write-Host "OK: og:url tag is properly formatted" -ForegroundColor Green
} else {
    Write-Host "WARNING: og:url tag may have issues" -ForegroundColor Yellow
}
Write-Host ""

# Check Cloudflare Functions
Write-Host "[5/8] Checking Cloudflare Functions..."
$functionFiles = @(
    "functions/api/live.js",
    "functions/api/timeline.js",
    "functions/api/standings.js",
    "functions/api/health.js"
)
foreach ($file in $functionFiles) {
    if (Test-Path $file) {
        Write-Host "Found $file" -ForegroundColor Green
    } else {
        Write-Host "ERROR: $file not found!" -ForegroundColor Red
    }
}
Write-Host ""

# Check Service Worker version
Write-Host "[6/8] Checking Service Worker Version..."
$swContent = Get-Content "sw.js" -Raw
if ($swContent -match 'CACHE_NAME = "lsf-v43"') {
    Write-Host "OK: Service Worker version v43" -ForegroundColor Green
} else {
    Write-Host "WARNING: Service Worker version not expected" -ForegroundColor Yellow
}
Write-Host ""

# Check API Config
Write-Host "[7/8] Checking API Configuration..."
$apiContent = Get-Content "api-config.js" -Raw
if ($apiContent -match "PRODUCTION_DOMAINS") {
    Write-Host "OK: Production domains configured" -ForegroundColor Green
} else {
    Write-Host "WARNING: Production domains not configured!" -ForegroundColor Yellow
}
Write-Host ""

# Check for uncommitted changes
Write-Host "[8/8] Checking for uncommitted changes..."
$status = git status --short
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "Repository is clean - Ready for deployment!" -ForegroundColor Green
} else {
    Write-Host "Uncommitted changes detected:" -ForegroundColor Yellow
    Write-Host $status
}
Write-Host ""

Write-Host "============================================================"
Write-Host "Verification Complete"
Write-Host "============================================================"
Write-Host ""
Write-Host "Next Steps:"
Write-Host "  1. Push changes: git push origin main"
Write-Host "  2. Check Cloudflare Pages dashboard for deployment status"
Write-Host "  3. Verify: https://livescorefree.online"
Write-Host "  4. Test API: https://api.livescorefree.online/api/live"
Write-Host "  5. Verify service worker updates in browser DevTools"
Write-Host ""
