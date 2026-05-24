import { buildMatchRoutePath } from "./_match-page.js";

const CANONICAL_ORIGIN = "https://livescorefree.online";
const CORE_SPORTS = ["soccer", "cricket", "basketball", "football", "baseball", "hockey", "tennis", "mma", "racing", "golf"];

function escapeXml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getEntryDate(value = "") {
  if (!value) return todayIsoDate();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return todayIsoDate();
  return parsed.toISOString().slice(0, 10);
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

function buildBlogArticlePath(post = {}) {
  const params = new URLSearchParams();
  if (post?.slug) params.set("slug", post.slug);
  if (post?.sport) params.set("sport", post.sport);
  if (post?.league) params.set("league", post.league);
  const query = params.toString();
  return query ? `/blog_article?${query}` : "/blog_article";
}

export async function onRequest(context) {
  const { request } = context;
  const hostname = CANONICAL_ORIGIN;
  const lastmod = todayIsoDate();

  try {
    const [liveData, upcomingData, resultsData, blogData] = await Promise.all([
      fetchInternalJson(request, "/api/live", { sport: "all" }),
      fetchInternalJson(request, "/api/upcoming", { sport: "all", days: 4 }),
      fetchInternalJson(request, "/api/results", { sport: "all", days: 2 }),
      fetchInternalJson(request, "/api/blog", { sport: "all", limit: 30 })
    ]);

    const staticUrls = [
      { loc: `${hostname}/`, priority: "1.0", changefreq: "always", lastmod },
      { loc: `${hostname}/live`, priority: "0.9", changefreq: "always", lastmod },
      { loc: `${hostname}/upcoming`, priority: "0.9", changefreq: "hourly", lastmod },
      { loc: `${hostname}/results`, priority: "0.8", changefreq: "hourly", lastmod },
      { loc: `${hostname}/news`, priority: "0.8", changefreq: "daily", lastmod },
      { loc: `${hostname}/trending`, priority: "0.8", changefreq: "hourly", lastmod },
      { loc: `${hostname}/leagues`, priority: "0.7", changefreq: "daily", lastmod },
      { loc: `${hostname}/teams`, priority: "0.7", changefreq: "daily", lastmod },
      { loc: `${hostname}/players`, priority: "0.7", changefreq: "daily", lastmod },
      { loc: `${hostname}/standings`, priority: "0.7", changefreq: "hourly", lastmod },
      { loc: `${hostname}/sport`, priority: "0.7", changefreq: "hourly", lastmod },
      { loc: `${hostname}/blog_hub`, priority: "0.7", changefreq: "daily", lastmod },
      { loc: `${hostname}/info`, priority: "0.4", changefreq: "monthly", lastmod },
      { loc: `${hostname}/ipl`, priority: "0.8", changefreq: "hourly", lastmod },
      ...CORE_SPORTS.flatMap((sport) => [
        { loc: `${hostname}/live?s=${sport}`, priority: "0.7", changefreq: "always", lastmod },
        { loc: `${hostname}/upcoming?s=${sport}`, priority: "0.7", changefreq: "hourly", lastmod },
        { loc: `${hostname}/results?s=${sport}`, priority: "0.6", changefreq: "hourly", lastmod },
        { loc: `${hostname}/standings?s=${sport}`, priority: "0.6", changefreq: "hourly", lastmod }
      ])
    ];

    const dynamicMatchUrls = [
      ...((liveData.matches || []).slice(0, 80).map((match) => ({
        loc: `${hostname}${buildMatchRoutePath({
          id: match.id,
          sport: match.sport,
          league: match.leagueSlug,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam
        }, "match")}`,
        priority: "0.8",
        changefreq: "always",
        lastmod
      }))),
      ...((resultsData.matches || []).slice(0, 80).map((match) => ({
        loc: `${hostname}${buildMatchRoutePath({
          id: match.id,
          sport: match.sport,
          league: match.leagueSlug,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam
        }, "match")}`,
        priority: "0.7",
        changefreq: "daily",
        lastmod: getEntryDate(match.date || match.startTime)
      }))),
      ...((upcomingData.matches || []).slice(0, 80).map((match) => ({
        loc: `${hostname}${buildMatchRoutePath({
          id: match.id,
          sport: match.sport,
          league: match.leagueSlug,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam
        }, "upcoming-match")}`,
        priority: "0.7",
        changefreq: "hourly",
        lastmod
      })))
    ];

    const blogUrls = (blogData.posts || [])
      .filter((post) => post?.slug)
      .slice(0, 40)
      .map((post) => ({
        loc: `${hostname}${buildBlogArticlePath(post)}`,
        priority: "0.6",
        changefreq: "weekly",
        lastmod: getEntryDate(post.published)
      }));

    const urlStore = dedupeUrls([...staticUrls, ...dynamicMatchUrls, ...blogUrls]);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlStore
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${escapeXml(entry.lastmod || lastmod)}</lastmod>
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
