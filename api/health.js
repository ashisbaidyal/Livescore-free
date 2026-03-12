/**
 * /api/health.js
 * Healthcheck Endpoint
 * Returns: System status, API health, cache status
 * 
 * @author LiveScoreFree Team
 * @version 2.0
 * @updated 2026-03-13
 */

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/123";

const healthCheck = {
  lastCheck: 0,
  status: {
    espn: { ok: false, latency: 0, lastError: null },
    sportsdb: { ok: false, latency: 0, lastError: null },
    vercel: { ok: true, latency: 0 }
  }
};

async function checkEspnHealth() {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${ESPN_BASE}/soccer/eng.1/events?limit=1`, {
      signal: controller.signal,
      headers: { "User-Agent": "LiveScoreFree-Health-Check/2.0" }
    });
    
    clearTimeout(timeout);
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

async function checkSportsDbHealth() {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(
      `${SPORTSDB_BASE}/leaguestable.php?l=133602&s=2025`,
      { signal: controller.timeout }
    );
    
    clearTimeout(timeout);
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

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=10, s-maxage=10");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Perform health checks
  await Promise.all([
    checkEspnHealth(),
    checkSportsDbHealth()
  ]);

  healthCheck.lastCheck = Date.now();

  const status = getSystemHealth();
  const statusCode = status === "healthy" ? 200 : status === "degraded" ? 207 : 503;

  return res.status(statusCode).json({
    status,
    timestamp: Date.now(),
    uptime: process.uptime ? Math.floor(process.uptime()) : "unknown",
    environment: process.env.VERCEL_ENV || "unknown",
    region: process.env.VERCEL_REGION || "unknown",
    providers: healthCheck.status,
    version: "2.0"
  });
}
