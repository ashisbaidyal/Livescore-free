# LiveScoreFree - Complete Documentation

**Version:** 2.0 Production (v42)  
**Status:** ✅ FULLY DEPLOYED & LIVE  
**URL:** https://livescorefree.online  
**API:** https://api.livescorefree.online  
**Repository:** https://github.com/ashisbaidyal/Livescore-free  
**Last Updated:** March 13, 2026

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Features](#features)
4. [Architecture & Infrastructure](#architecture--infrastructure)
5. [API Documentation](#api-documentation)
6. [Installation & Setup](#installation--setup)
7. [Deployment Guide](#deployment-guide)
8. [DNS Configuration](#dns-configuration)
9. [SEO & Optimization](#seo--optimization)
10. [Troubleshooting](#troubleshooting)
11. [Monitoring & Maintenance](#monitoring--maintenance)

---

## PROJECT OVERVIEW

**LiveScoreFree** is a free, community-powered sports scoreboard web application featuring real-time live scores, player statistics, match commentary, lineups, and results across multiple sports (football, cricket, basketball, tennis, and more).

### Key Characteristics
- ✅ Static SPA (Single Page Application) - Lightning fast
- ✅ Zero backend required (uses free public APIs: ESPN + TheSportsDB)
- ✅ SEO-friendly with dynamic meta tags and structured data
- ✅ PWA-enabled (installable on mobile, offline support)
- ✅ Fully responsive design with stadium-themed UI
- ✅ Multi-language support with Google Translate integration
- ✅ Real-time score updates (30-second refresh cycle)
- ✅ Service worker for offline functionality
- ✅ Revenue-ready layout with ad placements

---

## QUICK START

### For Visitors
1. Open https://livescorefree.online
2. Browse live scores, upcoming matches, trending matches
3. Click on any match for detailed information
4. Bookmark or install PWA (mobile: "Add to Home Screen")

### For Developers
```bash
# Clone repository
git clone https://github.com/ashisbaidyal/Livescore-free.git
cd Livescore-free/lsf

# No build step needed! Just open in browser or local server
# Using Python 3:
python -m http.server 8000

# Then visit: http://localhost:8000

# Or using Node.js:
npx http-server

# Then visit: http://localhost:8080
```

### For Deployment
```bash
# Automatic! Just push to main branch
git add .
git commit -m "Your changes"
git push origin main

# GitHub Pages auto-deploys ~2-5 minutes
# Vercel API auto-deploys ~1-3 minutes
```

---

## FEATURES

### Core Features
- 🏆 **Live Scoreboard** - Real-time updates every 30 seconds
- 📊 **Detailed Match Center** - Summary, Stats, Lineups, Table, H2H, Analysis, Preview, Events
- 📈 **League Pages** - Overview, Live, Upcoming, Results, History, Teams, Players, Schedule
- 🔥 **Trending Matches** - Auto-highlighted trending matches
- 🏅 **Top Leagues** - Premier League, La Liga, Champions League, NBA, NFL, Cricket, Tennis
- 🔍 **Sport-Specific Pages** - Football, Cricket, Basketball, Tennis, etc.

### Advanced Features
- 💾 **Favorite/Save Matches** - Local storage persistence
- 🔔 **Goal Notifications** - Browser notifications on scores
- 🌍 **Multi-Language** - Auto-detect + manual language selection + Google Translate
- 🎨 **Day/Night Theme** - Auto theme switching based on system preference
- 📱 **PWA Installation** - Install on mobile or desktop
- 📡 **Offline Support** - Service worker caching for offline access
- 🔗 **Social Sharing** - WhatsApp, Telegram, X (Twitter), Facebook, LinkedIn, Reddit, Email
- 🎬 **Stadium Backgrounds** - Auto-rotating themed backgrounds per page
- 📑 **Dynamic Sitemaps** - Auto-generated SEO sitemaps

### Data Sources
- **Primary:** ESPN API (`https://site.api.espn.com/apis/site/v2/sports`)
- **Fallback:** TheSportsDB (`https://www.thesportsdb.com/api/v1/json/123`)
- **Coverage:** Football, Cricket, Basketball, Tennis, NFL, NHL, MLB, Rugby, MMA, Formula 1

---

## ARCHITECTURE & INFRASTRUCTURE

### Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Static SPA) - GitHub Pages                    │
├─────────────────────────────────────────────────────────┤
│ • index.html (main entry)                               │
│ • app.js (7500+ lines core logic)                       │
│ • styles.css (responsive design)                        │
│ • sw.js (service worker, offline support)              │
│ • manifest.json (PWA configuration)                     │
│ • 40+ SVG assets (logos, icons, backgrounds)           │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│ API Layer - Vercel Serverless Functions                 │
├─────────────────────────────────────────────────────────┤
│ • /api/live (live matches endpoint)                     │
│ • /api/timeline (match timeline events)                 │
│ • /api/standings (league standings table)               │
│ • CORS enabled, edge caching, rate limiting             │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│ Data Sources (Public Free APIs)                         │
├─────────────────────────────────────────────────────────┤
│ • ESPN API (primary, comprehensive)                     │
│ • TheSportsDB (fallback, coverage gaps)                 │
└─────────────────────────────────────────────────────────┘
```

### Deployment Architecture

```
GitHub Repository (main branch)
          ↓
    ┌─────┴─────┐
    ↓           ↓
GitHub Pages   Vercel
(Static)       (API Functions)
    ↓           ↓
https://livescorefree.online/
https://api.livescorefree.online/
```

### DNS Structure

```
livescorefree.online (Hostinger DNS)
│
├─ @ (A Records) → GitHub Pages (185.199.108.153, etc.)
├─ www (CNAME) → livescorefree.online
└─ api (CNAME) → cname.vercel-dns.com → Vercel
```

---

## API DOCUMENTATION

### Base URL
```
https://api.livescorefree.online
```

### Authentication
- **None required** - All endpoints are public
- **Rate Limit:** 100 requests/minute per IP
- **Recommended:** 50 requests/minute (soft limit)

### 1. GET `/api/live` - Live Matches

Returns currently live and upcoming matches.

**Request:**
```bash
curl https://api.livescorefree.online/api/live
curl https://api.livescorefree.online/api/live?league=eng.1
curl https://api.livescorefree.online/api/live?limit=50&status=live
```

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `league` | string | all | League key (eng.1, esp.1, nba, cricket, etc.) |
| `limit` | number | 50 | Max results (1-100) |
| `status` | string | all | Filter: all, live, upcoming |

**Response (200 OK):**
```json
{
  "success": true,
  "timestamp": "2026-03-13T10:30:00Z",
  "count": 12,
  "events": [
    {
      "id": "4789345",
      "date": "2026-03-13T15:00:00Z",
      "status": "live",
      "home": {"name": "Manchester United", "score": 2},
      "away": {"name": "Liverpool", "score": 1},
      "venue": "Old Trafford",
      "leagueKey": "eng.1"
    }
  ]
}
```

**Cache:** 15 seconds | **Status Codes:** 200 (OK), 400 (Bad Request), 500 (Server Error)

---

### 2. GET `/api/timeline` - Match Timeline

Returns timeline events for a specific match.

**Request:**
```bash
curl https://api.livescorefree.online/api/timeline?match=4789345
```

**Response (200 OK):**
```json
{
  "success": true,
  "matchId": "4789345",
  "events": [
    {"minute": "23'", "type": "goal", "team": "Manchester United", "player": "Bruno Fernandes"},
    {"minute": "45+1'", "type": "yellow_card", "team": "Liverpool", "player": "Roberto Firmino"}
  ]
}
```

**Cache:** 10 seconds | **Event Types:** goal, yellow_card, red_card, substitution

---

### 3. GET `/api/standings` - League Standings

Returns league table.

**Request:**
```bash
curl https://api.livescorefree.online/api/standings?league=eng.1
```

**Response (200 OK):**
```json
{
  "success": true,
  "league": "eng.1",
  "standings": [
    {"rank": 1, "teamName": "Manchester City", "points": 82, "played": 30, "won": 25}
  ]
}
```

**Cache:** 3600 seconds (1 hour)

---

## INSTALLATION & SETUP

### Prerequisites
- Node.js 14+ (optional, for local development)
- Git
- Modern web browser

### Local Development

**Using Python:**
```bash
cd d:\YTB\livescorefree-v2-production\lsf
python -m http.server 8000
```

**Using Node.js:**
```bash
npx http-server -p 8000
```

### Project Structure

```
lsf/
├── index.html              # Main entry point
├── app.js                  # Core logic (7500+ lines)
├── styles.css              # Responsive design
├── sw.js                   # Service worker
├── manifest.json           # PWA config
├── api-config.js           # API configuration
├── robots.txt              # SEO crawler rules
├── sitemap.xml             # URL sitemap
├── _redirects              # Redirect rules
├── vercel.json             # Vercel config
├── api/                    # API functions
│   ├── live.js
│   ├── timeline.js
│   └── standings.js
└── [40+ SVG Assets]        # Logos, icons, backgrounds
```

---

## DEPLOYMENT GUIDE

### Step 1: GitHub Pages (Frontend)
- **Status:** Already Configured ✅
- **Branch:** main
- **Domain:** livescorefree.online (via CNAME)

### Step 2: Vercel (API Functions)
- **Status:** Already Configured ✅
- **Functions:** Auto-deploys from `/api` folder
- **Domain:** api.livescorefree.online

### Step 3: Push to Deploy

```bash
git add -A
git commit -m "Your changes"
git push origin main

# GitHubPages: 2-5 minutes
# Vercel: 1-3 minutes
```

### Verify Deployment

```bash
curl -I https://livescorefree.online/          # Expect: HTTP 200
curl https://api.livescorefree.online/api/live # Expect: JSON response
```

---

## DNS CONFIGURATION

### Current Configuration
**DNS Provider:** Hostinger  
**Nameservers:** ns1.dns-parking.com, ns2.dns-parking.com

### A Records (GitHub Pages)

```
Type: A | Name: @ | Value: 185.199.108.153 | TTL: 3600
Type: A | Name: @ | Value: 185.199.109.153 | TTL: 3600
Type: A | Name: @ | Value: 185.199.110.153 | TTL: 3600
Type: A | Name: @ | Value: 185.199.111.153 | TTL: 3600
```

### CNAME Records

```
Type: CNAME | Name: www | Value: livescorefree.online | TTL: 3600
Type: CNAME | Name: api | Value: cname.vercel-dns.com | TTL: 3600
```

### Verify DNS

```bash
nslookup livescorefree.online
nslookup api.livescorefree.online
```

---

## SEO & OPTIMIZATION

### Meta Tags
- ✅ Dynamic title, description, keywords per page
- ✅ OpenGraph tags (og:title, og:description, og:image, og:url)
- ✅ Twitter Card tags
- ✅ Canonical URL tags (prevents duplicate content)
- ✅ hreflang tags (multi-language support)

### Structured Data
- ✅ JSON-LD schema.org markup
- ✅ WebSite, SportsEvent, SportsTeam, Person schemas

### Search Engine Crawling
- ✅ robots.txt with crawl rules for all major engines
- ✅ Sitemap (30+ indexed pages)
- ✅ Dynamic canonical URLs
- ✅ No noindex tags on public pages

### Performance
- **Lighthouse:** 94+ / 100 (Desktop)
- **FCP:** < 2 seconds
- **LCP:** < 3 seconds
- **CLS:** < 0.1

---

## TROUBLESHOOTING

### Common Issues

**1. "Page Not Found" (404)**
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check `_redirects` and `vercel.json` rewrite rules

**2. Service Worker Not Registering**
- Check browser console for errors
- Clear DevTools → Application → Service Workers
- Verify HTTPS in production

**3. API Errors - No Data**
- Check if ESPN API is accessible
- Verify Vercel Functions deployed
- Clear cache in DevTools Network tab

**4. HTTPS Certificate Error**
- Wait 24-48 hours for Let's Encrypt certificate
- Clear browser cache and cookies
- Try different browser

**5. Mixed Content Warning**
- Ensure all URLs use HTTPS
- Use relative paths for images
- Verify external API calls use HTTPS

---

## MONITORING & MAINTENANCE

### Health Checks (Daily)

```bash
curl -I https://livescorefree.online/       # Expect: HTTP 200
curl https://api.livescorefree.online/api/live?limit=1  # Expect: JSON
```

### Search Console
- Visit: https://search.google.com/search-console
- Add property: https://livescorefree.online
- Monitor: Indexation, Crawl Stats, Coverage, Core Web Vitals

### Monitoring Services
- **Uptime:** https://uptimerobot.com
- **Performance:** https://developers.google.com/web/tools/lighthouse
- **Analytics:** Google Analytics 4

### Maintenance Checklist
- **Weekly:** Check Vercel dashboard, monitor API response times
- **Monthly:** Review Search Console, check analytics, security patches
- **Quarterly:** Major updates, performance audit, SEO review

---

## SUPPORT & LINKS

### Important URLs
- **Live Site:** https://livescorefree.online
- **API Base:** https://api.livescorefree.online
- **GitHub:** https://github.com/ashisbaidyal/Livescore-free
- **GitHub Pages Settings:** https://github.com/ashisbaidyal/Livescore-free/settings/pages
- **Vercel Dashboard:** https://vercel.com/dashboard

### Data Sources
- **ESPN API:** https://site.api.espn.com/apis/site/v2/sports
- **TheSportsDB:** https://www.thesportsdb.com/api/v1/json/123

---

## VERSION HISTORY

### v2.0 (March 13, 2026) - CURRENT ✅
- Enhanced SEO with improved meta tags
- Fixed crawler support (robots.txt optimization)
- Updated service worker (cache v42)
- Enhanced Vercel configuration with security headers
- Full documentation consolidation into single README.md

### v1.0 (Initial Release)
- Core SPA functionality
- ESPN + TheSportsDB integration
- PWA support
- Basic SEO

---

**Status:** ✅ Production Ready | **Performance:** Lighthouse 94+/100 | **Deployment:** Fully Automated  

🚀 **LiveScoreFree is ready to scale!**
- Ensure SPA rewrite to `index.html` is enabled for clean-path routing.

## Data Sources

- ESPN Scoreboard API (primary live feed)
- ESPN Summary API (match detail for commentary, stats, lineups)
- TheSportsDB `eventsday.php` (free realtime fallback feed)
- TheSportsDB detail endpoints:
  - `lookupevent.php`
  - `lookupeventstats.php`
  - `lookuptimeline.php`
  - `lookuplineup.php`

## Notes

- Dynamic match pages are generated from live feed events.
- Direct indexing of dynamic slugs requires rewrite support (already included for Netlify/Vercel).
- No paid key is required for current realtime setup.

## Needed Things For Realtime

- Keep `app.js` refresh interval active (`REFRESH_INTERVAL_MS = 30000`).
- Host on HTTPS so service worker and cache refresh work correctly.
- Keep SPA rewrite enabled (`_redirects` or `vercel.json`) so clean match URLs resolve.
- Do not block outbound requests to:
  - `https://site.api.espn.com`
  - `https://www.thesportsdb.com`

