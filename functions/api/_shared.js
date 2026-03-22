export const FALLBACK_LOGO = "/icons/icon-192.png";
export const FALLBACK_HERO = "/icons/hero-fallback.svg";

export const SPORT_LEAGUES = {
  soccer: [
    "eng.1",
    "esp.1",
    "ger.1",
    "ita.1",
    "fra.1",
    "uefa.champions",
    "uefa.europa",
    "uefa.europa.conf",
    "usa.1",
    "mex.1",
    "ned.1",
    "ksa.1",
    "jpn.1"
  ],
  football: ["nfl", "college-football", "cfl", "ufl"],
  basketball: ["nba", "wnba", "mens-college-basketball", "womens-college-basketball", "euroleague", "nbl"],
  baseball: ["mlb", "college-baseball"],
  hockey: ["nhl", "mens-college-hockey"],
  cricket: ["8039", "8040", "8048", "19430", "ipl"],
  tennis: ["atp", "wta"],
  mma: ["ufc", "pfl", "bellator"],
  racing: ["f1", "nascar-premier", "irl", "motogp"],
  golf: ["pga", "lpga"],
  rugby: ["271937", "267979"],
  "rugby-league": ["3"]
};

export const SPORT_ALIASES = {
  "american-football": "football",
  footbal: "football",
  futbol: "soccer",
  footballs: "soccer",
  soccer: "soccer",
  cricket: "cricket",
  basketball: "basketball",
  baseball: "baseball",
  hockey: "hockey",
  tennis: "tennis",
  mma: "mma",
  racing: "racing",
  golf: "golf",
  rugby: "rugby",
  "rugby-league": "rugby-league"
};

export const LEAGUE_ALIASES = {
  mls: "usa.1",
  "saudi-pro-league": "ksa.1",
  "j-league": "jpn.1",
  "liga-mx": "mex.1",
  eredivisie: "ned.1",
  "premier-league": "eng.1",
  epl: "eng.1",
  laliga: "esp.1",
  "la-liga": "esp.1",
  bundesliga: "ger.1",
  "serie-a": "ita.1",
  "ligue-1": "fra.1",
  ucl: "uefa.champions",
  "champions-league": "uefa.champions",
  "europa-league": "uefa.europa",
  "conference-league": "uefa.europa.conf",
  "world-cup": "fifa.world",
  "icc-world-cup": "8039",
  "saudi-pro": "ksa.1",
  nfl: "nfl",
  nba: "nba",
  nhl: "nhl",
  mlb: "mlb",
  atp: "atp",
  wta: "wta",
  ufc: "ufc",
  f1: "f1"
};

export function normalizeSportParam(inputSport = "all", inputLeague = "") {
  const sport = String(inputSport || "all").trim().toLowerCase();
  const league = normalizeLeagueParam(inputLeague);

  if (sport === "all") return "all";
  if (SPORT_ALIASES[sport]) return SPORT_ALIASES[sport];

  if (sport === "football") {
    if (league && SPORT_LEAGUES.football.includes(league)) return "football";
    return "football";
  }

  return sport;
}

export function normalizeLeagueParam(inputLeague = "", fallbackSport = "") {
  const league = String(inputLeague || "").trim().toLowerCase();
  if (!league) {
    return fallbackSport ? getDefaultLeague(fallbackSport) : "";
  }

  return LEAGUE_ALIASES[league] || league;
}

export function getDefaultLeague(sport = "soccer") {
  const normalizedSport = normalizeSportParam(sport);
  return SPORT_LEAGUES[normalizedSport]?.[0] || "eng.1";
}

export function getTargetSports(sportParam = "all", leagueParam = "") {
  const normalizedSport = normalizeSportParam(sportParam, leagueParam);
  if (normalizedSport === "all") {
    return ["soccer", "basketball", "football", "hockey", "baseball", "cricket", "tennis", "mma", "racing"];
  }
  return [normalizedSport];
}

export function siteApiUrl(sport, league, resource, query = {}) {
  const url = new URL(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/${resource}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

export function coreApiUrl(sport, league, resource, query = {}) {
  const url = new URL(`https://sports.core.api.espn.com/v2/sports/${sport}/leagues/${league}/${resource}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

export async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} for ${url}`);
  }
  return response.json();
}

export function jsonResponse(payload, cacheSeconds = 30, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export function dedupeById(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item?.id || item?.uid || JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mapStatus(state = "pre") {
  if (state === "in") return "live";
  if (state === "post") return "finished";
  return "upcoming";
}

export function parseDateRange(daysAhead = 7) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i <= daysAhead; i += 1) {
    const next = new Date(now);
    next.setDate(now.getDate() + i);
    dates.push(
      `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, "0")}${String(next.getDate()).padStart(2, "0")}`
    );
  }
  return dates;
}

export function extractLeagueName(scoreboard = {}, fallbackLeague = "") {
  return scoreboard.leagues?.[0]?.name || fallbackLeague || "Sports Event";
}

export function normalizeArticle(article = {}) {
  return {
    id: article.id || article.story || article.headline,
    headline: article.headline || "Untitled story",
    description: article.description || article.story || "",
    published: article.published || article.lastModified || "",
    byline: article.byline || article.source || "",
    images: article.images || [],
    categories: article.categories || [],
    links: article.links || {}
  };
}

export function normalizeScoreboardEvent(event = {}, sport, leagueSlug, leagueName = "") {
  const competition = event.competitions?.[0] || {};
  const competitors = competition.competitors || [];
  const home = competitors.find((entry) => entry.homeAway === "home") || {};
  const away = competitors.find((entry) => entry.homeAway === "away") || {};
  const statusType = event.status?.type || competition.status?.type || {};
  const venue = competition.venue || {};
  const broadcasts = competition.broadcasts || [];
  const homeLeader = home.leaders?.[0]?.leaders?.[0];
  const awayLeader = away.leaders?.[0]?.leaders?.[0];

  return {
    id: event.id,
    uid: event.uid || "",
    date: event.date || competition.date || "",
    name: event.name || event.shortName || "Match",
    shortName: event.shortName || event.name || "Match",
    sport,
    leagueSlug,
    leagueSearchValue: leagueSlug,
    league: leagueName || extractLeagueName({ leagues: [{ name: leagueName }] }, leagueName),
    status: mapStatus(statusType.state),
    statusText: statusType.detail || statusType.description || statusType.shortDetail || "",
    time: statusType.shortDetail || statusType.detail || "",
    period: event.status?.period || competition.status?.period || null,
    displayClock: event.status?.displayClock || "",
    venue: venue.fullName || "",
    venueCity: venue.address?.city || "",
    broadcast: broadcasts.map((entry) => entry.media?.shortName || entry.names?.join(", ")).filter(Boolean).join(", "),
    highlightUrl: event.links?.find((entry) => ["Highlights", "Recap"].includes(entry.shortText))?.href || "",
    homeTeam: {
      id: home.team?.id || "",
      name: home.team?.shortDisplayName || home.team?.displayName || home.team?.name || "Home",
      fullName: home.team?.displayName || home.team?.name || "Home",
      abbreviation: home.team?.abbreviation || "",
      logo: home.team?.logo || home.team?.logos?.[0]?.href || FALLBACK_LOGO,
      score: home.score || "0",
      winner: Boolean(home.winner),
      record: home.records?.[0]?.summary || "",
      color: home.team?.color || "",
      leader: homeLeader
        ? {
            name: homeLeader.athlete?.displayName || "",
            value: homeLeader.displayValue || ""
          }
        : null
    },
    awayTeam: {
      id: away.team?.id || "",
      name: away.team?.shortDisplayName || away.team?.displayName || away.team?.name || "Away",
      fullName: away.team?.displayName || away.team?.name || "Away",
      abbreviation: away.team?.abbreviation || "",
      logo: away.team?.logo || away.team?.logos?.[0]?.href || FALLBACK_LOGO,
      score: away.score || "0",
      winner: Boolean(away.winner),
      record: away.records?.[0]?.summary || "",
      color: away.team?.color || "",
      leader: awayLeader
        ? {
            name: awayLeader.athlete?.displayName || "",
            value: awayLeader.displayValue || ""
          }
        : null
    }
  };
}

export function normalizeTeamEntry(entry = {}, sport = "soccer", league = "eng.1") {
  const team = entry.team || entry;
  return {
    id: team.id || "",
    name: team.displayName || team.name || "Team",
    shortName: team.shortDisplayName || team.abbreviation || team.name || "Team",
    abbreviation: team.abbreviation || "",
    slug: team.slug || "",
    location: team.location || "",
    color: team.color || "",
    alternateColor: team.alternateColor || "",
    isActive: team.isActive !== false,
    logo: team.logos?.[0]?.href || team.logo || FALLBACK_LOGO,
    venue: team.venue?.fullName || entry.venue?.fullName || "",
    record: entry.record?.items?.[0]?.summary || entry.record?.summary || team.record || "",
    sport,
    league
  };
}

export function normalizeRosterGroups(data = {}) {
  const groups = data.athletes || [];
  const athletes = [];
  groups.forEach((group) => {
    (group.items || []).forEach((athlete) => {
      athletes.push({
        id: athlete.id || "",
        firstName: athlete.firstName || "",
        lastName: athlete.lastName || "",
        fullName: athlete.displayName || `${athlete.firstName || ""} ${athlete.lastName || ""}`.trim(),
        shortName: athlete.shortName || athlete.displayName || "",
        jersey: athlete.jersey || "",
        age: athlete.age || "",
        displayHeight: athlete.displayHeight || athlete.height || "",
        displayWeight: athlete.displayWeight || athlete.weight || "",
        position: athlete.position || group.position || {},
        status: athlete.status || {},
        headshot: athlete.headshot || { href: FALLBACK_LOGO }
      });
    });
  });
  return athletes;
}

export function normalizeAthlete(detail = {}, fallback = {}) {
  return {
    id: detail.id || fallback.id || "",
    firstName: detail.firstName || fallback.firstName || "",
    lastName: detail.lastName || fallback.lastName || "",
    fullName: detail.displayName || fallback.displayName || fallback.fullName || "Athlete",
    shortName: detail.shortName || fallback.shortName || detail.displayName || "Athlete",
    age: detail.age || fallback.age || "",
    displayHeight: detail.displayHeight || fallback.displayHeight || "",
    displayWeight: detail.displayWeight || fallback.displayWeight || "",
    jersey: detail.jersey || fallback.jersey || "",
    active: detail.active !== false,
    position: detail.position || fallback.position || {},
    experience: detail.experience || fallback.experience || {},
    citizenship: detail.citizenship || fallback.citizenship || "",
    birthPlace: detail.birthPlace || fallback.birthPlace || {},
    status: detail.status || fallback.status || { name: detail.active === false ? "Inactive" : "Active" },
    headshot: detail.headshot || fallback.headshot || { href: FALLBACK_LOGO },
    teamRef: detail.team?.$ref || "",
    teamId: extractTrailingId(detail.team?.$ref || ""),
    sport: fallback.sport || "",
    league: fallback.league || ""
  };
}

export function extractTrailingId(ref = "") {
  const parts = String(ref).split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

export async function resolveTeamFromRef(ref = "") {
  if (!ref) return null;
  try {
    const data = await fetchJson(ref);
    return normalizeTeamEntry({ team: data });
  } catch (error) {
    return null;
  }
}

export function normalizeStandingsEntries(data = {}) {
  return data.standings?.[0]?.entries || data.children?.[0]?.standings?.entries || [];
}
