import { normalizeLeagueParam, normalizeSportParam } from "./api/_shared.js";

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeMatchContext({ id = "", sport = "", league = "" } = {}) {
  const normalizedLeague = normalizeLeagueParam(league);
  const normalizedSport = normalizeSportParam(sport || "all", normalizedLeague);
  return {
    id: String(id || "").trim(),
    sport: normalizedSport || "all",
    league: normalizedLeague || "all"
  };
}

function slugifyPathSegment(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildMatchSeoSlug({ homeTeam = {}, awayTeam = {} } = {}) {
  const homeSlug = slugifyPathSegment(homeTeam?.fullName || homeTeam?.name || homeTeam?.abbreviation || "");
  const awaySlug = slugifyPathSegment(awayTeam?.fullName || awayTeam?.name || awayTeam?.abbreviation || "");
  if (!homeSlug || !awaySlug) return "";
  return `${homeSlug}-vs-${awaySlug}`;
}

function extractMatchIdFromSegment(segment = "") {
  const decoded = String(segment || "").trim();
  const trailingMatch = decoded.match(/(\d+)$/);
  return trailingMatch?.[1] || decoded;
}

export function buildMatchRoutePath({ id = "", sport = "", league = "", homeTeam = {}, awayTeam = {} } = {}, routeBase = "match") {
  const normalized = normalizeMatchContext({ id, sport, league });
  if (!normalized.id) return `/${routeBase}`;
  const slug = buildMatchSeoSlug({ homeTeam, awayTeam });
  const detailSegment = slug ? `${slug}-${normalized.id}` : normalized.id;
  return `/${routeBase}/${encodeURIComponent(normalized.sport)}/${encodeURIComponent(normalized.league)}/${encodeURIComponent(detailSegment)}`;
}

export function parseMatchRoute(url, routeBase = "match") {
  const segments = url.pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch (error) {
        return segment;
      }
    });

  if (segments[0] === routeBase && segments.length >= 4) {
    return normalizeMatchContext({
      sport: segments[1],
      league: segments[2],
      id: extractMatchIdFromSegment(segments[3])
    });
  }

  return normalizeMatchContext({
    id: url.searchParams.get("id") || "",
    sport: url.searchParams.get("sport") || url.searchParams.get("s") || "",
    league: url.searchParams.get("league") || url.searchParams.get("l") || ""
  });
}

async function fetchPageAsset(context, request, assetPath) {
  const assetUrl = new URL(assetPath, request.url);
  if (context?.env?.ASSETS?.fetch) {
    return context.env.ASSETS.fetch(new Request(assetUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml"
      }
    }));
  }
  return fetch(assetUrl.toString(), {
    headers: {
      Accept: "text/html,application/xhtml+xml"
    }
  });
}

async function fetchMatchPayload(request, { id = "", sport = "", league = "" } = {}) {
  const apiUrl = new URL("/api/match", request.url);
  apiUrl.searchParams.set("id", id);
  if (sport && sport !== "all") apiUrl.searchParams.set("sport", sport);
  if (league && league !== "all") apiUrl.searchParams.set("league", league);

  const apiResponse = await fetch(apiUrl.toString(), {
    headers: {
      Accept: "application/json"
    }
  });

  if (!apiResponse.ok) return null;
  const payload = await apiResponse.json();
  if (!payload || payload.notFound) return null;
  return payload;
}

class TitleRewriter {
  constructor(title) {
    this.title = title;
  }

  element(element) {
    element.setInnerContent(this.title);
  }
}

class AttributeRewriter {
  constructor(attribute, value) {
    this.attribute = attribute;
    this.value = value;
  }

  element(element) {
    element.setAttribute(this.attribute, this.value);
  }
}

function buildNotFoundHtml({ title = "Match not found | LiveScoreFree", canonical = "" } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="robots" content="noindex,follow">
${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : ""}
</head>
<body>
<main>
<h1>Match not found</h1>
<p>This match centre is unavailable or has expired.</p>
<p><a href="/live">View live scores</a> or <a href="/upcoming">upcoming fixtures</a>.</p>
</main>
</body>
</html>`;
}

export async function renderMatchPage(context, {
  routeBase = "match",
  assetPath = "/match.html",
  upcoming = false
} = {}) {
  const { request } = context;
  const url = new URL(request.url);
  const matchRoute = parseMatchRoute(url, routeBase);

  const response = await fetchPageAsset(context, request, assetPath);
  if (response.status !== 200 || !matchRoute.id) {
    return response;
  }

  try {
    const matchData = await fetchMatchPayload(request, matchRoute);
    if (!matchData) {
      return new Response(buildNotFoundHtml({
        title: upcoming ? "Upcoming match not found | LiveScoreFree" : "Match not found | LiveScoreFree",
        canonical: new URL(upcoming ? "/upcoming" : "/live", request.url).toString()
      }), {
        status: 404,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=120",
          "X-Robots-Tag": "noindex, follow"
        }
      });
    }
    const canonicalPath = buildMatchRoutePath({
      id: matchRoute.id,
      sport: matchData.sport || matchRoute.sport,
      league: matchData.leagueSlug || matchRoute.league,
      homeTeam: matchData.homeTeam || {},
      awayTeam: matchData.awayTeam || {}
    }, routeBase);

    if (url.searchParams.get("id") || url.pathname.endsWith(".html") || url.pathname !== canonicalPath) {
      return Response.redirect(new URL(canonicalPath, request.url).toString(), 301);
    }

    const statusLabel = upcoming || matchData.status === "upcoming"
      ? "Upcoming"
      : matchData.status === "finished"
        ? "Result"
        : "Live";
    const title = `${statusLabel}: ${matchData.homeTeam?.name || "Home"} vs ${matchData.awayTeam?.name || "Away"} | LiveScoreFree`;
    const description = upcoming || matchData.status === "upcoming"
      ? `Preview the ${matchData.league || "scheduled"} match between ${matchData.homeTeam?.name || "Home"} and ${matchData.awayTeam?.name || "Away"} with kickoff time, venue, and live updates on LiveScoreFree.`
      : `Follow the ${matchData.league || "live"} match between ${matchData.homeTeam?.name || "Home"} and ${matchData.awayTeam?.name || "Away"} with realtime scores, stats, and play-by-play on LiveScoreFree.`;
    const canonical = new URL(canonicalPath, request.url).toString();
    const image = matchData.homeTeam?.logo || matchData.awayTeam?.logo || `${url.origin}/icons/icon-512.png`;

    return new HTMLRewriter()
      .on("title", new TitleRewriter(title))
      .on('meta[name="description"]', new AttributeRewriter("content", description))
      .on('meta[name="robots"]', new AttributeRewriter("content", "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"))
      .on('link[rel="canonical"]', new AttributeRewriter("href", canonical))
      .on('meta[property="og:title"]', new AttributeRewriter("content", title))
      .on('meta[property="og:description"]', new AttributeRewriter("content", description))
      .on('meta[property="og:type"]', new AttributeRewriter("content", "website"))
      .on('meta[property="og:url"]', new AttributeRewriter("content", canonical))
      .on('meta[property="og:image"]', new AttributeRewriter("content", image))
      .on('meta[name="twitter:card"]', new AttributeRewriter("content", "summary_large_image"))
      .on('meta[name="twitter:title"]', new AttributeRewriter("content", title))
      .on('meta[name="twitter:description"]', new AttributeRewriter("content", description))
      .on('meta[name="twitter:image"]', new AttributeRewriter("content", image))
      .transform(response);
  } catch (error) {
    return response;
  }
}
