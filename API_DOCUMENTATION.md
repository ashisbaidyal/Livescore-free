# LiveScoreFree API Documentation

## Overview

The LiveScoreFree API provides serverless endpoints for live sports scores, timelines, and standings. All endpoints are deployed on **Vercel** and proxied through the main domain.

**Base URL:** `https://livescorefree.online/api`

---

## Authentication

No authentication required. All endpoints are public.

---

## Rate Limiting

- **Hard limit:** 100 requests per minute per IP
- **Soft limit:** 50 requests per minute recommended
- **Caching:** Responses cached at edge (5-60 seconds)

---

## Endpoints

### 1. GET `/api/live` - Live Matches

Returns currently live and upcoming matches across all supported leagues.

#### Request

```bash
curl https://livescorefree.online/api/live
curl https://livescorefree.online/api/live?league=eng.1
curl https://livescorefree.online/api/live?limit=50
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `league` | string | _all_ | League key (see League Keys below) |
| `limit` | number | 50 | Max results to return |
| `status` | string | _live_ | Filter: `live`, `upcoming`, or `all` |

#### Response

```json
{
  "success": true,
  "timestamp": "2026-03-13T10:30:00Z",
  "count": 12,
  "league": "eng.1",
  "events": [
    {
      "id": "4789345",
      "date": "2026-03-13T15:00:00Z",
      "status": "live",
      "statusDetail": "45+1",
      "home": {
        "name": "Manchester United",
        "abbreviation": "MUN",
        "score": 2,
        "teamId": "25",
        "logo": "https://a.espncdn.com/..."
      },
      "away": {
        "name": "Liverpool",
        "abbreviation": "LOU",
        "score": 1,
        "teamId": "15",
        "logo": "https://a.espncdn.com/..."
      },
      "venue": "Old Trafford",
      "leagueKey": "eng.1",
      "sportGroup": "football"
    }
  ]
}
```

#### Status Codes

- `200` OK - Successful response
- `400` Bad Request - Invalid league key
- `500` Server Error - API unavailable

#### Caching

- **TTL:** 15 seconds
- **Cache-Control:** `public, s-maxage=15, stale-while-revalidate=30`

---

### 2. GET `/api/timeline` - Match Timeline

Returns timeline events for a specific match (goals, cards, substitutions, etc).

#### Request

```bash
curl https://livescorefree.online/api/timeline?match=4789345
curl https://livescorefree.online/api/timeline?match=4789345&limit=20
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `match` | string | ✓ | ESPN match ID |
| `limit` | number | | Max events (default: 50) |
| `type` | string | | Filter: `goal`, `card`, `substitution` |

#### Response

```json
{
  "success": true,
  "match_id": "4789345",
  "timestamp": "2026-03-13T10:30:00Z",
  "events": [
    {
      "minute": 45,
      "type": "goal",
      "team": "Manchester United",
      "player": "Marcus Rashford",
      "description": "Marcus Rashford goal",
      "icon": "🎯"
    },
    {
      "minute": 38,
      "type": "yellow_card",
      "team": "Liverpool",
      "player": "Mohamed Salah",
      "description": "Yellow card",
      "icon": "🟨"
    },
    {
      "minute": 32,
      "type": "substitution",
      "team": "Manchester United",
      "playerOut": "Harry Maguire",
      "playerIn": "Luke Shaw",
      "description": "Substitution",
      "icon": "🔄"
    }
  ]
}
```

#### Event Types

- `goal` - Goal scored
- `yellow_card` - Yellow card warning
- `red_card` - Red card (ejection)
- `substitution` - Player substitution
- `penalty` - Penalty awarded
-`clear` - Defensive clear

#### Caching

- **TTL:** 10 seconds
- **Cache-Control:** `public, s-maxage=10, stale-while-revalidate=20`

---

### 3. GET `/api/standings` - League Standings

Returns league standings table with team ranking, points, and records.

#### Request

```bash
curl https://livescorefree.online/api/standings?league=eng.1
curl https://livescorefree.online/api/standings?league=nba&limit=10
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `league` | string | ✓ | League key (see below) |
| `limit` | number | | Top N teams (default: all) |

#### Response

```json
{
  "success": true,
  "league": "eng.1",
  "leagueLabel": "Premier League",
  "timestamp": "2026-03-13T10:30:00Z",
  "standings": {
    "group": "EPL",
    "entries": [
      {
        "rank": 1,
        "teamId": "25",
        "teamName": "Manchester City",
        "logo": "https://a.espncdn.com/...",
        "played": 28,
        "won": 21,
        "drawn": 4,
        "lost": 3,
        "goalsFor": 68,
        "goalsAgainst": 18,
        "goalDifference": 50,
        "points": 67
      },
      {
        "rank": 2,
        "teamId": "15",
        "teamName": "Arsenal",
        "logo": "https://a.espncdn.com/...",
        "played": 28,
        "won": 20,
        "drawn": 2,
        "lost": 6,
        "goalsFor": 62,
        "goalsAgainst": 25,
        "goalDifference": 37,
        "points": 62
      }
    ]
  }
}
```

#### Caching

- **TTL:** 3600 seconds (1 hour)
- **Cache-Control:** `public, s-maxage=3600, stale-while-revalidate=7200`

---

## League Keys

Supported league keys for queries:

### Football/Soccer
- `eng.1` - English Premier League
- `esp.1` - Spanish La Liga
- `ita.1` - Italian Serie A
- `ger.1` - German Bundesliga
- `fra.1` - French Ligue 1
- `ned.1` - Dutch Eredivisie
- `uefa.champions` - UEFA Champions League

### Cricket
- `cricket` - International Cricket

### Basketball
- `nba` - NBA (National Basketball Association)
- `ncaamb` - NCAA Men's Basketball

### American Football
- `nfl` - NFL (National Football League)

### Ice Hockey
- `nhl` - NHL (National Hockey League)

### Baseball
- `mlb` - MLB (Major League Baseball)

### Tennis
- `tennis` - ATP/WTA Tennis

### Rugby
- `rugby` - International Rugby

### MMA
- `mma` - UFC/MMA

### Formula 1
- `f1` - Formula 1 Racing

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Invalid league key",
  "message": "The league 'xyz' is not supported",
  "timestamp": "2026-03-13T10:30:00Z"
}
```

### Common Errors

| Code | Message | Solution |
|------|---------|----------|
| `400` | Invalid league key | Use valid league from League Keys list |
| `400` | Missing required parameter | Add required query parameter |
| `429` | Rate limit exceeded | Wait and retry (backoff 60s) |
| `500` | API unavailable | Retry in 5 minutes; check status page |
| `503` | Service temporarily unavailable | Upstream API down; retry in 10 minutes |

---

## CORS Headers

All endpoints include:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

Suitable for browser requests from any domain.

---

## Response Headers

### Cache Control

All responses include cache headers for optimal performance:

```
Cache-Control: public, s-maxage=15, stale-while-revalidate=30
```

- **s-maxage:** CDN cache duration
- **stale-while-revalidate:** Serve stale data while refreshing

### Content Type

```
Content-Type: application/json; charset=utf-8
```

---

## Best Practices

### 1. Implement Exponential Backoff

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
}
```

### 2. Cache Responses Client-Side

```javascript
const cache = new Map();

function getCachedLiveMatches() {
  const cached = cache.get('live-matches');
  if (cached && Date.now() - cached.timestamp < 15000) {
    return cached.data;
  }
  // Fetch and cache
}
```

### 3. Handle Rate Limits

```javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After') || '60';
  setTimeout(() => { /* retry */ }, retryAfter * 1000);
}
```

### 4. Validate Responses

```javascript
const validateLiveMatch = (event) => {
  return event.id && event.date && event.home && event.away;
};
```

---

## Data Schedule

| Endpoint | Refresh | Lag |
|----------|---------|-----|
| `/api/live` | 15 seconds | <30s |
| `/api/timeline` | 10 seconds | <20s |
| `/api/standings` | 1 hour | <5 min |

---

## Monitoring & Status

Check API status:

```bash
curl -I https://livescorefree.online/api/live
# HTTP/2 200 indicates all systems operational
```

Production status page: [status.livescorefree.online](https://status.livescorefree.online)

---

## Support & Issues

- **GitHub Issues:** [Report issue](https://github.com/ashisbaidyal/Livescore-free/issues)
- **Email:** [hello@livescorefree.com](mailto:hello@livescorefree.com)
- **Response time:** Best effort; check status page first

---

## Changelog

### v1.0 (Current)
- ✅ `/api/live` endpoint
- ✅ `/api/timeline` endpoint
- ✅ `/api/standings` endpoint
- ✅ CORS enabled
- ✅ Edge caching with Vercel

### Planned
- Timeline filters by event type
- Player statistics endpoint
- Team roster endpoint
- Match predictions endpoint

---

## Terms of Use

- Free for non-commercial use
- Please attribute: "Powered by LiveScoreFree"
- Don't resell or redistribute data
- Respect rate limits (don't hammer the API)

---

**API Version:** 1.0  
**Last Updated:** March 2026  
**Status:** 🟢 Fully Operational
