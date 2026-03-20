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

function normalizeOriginValue(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function originMatchesPattern(origin, pattern) {
  const safeOrigin = normalizeOriginValue(origin);
  const safePattern = normalizeOriginValue(pattern);

  if (!safeOrigin || !safePattern) {
    return false;
  }

  if (safePattern === "*" || safeOrigin === safePattern) {
    return true;
  }

  const wildcardMatch = safePattern.match(/^(https?):\/\/\*\.([^/]+)$/i);
  if (!wildcardMatch) {
    return false;
  }

  try {
    const originUrl = new URL(safeOrigin);
    const expectedProtocol = `${wildcardMatch[1].toLowerCase()}:`;
    const expectedHostname = wildcardMatch[2].toLowerCase();
    const originHostname = originUrl.hostname.toLowerCase();

    return originUrl.protocol === expectedProtocol && (
      originHostname === expectedHostname ||
      originHostname.endsWith(`.${expectedHostname}`)
    );
  } catch {
    return false;
  }
}

export function getCorsHeaders(request, env, extra = {}) {
  const allowed = getEnv(env, "ALLOWED_ORIGINS", "*");
  const origin = request.headers.get("Origin");
  let allowOrigin = "*";

  if (allowed !== "*" && origin) {
    const allowedList = allowed.split(",").map((item) => item.trim()).filter(Boolean);
    const matchingOrigin = allowedList.find((item) => originMatchesPattern(origin, item));
    allowOrigin = matchingOrigin ? origin : (allowedList[0] || "*");
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


