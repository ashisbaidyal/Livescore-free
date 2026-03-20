/**
 * /api/proxy
 * Same-origin JSON proxy for approved upstream sports/news APIs.
 */

import { getEnv, getIntEnv, getCorsHeaders, jsonResponse } from "../_shared.js";

const ALLOWED_HOSTS = new Set([
  "site.api.espn.com",
  "www.thesportsdb.com",
  "gnews.io"
]);

function isAllowedUpstream(url) {
  return /^https:$/i.test(url.protocol) && ALLOWED_HOSTS.has(url.hostname);
}

export async function onRequest(context) {
  const { request, env } = context;
  const startTime = Date.now();
  const API_VERSION = getEnv(env, "API_VERSION", "2.0");
  const REQUEST_TIMEOUT = getIntEnv(env, "API_TIMEOUT", 8000);

  const baseHeaders = getCorsHeaders(request, env, {
    "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    "X-API-Version": API_VERSION
  });

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: baseHeaders });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({
      success: false,
      error: "Method not allowed",
      version: API_VERSION
    }, {
      status: 405,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }

  const incomingUrl = new URL(request.url);
  const target = incomingUrl.searchParams.get("url");
  if (!target) {
    return jsonResponse({
      success: false,
      error: "Missing url parameter",
      version: API_VERSION
    }, {
      status: 400,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }

  let upstreamUrl;
  try {
    upstreamUrl = new URL(target);
  } catch (_error) {
    return jsonResponse({
      success: false,
      error: "Invalid upstream url",
      version: API_VERSION
    }, {
      status: 400,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }

  if (!isAllowedUpstream(upstreamUrl)) {
    return jsonResponse({
      success: false,
      error: "Upstream host is not allowed",
      version: API_VERSION
    }, {
      status: 403,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: request.method,
      signal: controller.signal,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "livescoreFree.online-Proxy/2.0"
      }
    });

    const responseHeaders = new Headers(baseHeaders);
    responseHeaders.set("Content-Type", upstreamResponse.headers.get("Content-Type") || "application/json");
    responseHeaders.set("X-Upstream-Host", upstreamUrl.hostname);
    responseHeaders.set("X-Response-Time", `${Date.now() - startTime}ms`);

    if (request.method === "HEAD") {
      return new Response(null, {
        status: upstreamResponse.status,
        headers: responseHeaders
      });
    }

    const body = await upstreamResponse.text();
    return new Response(body, {
      status: upstreamResponse.status,
      headers: responseHeaders
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message || "Upstream fetch failed",
      version: API_VERSION
    }, {
      status: 502,
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${Date.now() - startTime}ms`
      }
    });
  } finally {
    clearTimeout(timer);
  }
}





