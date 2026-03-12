# LiveScoreFree Production Deployment Guide

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│       https://livescorefree.online                       │
│                  (Hostinger DNS)                         │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   ┌───▼────┐      ┌───▼────┐
   │ GitHub │      │ Vercel │
   │ Pages  │      │ Serverless│
   │(Main)  │      │Functions(API)│
   └────────┘      └────────┘
```

---

## Prerequisites

- [Git](https://git-scm.com/download/win)
- [Node.js 18+](https://nodejs.org/)
- GitHub account with push access to [ashisbaidyal/Livescore-free](https://github.com/ashisbaidyal/Livescore-free)
- Vercel account (free)
- Hostinger account with domain access

---

## Phase 1: GitHub Pages (Frontend)

### 1a. Verify CNAME File

Ensure `CNAME` file exists in repo root:

```bash
cd d:\YTB\livescorefree-v2-production\lsf
cat CNAME
# Output: livescorefree.online
```

If missing, create it:
```bash
echo livescorefree.online > CNAME
git add CNAME
git commit -m "Add CNAME for custom domain"
```

### 1b. Verify index.html

Check that index.html contains correct canonical URL:

```html
<link rel="canonical" href="https://livescorefree.online/home">
```

Update if needed:
```bash
# Edit index.html to ensure canonical points to livescorefree.online
```

### 1c. Enable GitHub Pages

1. Go to GitHub repository → **Settings** → **Pages**
2. **Source:** `Deploy from a branch`
3. **Branch:** `main` → `/ (root)`
4. Click **Save**
5. Wait for green checkmark: "Your site is live at https://livescorefree.online"

### 1d. Test Frontend

```bash
# Test homepage
curl https://livescorefree.online/home

# Test service worker
curl https://livescorefree.online/sw.js

# Test sitemap
curl https://livescorefree.online/sitemap.xml
```

All should return 200 status.

---

## Phase 2: Vercel (Backend API)

### 2a. Create Vercel Account

1. Sign up free at [vercel.com](https://vercel.com)
2. Connect GitHub account

### 2b. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from project root
cd d:\YTB\livescorefree-v2-production\lsf
vercel --prod
```

When prompted:
- **Set up and deploy?** → `Y`
- **Which scope?** → Your Vercel team/account
- **Link to existing project?** → `N`
- **Project name?** → `livescorefree`
- **Which directory?** → `./` (current)

### 2c. Add Custom Domain to Vercel

1. Go to Vercel dashboard → Project **Settings** → **Domains**
2. Add domain: `livescorefree.online`
3. Vercel will provide DNS records (but Hostinger handles this, not Vercel)
4. Update project URL to use `livescorefree.online`

### 2d. Verify vercel.json

Check that `vercel.json` exists with correct rewrites:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures all routes serve `index.html` for client-side routing.

### 2e. Test API Endpoints

```bash
# Live matches
curl https://livescorefree.online/api/live

# Timeline
curl https://livescorefree.online/api/timeline?match=1234

# Standings
curl https://livescorefree.online/api/standings?league=eng.1
```

All should return `200` with JSON data.

---

## Phase 3: Hostinger DNS Configuration

### 3a. Update DNS Records

Log into Hostinger → **Domain** → **DNS Zone**

Add/update these records:

```
Type | Host | Value                  | TTL
-----|------|------------------------|---------
A    | @    | 185.199.108.153        | 3600
A    | @    | 185.199.109.153        | 3600
A    | @    | 185.199.110.153        | 3600
A    | @    | 185.199.111.153        | 3600
CNAME| www  | livescorefree.online   | 3600
```

### 3b. Verify DNS Propagation

```bash
# Wait up to 48 hours, then check:
nslookup livescorefree.online

# Or use:
ping livescorefree.online
```

Should return one of the GitHub Pages IPs.

---

## Phase 4: SSL/HTTPS

### GitHub Pages
- Automatically provisioned via Let's Encrypt
- Enforce HTTPS in repository settings

### Vercel
- Automatically provisioned via Let's Encrypt
- No manual setup needed

### Verify HTTPS

```bash
curl -I https://livescorefree.online
# Should show: HTTP/2 200
```

---

## Phase 5: Post-Deployment Testing

### 5a. Full Integration Test

```bash
# 1. Frontend loads
curl -I https://livescorefree.online/home
=> HTTP/2 200

# 2. Favicon loads
curl -I https://livescorefree.online/logo-mark.svg
=> HTTP/2 200

# 3. Service worker accessible
curl -I https://livescorefree.online/sw.js
=> HTTP/2 200

# 4. API responds
curl -I https://livescorefree.online/api/live
=> HTTP/2 200

# 5. Manifest accessible
curl -I https://livescorefree.online/manifest.json
=> HTTP/2 200

# 6. Sitemap accessible
curl -I https://livescorefree.online/sitemap.xml
=> HTTP/2 200

# 7. Robots.txt accessible
curl -I https://livescorefree.online/robots.txt
=> HTTP/2 200
```

### 5b. Browser Testing

1. Visit `https://livescorefree.online`
2. Open DevTools (F12)
3. Check:
   - ✅ No console errors
   - ✅ Service worker registered
   - ✅ Canonical links correct
   - ✅ OG meta tags present
   - ✅ No mixed content warnings (all assets HTTPS)

### 5c. Mobile Testing

Use [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

---

## Phase 6: SEO & Search Indexing

### 6a. Submit to Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://livescorefree.online`
3. Verify ownership (DNS TXT or meta tag)
4. Submit sitemap: `/sitemap.xml`

### 6b. Submit Sitemap

```bash
curl "https://www.google.com/ping?sitemap=https://livescorefree.online/sitemap.xml"
```

### 6c. Check Indexation

```bash
# In Google Search Console
# Wait 1-7 days for crawl
# Check: Coverage report
# Expected: All pages indexed
```

---

## Continuous Deployment

### Auto-Deploy on Push

1. **GitHub Pages:** Automatically deploys on push to `main`
2. **Vercel:** 
   - Connect GitHub repo
   - Set branch to `main`
   - Auto-deploys on each push

### Manual Deployment (If Needed)

```bash
# GitHub Pages (automatic on push)
git push origin main

# Vercel (optional manual)
vercel --prod
```

---

## Monitoring & Troubleshooting

### Check Live Status

```bash
# All endpoints should be GREEN
curl https://livescorefree.online/health-check
```

### View Vercel Logs

```bash
vercel logs livescorefree --prod
```

### Common Issues

| Issue | Solution |
|-------|----------|
| **404 on API calls** | Verify `vercel.json` rewrites; redeploy |
| **CORS errors** | Add headers in `vercel.json` |
| **Slow initial load** | Check service worker caching; enable Vercel edge functions |
| **DNS not resolving** | Clear DNS cache; wait 48 hours |
| **Mixed content warning** | Ensure all assets use HTTPS URLs |

---

## Rollback Plan

If deploying causes issues:

```bash
# Revert to previous GitHub commit
git revert HEAD
git push origin main

# Vercel auto-reverts to previous successful deployment
# (Check Vercel dashboard → Deployments)
```

---

## Performance Optimization Checklist

- ✅ Service worker caching enabled (sw.js)
- ✅ Assets minified and compressed
- ✅ Images lazy-loaded
- ✅ CSS/JS bundled
- ✅ HTTP headers optimized (vercel.json)
- ✅ CDN caching enabled (5-30 min)

---

## Final Verification

```bash
# Run complete health check
echo "1. Frontend..."
curl -s -o /dev/null -w "%{http_code}" https://livescorefree.online
echo ""

echo "2. API Live..."
curl -s -o /dev/null -w "%{http_code}" https://livescorefree.online/api/live
echo ""

echo "3. Sitemap..."
curl -s -o /dev/null -w "%{http_code}" https://livescorefree.online/sitemap.xml
echo ""

echo "4. Service Worker..."
curl -s -o /dev/null -w "%{http_code}" https://livescorefree.online/sw.js
echo ""

# All should be 200
```

---

## Support

- **GitHub Issues:** [ashisbaidyal/Livescore-free](https://github.com/ashisbaidyal/Livescore-free/issues)
- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **GitHub Pages Docs:** [pages.github.com](https://pages.github.com/)

---

**Deployment Status:** 🚀 **LIVE** at https://livescorefree.online
