# LiveScoreFree Production Deployment Guide

**Date:** March 13, 2026  
**Status:** 🟢 PRODUCTION READY  
**Domain:** https://livescorefree.online

---

## TABLE OF CONTENTS

1. [Infrastructure Overview](#infrastructure-overview)
2. [Hostinger DNS Setup](#hostinger-dns-setup)
3. [GitHub Pages Configuration](#github-pages-configuration)
4. [Vercel Deployment](#vercel-deployment)
5. [Domain Verification](#domain-verification)
6. [Testing & Validation](#testing--validation)
7. [Post-Launch Monitoring](#post-launch-monitoring)
8. [Troubleshooting](#troubleshooting)

---

## INFRASTRUCTURE OVERVIEW

### Architecture
```
DNS Provider: Hostinger (nameservers: ns1.dns-parking.com, ns2.dns-parking.com)
    │
    ├─→ livescorefree.online (A Records: GitHub Pages)
    │   └─→ GitHub Pages (Frontend: index.html, app.js, CSS, SW)
    │       └─→ https://livescorefree.online/ (Static HTML+JS SPA)
    │
    ├─→ www.livescorefree.online (CNAME: livescorefree.online)
    │   └─→ Same as above
    │
    └─→ api.livescorefree.online (CNAME: cname.vercel-dns.com)
        └─→ Vercel (Backend: /api/live, /api/timeline, /api/standings)
            └─→ https://api.livescorefree.online/live
            └─→ https://api.livescorefree.online/timeline
            └─→ https://api.livescorefree.online/standings
```

### Technology Stack
- **Frontend Hosting:** GitHub Pages (static, CDN-backed)
- **Backend API:** Vercel Serverless Functions (Node.js)
- **Domain & DNS:** Hostinger
- **SSL/TLS:** Let's Encrypt (auto-provisioned by both GitHub Pages and Vercel)
- **CDN:** Provided by GitHub Pages and Vercel Edge Network
- **Data Sources:** ESPN API + TheSportsDB API

---

## HOSTINGER DNS SETUP

### CRITICAL: Update Nameservers First

**ACTION REQUIRED:** This step must be completed BEFORE adding DNS records.

1. **Login to Hostinger Account**
   - Visit: https://hpanel.hostinger.com
   - Login with your credentials
   - Navigate to: **Domains** → **Your Domains** → Select **livescorefree.online**

2. **Change Nameservers (MANDATORY)**
   - Click: **Nameservers**
   - Select: **Custom Nameservers**
   - Replace default nameservers with:
     - **ns1.dns-parking.com**
     - **ns2.dns-parking.com**
   - Save changes
   - ⏳ **Wait 24 hours** for propagation (nameserver changes take time)

3. **Verify Nameserver Update**
   ```bash
   # Check nameserver propagation
   nslookup -type=ns livescorefree.online
   
   # Expected output should show:
   # ns1.dns-parking.com
   # ns2.dns-parking.com
   ```

---

### Add DNS Records (After nameserver update)

Once nameservers are propagated, add these records in DNS zone editor:

#### 1. GitHub Pages A Records (For root domain)

| Type | Name/Host | Value | TTL |
|------|-----------|-------|-----|
| A | @ | 185.199.108.153 | 3600 |
| A | @ | 185.199.109.153 | 3600 |
| A | @ | 185.199.110.153 | 3600 |
| A | @ | 185.199.111.153 | 3600 |

**Instructions:**
1. In Hostinger hPanel: **Domains** → **livescorefree.online** → **DNS Zone Editor**
2. Click: **Add Record**
3. For each A record:
   - **Type:** A
   - **Host:** @ (root domain)
   - **Value:** [IP from table above]
   - **TTL:** 3600
   - Click: **Add**
4. Repeat 4 times for all four GitHub Pages IPs

**Why 4 A records?** GitHub Pages uses redundant IPs for high availability.

#### 2. www Subdomain (CNAME to root)

| Type | Name/Host | Value | TTL |
|------|-----------|-------|-----|
| CNAME | www | livescorefree.online | 3600 |

**Instructions:**
1. Click: **Add Record**
2. **Type:** CNAME
3. **Host:** www
4. **Value:** livescorefree.online
5. **TTL:** 3600
6. Click: **Add**

#### 3. API Subdomain (CNAME to Vercel)

| Type | Name/Host | Value | TTL |
|------|-----------|-------|-----|
| CNAME | api | cname.vercel-dns.com | 3600 |

**Instructions:**
1. Click: **Add Record**
2. **Type:** CNAME
3. **Host:** api
4. **Value:** cname.vercel-dns.com
5. **TTL:** 3600
6. Click: **Add**

**Note:** Using Vercel's DNS CNAME endpoint (cname.vercel-dns.com) allows Vercel to automatically issue SSL certificates.

### Final DNS Verification

After adding all records, verify DNS configuration:

```bash
# Root domain (should resolve to GitHub Pages IP)
nslookup livescorefree.online
# Expected: 185.199.108.153 (or one of the 4 GitHub IPs)

# www subdomain (should resolve to same IPs)
nslookup www.livescorefree.online
# Expected: 185.199.108.153 (or one of the 4 GitHub IPs)

# API subdomain (should resolve to Vercel IP)
nslookup api.livescorefree.online
# Expected: Something like 76.76.0.x (Vercel IP)

# Check nameservers
nslookup -type=ns livescorefree.online
# Expected: ns1.dns-parking.com, ns2.dns-parking.com
```

---

## GITHUB PAGES CONFIGURATION

### Verify Repository Structure

Ensure these critical files exist in repository root:

```
✅ CNAME                      # Contains: livescorefree.online
✅ index.html                 # Main entry point
✅ app.js                      # 7500+ line SPA application
✅ styles.css                  # Responsive styling
✅ sw.js                       # Service worker
✅ manifest.json               # PWA manifest
✅ vercel.json                 # Vercel config
✅ robots.txt                  # SEO crawler directives
✅ sitemap.xml                 # XML sitemap
✅ _redirects                  # Fallback redirects
✅ 404.html                    # 404 error page
✅ /api/                       # Vercel serverless functions
```

### CNAME File Content

**File:** `CNAME`
```
livescorefree.online
```

**Verification:**
```bash
# Check CNAME file content
cat CNAME
# Expected output: livescorefree.online
```

### Enable GitHub Pages

1. **GitHub Repository Settings**
   - Go to: https://github.com/ashisbaidyal/Livescore-free
   - Settings → Pages
   - **Source:** main branch
   - **Enforce HTTPS:** ✅ Enabled
   - **Custom Domain:** livescorefree.online (should auto-populate from CNAME)

2. **Verify Build Status**
   - Go to: **Actions** tab
   - Latest workflow should show ✅ (green checkmark)

3. **Check GitHub Pages Deployment**
   - Actions → All Workflows → **pages build and deployment**
   - Latest run should be successful

### Expected GitHub Pages Configuration

```yaml
# URL should be:
https://livescorefree.online

# For HTTPS encryption:
✅ Managed by Let's Encrypt (auto-renewed)

# CDN:
✅ Powered by GitHub's global CDN
```

---

## VERCEL DEPLOYMENT

### Project Configuration

**Project Name:** livescorefree  
**Framework:** Static (no build step)  
**Region:** Automatic global distribution  

### Deploy Vercel Functions

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Deploy from Repository**
   ```bash
   cd d:\YTB\livescorefree-v2-production\lsf
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel
   ```

3. **Link to Domain**
   - Project Settings → **Production Deployment**
   - Domains: `api.livescorefree.online`
   - Vercel will auto-provision SSL certificate

4. **Verify Functions Deployed**
   ```bash
   # Check live endpoint
   curl https://api.livescorefree.online/live?sport=football
   
   # Check timeline endpoint
   curl https://api.livescorefree.online/timeline?match=1234567
   
   # Check standings endpoint
   curl https://api.livescorefree.online/standings?league=eng.1
   ```

### API Endpoints

| Endpoint | Method | Purpose | Cache |
|----------|--------|---------|-------|
| /api/live | GET | Live & upcoming matches | 15s |
| /api/timeline | GET | Match timeline events | 10s |
| /api/standings | GET | League standings table | 1hr |

**Base URL:** `https://api.livescorefree.online`

**Example Requests:**
```bash
# Get live matches
curl "https://api.livescorefree.online/live?sport=football&limit=50"

# Get match timeline
curl "https://api.livescorefree.online/timeline?match=32597783"

# Get standings
curl "https://api.livescorefree.online/standings?league=eng.1"
```

---

## DOMAIN VERIFICATION

### Propagation Timeline

| Service | Expected Time |
|---------|----------------|
| Nameservers | 24-48 hours |
| A Records | 15-30 minutes (after nameserver update) |
| CNAME Records | 15-30 minutes (after nameserver update) |
| HTTPS Certificates | 5-10 minutes (once DNS is resolved) |

### Live Verification Steps

**Step 1: Check DNS Propagation (Immediately)**
```bash
nslookup livescorefree.online
```

**Step 2: Visit Website**
```bash
# After 15-30 minutes of DNS setup
https://livescorefree.online

# Expected:
✅ Page loads without redirect
✅ No HTTPS certificate warning
✅ Service worker installs (visible in DevTools)
```

**Step 3: Verify API Endpoints**
```bash
curl https://api.livescorefree.online/live
# Expected: JSON array of matches
```

**Step 4: Check All Domain Variants**
```bash
# All should respond with 200
curl -I https://livescorefree.online
curl -I https://www.livescorefree.online
curl -I https://api.livescorefree.online
```

---

## TESTING & VALIDATION

### Pre-Launch Checklist

#### Domain & SSL
- [ ] `nslookup livescorefree.online` returns GitHub Pages IP
- [ ] `nslookup api.livescorefree.online` returns Vercel IP
- [ ] https://livescorefree.online loads without HTTPS warnings
- [ ] https://www.livescorefree.online redirects to root domain
- [ ] https://api.livescorefree.online responds to /live request

#### Frontend Functionality
- [ ] Homepage loads (all 30+ sports displayed)
- [ ] Live matches update every 30 seconds
- [ ] Score updates trigger refresh
- [ ] Match detail page (timeline, standings, H2H) loads
- [ ] Search/filter works
- [ ] Dark/light theme toggles
- [ ] Language selection works (14 languages)

#### Backend API
- [ ] `/api/live?sport=football` returns live matches
- [ ] `/api/timeline?match=<id>` returns match events
- [ ] `/api/standings?league=eng.1` returns table
- [ ] API responses include headers: `Cache-Control`, `CORS`
- [ ] Errors return proper JSON with status codes

#### PWA & Service Worker
- [ ] Service worker installs (check DevTools → Application)
- [ ] "Add to Home Screen" prompt appears on mobile
- [ ] App works offline (cached pages load)
- [ ] Notifications are toggleable in settings

#### Performance & SEO
- [ ] Lighthouse score: 90+ (Desktop)
- [ ] Time to Interactive: <3 seconds
- [ ] Canonical URL: https://livescorefree.online/[page]
- [ ] sitemap.xml: https://livescorefree.online/sitemap.xml
- [ ] robots.txt: https://livescorefree.online/robots.txt

#### Browser Compatibility
```
Testing Matrix:
✅ Chrome (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Edge (latest)
✅ Mobile Chrome (iOS/Android)
✅ Mobile Safari (iOS)
```

### Test Requests

```bash
# Test live matches endpoint
curl -H "Accept: application/json" \
  "https://api.livescorefree.online/live?sport=football" \
  | jq '.[] | {id, homeTeam, awayTeam, status}'

# Test standings endpoint
curl -H "Accept: application/json" \
  "https://api.livescorefree.online/standings?league=eng.1" \
  | jq '.[] | {rank, teamName, points, played}'

# Test CORS headers
curl -I -H "Origin: https://livescorefree.online" \
  "https://api.livescorefree.online/live"
```

---

## POST-LAUNCH MONITORING

### Daily Checks (Automation Recommended)

```bash
#!/bin/bash
# save as: monitor.sh

echo "=== LiveScoreFree Production Monitoring ==="
echo "Time: $(date)"

# Check website availability
echo "Frontend: $(curl -s -o /dev/null -w '%{http_code}' https://livescorefree.online)"

# Check API endpoints
echo "API /live: $(curl -s -o /dev/null -w '%{http_code}' https://api.livescorefree.online/live)"
echo "API /standings: $(curl -s -o /dev/null -w '%{http_code}' https://api.livescorefree.online/standings)"
echo "API /timeline: $(curl -s -o /dev/null -w '%{http_code}' https://api.livescorefree.online/timeline?match=123)"

# Check service worker
echo "SW: $(curl -s -o /dev/null -w '%{http_code}' https://livescorefree.online/sw.js)"

# Setup as cron job (runs every 5 minutes)
# */5 * * * * /path/to/monitor.sh >> /var/log/livescorefree-monitor.log
```

### Weekly Review

1. **Error Logs**
   - GitHub Pages: Actions tab for build failures
   - Vercel: https://vercel.com → livescorefree → Logs
   - Browser Console: Check for JS errors

2. **Performance Metrics**
   - Google Lighthouse: https://pagespeed.web.dev
   - WebPageTest: https://webpagetest.org
   - User experience metrics (Core Web Vitals)

3. **API Monitoring**
   - Response times (should be <500ms)
   - Error rates (should be <0.1%)
   - Cache hit rates (should be >95% for /standings)

### Monthly Report

- Traffic analytics (via Vercel or GA)
- Error rate trends
- Performance improvements
- Feature requests from users

---

## TROUBLESHOOTING

### Issue: Site not loading after DNS setup

**Symptoms:**
- https://livescorefree.online → Connection timeout
- HTTPS certificate not valid

**Resolution:**
```bash
# Step 1: Check DNS propagation
nslookup livescorefree.online
# If it returns GitHub Pages IP, DNS is correct

# Step 2: Check GitHub Pages status
# Go to: Settings → Pages
# Should show "Your site is live at https://livescorefree.online"

# Step 3: Clear DNS cache (Windows)
ipconfig /flushdns

# Step 4: Wait longer
# DNS/HTTPS certificate can take 24-48 hours to fully propagate
```

### Issue: HTTPS certificate warning

**Symptoms:**
- "ERR_CERT_INVALID" or "ERR_CERT_NOT_YET_VALID"

**Resolution:**
```bash
# Step 1: Verify CNAME file exists
cat CNAME
# Should output: livescorefree.online

# Step 2: Verify GitHub Pages setting
# Settings → Pages
# Custom domain should be: livescorefree.online

# Step 3: Re-check HTTPS enforcement
# Settings → Pages → Enforce HTTPS (toggle OFF then ON)

# Step 4: Wait for certificate
# Let's Encrypt certificate can take 5-10 minutes to issue
# Check back in 10 minutes
```

### Issue: API endpoints returning 404

**Symptoms:**
- curl https://api.livescorefree.online/live → 404 error
- Frontend gets "API not found" error

**Resolution:**
```bash
# Step 1: Verify Vercel deployment
vercel ls
# Should show livescorefree project as "READY"

# Step 2: Check API functions exist
ls api/
# Should show: live.js, timeline.js, standings.js

# Step 3: Deploy Vercel functions
vercel deploy --prod

# Step 4: Check Vercel project settings
# Dashboard → livescorefree → Settings
# Domains should include: api.livescorefree.online
```

### Issue: Frequent API timeouts

**Symptoms:**
- External APIs (ESPN, TheSportsDB) slow or offline
- Frontend shows "No data available"

**Resolution:**
```bash
# The /api endpoints have fallback logic:
# 1. Try ESPN API
# 2. If ESPN fails, try TheSportsDB
# 3. Cache results for 15 seconds

# Check if external APIs are online:
curl https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/events
# If this fails, the issue is ESPN API, not our infrastructure

# Check Vercel function logs:
vercel logs livescorefree
```

### Issue: Service Worker not installing

**Symptoms:**
- "Add to Home Screen" prompt doesn't appear
- Offline mode doesn't work

**Resolution:**
```bash
# Step 1: Check sw.js is accessible
curl https://livescorefree.online/sw.js
# Should return 200 status

# Step 2: Check manifest.json
curl https://livescorefree.online/manifest.json
# Should return valid JSON

# Step 3: Force service worker update (browser DevTools)
# DevTools → Application → Service Workers
# Click "Unregister" then refresh page

# Step 4: Check browser console for errors
# Open DevTools → Console
# Should not show any CORS or security errors
```

---

## ROLLBACK PROCEDURE

If critical issues occur:

### Quick Rollback (DNS)

```bash
# Step 1: Change nameservers back (Hostinger)
# Hostinger → Domains → livescorefree.online → Nameservers
# Switch back to: Hostinger default nameservers
# Wait 24 hours for propagation

# Step 2: Revert GitHub commit
git revert HEAD
git push origin main
```

### Emergency: Temporarily disable custom domain

```bash
# Remove CNAME file
rm CNAME
git add CNAME
git commit -m "Temporarily disable custom domain"
git push origin main

# Site will be available at:
# https://ashisbaidyal.github.io/Livescore-free/

# After fixing, restore CNAME:
echo "livescorefree.online" > CNAME
git add CNAME
git commit -m "Restore custom domain"
git push origin main
```

---

## FINAL DEPLOYMENT CHECKLIST

**Pre-Deployment:**
- [ ] All DNS records added to Hostinger
- [ ] Nameservers updated to ns1.dns-parking.com, ns2.dns-parking.com
- [ ] CNAME file exists with: livescorefree.online
- [ ] GitHub Pages enabled with HTTPS enforced
- [ ] Vercel functions deployed
- [ ] All files committed and pushed to main branch

**Launch Day:**
- [ ] DNS propagation verified (nslookup)
- [ ] Website loads at https://livescorefree.online
- [ ] API responds at https://api.livescorefree.online
- [ ] All live matches display correctly
- [ ] Service worker installs
- [ ] No HTTPS warnings
- [ ] Lighthouse score checked (90+)

**Post-Launch:**
- [ ] Monitor error logs for 24 hours
- [ ] Verify all API endpoints responding
- [ ] Check user feedback/analytics
- [ ] Set up monitoring scripts/alerts

---

## SUPPORT & DOCUMENTATION

**Repository:** https://github.com/ashisbaidyal/Livescore-free  
**Website:** https://livescorefree.online  
**API Docs:** See API_DOCUMENTATION.md  

---

**Status:** 🟢 READY FOR PRODUCTION LAUNCH

**Last Updated:** March 13, 2026  
**Next Review:** March 20, 2026
