import { buildMatchRoutePath } from "./_match-page.js";

function escapeXml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildInternalApiUrl(request, path, params = {}) {
  const url = new URL(path, request.url);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function fetchInternalJson(request, path, params = {}) {
  const response = await fetch(buildInternalApiUrl(request, path, params), {
    headers: {
      Accept: "application/json"
    }
  });
  if (!response.ok) return {};
  return response.json();
}

function dedupeUrls(entries = []) {
  const seen = new Set();
  return entries.filter((entry) => {
    if (!entry?.loc || seen.has(entry.loc)) return false;
    seen.add(entry.loc);
    return true;
  });
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const hostname = `${url.protocol}//${url.hostname}`;

  try {
    const [liveData, upcomingData, resultsData, blogData] = await Promise.all([
      fetchInternalJson(request, "/api/live", { sport: "all" }),
      fetchInternalJson(request, "/api/upcoming", { sport: "all", days: 4 }),
      fetchInternalJson(request, "/api/results", { sport: "all", days: 2 }),
      fetchInternalJson(request, "/api/blog", { sport: "all", limit: 30 })
    ]);

    const staticUrls = [
      { loc: `${hostname}/`, priority: "1.0", changefreq: "always" },
      { loc: `${hostname}/live`, priority: "0.9", changefreq: "always" },
      { loc: `${hostname}/upcoming`, priority: "0.9", changefreq: "hourly" },
      { loc: `${hostname}/results`, priority: "0.8", changefreq: "hourly" },
      { loc: `${hostname}/news`, priority: "0.8", changefreq: "daily" },
      { loc: `${hostname}/trending`, priority: "0.8", changefreq: "hourly" },
      { loc: `${hostname}/leagues`, priority: "0.7", changefreq: "daily" },
      { loc: `${hostname}/teams`, priority: "0.7", changefreq: "daily" },
      { loc: `${hostname}/players`, priority: "0.7", changefreq: "daily" },
      { loc: `${hostname}/standings`, priority: "0.7", changefreq: "hourly" },
      { loc: `${hostname}/ipl`, priority: "0.8", changefreq: "hourly" }
    ];

    const dynamicMatchUrls = [
      ...((liveData.matches || []).slice(0, 80).map((match) => ({
        loc: `${hostname}${buildMatchRoutePath({ id: match.id, sport: match.sport, league: match.leagueSlug }, "match")}`,
        priority: "0.8",
        changefreq: "always"
      }))),
      ...((resultsData.matches || []).slice(0, 80).map((match) => ({
        loc: `${hostname}${buildMatchRoutePath({ id: match.id, sport: match.sport, league: match.leagueSlug }, "match")}`,
        priority: "0.7",
        changefreq: "daily"
      }))),
      ...((upcomingData.matches || []).slice(0, 80).map((match) => ({
        loc: `${hostname}${buildMatchRoutePath({ id: match.id, sport: match.sport, league: match.leagueSlug }, "upcoming-match")}`,
        priority: "0.7",
        changefreq: "hourly"
      })))
    ];

    const blogUrls = (blogData.posts || [])
      .filter((post) => post?.slug)
      .slice(0, 40)
      .map((post) => ({
        loc: `${hostname}/blog_article.html?slug=${encodeURIComponent(post.slug)}`,
        priority: "0.6",
        changefreq: "weekly"
      }));

    const urlStore = dedupeUrls([...staticUrls, ...dynamicMatchUrls, ...blogUrls]);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlStore
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=900"
      }
    });
  } catch (error) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "public, max-age=300"
        }
      }
    );
  }
}
