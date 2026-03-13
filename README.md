# LiveScoreFree - Documentation

Version: 2.0 Production (v43)
Status: LIVE
URL: https://livescorefree.online
API: https://api.livescorefree.online
Repository: https://github.com/ashisbaidyal/Livescore-free
Last Updated: March 13, 2026

---

## Quick Start

### Local Development
```bash
python -m http.server 8000
# Open http://localhost:8000
```

### Deployment (Cloudflare Pages)
1. Connect the repo to Cloudflare Pages.
2. Set build output to `.` and enable Pages Functions (uses `functions/`).
3. Add custom domains for `livescorefree.online` and `api.livescorefree.online`.
4. Configure environment variables in Cloudflare (see `wrangler.toml`).
5. Push to `main` to deploy.

---

## API Endpoints

### GET /api/live
```bash
curl https://api.livescorefree.online/api/live
```

### GET /api/timeline
```bash
curl https://api.livescorefree.online/api/timeline?match=123456
```

### GET /api/standings
```bash
curl https://api.livescorefree.online/api/standings?league=eng.1
```

### GET /api/health
```bash
curl https://api.livescorefree.online/api/health
```

---

## Cloudflare Setup

### Key Files
- _headers (security + cache headers)
- _redirects (SPA routing + canonical redirects)
- wrangler.toml (Cloudflare Pages config + vars)
- functions/api/* (Cloudflare Pages Functions API)

### Environment Variables (Cloudflare)
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

---

## File Structure

```text
lsf/
|-- index.html
|-- app.js
|-- styles.css
|-- sw.js
|-- manifest.json
|-- api-config.js
|-- robots.txt
|-- sitemap.xml
|-- humans.txt
|-- _redirects
|-- _headers
|-- wrangler.toml
|-- functions/
|   `-- api/
|       |-- live.js
|       |-- timeline.js
|       |-- standings.js
|       `-- health.js
|-- scripts/
|   |-- connect-github.ps1
|   |-- publish.ps1
|   |-- verify-deployment.ps1
|   `-- verify-deployment.bat
`-- [40+ SVG Assets]
```

---

## Support & Links
- Live Site: https://livescorefree.online
- API Base: https://api.livescorefree.online
- GitHub: https://github.com/ashisbaidyal/Livescore-free
- Cloudflare Dashboard: https://dash.cloudflare.com
- Google Search Console: https://search.google.com/search-console
- Bing Webmaster Tools: https://www.bing.com/webmaster

---

Notes:
- Dynamic match pages are generated from live feed events.
- Keep SPA rewrite enabled via `_redirects`.
- External APIs used: ESPN and TheSportsDB.
