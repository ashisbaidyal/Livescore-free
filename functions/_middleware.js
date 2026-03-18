export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = url.pathname || "/";

  if (
    path.startsWith("/api/") ||
    path.startsWith("/.well-known/") ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    path === "/manifest.json" ||
    path === "/sw.js" ||
    path === "/favicon.ico"
  ) {
    return next();
  }

  const lastSegment = path.split("/").pop() || "";
  if (lastSegment.includes(".")) {
    return next();
  }

  // Rewrite SPA routes to the site root so Cloudflare serves index.html
  // without hitting the /index.html -> / canonical redirect rule.
  const rewrittenUrl = new URL("/", request.url);
  const rewrittenRequest = new Request(rewrittenUrl.toString(), request);
  if (env && env.ASSETS && typeof env.ASSETS.fetch === "function") {
    return env.ASSETS.fetch(rewrittenRequest);
  }

  return fetch(rewrittenRequest);
}
