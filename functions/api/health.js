/**
 * /api/health
 * Healthcheck Endpoint
 * Returns: System status, API health, cache status
 *
 * @author LiveScoreFree Team
 * @version 2.0
 * @updated 2026-03-13
 */

import { getEnv, getIntEnv, getCorsHeaders, jsonResponse } from "../_shared.js";

const bootTime = Date.now();

const healthCheck = {
  lastCheck: 0,
  status: {
    espn: { ok: false, latency: 0, lastError: null },
    sportsdb: { ok: false, latency: 0, lastError: null },
    cloudflare: { ok: true, latency: 0 }
  }
};

async function checkEspnHealth(espnBase, timeout) {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${espnBase}/soccer/eng.1/events?limit=1`, {
      signal: controller.signal,
      headers: { "User-Agent": "LiveScoreFree-Health-Check/2.0" }
    });

    clearTimeout(timer);
    const latency = Date.now() - startTime;

    healthCheck.status.espn = {
      ok: response.ok,
      latency,
      lastError: response.ok ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    healthCheck.status.espn = {
      ok: false,
      latency: Date.now() - startTime,
      lastError: error.message
    };
  }
}

async function checkSportsDbHealth(sportsDbBase, timeout) {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${sportsDbBase}/leaguestable.php?l=133602&s=2025`, {
      signal: controller.signal,
      headers: { "User-Agent": "LiveScoreFree-Health-Check/2.0" }
    });

    clearTimeout(timer);
    const latency = Date.now() - startTime;

    healthCheck.status.sportsdb = {
      ok: response.ok,
      latency,
      lastError: response.ok ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    healthCheck.status.sportsdb = {
      ok: false,
      latency: Date.now() - startTime,
      lastError: error.message
    };
  }
}

function getSystemHealth() {
  const espnOk = healthCheck.status.espn.ok;
  const sportsdbOk = healthCheck.status.sportsdb.ok;

  let overallStatus = "healthy";
  if (!espnOk && !sportsdbOk) {
    overallStatus = "unhealthy";
  } else if (!espnOk || !sportsdbOk) {
    overallStatus = "degraded";
  }

  return overallStatus;
}

export async function onRequest(context) {
  const { request, env } = context;

  const ESPN_BASE = getEnv(env, "ESPN_API_BASE", "https://site.api.espn.com/apis/site/v2/sports");
  const SPORTSDB_BASE = getEnv(env, "SPORTSDB_API_BASE", "https://www.thesportsdb.com/api/v1/json/123");
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 5000);
  const API_VERSION = getEnv(env, "API_VERSION", "2.0");

  const baseHeaders = getCorsHeaders(request, env, {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=10, s-maxage=10",
    "X-API-Version": API_VERSION
  });

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: baseHeaders });
  }

  await Promise.all([
    checkEspnHealth(ESPN_BASE, REQUEST_TIMEOUT),
    checkSportsDbHealth(SPORTSDB_BASE, REQUEST_TIMEOUT)
  ]);

  healthCheck.lastCheck = Date.now();

  const status = getSystemHealth();
  const statusCode = status === "healthy" ? 200 : status === "degraded" ? 207 : 503;
  const cf = request.cf || {};

  return jsonResponse({
    status,
    timestamp: Date.now(),
    uptime: Math.floor((Date.now() - bootTime) / 1000),
    environment: getEnv(env, "CF_PAGES_BRANCH", getEnv(env, "ENVIRONMENT", "unknown")),
    region: cf.colo || "unknown",
    country: cf.country || "unknown",
    providers: healthCheck.status,
    version: API_VERSION,
    deployment: {
      project: getEnv(env, "CF_PAGES_PROJECT_NAME", "unknown"),
      branch: getEnv(env, "CF_PAGES_BRANCH", "unknown"),
      commit: getEnv(env, "CF_PAGES_COMMIT_SHA", "unknown"),
      url: getEnv(env, "CF_PAGES_URL", "unknown")
    }
  }, {
    status: statusCode,
    headers: baseHeaders
  });
}
