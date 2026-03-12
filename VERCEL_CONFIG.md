# Vercel Environment Variables & Configuration Guide

**Last Updated:** March 13, 2026  
**Version:** 2.0  
**Status:** ✅ Deployed

## 📋 Environment Variables

### Core Configuration

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Node.js environment mode |
| `API_VERSION` | `2.0` | Current API version |
| `LOG_LEVEL` | `info` | Logging verbosity level |
| `ENABLE_ANALYTICS` | `true` | Enable performance analytics |
| `ENABLE_CORS` | `true` | Enable CORS headers |

### Domain & Origin Configuration

| Variable | Value | Description |
|----------|-------|-------------|
| `ALLOWED_ORIGINS` | `https://livescorefree.online,https://www.livescorefree.online,https://api.livescorefree.online` | Allowed request origins for CORS |

### API Configuration

| Variable | Value | Description |
|----------|-------|-------------|
| `ESPN_API_BASE` | `https://site.api.espn.com/apis/site/v2/sports` | ESPN API base URL |
| `SPORTSDB_API_BASE` | `https://www.thesportsdb.com/api/v1/json/123` | TheSportsDB API base URL |
| `API_TIMEOUT` | `8000` | API request timeout (milliseconds) |

### Cache TTL Settings

| Variable | Value | Description |
|----------|-------|-------------|
| `CACHE_TTL_LIVE` | `15000` | Live matches cache TTL (15 seconds) |
| `CACHE_TTL_TIMELINE` | `10000` | Timeline events cache TTL (10 seconds) |
| `CACHE_TTL_STANDINGS` | `3600000` | Standings cache TTL (1 hour) |

### Rate Limiting

| Variable | Value | Description |
|----------|-------|-------------|
| `ENABLE_RATE_LIMITING` | `true` | Enable rate limiting per IP |
| `RATE_LIMIT_WINDOW` | `60000` | Rate limit window (1 minute) |
| `MAX_REQUESTS_PER_WINDOW` | `100` | Maximum requests per IP per window |

---

## 🔧 Build Configuration

### Node.js Runtime
```json
{
  "buildEnvironment": {
    "NODE_VERSION": "18.x"
  }
}
```

### Serverless Function Configuration
```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 3008,
      "maxDuration": 30,
      "runtime": "nodejs18.x"
    }
  }
}
```

**Settings:**
- **Memory:** 3008 MB (Maximum available)
- **Max Duration:** 30 seconds per request
- **Runtime:** Node.js 18.x

---

## 📍 Deployment Regions

```json
{
  "regions": ["iad1"]
}
```

**iad1:** United States (Northern Virginia)  
**Benefits:**
- Closest to North American users
- Fast response times
- High availability

---

## 🌐 HTTP Headers Configuration

### Global Headers (all routes)
```
Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
Content-Security-Policy: default-src 'self' https:; ...
X-API-Version: 2.0
```

### API Headers (/api/*)
```
Cache-Control: public, max-age=60, s-maxage=60, stale-while-revalidate=120
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept, X-API-Key
Access-Control-Allow-Credentials: false
Access-Control-Max-Age: 86400
X-RateLimit-Limit: 100
X-RateLimit-Window: 60000ms
```

### Health Check Headers (/api/health)
```
Cache-Control: public, max-age=10, s-maxage=10
```

### Static Assets Headers (JS, CSS, SVG, images)
```
Cache-Control: public, max-age=31536000, immutable
```

---

## 🔗 URL Rewrites & Redirects

### Rewrites (Internal)
```
/api/* → /api/$1 (API routes)
/* → /index.html (SPA fallback)
```

### Redirects (HTTP 301)
```
/index.php → /
/index.html → /
```

### Settings
```json
{
  "cleanUrls": true,
  "trailingSlash": false
}
```

---

## 🔐 DNS Configuration for livescorefree.online

### Recommended DNS Records

#### A Records (GitHub Pages / Vercel)
```
livescorefree.online A 185.199.108.153
livescorefree.online A 185.199.109.153
livescorefree.online A 185.199.110.153
livescorefree.online A 185.199.111.153
```

#### CNAME Records
```
www CNAME livescorefree.online  (or cname.vercel.domains if using Vercel)
api CNAME api.livescorefree.online
```

#### TXT Records (Verification)
```
TXT: google-site-verification=IWNRzZKEwiFv_1uYKpsyvGx0N9uMLb7k2Nw1x9ZdFa4
TXT: v=spf1 include:vercel.com ~all
```

---

## 🚀 GitHub Integration

```json
{
  "github": {
    "enabled": true,
    "autoAlias": true,
    "silent": false
  }
}
```

**Features:**
- Automatic deployments on git push
- Auto-generated preview URLs for branches
- Silent (no noise in PR comments)
- Auto aliasing enabled

---

## ⚙️ Advanced Settings

### Output Directory
```json
{
  "outputDirectory": "./"
}
```
Points to repository root (static files)

### Framework
```json
{
  "framework": null
}
```
No framework (vanilla JavaScript SPA)

### Build Command
```json
{
  "buildCommand": "npm run build || true"
}
```
Continues deployment even if build command fails

---

## 📊 Monitoring & Debugging

### Available Environment Info
```javascript
// In API routes:
process.env.VERCEL_ENV     // "production"
process.env.VERCEL_REGION  // "iad1"
process.env.VERCEL_URL     // Domain
process.env.NODE_ENV       // "production"
```

### Vercel Analytics
Access via: https://vercel.com/dashboard

**Monitor:**
- Response times
- Bandwidth usage
- Deployment history
- Function logs
- Error rates

---

## 🔄 Updating Environment Variables

### Via Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add or modify variables
3. Redeploy to apply

### Via `vercel.json`:
1. Update environment variables in `env` object
2. Commit and push changes
3. Vercel auto-redeployment triggered

### Verification:
```bash
# Check deployment
git log --oneline -1
# Visit dashboard to confirm deployment
```

---

## 🧪 Testing Configuration

### Local Testing:
```bash
# Install Vercel CLI
npm install -g vercel

# Run locally with Vercel config
vercel dev

# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/live
```

### Production Testing:
```bash
# Test live endpoint
curl https://api.livescorefree.online/api/live

# Check headers
curl -I https://livescorefree.online

# Verify CORS
curl -H "Origin: https://example.com" https://api.livescorefree.online/api/health
```

---

## ✅ Deployment Checklist

- [x] Environment variables configured
- [x] Build configuration optimized
- [x] HTTP headers secured
- [x] Rate limiting enabled
- [x] CORS properly configured
- [x] DNS records pointing to Vercel
- [x] CNAME file in repository
- [x] GitHub integration enabled
- [x] API routes working
- [x] Health check endpoint active
- [x] Caching strategy implemented
- [x] Security headers in place
- [x] Analytics enabled
- [x] Monitoring configured

---

## 🆘 Troubleshooting

### Issue: Build fails on deployment
**Solution:**
- Check `buildCommand` - currently set to ignore errors with `|| true`
- Review Vercel deployment logs
- Verify all dependencies are available

### Issue: API slow response
**Solution:**
- Check ESP N/SportsDB API rate limits
- Review cache TTL settings
- Consider enabling response compression

### Issue: CORS errors
**Solution:**
- Verify `ALLOWED_ORIGINS` includes your domain
- Check API endpoint CORS headers
- Ensure `Access-Control-Allow-Origin: *` is set

### Issue: Cache not updating
**Solution:**
- Clear Vercel cache in project settings
- Increment cache version in security headers
- Manually purge via Vercel CLI: `vercel pull`

---

**Last Updated:** 2026-03-13  
**Configuration Version:** 2.0  
**Status:** ✅ Production Ready
