@echo off
REM Deployment Verification Script for LiveScoreFree (Cloudflare)
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

REM Check Cloudflare Config Files
echo [3/8] Checking Cloudflare config files...
if exist wrangler.toml (
    echo Found wrangler.toml
) else (
    echo ERROR: wrangler.toml not found!
)
if exist _headers (
    echo Found _headers
) else (
    echo ERROR: _headers not found!
)
if exist _redirects (
    echo Found _redirects
) else (
    echo ERROR: _redirects not found!
)
echo.

REM Validate HTML
echo [4/8] Checking index.html...
findstr /i "og:url" index.html | findstr ">"
echo.

REM Check Cloudflare Functions
echo [5/8] Checking Cloudflare Functions...
if exist functions\api\live.js (
    echo Found functions\api\live.js
) else (
    echo ERROR: functions\api\live.js not found!
)
if exist functions\api\timeline.js (
    echo Found functions\api\timeline.js
) else (
    echo ERROR: functions\api\timeline.js not found!
)
if exist functions\api\standings.js (
    echo Found functions\api\standings.js
) else (
    echo ERROR: functions\api\standings.js not found!
)
if exist functions\api\health.js (
    echo Found functions\api\health.js
) else (
    echo ERROR: functions\api\health.js not found!
)
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
echo 2. Check Cloudflare Pages dashboard for deployment status
echo 3. Verify https://livescorefree.online loads correctly
echo 4. Test API at https://api.livescorefree.online/api/live
echo 5. Clear browser cache and verify service worker updates
echo.
