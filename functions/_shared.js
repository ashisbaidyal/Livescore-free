export function getEnv(env, key, fallback) {
  if (!env || env[key] === undefined || env[key] === null || env[key] === "") {
    return fallback;
  }
  return env[key];
}

export function getIntEnv(env, key, fallback) {
  const raw = getEnv(env, key, fallback);
  const value = parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

export function getBoolEnv(env, key, fallback) {
  const raw = getEnv(env, key, fallback ? "true" : "false");
  if (typeof raw === "boolean") return raw;
  return String(raw).toLowerCase() === "true";
}

export function getClientIp(request) {
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) return cfIp;
  const xff = request.headers.get("X-Forwarded-For");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

export function getCorsHeaders(request, env, extra = {}) {
  const allowed = getEnv(env, "ALLOWED_ORIGINS", "*");
  const origin = request.headers.get("Origin");
  let allowOrigin = "*";

  if (allowed !== "*" && origin) {
    const allowedList = allowed.split(",").map((item) => item.trim()).filter(Boolean);
    allowOrigin = allowedList.includes(origin) ? origin : (allowedList[0] || "*");
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, X-API-Key",
    "Access-Control-Allow-Credentials": "false",
    "Access-Control-Max-Age": "86400",
    ...extra
  };
}

export function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}
