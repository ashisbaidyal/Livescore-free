# API Documentation - LiveScoreFree v2.0

**Version:** 2.0  
**Base URL:** `https://api.livescorefree.online` or `https://livescorefree.online/api`  
**Last Updated:** March 13, 2026  
**Status:** ✅ Production Ready

---

## 📡 API Endpoints

### 1. Health Check Endpoint

**GET** `/api/health`

Check API and provider health status.

#### Request
```bash
curl https://api.livescorefree.online/api/health
```

#### Response (200 OK)
```json
{
  "status": "healthy",
  "timestamp": 1710350000000,
  "uptime": 3600,
  "environment": "production",
  "region": "iad1",
  "providers": {
    "espn": {
      "ok": true,
      "latency": 245,
      "lastError": null
    },
    "sportsdb": {
      "ok": true,
      "latency": 312,
      "lastError": null
    },
    "vercel": {
      "ok": true,
      "latency": 0
    }
  },
  "version": "2.0"
}
```

#### Status Codes
- `200 OK` - All healthy
- `207 Multi-Status` - Degraded (at least one provider down)
- `503 Service Unavailable` - Unhealthy (all providers down)

#### Cache
- TTL: 10 seconds
- Stale-While-Revalidate: 10 seconds

---

### 2. Live Matches Endpoint

**GET** `/api/live`

Fetch live and upcoming matches.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sport` | string | `football` | Sport type (football, cricket, basketball, etc.) |
| `limit` | number | `50` | Maximum results (1-200) |

#### Request Examples
```bash
# Get 50 live football matches
curl "https://api.livescorefree.online/api/live?sport=football&limit=50"

# Get 30 cricket matches
curl "https://api.livescorefree.online/api/live?sport=cricket&limit=30"
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "12345678",
      "homeTeam": "Manchester United",
      "awayTeam": "Liverpool",
      "homeScore": 2,
      "awayScore": 1,
      "status": "IN_PROGRESS",
      "date": "2026-03-13T15:00:00Z",
      "league": "Premier League",
      "venue": "Old Trafford",
      "sportGroup": "football"
    }
  ],
  "cached": false,
  "timestamp": 1710350000000,
  "count": 15,
  "version": "2.0"
}
```

#### Cache
- TTL: 15 seconds
- Stale-While-Revalidate: 30 seconds

#### Rate Limiting
- Limit: 100 requests per IP
- Window: 1 minute
- Response: 429 Too Many Requests

#### Response Headers
```
X-API-Version: 2.0
X-RateLimit-Limit: 100
X-RateLimit-Window: 60000
Cache-Control: public, s-maxage=15, stale-while-revalidate=30
```

---

### 3. Match Timeline Endpoint

**GET** `/api/timeline`

Fetch match timeline events (goals, cards, substitutions).

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `match` | string | Yes | Match ID from live endpoint |

#### Request Example
```bash
curl "https://api.livescorefree.online/api/timeline?match=12345678"
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "minute": 15,
      "type": "goal",
      "player": "Marcus Rashford",
      "team": "Manchester United",
      "description": "Marcus Rashford scores"
    },
    {
      "minute": 32,
      "type": "yellow-card",
      "player": "Fabinho",
      "team": "Liverpool",
      "description": "Yellow card for Fabinho"
    }
  ],
  "matchId": "12345678",
  "timestamp": 1710350000000,
  "count": 8,
  "version": "2.0"
}
```

#### Cache
- TTL: 10 seconds
- Stale-While-Revalidate: 20 seconds

---

### 4. League Standings Endpoint

**GET** `/api/standings`

Fetch league standings/table.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `league` | string | Yes | League ID (eng.1, esp.1, nba, etc.) |

#### Supported Leagues
```
Football (Soccer):
- eng.1: Premier League
- esp.1: La Liga
- ita.1: Serie A
- ger.1: Bundesliga
- fra.1: Ligue 1
- ned.1: Eredivisie
- uefa.champions: UEFA Champions League

Basketball:
- nba: NBA
- ncaamb: NCAA Basketball

Other:
- nfl: NFL
- nhl: NHL
- mlb: MLB
- cricket: Cricket
- tennis: Tennis
```

#### Request Example
```bash
curl "https://api.livescorefree.online/api/standings?league=eng.1"
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "team": "Manchester City",
      "played": 30,
      "won": 25,
      "drawn": 3,
      "lost": 2,
      "points": 78,
      "goalDifference": 45
    },
    {
      "rank": 2,
      "team": "Arsenal",
      "played": 30,
      "won": 23,
      "drawn": 4,
      "lost": 3,
      "points": 73,
      "goalDifference": 38
    }
  ],
  "league": "eng.1",
  "timestamp": 1710350000000,
  "count": 20,
  "version": "2.0"
}
```

#### Cache
- TTL: 1 hour (3600 seconds)
- Stale-While-Revalidate: 12 hours

---

## 🔐 CORS & Authorization

### CORS Headers
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept, X-API-Key
Access-Control-Max-Age: 86400
```

### No Authentication Required
All endpoints are publicly accessible without API keys.

### CORS Preflight
```bash
curl -X OPTIONS https://api.livescorefree.online/api/live
```

---

## ⚡ Performance & Caching

### Cache Strategy
```
Client Cache:
- HTML/CSS/JS: 30 days (immutable)
- API responses: 10-60 seconds
- Service Worker: Always fresh

Edge Cache (Vercel):
- Static assets: 1 hour + 24 hours stale
- API responses: 60 seconds + 2 minutes stale
- Health check: 10 seconds

Stale-While-Revalidate:
- Updates cache in background
- Serves stale content while refreshing
```

### Response Times
```
Average: < 200ms globally
Percentile 95: < 500ms
Percentile 99: < 1s
```

---

## 🛡️ Rate Limiting

### Per IP Limits
```
Requests: 100 per minute
Burst: Up to 100 requests
Window: 60 seconds (sliding)
```

### Response Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Window: 60000
```

### Rate Limit Exceeded (429)
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please wait a moment."
}
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": [...],
  "timestamp": 1710350000000,
  "count": 15,
  "cached": false,
  "version": "2.0"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": 1710350000000
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `data` | array | Response data (if applicable) |
| `error` | string | Error message (if failed) |
| `timestamp` | number | Unix timestamp (ms) |
| `cached` | boolean | Whether response was cached |
| `count` | number | Number of items returned |
| `version` | string | API version |

---

## 🧪 Testing

### cURL Examples

```bash
# Health check
curl https://api.livescorefree.online/api/health

# Get live matches
curl "https://api.livescorefree.online/api/live"

# Get specific sport
curl "https://api.livescorefree.online/api/live?sport=cricket"

# Get standings
curl "https://api.livescorefree.online/api/standings?league=nba"

# Check response headers
curl -i https://api.livescorefree.online/api/health

# Verbose output
curl -v https://api.livescorefree.online/api/health
```

### JavaScript Fetch Examples

```javascript
// Health check
fetch('https://api.livescorefree.online/api/health')
  .then(r => r.json())
  .then(data => console.log(data));

// Get live matches
fetch('https://api.livescorefree.online/api/live')
  .then(r => r.json())
  .then(data => console.log(data.data));

// Get standings
fetch('https://api.livescorefree.online/api/standings?league=eng.1')
  .then(r => r.json())
  .then(data => console.log(data.data));
```

---

## 🚨 HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 207 | Multi-Status | Partial success (degraded) |
| 400 | Bad Request | Invalid parameters |
| 404 | Not Found | Endpoint not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 503 | Service Unavailable | All providers down |
| 500 | Internal Server Error | Server error |

---

## 📝 Request/Response Examples

### Complete Example: Get Live Football Matches

```bash
curl -i "https://api.livescorefree.online/api/live?sport=football&limit=5"
```

**Response Headers:**
```
HTTP/2 200
Content-Type: application/json
Cache-Control: public, s-maxage=15, stale-while-revalidate=30
Access-Control-Allow-Origin: *
X-API-Version: 2.0
X-RateLimit-Limit: 100
X-RateLimit-Window: 60000
```

**Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "id": "34567890",
      "homeTeam": "Chelsea",
      "awayTeam": "Newcastle United",
      "homeScore": 1,
      "awayScore": 2,
      "status": "IN_PROGRESS",
      "date": "2026-03-13T17:30:00Z",
      "league": "Premier League",
      "venue": "Stamford Bridge",
      "sportGroup": "football"
    },
    {
      "id": "34567891",
      "homeTeam": "Tottenham",
      "awayTeam": "Aston Villa",
      "homeScore": 0,
      "awayScore": 0,
      "status": "SCHEDULED",
      "date": "2026-03-13T19:45:00Z",
      "league": "Premier League",
      "venue": "Tottenham Hotspur Stadium",
      "sportGroup": "football"
    }
  ],
  "cached": false,
  "timestamp": 1710350000000,
  "count": 2,
  "version": "2.0"
}
```

---

## 🔍 Debugging

### Check API Status
```bash
curl https://api.livescorefree.online/api/health | jq '.providers'
```

### Monitor Request Latency
```bash
curl -w "\nTime: %{time_total}s\n" https://api.livescorefree.online/api/live?limit=1
```

### View Cache Status
```bash
curl -i https://api.livescorefree.online/api/live | grep "Cache-Control\|X-"
```

---

## 🆘 Common Issues

### Issue: Getting 429 Rate Limited
**Solution:** Reduce request frequency or implement client-side caching

### Issue: Empty data array
**Solution:** Check if matches are available for the specified sport/date

### Issue: Slow responses
**Solution:** Cache responses client-side, use stale-while-revalidate

### Issue: CORS errors
**Solution:** Ensure you're hitting the correct API domain

---

## 📚 Additional Resources

- **Documentation:** [API Docs](.)
- **Status Page:** [Status](https://status.livescorefree.online)
- **GitHub:** [Repository](https://github.com/ashisbaidyal/Livescore-free)
- **Support:** Create an issue on GitHub

---

**Version:** 2.0  
**Last Updated:** 2026-03-13  
**Status:** ✅ Production Ready  
**Uptime SLA:** 99.9%
