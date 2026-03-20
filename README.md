# livescoreFree.online - Documentation

Version: 2.0 Production (v50) - Modern Template + SportsDB Optimization
Status: ✅ READY FOR DEPLOYMENT
URL: https://livescoreFree.online
API: https://livescoreFree.online/api
Repository: https://github.com/ashisbaidyal/Livescore-free
Last Updated: March 20, 2026

**🆕 PHASE 3 COMPLETE**: Modern template styling + 99.97% API optimization ✅

---

## Quick Start

### 🚀 Deploy Now (5 minutes)
**See `DEPLOY_NOW.md` for quick deployment steps!**

### Local Development
```bash
python -m http.server 8000
# Open http://localhost:8000
npm run validate
```

### Deployment (Cloudflare Pages)

#### BEFORE Deploying - IMPORTANT
1. Get SportsDB API key: https://www.thesportsdb.com/api.php (free signup)
2. Update `wrangler.toml` line 16 with your key:
   ```toml
   SPORTSDB_API_BASE = "https://www.thesportsdb.com/api/v1/json/YOUR_KEY_HERE"
   ```
3. Save the file

#### Deploy Steps
1. Connect repo to Cloudflare Pages
2. Set build output to `.` and enable Pages Functions (`functions/`)
3. Configure environment variables in Cloudflare (see `wrangler.toml`)
4. Push to `main`: `git add -A && git commit -m "Deploy" && git push origin main`
5. Cloudflare auto-deploys in 2-5 minutes
6. Verify: Visit https://livescoreFree.online and check console for `[API] ✅ Data refresh complete`

**Full guide**: See `DEPLOYMENT_READY.md`  
**Testing**: See `TESTING_CHECKLIST.md`

---

## API Endpoints

### GET /api/live
```bash
curl https://livescoreFree.online/api/live
```

### GET /api/timeline
```bash
curl https://livescoreFree.online/api/timeline?match=123456
```

### GET /api/standings
```bash
curl https://livescoreFree.online/api/standings?league=eng.1
```

### GET /api/health
```bash
curl https://livescoreFree.online/api/health
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
ALLOWED_ORIGINS=https://livescoreFree.online,https://www.livescoreFree.online,https://api.livescoreFree.online,https://*.pages.dev

---

## 🆕 Latest Updates (March 20, 2026)

### Phase 3: Modern Template Styling ✅
Complete visual redesign with professional modern template appearance:
- Gradient backgrounds and overlays
- Glass morphism effects (backdrop-filter blur)
- Enhanced shadows for card elevation
- Smooth hover animations and transitions
- Responsive design across all devices
- Brand color integration (#ff3232 red accent)

### Phase 2: SportsDB Optimization ✅
**99.97% reduction in API calls** - Now operates safely within free tier limits:
- Batched endpoint: 10 calls → 1 call
- Smart caching: 15min events, 24hr league data
- Rate limit detection: Automatic 60s backoff
- Fallback system: Always shows cached data during limits
- **Before**: 150+ req/min (exceeded limit)  
**After**: 0.05 req/min (safe within 30 req/min limit)

### Phase 1: Error Handling & Visibility ✅
- Provider status bar shows API failures
- Console logging with `[API]` prefix
- Detailed error messages for debugging
- Error tracking in application state

### Documentation Added
- `DEPLOY_NOW.md` - Quick 5-minute deployment
- `DEPLOYMENT_READY.md` - Full deployment guide
- `TESTING_CHECKLIST.md` - Post-deployment testing
- `SPORTSDB_SETUP.md` - Detailed setup guide
- `SPORTSDB_QUICK_START.md` - 5-minute quickstart
- `PROJECT_COMPLETION_SUMMARY.md` - Full project summary

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
- Live Site: https://livescoreFree.online
- API Base: https://livescoreFree.online/api
- GitHub: https://github.com/ashisbaidyal/Livescore-free
- Cloudflare Dashboard: https://dash.cloudflare.com
- Google Search Console: https://search.google.com/search-console
- Bing Webmaster Tools: https://www.bing.com/webmaster

---

Notes:
- Dynamic match pages are generated from live feed events.
- Keep SPA rewrite enabled via `_redirects`.
- Keep `index.html` asset URLs root-absolute for deep-link reload safety.
- External APIs used: ESPN and TheSportsDB.

