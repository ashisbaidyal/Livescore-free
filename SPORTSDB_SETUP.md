# SportsDB Integration Guide

## Overview

LiveScoreFree uses TheSportsDB API as a secondary data source for sports data when ESPN doesn't have coverage. This guide explains the setup, limitations, and optimization strategy.

**Last Updated**: March 20, 2026

---

## What Was Done

### ✅ Phase 1: API Analysis & Optimization

1. **Analyzed SportsDB Rate Limits** (from official documentation):
   - Free Tier: 30 requests per minute (TOTAL)
   - Search endpoints: 2 requests per minute
   - List endpoints: 10 requests per minute
   - Schedule endpoints (eventsday.php): Higher limit, best for live data

2. **Created Optimized Backend Endpoint** (`functions/api/sportsdb.js`):
   - Batches all sports requests into single endpoint call
   - Reduces frontend-to-SportsDB calls significantly
   - Implements smart caching strategy

3. **Implemented Smart Caching** (`functions/api/sportsdb-helper.js`):
   - **Event data**: 15-minute cache (for live updates)
   - **League data**: 24-hour cache (rarely changes)
   - **Rate limit detection**: Automatic cooldown on HTTP 429 responses
   - **Cache statistics**: Monitor usage and hit rates

4. **Optimized Frontend Data Fetching** (`js/api.js`):
   - Changed from individual sport calls to batched requests
   - Increased SportsDB data cache from 12 seconds to 1 hour
   - Reduced refresh frequency for non-critical data

---

## Free vs Premium API Keys

### Current Setup: Free Public Key ("123")

```
API URL: https://www.thesportsdb.com/api/v1/json/123/
Requests per minute: 30 (shared across all LiveScoreFree users)
Database: Limited, community-contributed data
State: Being phased out (heavily abused historically)
```

**Status**: ⚠️ This key has severe limitations but WORKS for basic data.

### Recommended: Free Account Key

1. **Get Free Account**:
   - Go to: https://www.thesportsdb.com/api.php
   - Click "Register"
   - Create free account
   - Get YOUR personal API key (not "123")

2. **Update Configuration**:
   - Open [wrangler.toml](../../wrangler.toml#L16)
   - Find: `SPORTSDB_API_BASE = "https://www.thesportsdb.com/api/v1/json/3457523"`
   - Replace `3457523` with your key from step 1
   - Redeploy to Cloudflare Pages

3. **Verification**:
   - Check Cloudflare Pages deployment log
   - Visit `/api/health` and verify SportsDB shows "ok: true"

### Premium Tier (Optional, $9/month)

If you need more data:
- Go to: https://www.thesportsdb.com/pricing
- Subscribe for Premium
- Get higher rate limits: 100 requests per minute
- Access V2 API with more endpoints
- Get Video Highlights data

---

## Architecture

### Request Flow

```
Frontend (js/api.js)
    ↓
/api/sportsdb endpoint (batches requests)
    ↓
SportsDB Helper (caching + rate limit handling)
    ↓
TheSportsDB API (free tier: 30 req/min)
```

### Key Components

#### 1. Backend Endpoint: `/api/sportsdb`

**Actions Available**:

```bash
# Get all events for a date, all sports
GET /api/sportsdb?action=events-by-sport&date=2026-03-20

# Get events for specific date and sport
GET /api/sportsdb?action=events-day&date=2026-03-20&sport=Soccer

# Get league details
GET /api/sportsdb?action=league-detail&league-id=4328

# Check cache statistics
GET /api/sportsdb?action=cache-stats
```

#### 2. Frontend Integration: `js/api.js`

```javascript
// This now calls the optimized endpoint instead of direct SportsDB calls
const sportsdbResult = await cachedJson(
  `/api/sportsdb?action=events-by-sport&date=${today}`,
  3600000  // 1 hour cache (respects free tier limits)
);
```

#### 3. Rate Limit Handling

- **Automatic Detection**: Tracks HTTP 429 responses
- **Backoff Strategy**: 60-second cooldown when rate limited
- **Fallback**: Returns cached data if rate limited
- **Monitoring**: Check `/api/sportsdb?action=cache-stats` for status

---

## Verification & Testing

### Test 1: Check API Endpoint

```bash
# In browser console or PowerShell:
curl https://livescorefree.online/api/sportsdb?action=events-by-sport&date=2026-03-20
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "football": { "sport": "Soccer", "count": 15, "events": [...] },
    "cricket": { "sport": "Cricket", "count": 8, "events": [...] },
    ...
  },
  "totalEvents": 50,
  "errorCount": 0
}
```

### Test 2: Check Cache Stats

```bash
curl https://livescorefree.online/api/sportsdb?action=cache-stats
```

**Shows**:
- Current cache size
- Cache hit/miss rates
- Rate limit status

### Test 3: Monitor Data Flow

Enable debug mode and check console:

```javascript
// In browser console:
localStorage.setItem('DEBUG_API', 'true');
location.reload();

// Check console for messages like:
// [API] ✅ Data refresh complete: 45 total matches
// [API] Provider Status: { espn: "✅ ESPN data...", sportsdb: "✅ SportsDB..." }
```

---

## Rate Limit Management Strategy

### How We Stay Under 30 req/min Limit

| Component | Calls | Frequency | Cache TTL | Result |
|-----------|-------|-----------|-----------|--------|
| ESPN Data | 40+ feeds | Every 15s (2.5 calls/s) | 15s | ~150 req/min ❌ SEPARATE ENDPOINT |
| SportsDB | 10 sports | Batched → 1 call | 1 hour | ~0.017 req/min ✅ |
| League Visuals | 40+ lookups | Lazy load | 24 hours | ~0.03 req/min ✅ |
| **TOTAL SportsDB** | - | - | - | **~0.05 req/min ✅** |

**Key**: ESPN and SportsDB are completely separate. ESPN gets its own request handling, SportsDB stays well under limits with batching + caching.

### If You Hit Rate Limits

**Symptom**: API responses show SportsDB errors, data is sparse

**Fix Priority**:
1. ✅ **Check your API key** (ensure not using public "123")
2. ✅ **Clear browser cache** (localStorage may have old data)
3. ✅ **Check cache stats** (`/api/sportsdb?action=cache-stats`)
4. 🔧 **Increase cache TTL** in [js/api.js](../../js/api.js#L657) (change 3600000 to 7200000 for 2 hour)
5. 🔧 **Reduce refresh frequency** in [js/constants.js](../../js/constants.js) (change REFRESH_INTERVAL_MS)

---

## Monitoring & Debugging

### Check Provider Status

Visit any page and look for status banner at top:
- ✅ Green = All sources working
- ⚠️ Orange = Some sources rate limited or down

### Check Backend Logs

Cloudflare Pages dashboard:
1. Go to https://dash.cloudflare.com
2. Pages → Your Site → Functions → Logs
3. Filter for `sportsdb` to see request details

### Check Browser Console

```javascript
// These should print debug info when DEBUG_API is enabled:
[API] ESPN fetch failed for eng.1: <error>
[API] SportsDB batch fetch failed: <error>
[API] ✅ Data refresh complete: X total matches
[API] Provider Status: { espn: "...", sportsdb: "..." }
```

---

## Future Improvements

### Planned
1. ✅ Auto-detection of API key type (free vs premium)
2. ✅ Smarter rate limit backoff algorithm
3. ⏳ V2 API support (requires premium, more modern endpoints)
4. ⏳ Persistent cache storage (cache across deployments)
5. ⏳ Data enrichment from multiple sources

---

## Support & Resources

**Official SportsDB Documentation**: https://www.thesportsdb.com/documentation

**API Testing Tools**:
- [Readme.io Sandbox](https://thedatadb.readme.io/)
- [Postman Collection](https://www.postman.com/thedatadb/thesportsdb)
- [OpenAPI Spec](https://www.thesportsdb.com/api/spec/v1/openapi.yaml)

**Issues?**
1. Check this guide's "Verification & Testing" section
2. Enable debug mode: `localStorage.setItem('DEBUG_API', 'true')`
3. Check `/api/health` endpoint for provider status
4. Review Cloudflare logs in dashboard

---

## Implementation Checklist

This is what was automatically done:

- ✅ Created `functions/api/sportsdb-helper.js` - helper functions
- ✅ Created `functions/api/sportsdb.js` - batched endpoint
- ✅ Updated `js/api.js` - uses batched endpoint
- ✅ Updated `wrangler.toml` - uses placeholder key (3457523)
- ✅ Added error handling and rate limit detection
- ✅ Added caching strategy
- ⏳ **TODO**: Replace placeholder API key with your actual key

---

## Next Steps

1. **Register Free Account** (2 minutes):
   - https://www.thesportsdb.com/api.php
   - Get your personal API key

2. **Update Configuration** (1 minute):
   - Edit [wrangler.toml](../../wrangler.toml#L16)
   - Replace `3457523` with your key

3. **Deploy** (30 seconds):
   - Push to GitHub
   - Wait for Cloudflare deployment

4. **Verify** (2 minutes):
   - Check `/api/health` endpoint
   - Look for SportsDB "ok: true"
   - Check live sports page for cricket/rugby data

5. **Monitor** (ongoing):
   - Check cache stats: `/api/sportsdb?action=cache-stats`
   - Watch for rate limit warnings in provider status
   - Review performance in Cloudflare dashboard

---

**Questions?** Review the official SportsDB API docs or check the implementation in `functions/api/sportsdb.js`.
