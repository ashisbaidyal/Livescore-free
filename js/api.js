import { 
  ESPN_BASE, 
  SPORTSDB_BASE, 
  CRICBUZZ_LIVE_URL, 
  NHL_LIVE_URL, 
  MLB_LIVE_URL, 
  REFRESH_INTERVAL_MS, 
  LEAGUES, 
  TOP_LEAGUE_KEYS, 
  SPORT_GROUPS, 
  LEAGUE_VISUAL_MATCHERS, 
  LEAGUE_REGIONS, 
  SPORTSDB_SPORTS, 
  PROXIED_DATA_HOSTS 
} from "./constants.js";
import { state } from "./state.js";
import { 
  slugify, 
  formatDateTime 
} from "./utils.js";
import { 
  upsertHistory, 
  saveHistory 
} from "./storage.js";
import { 
  routeForMatch 
} from "./routing.js";

const requestCache = new Map();

export function parseStatus(typeName) {
  const raw = String(typeName || "").toLowerCase();
  if (raw === "in" || raw === "live" || raw === "mid" || raw.includes("halftime") || raw.includes("quarter") || raw.includes("period")) {
    return "live";
  }
  if (
    raw === "post" || 
    raw === "final" || 
    raw === "finished" || 
    raw === "ft" || 
    raw.includes("ft") || 
    raw.includes("final") || 
    raw === "complete" || 
    raw === "completed"
  ) {
    return "final";
  }
  return "upcoming";
}

export function toneClassForMatchStatus(status = "") {
  if (status === "live") return "tone-live";
  if (status === "final") return "tone-final";
  return "tone-upcoming";
}

export function statusBadge(match) {
  if (match.status === "live") {
    return `<span class="badge badge-live"><span class="badge-dot"></span>${escapeHtml(match.statusDetail || "LIVE")}</span>`;
  }
  if (match.status === "final") {
    return `<span class="badge badge-final">FINAL</span>`;
  }
  return `<span class="badge badge-upcoming">${escapeHtml(match.statusDetail || "UPCOMING")}</span>`;
}

// Internal helper for statusBadge
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getStatusText(match) {
  if (match.status === "final") {
    return "Final";
  }
  if (match.status === "live") {
    return match.statusDetail || "Live";
  }
  return match.statusDetail || formatDateTime(match.date);
}

export function buildBrowserDataUrl(url) {
  const raw = String(url || "");
  if (!raw) return raw;

  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    if (!isLocal && /^https?:$/i.test(parsed.protocol) && PROXIED_DATA_HOSTS.has(parsed.hostname)) {
      return `/api/proxy?url=${encodeURIComponent(parsed.toString())}`;
    }
  } catch (_error) {
    return raw;
  }

  return raw;
}

export async function cachedJson(url, ttlMs = REFRESH_INTERVAL_MS) {
  const now = Date.now();
  const cached = requestCache.get(url);
  if (cached && now - cached.time < ttlMs) {
    return cached.data;
  }
  const requestUrl = buildBrowserDataUrl(url);
  const response = await fetch(requestUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${requestUrl}`);
  }
  const data = await response.json();
  requestCache.set(url, { time: now, data });
  return data;
}

export function scoreSportsDbLeagueCandidate(candidate, matcher = {}, fallbackLabel = "") {
  const candidateNames = [
    candidate?.strLeague,
    candidate?.strLeagueAlternate,
    candidate?.strLeague2
  ].map((value) => slugify(value)).filter(Boolean);
  const matchNames = [...(matcher.names || []), fallbackLabel]
    .map((value) => slugify(value))
    .filter(Boolean);
  const candidateSport = String(candidate?.strSport || "").trim().toLowerCase();
  const matchSports = (matcher.sportNames || [])
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  let score = 0;
  if (matchSports.length && matchSports.includes(candidateSport)) {
    score += 12;
  }

  for (const name of matchNames) {
    if (!name) continue;
    if (candidateNames.includes(name)) {
      score += 24;
      continue;
    }
    if (candidateNames.some((candidateName) => candidateName.includes(name) || name.includes(candidateName))) {
      score += 14;
    }
  }

  if (candidate?.strCountry && matcher.region && slugify(candidate.strCountry) === slugify(matcher.region)) {
    score += 3;
  }

  return score;
}

function normalizeRemoteImageUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;
  return "";
}

export function pickLeagueVisualImage(detail) {
  return normalizeRemoteImageUrl(
    detail?.strBanner ||
      detail?.strFanart1 ||
      detail?.strFanart2 ||
      detail?.strFanart3 ||
      detail?.strFanart4 ||
      detail?.strPoster ||
      detail?.strBadge ||
      detail?.strLogo ||
      ""
  );
}

export function pickLeagueVisualIcon(detail) {
  return normalizeRemoteImageUrl(detail?.strBadge || detail?.strLogo || detail?.strPoster || "");
}

export async function fetchLeagueVisualsSnapshot() {
  const leagueDirectory = await cachedJson(`${SPORTSDB_BASE}/all_leagues.php`, 1000 * 60 * 60 * 12);
  const availableLeagues = Array.isArray(leagueDirectory?.leagues)
    ? leagueDirectory.leagues
    : Array.isArray(leagueDirectory?.countries)
      ? leagueDirectory.countries
      : [];

  if (!availableLeagues.length) return {};

  const visuals = {};

  await Promise.all(
    Object.entries(LEAGUES).map(async ([leagueKey, leagueConfig]) => {
      const matcher = LEAGUE_VISUAL_MATCHERS[leagueKey] || {};
      const best = availableLeagues
        .map((candidate) => ({
          candidate,
          score: scoreSportsDbLeagueCandidate(candidate, {
            ...matcher,
            region: LEAGUE_REGIONS[leagueKey] || ""
          }, leagueConfig.label || leagueKey)
        }))
        .sort((left, right) => right.score - left.score)[0];

      if (!best || best.score < 18 || !best.candidate?.idLeague) return;

      try {
        const details = await cachedJson(`${SPORTSDB_BASE}/lookupleague.php?id=${encodeURIComponent(best.candidate.idLeague)}`, 1000 * 60 * 60 * 12);
        const detail = Array.isArray(details?.leagues) ? details.leagues[0] : Array.isArray(details?.countries) ? details.countries[0] : null;
        const imagePath = pickLeagueVisualImage(detail);
        if (!imagePath) return;
        visuals[leagueKey] = {
          imagePath,
          iconPath: pickLeagueVisualIcon(detail),
          fit: "cover",
          position: "center"
        };
      } catch (_error) {
        // ignore
      }
    })
  );

  return visuals;
}

export function buildMatchFromEvent(event, leagueKey, leagueConfig, seenSlugs) {
  const comp = event.competitions?.[0] || {};
  const competitors = comp.competitors || [];
  const home = competitors.find((item) => item.homeAway === "home") || competitors[0] || {};
  const away = competitors.find((item) => item.homeAway === "away") || competitors[1] || {};

  const homeName = home.team?.displayName || home.team?.name || "Home";
  const awayName = away.team?.displayName || away.team?.name || "Away";
  const baseSlug = `${slugify(homeName)}-vs-${slugify(awayName)}` || `match-${event.id}`;

  const count = seenSlugs.get(baseSlug) || 0;
  seenSlugs.set(baseSlug, count + 1);
  const slug = count > 0 ? `${baseSlug}-${String(event.id).slice(-4)}` : baseSlug;

  const status = parseStatus(event.status?.type?.name || comp.status?.type?.name);
  const statusDetail =
    event.status?.type?.shortDetail ||
    event.status?.type?.description ||
    comp.status?.type?.shortDetail ||
    "";

  const startMs = new Date(event.date || Date.now()).getTime();
  const hoursDistance = Math.abs((Date.now() - startMs) / 3600000);
  const leagueWeight = TOP_LEAGUE_KEYS.includes(leagueKey) ? 22 : 8;
  const statusWeight = status === "live" ? 100 : status === "upcoming" ? 52 : 30;
  const trendingScore = Math.round(statusWeight + leagueWeight + Math.max(0, 36 - hoursDistance));

  return {
    id: String(event.id),
    leagueKey,
    leagueLabel: leagueConfig.label,
    feedPath: leagueConfig.feed,
    sportGroup: leagueConfig.sportGroup,
    sportLabel: SPORT_GROUPS[leagueConfig.sportGroup]?.label || leagueConfig.sportGroup,
    status,
    statusDetail,
    date: event.date,
    homeName,
    awayName,
    homeTeamId: String(home.team?.id || ""),
    awayTeamId: String(away.team?.id || ""),
    homeAbbr: home.team?.abbreviation || homeName.slice(0, 3).toUpperCase(),
    awayAbbr: away.team?.abbreviation || awayName.slice(0, 3).toUpperCase(),
    homeLogo: home.team?.logo || "",
    awayLogo: away.team?.logo || "",
    homeScore: home.score ?? "-",
    awayScore: away.score ?? "-",
    venue: comp.venue?.fullName || "Venue TBC",
    note: comp.notes?.[0]?.headline || "",
    slug,
    trendingScore,
    route: "",
    source: event.source || "espn",
    sourceId: String(event.id || "")
  };
}

export function cricbuzzToIso(value) {
  if (!value) return new Date().toISOString();
  const numeric = Number(value);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
    const ms = numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
    const parsed = new Date(ms);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  const parsed = new Date(String(value));
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return new Date().toISOString();
}

export function parseCricbuzzStatus(statusText = "") {
  const token = String(statusText || "").toLowerCase();
  if (
    token.includes("live") ||
    token.includes("in progress") ||
    token.includes("innings") ||
    token.includes("stumps") ||
    token.includes("break") ||
    token.includes("day")
  ) {
    return { status: "IN_PROGRESS", detail: statusText || "Live" };
  }
  if (
    token.includes("completed") ||
    token.includes("won") ||
    token.includes("final") ||
    token.includes("abandon") ||
    token.includes("no result") ||
    token.includes("tie")
  ) {
    return { status: "FINAL", detail: statusText || "Final" };
  }
  return { status: "SCHEDULED", detail: statusText || "Scheduled" };
}

export function pickCricbuzzTeamName(team) {
  return team?.name || team?.team_name || team?.teamName || team?.s_name || team?.short_name || team?.shortName || team?.team || "";
}

export function pickCricbuzzTeamAbbr(team, fallbackName = "") {
  return team?.s_name || team?.short_name || team?.shortName || team?.abbreviation || team?.abbr || fallbackName.slice(0, 3).toUpperCase();
}

export function formatCricbuzzScore(score) {
  if (score === null || score === undefined) return "-";
  if (typeof score === "string" || typeof score === "number") return String(score).trim() || "-";
  const runs = score.score ?? score.runs ?? score.run ?? score.r;
  const wickets = score.wickets ?? score.wkt ?? score.w;
  const overs = score.overs ?? score.ovr ?? score.o;
  let text = "";
  if (runs !== null && runs !== undefined) text = String(runs);
  if (wickets !== null && wickets !== undefined && text) text += `/${wickets}`;
  if (overs !== null && overs !== undefined && text) text += ` (${overs})`;
  return text || "-";
}

export function buildCricbuzzEvents(payload = {}) {
  if (Array.isArray(payload?.events)) return payload.events;
  const list = Array.isArray(payload?.matches) ? payload.matches : [];
  if (!list.length) return [];

  return list
    .map((item) => {
      const match = item?.match || item;
      const team1 = item?.team1 || match?.team1 || (Array.isArray(match?.team) ? match.team[0] : null) || {};
      const team2 = item?.team2 || match?.team2 || (Array.isArray(match?.team) ? match.team[1] : null) || {};
      const homeName = pickCricbuzzTeamName(team1) || "Home";
      const awayName = pickCricbuzzTeamName(team2) || "Away";
      const statusText = match?.status || match?.state || match?.status_detail || match?.match_status || "";
      const statusInfo = parseCricbuzzStatus(statusText);
      const startTime = match?.start_time || match?.startTime || match?.start_time_ms || match?.start_date || match?.start;
      const leagueLabel = match?.series_name || match?.series || match?.series_name_short || match?.tour || "Cricket";

      const scoreBlock = item?.score || match?.score || match?.scores || {};
      const homeScore = formatCricbuzzScore(scoreBlock?.team1 || scoreBlock?.team1Score || scoreBlock?.home || team1?.score);
      const awayScore = formatCricbuzzScore(scoreBlock?.team2 || scoreBlock?.team2Score || scoreBlock?.away || team2?.score);

      return {
        id: `cb-${String(match?.id || match?.matchId || match?.match_id || Date.now())}`,
        date: cricbuzzToIso(startTime),
        status: {
          type: {
            name: statusInfo.status,
            shortDetail: statusInfo.detail,
            description: statusInfo.detail
          }
        },
        name: leagueLabel,
        competitions: [
          {
            competitors: [
              {
                homeAway: "home",
                team: {
                  displayName: homeName,
                  abbreviation: pickCricbuzzTeamAbbr(team1, homeName),
                  logo: team1?.logo || team1?.image || ""
                },
                score: homeScore
              },
              {
                homeAway: "away",
                team: {
                  displayName: awayName,
                  abbreviation: pickCricbuzzTeamAbbr(team2, awayName),
                  logo: team2?.logo || team2?.image || ""
                },
                score: awayScore
              }
            ],
            venue: { fullName: match?.venue || match?.venue_name || match?.location || "Venue TBC" },
            status: {
              type: {
                name: statusInfo.status,
                shortDetail: statusInfo.detail,
                description: statusInfo.detail
              }
            }
          }
        ]
      };
    })
    .filter(Boolean);
}

export function buildNhlEvents(payload = {}) {
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.games)) return payload.games;
  return [];
}

export function buildMlbEvents(payload = {}) {
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.games)) return payload.games;
  return [];
}

export function parseSportsDbStatus(event) {
  const rawStatus = String(event.strStatus || event.strProgress || "").toLowerCase();
  const hasScores = event.intHomeScore !== null && event.intHomeScore !== undefined && event.intAwayScore !== null && event.intAwayScore !== undefined;

  if (rawStatus.includes("live") || rawStatus.includes("in progress")) return "live";
  if (rawStatus.includes("finished") || rawStatus.includes("final") || rawStatus.includes("ft")) return "final";
  if (hasScores) {
    const startMs = new Date(sportsDbDateToIso(event)).getTime();
    if (!Number.isNaN(startMs) && Date.now() - startMs < 4 * 60 * 60 * 1000) return "live";
    return "final";
  }
  return "upcoming";
}

export function sportsDbDateToIso(event) {
  const datePart = event.dateEvent || event.dateEventLocal;
  const timePart = event.strTime || event.strTimeLocal || "00:00:00";
  if (!datePart) return new Date().toISOString();
  const withZone = `${datePart}T${timePart}`.includes("Z") ? `${datePart}T${timePart}` : `${datePart}T${timePart}Z`;
  const parsed = new Date(withZone);
  if (Number.isNaN(parsed.getTime())) return new Date(`${datePart}T00:00:00Z`).toISOString();
  return parsed.toISOString();
}

export function buildMatchFromSportsDbEvent(event, sportGroup, seenSlugs) {
  const homeName = event.strHomeTeam || "Home";
  const awayName = event.strAwayTeam || "Away";
  const baseSlug = `${slugify(homeName)}-vs-${slugify(awayName)}` || `sportsdb-${event.idEvent || Date.now()}`;
  const count = seenSlugs.get(baseSlug) || 0;
  seenSlugs.set(baseSlug, count + 1);
  const slug = count > 0 ? `${baseSlug}-${String(event.idEvent || "").slice(-4)}` : baseSlug;

  const status = parseSportsDbStatus(event);
  const statusDetail = event.strStatus || (status === "live" ? "Live" : status === "final" ? "Final" : "Scheduled");
  const dateIso = sportsDbDateToIso(event);
  const statusWeight = status === "live" ? 95 : status === "upcoming" ? 45 : 22;

  return {
    id: `sdb-${String(event.idEvent || slug)}`,
    leagueKey: `sportsdb-${sportGroup}`,
    leagueLabel: event.strLeague || SPORT_GROUPS[sportGroup]?.label || "Sports",
    feedPath: "",
    sportGroup,
    sportLabel: SPORT_GROUPS[sportGroup]?.label || sportGroup,
    status,
    statusDetail,
    date: dateIso,
    homeName,
    awayName,
    homeTeamId: "",
    awayTeamId: "",
    homeAbbr: (event.strHomeTeamShort || homeName.slice(0, 3)).toUpperCase(),
    awayAbbr: (event.strAwayTeamShort || awayName.slice(0, 3)).toUpperCase(),
    homeLogo: "",
    awayLogo: "",
    homeScore: event.intHomeScore ?? "-",
    awayScore: event.intAwayScore ?? "-",
    venue: event.strVenue || "Venue TBC",
    note: event.strProgress || "",
    slug,
    trendingScore: Math.round(statusWeight + Math.max(0, 24 - Math.abs((Date.now() - new Date(dateIso).getTime()) / 3600000))),
    route: "",
    source: "sportsdb",
    sourceId: String(event.idEvent || "")
  };
}

export function dedupeMatchKey(match) {
  const day = String(match.date || "").slice(0, 10);
  return `${match.sportGroup}|${slugify(match.homeName)}|${slugify(match.awayName)}|${day}`;
}

export function syncMatchRealtimeState(match, updates = {}) {
  if (!match || !updates || typeof updates !== "object") return;
  
  const apply = (target) => {
    if (!target) return;
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === null || value === "") continue;
      target[key] = value;
    }
  };

  apply(match);
  
  const matchKeys = [`${match.sportGroup}:${match.slug}`, `${match.leagueKey}:${match.id}`, match.slug].filter(Boolean);
  for (const key of matchKeys) apply(state.matchIndex.get(key));

  const syncLists = [state.matches, state.liveMatches, state.finalMatches, state.upcomingMatches, state.history];
  for (const list of syncLists) {
    const target = Array.isArray(list) ? list.find((item) => item && item.slug === match.slug && item.sportGroup === match.sportGroup) : null;
    apply(target);
  }

  // --- Kinetic DOM Updates ---
  if (typeof document !== "undefined") {
    const matchId = `match-${match.sportGroup}-${match.slug}`;
    const homeEl = document.getElementById(`${matchId}-home-score`);
    const awayEl = document.getElementById(`${matchId}-away-score`);
    const statusEl = document.getElementById(`${matchId}-status`);
    const metaEl = document.getElementById(`${matchId}-meta`);

    if (homeEl && updates.homeScore !== undefined) homeEl.textContent = updates.homeScore;
    if (awayEl && updates.awayScore !== undefined) awayEl.textContent = updates.awayScore;
    if (statusEl && (updates.status !== undefined || updates.statusDetail !== undefined)) {
      // Re-render only the badge part if we have the full match object updated
      import("./ui-matches.js").then(m => {
        if (statusEl) statusEl.innerHTML = m.statusBadge(match);
      });
    }
  }
}

export function rebuildMatches() {
  const seenSlugs = new Map();
  const nextMatches = [];
  const dedupeMap = new Map();
  const statusRank = { live: 3, final: 2, upcoming: 1 };

  const addMatch = (match) => {
    match.route = routeForMatch(match);
    const key = dedupeMatchKey(match);
    if (!dedupeMap.has(key)) {
      dedupeMap.set(key, nextMatches.length);
      nextMatches.push(match);
      return;
    }
    const existingIndex = dedupeMap.get(key);
    const existing = nextMatches[existingIndex];
    if ((statusRank[match.status] || 0) > (statusRank[existing.status] || 0)) {
      nextMatches[existingIndex] = match;
    }
  };

  for (const [leagueKey, leagueConfig] of Object.entries(LEAGUES)) {
    const events = state.eventsByLeague[leagueKey] || [];
    for (const event of events) {
      const match = buildMatchFromEvent(event, leagueKey, leagueConfig, seenSlugs);
      addMatch(match);
    }
  }

  for (const item of state.externalEvents) {
    const match = buildMatchFromSportsDbEvent(item.event, item.sportGroup, seenSlugs);
    addMatch(match);
  }

  nextMatches.sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

  const nextIndex = new Map();
  for (const match of nextMatches) {
    nextIndex.set(`${match.sportGroup}:${match.slug}`, match);
    nextIndex.set(`${match.leagueKey}:${match.id}`, match);
    if (!nextIndex.has(match.slug)) nextIndex.set(match.slug, match);
    if (match.status === "final") upsertHistory(match);
  }

  state.matches = nextMatches;
  state.liveMatches = nextMatches.filter((match) => match.status === "live");
  state.upcomingMatches = nextMatches.filter((match) => match.status === "upcoming" && new Date(match.date).getTime() > Date.now() - 1000 * 60 * 60 * 2);
  state.finalMatches = nextMatches.filter((match) => match.status === "final");
  state.matchIndex = nextIndex;

  saveHistory();
}

export async function refreshData({ silent = false } = {}) {
  if (state.refreshPromise) {
    return state.refreshPromise;
  }

  state.refreshPromise = (async () => {
    let failed = 0;
    let failedErrors = {};
    const leagueVisualsPromise = fetchLeagueVisualsSnapshot().catch(() => state.leagueVisuals || {});

    const nextEvents = {};
    const espnTasks = Object.entries(LEAGUES).map(async ([leagueKey, leagueConfig]) => {
      try {
        const data = await cachedJson(`${ESPN_BASE}/${leagueConfig.feed}/scoreboard`, 12000);
        nextEvents[leagueKey] = data.events || [];
      } catch (error) {
        failed += 1;
        failedErrors[leagueKey] = error.message;
        if (!silent) {
          console.error(`[API] ESPN fetch failed for ${leagueKey}:`, error.message);
        }
        nextEvents[leagueKey] = state.eventsByLeague[leagueKey] || [];
      }
    });

    await Promise.all(espnTasks);

    try {
      const cricketPayload = await cachedJson(CRICBUZZ_LIVE_URL, 10000);
      const cricketEvents = buildCricbuzzEvents(cricketPayload);
      if (cricketEvents.length) {
        nextEvents.cricket = [...(nextEvents.cricket || []), ...cricketEvents];
      }
    } catch (error) {
      if (!silent) {
        console.warn('[API] Cricbuzz fetch failed:', error.message);
      }
    }

    await Promise.all([
      (async () => {
        if (!Array.isArray(nextEvents.nhl) || nextEvents.nhl.length === 0) {
          try {
            const nhlPayload = await cachedJson(NHL_LIVE_URL, 10000);
            const nhlEvents = buildNhlEvents(nhlPayload);
            if (nhlEvents.length) {
              nextEvents.nhl = nhlEvents;
            }
          } catch (error) {
            if (!silent) {
              console.warn('[API] NHL fetch failed:', error.message);
            }
          }
        }
      })(),
      (async () => {
        if (!Array.isArray(nextEvents.mlb) || nextEvents.mlb.length === 0) {
          try {
            const mlbPayload = await cachedJson(MLB_LIVE_URL, 10000);
            const mlbEvents = buildMlbEvents(mlbPayload);
            if (mlbEvents.length) {
              nextEvents.mlb = mlbEvents;
            }
          } catch (error) {
            if (!silent) {
              console.warn('[API] MLB fetch failed:', error.message);
            }
          }
        }
      })()
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const externalEvents = [];
    let sportsDbFailures = 0;

    // Optimized: Use backend /api/sportsdb endpoint that batches all sports
    // This respects SportsDB free tier rate limits (30 req/min) better than individual calls
    // Cache for 1 hour since this is less time-critical than live ESPN data
    try {
      const sportsdbUrl = `/api/sportsdb?action=events-by-sport&date=${today}`;
      const sportsdbResult = await cachedJson(sportsdbUrl, 3600000); // 1 hour cache
      
      if (sportsdbResult?.success && sportsdbResult?.data) {
        // Map SportsDB results back to our internal format
        for (const [sportGroup, sportData] of Object.entries(sportsdbResult.data)) {
          if (Array.isArray(sportData?.events)) {
            for (const event of sportData.events) {
              externalEvents.push({ sportGroup, event });
            }
          }
        }
      }
      
      // Count partial failures (some sports failed but not all)
      if (sportsdbResult?.errorCount > 0) {
        sportsDbFailures = Math.min(sportsdbResult.errorCount, Object.keys(SPORTSDB_SPORTS).length);
      }
    } catch (error) {
      sportsDbFailures = Object.keys(SPORTSDB_SPORTS).length;
      if (!silent) {
        console.warn(`[API] SportsDB batch fetch failed:`, error.message);
      }
    }

    const nextLeagueVisuals = await leagueVisualsPromise;

    state.eventsByLeague = nextEvents;
    state.externalEvents = externalEvents;
    state.leagueVisuals = {
      ...(state.leagueVisuals || {}),
      ...(nextLeagueVisuals || {})
    };

    const espnMatchCount = Object.values(nextEvents).reduce((sum, events) => sum + (Array.isArray(events) ? events.length : 0), 0);
    state.providerStatus.espn = {
      ok: failed === 0,
      matches: espnMatchCount,
      failedLeagues: failed,
      totalLeagues: Object.keys(LEAGUES).length,
      lastFetch: Date.now(),
      lastError: failed > 0 ? `${failed} of ${Object.keys(LEAGUES).length} ESPN feed(s) unavailable` : "",
      message: failed === 0 ? "✅ ESPN data loaded successfully" : `⚠️  ESPN partial failure: ${failed} league(s) unavailable`,
      failureDetails: Object.keys(failedErrors).length > 0 ? failedErrors : null
    };
    state.providerStatus.sportsdb = {
      ok: sportsDbFailures === 0,
      matches: externalEvents.length,
      failedSports: sportsDbFailures,
      totalSports: Object.keys(SPORTSDB_SPORTS).length,
      lastFetch: Date.now(),
      lastError: sportsDbFailures > 0 ? `${sportsDbFailures} of ${Object.keys(SPORTSDB_SPORTS).length} SportsDB request(s) failed` : "",
      message: sportsDbFailures === 0 ? "✅ SportsDB data loaded successfully" : `⚠️  SportsDB partial failure: ${sportsDbFailures} sport(s) unavailable`
    };

    state.lastUpdatedAt = Date.now();
    state.nextRefreshAt = Date.now() + REFRESH_INTERVAL_MS;
    rebuildMatches();
    
    if (!silent) {
      console.log(
        `[API] ✅ Data refresh complete: ${state.matches.length} total matches ` +
        `(${state.liveMatches.length} live, ${state.upcomingMatches.length} upcoming, ${state.finalMatches.length} final)`
      );
      console.log('[API] Provider Status:', {
        espn: state.providerStatus.espn.message,
        sportsdb: state.providerStatus.sportsdb.message
      });
    }
  })()
    .finally(() => {
      state.refreshPromise = null;
    });

  return state.refreshPromise;
}

export function extractMatchStatPairs(match, summary, sportsDbBundle) {
  const pairs = [];
  if (sportsDbBundle?.stats) {
    for (const stat of sportsDbBundle.stats) {
      pairs.push({
        label: stat.strStat,
        homeValue: stat.intHome,
        awayValue: stat.intAway
      });
    }
  } else if (summary?.statistics) {
    const stats = summary.statistics || [];
    for (const stat of stats) {
      pairs.push({
        label: stat.label,
        homeValue: stat.displayValue,
        awayValue: stat.displayValue
      });
    }
  }
  return pairs;
}

export function buildHeroMetrics(statPairs) {
  return statPairs.slice(0, 4);
}

export async function resolveStandings(match, sportsDbEvent) {
  if (sportsDbEvent?.idLeague) {
    try {
      const data = await cachedJson(`${SPORTSDB_BASE}/lookuptable.php?l=${sportsDbEvent.idLeague}&s=${new Date().getFullYear()}`, 1000 * 60 * 60);
      return data?.table || [];
    } catch (_error) {
      return [];
    }
  }
  return [];
}

export function buildMatchInfoItems(match, summary, sportsDbEvent) {
  const items = [];
  if (match.venue) items.push({ label: "Venue", value: match.venue });
  if (match.date) items.push({ label: "Kickoff", value: formatDateTime(match.date) });
  if (match.leagueLabel) items.push({ label: "League", value: match.leagueLabel });
  if (sportsDbEvent?.strTimestamp) items.push({ label: "Timestamp", value: sportsDbEvent.strTimestamp });
  return items;
}

export function buildHeadToHeadMatches(match) {
  const home = slugify(match.homeName);
  const away = slugify(match.awayName);
  return state.history.filter((item) => {
    const h = slugify(item.homeName);
    const a = slugify(item.awayName);
    return (h === home && a === away) || (h === away && a === home);
  });
}

export function buildTeamForm(teamName, sportGroup) {
  const name = slugify(teamName);
  return state.history
    .filter((item) => slugify(item.homeName) === name || slugify(item.awayName) === name)
    .slice(0, 5)
    .map((item) => {
      const isHome = slugify(item.homeName) === name;
      const teamScore = isHome ? parseInt(item.homeScore) : parseInt(item.awayScore);
      const oppScore = isHome ? parseInt(item.awayScore) : parseInt(item.homeScore);
      if (teamScore > oppScore) return "W";
      if (teamScore < oppScore) return "L";
      return "D";
    });
}

export function buildWinProbabilities(match, statPairs, homeScore, awayScore) {
  // Simple heuristic for win probabilities
  let home = 33;
  let away = 33;
  let draw = 34;

  const hScore = parseInt(homeScore) || 0;
  const aScore = parseInt(awayScore) || 0;

  if (hScore > aScore) {
    home += 20;
    draw -= 10;
    away -= 10;
  } else if (aScore > hScore) {
    away += 20;
    draw -= 10;
    home -= 10;
  }

  return { home, away, draw };
}

export function flattenEspnRosterAthletes(data) {
  const athletes = [];
  const groups = data?.athletes || [];
  for (const group of groups) {
    const items = group.items || [];
    for (const item of items) {
      athletes.push(item);
    }
  }
  return athletes;
}




