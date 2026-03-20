# Auto-Deployment Configuration

Date: March 18, 2026
Status: ACTIVE AND READY

---

## Repository
- Repo: ashisbaidyal/Livescore-free
- Branch: main

## Deployment Platform
- Cloudflare Pages (static site + Pages Functions)
- Primary origin:
  - https://livescoreFree.online.online
- Optional secondary API/domain:
  - https://api.livescoreFree.online.online

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
ALLOWED_ORIGINS=https://livescoreFree.online.online,https://www.livescoreFree.online.online,https://api.livescoreFree.online.online,https://*.pages.dev

## Verification
- Frontend:
  - curl -I https://livescoreFree.online.online/
- API:
  - curl https://livescoreFree.online.online/api/health
  - curl https://livescoreFree.online.online/api/live?limit=1
- Crawl files:
  - curl -I https://livescoreFree.online.online/robots.txt
  - curl -I https://livescoreFree.online.online/sitemap.xml

## Monitoring
- Cloudflare Dashboard: https://dash.cloudflare.com
- Project Logs: Cloudflare Pages -> Functions logs

## Notes
- Use `npm run validate` and then `scripts/verify-deployment.ps1` or `scripts/verify-deployment.bat` after changes.
- Cloudflare Pages uses _redirects for SPA routing and _headers for cache/security.
- `api-config.js` resolves proxy API calls against the current deployment origin, so Pages preview URLs work without extra edits.

---

Last Verified: March 18, 2026

