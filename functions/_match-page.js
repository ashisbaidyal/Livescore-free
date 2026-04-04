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

export function buildMatchRoutePath({ id = "", sport = "", league = "" } = {}, routeBase = "match") {
  const normalized = normalizeMatchContext({ id, sport, league });
  if (!normalized.id) return `/${routeBase}`;
  return `/${routeBase}/${encodeURIComponent(normalized.sport)}/${encodeURIComponent(normalized.league)}/${encodeURIComponent(normalized.id)}`;
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
      id: segments[3]
    });
  }

  return normalizeMatchContext({
    id: url.searchParams.get("id") || "",
    sport: url.searchParams.get("sport") || url.searchParams.get("s") || "",
    league: url.searchParams.get("league") || url.searchParams.get("l") || ""
  });
}

async function fetchPageAsset(request, assetPath) {
  const assetUrl = new URL(assetPath, request.url);
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

class HeadInjector {
  constructor(meta = {}) {
    this.meta = meta;
  }

  element(element) {
    const tags = [
      `<meta name="description" content="${escapeHtml(this.meta.description)}">`,
      `<meta name="robots" content="index,follow,max-image-preview:large">`,
      `<link rel="canonical" href="${escapeHtml(this.meta.canonical)}">`,
      `<meta property="og:title" content="${escapeHtml(this.meta.title)}">`,
      `<meta property="og:description" content="${escapeHtml(this.meta.description)}">`,
      `<meta property="og:type" content="website">`,
      `<meta property="og:url" content="${escapeHtml(this.meta.canonical)}">`,
      `<meta property="og:image" content="${escapeHtml(this.meta.image)}">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${escapeHtml(this.meta.title)}">`,
      `<meta name="twitter:description" content="${escapeHtml(this.meta.description)}">`,
      `<meta name="twitter:image" content="${escapeHtml(this.meta.image)}">`
    ];
    element.append(tags.join(""), { html: true });
  }
}

export async function renderMatchPage(context, {
  routeBase = "match",
  assetPath = "/match.html",
  upcoming = false
} = {}) {
  const { request } = context;
  const url = new URL(request.url);
  const matchRoute = parseMatchRoute(url, routeBase);
  const canonicalPath = buildMatchRoutePath(matchRoute, routeBase);

  if (matchRoute.id && (url.searchParams.get("id") || url.pathname.endsWith(".html"))) {
    return Response.redirect(new URL(canonicalPath, request.url).toString(), 301);
  }

  const response = await fetchPageAsset(request, assetPath);
  if (response.status !== 200 || !matchRoute.id) {
    return response;
  }

  try {
    const matchData = await fetchMatchPayload(request, matchRoute);
    if (!matchData) return response;

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
      .on("head", new HeadInjector({ title, description, canonical, image }))
      .transform(response);
  } catch (error) {
    return response;
  }
}
