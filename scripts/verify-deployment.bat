@echo off
REM Deployment Verification Script for LiveScoreFree
REM Run this after deploying to verify everything is working

echo.
echo ============================================================
echo LiveScoreFree Deployment Verification
echo ============================================================
echo.

REM Check Git Status
echo [1/8] Checking Git Status...
git status
echo.

REM Check Git Log
echo [2/8] Recent Commits:
git log --oneline -3
echo.

REM Check Domain File
echo [3/8] Checking CNAME File...
if exist CNAME (
    echo CNAME File Contents:
    type CNAME
) else (
    echo ERROR: CNAME file not found!
)
echo.

REM Validate HTML
echo [4/8] Checking index.html...
findstr /i "og:url" index.html | findstr ">"
echo.

REM Check vercel.json
echo [5/8] Checking vercel.json...
findstr /i "ALLOWED_ORIGINS" vercel.json
echo.

REM Check Service Worker version
echo [6/8] Checking Service Worker Version...
findstr "CACHE_NAME" sw.js
echo.

REM Check API Config
echo [7/8] Checking API Configuration...
findstr "PRODUCTION_DOMAINS" api-config.js
echo.

REM Check for uncommitted changes
echo [8/8] Checking for uncommitted changes...
git status --short
if "%ERRORLEVEL%"=="0" (
    echo Repository is clean - Ready for deployment!
) else (
    echo WARNING: Uncommitted changes detected!
)
echo.

echo ============================================================
echo Verification Complete
echo ============================================================
echo.
echo Next Steps:
echo 1. Push changes: git push origin main
echo 2. Check Vercel Dashboard for deployment status
echo 3. Verify https://livescorefree.online loads correctly
echo 4. Test API at https://api.livescorefree.online/live
echo 5. Clear browser cache and verify service worker updates
echo.
