/**
 * /api/cricket-live
 * Endpoint: GET /api/cricket-live
 * Returns: Live cricket events from Cricbuzz (no-key) with RSS fallback.
 * Caching: 10-15 seconds
 *
 * @author LiveScoreFree Team
 * @version 1.0
 * @updated 2026-03-14
 */

import {
  getEnv,
  getIntEnv,
  getBoolEnv,
  getClientIp,
  getCorsHeaders,
  jsonResponse
} from "../_shared.js";

const CRICBUZZ_LIVE_URL = "https://www.cricbuzz.com/match-api/livematches.json";
const CRICINFO_RSS_URL = "https://static.cricinfo.com/rss/livescores.xml";

const cache = new Map();
const requestCounts = new Map();

function getCacheKey() {
  return "cricket-live";
}

function isCacheValid(timestamp, ttl) {
  return Date.now() - timestamp < ttl;
}

function pruneCache(maxEntries) {
  if (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

function checkRateLimit(ip, windowMs, maxRequests, enabled) {
  if (!enabled) return true;

  const now = Date.now();
  const windowStart = now - windowMs;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const requests = requestCounts.get(ip).filter((t) => t > windowStart);

  if (requests.length >= maxRequests) {
    requestCounts.set(ip, requests);
    return false;
  }

  requests.push(now);
  requestCounts.set(ip, requests);
  return true;
}

async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function stripCdata(text = "") {
  return String(text || "")
    .replace(/^<!\[CDATA\[/i, "")
    .replace(/\]\]>$/i, "")
    .trim();
}

function parseStatusFromText(text = "") {
  const token = String(text || "").toLowerCase();
  if (
    token.includes("live") ||
    token.includes("in progress") ||
    token.includes("innings") ||
    token.includes("stumps") ||
    token.includes("break") ||
    token.includes("day")
  ) {
    return { status: "IN_PROGRESS", detail: text || "Live" };
  }
  if (
    token.includes("won") ||
    token.includes("completed") ||
    token.includes("final") ||
    token.includes("abandon") ||
    token.includes("no result") ||
    token.includes("tie")
  ) {
    return { status: "FINAL", detail: text || "Final" };
  }
  return { status: "SCHEDULED", detail: text || "Scheduled" };
}

function splitTeamAndScore(segment = "") {
  const trimmed = String(segment || "").trim();
  if (!trimmed) {
    return { name: "", score: "-" };
  }
  const match = trimmed.match(/^(.*?)(\d.*)$/);
  if (!match) {
    return { name: trimmed, score: "-" };
  }
  return { name: match[1].trim(), score: match[2].trim() };
}

function parseRssItems(xml = "") {
  const items = [];
  const regex = /<item>([\s\S]*?)<\/item>/gi;
  let match = null;
  while ((match = regex.exec(xml))) {
    const block = match[1] || "";
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const title = stripCdata(titleMatch ? titleMatch[1] : "");
    const link = stripCdata(linkMatch ? linkMatch[1] : "");
    const pubDate = stripCdata(dateMatch ? dateMatch[1] : "");
    if (!title) {
      continue;
    }
    items.push({ title, link, pubDate });
  }
  return items;
}

function buildRssEvents(items = []) {
  return items.map((item, index) => {
    const title = item.title || "";
    const statusInfo = parseStatusFromText(title);

    const head = title.split(" - ")[0];
    const vsSplit = head.split(/\svs?\s/i);
    let home = "";
    let away = "";
    let homeScore = "-";
    let awayScore = "-";
    if (vsSplit.length >= 2) {
      const left = splitTeamAndScore(vsSplit[0]);
      const right = splitTeamAndScore(vsSplit.slice(1).join(" v "));
      home = left.name || "Home";
      away = right.name || "Away";
      homeScore = left.score || "-";
      awayScore = right.score || "-";
    } else {
      home = title.slice(0, 24).trim() || "Home";
      away = "Away";
    }

    return {
      id: `rss-${index}-${home.replace(/\s+/g, "-").toLowerCase()}`,
      date: item.pubDate || new Date().toISOString(),
      status: {
        type: {
          name: statusInfo.status,
          shortDetail: statusInfo.detail,
          description: statusInfo.detail
        }
      },
      name: "Cricket",
      competitions: [
        {
          competitors: [
            {
              homeAway: "home",
              team: {
                displayName: home,
                abbreviation: home.slice(0, 3).toUpperCase(),
                logo: ""
              },
              score: homeScore
            },
            {
              homeAway: "away",
              team: {
                displayName: away,
                abbreviation: away.slice(0, 3).toUpperCase(),
                logo: ""
              },
              score: awayScore
            }
          ],
          venue: { fullName: "" },
          status: {
            type: {
              name: statusInfo.status,
              shortDetail: statusInfo.detail,
              description: statusInfo.detail
            }
          }
        }
      ]
    };
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const startTime = Date.now();

  const API_VERSION = getEnv(env, "API_VERSION", "2.0");
  const CACHE_TTL = getIntEnv(env, "CACHE_TTL_LIVE", 15000);
  const MAX_CACHE_ENTRIES = getIntEnv(env, "MAX_CACHE_ENTRIES", 100);
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 8000);
  const RATE_LIMIT_WINDOW = getIntEnv(env, "RATE_LIMIT_WINDOW", 60000);
  const MAX_REQUESTS_PER_WINDOW = getIntEnv(env, "MAX_REQUESTS_PER_WINDOW", 100);
  const ENABLE_RATE_LIMITING = getBoolEnv(env, "ENABLE_RATE_LIMITING", true);
  const LOG_LEVEL = getEnv(env, "LOG_LEVEL", "info").toLowerCase();

  const cacheSeconds = Math.max(1, Math.floor(CACHE_TTL / 1000));
  const baseHeaders = getCorsHeaders(request, env, {
    "Content-Type": "application/json",
    "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
    "X-API-Version": API_VERSION
  });

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: baseHeaders });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({ success: false, error: "Method not allowed", version: API_VERSION }, {
      status: 405,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }

  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp, RATE_LIMIT_WINDOW, MAX_REQUESTS_PER_WINDOW, ENABLE_RATE_LIMITING)) {
    return jsonResponse({
      success: false,
      error: "Rate limit exceeded",
      message: "Too many requests. Please wait a moment.",
      version: API_VERSION
    }, {
      status: 429,
      headers: {
        ...baseHeaders,
        "Retry-After": Math.ceil(RATE_LIMIT_WINDOW / 1000).toString(),
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }

  const cacheKey = getCacheKey();
  const cached = cache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp, CACHE_TTL)) {
    return jsonResponse({
      success: true,
      events: cached.events,
      cached: true,
      cacheAge: Date.now() - cached.timestamp,
      timestamp: cached.timestamp,
      version: API_VERSION
    }, {
      status: 200,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }

  try {
    let events = [];
    try {
      const response = await fetchWithTimeout(CRICBUZZ_LIVE_URL, {
        headers: {
          "User-Agent": "LiveScoreFree-Bot/2.0",
          "Accept": "application/json"
        }
      }, REQUEST_TIMEOUT);
      if (response.ok) {
        const payload = await response.json();
        const matches = Array.isArray(payload?.matches) ? payload.matches : [];
        if (matches.length) {
          // return payload directly; client will normalize
          events = [];
          cache.set(cacheKey, {
            events: matches,
            timestamp: Date.now()
          });
          pruneCache(MAX_CACHE_ENTRIES);
          return jsonResponse({
            success: true,
            matches,
            cached: false,
            timestamp: Date.now(),
            version: API_VERSION
          }, {
            status: 200,
            headers: {
              ...baseHeaders,
              "X-Response-Time": `${Date.now() - startTime}ms`
            }
          });
        }
      }
    } catch (error) {
      if (LOG_LEVEL !== "silent") {
        console.warn("[API/cricket-live] Cricbuzz fetch failed:", error.message);
      }
    }

    try {
      const response = await fetchWithTimeout(CRICINFO_RSS_URL, {
        headers: {
          "User-Agent": "LiveScoreFree-Bot/2.0",
          "Accept": "application/rss+xml, application/xml"
        }
      }, REQUEST_TIMEOUT);
      if (response.ok) {
        const xml = await response.text();
        const items = parseRssItems(xml);
        events = buildRssEvents(items);
      }
    } catch (error) {
      if (LOG_LEVEL !== "silent") {
        console.warn("[API/cricket-live] RSS fetch failed:", error.message);
      }
    }

    cache.set(cacheKey, {
      events,
      timestamp: Date.now()
    });
    pruneCache(MAX_CACHE_ENTRIES);

    return jsonResponse({
      success: true,
      events,
      cached: false,
      timestamp: Date.now(),
      version: API_VERSION
    }, {
      status: 200,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  } catch (error) {
    if (LOG_LEVEL !== "silent") {
      console.error("[API/cricket-live] Request error:", error);
    }
    return jsonResponse({
      success: false,
      error: error.message || "Failed to fetch cricket data",
      timestamp: Date.now()
    }, {
      status: 500,
      headers: {
        ...baseHeaders,
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }
}
