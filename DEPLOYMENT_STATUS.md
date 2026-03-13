# Auto-Deployment Configuration

Date: March 13, 2026
Status: ACTIVE AND READY

---

## Repository
- Repo: ashisbaidyal/Livescore-free
- Branch: main

## Deployment Platform
- Cloudflare Pages (static site + Pages Functions)
- Custom domains:
  - https://livescorefree.online
  - https://api.livescorefree.online

## Key Configuration Files
- wrangler.toml
- _headers
- _redirects
- functions/api/*

## Deployment Flow
1. Push to main.
2. Cloudflare Pages builds from root (no build step).
3. Pages Functions deploy from /functions.
4. CDN cache updates globally.

## Environment Variables (Cloudflare)
NODE_ENV=production
API_VERSION=2.0
API_TIMEOUT=8000
CACHE_TTL_LIVE=15000
CACHE_TTL_TIMELINE=10000
CACHE_TTL_STANDINGS=3600000
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_WINDOW=100
ESPN_API_BASE=https://site.api.espn.com/apis/site/v2/sports
SPORTSDB_API_BASE=https://www.thesportsdb.com/api/v1/json/123
ENABLE_CORS=true
LOG_LEVEL=info
ENABLE_ANALYTICS=true
ALLOWED_ORIGINS=https://livescorefree.online,https://www.livescorefree.online,https://api.livescorefree.online

## Verification
- Frontend:
  - curl -I https://livescorefree.online/
- API:
  - curl https://api.livescorefree.online/api/health
  - curl https://api.livescorefree.online/api/live?limit=1
- Crawl files:
  - curl -I https://livescorefree.online/robots.txt
  - curl -I https://livescorefree.online/sitemap.xml

## Monitoring
- Cloudflare Dashboard: https://dash.cloudflare.com
- Project Logs: Cloudflare Pages -> Functions logs

## Notes
- Use scripts/verify-deployment.ps1 or scripts/verify-deployment.bat after changes.
- Cloudflare Pages uses _redirects for SPA routing and _headers for cache/security.

---

Last Verified: March 13, 2026
