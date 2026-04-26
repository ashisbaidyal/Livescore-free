import {
  buildFallbackUrls,
  buildFeedMeta,
  FALLBACK_LOGO,
  fetchJson,
  fetchText,
  IPL_SERIES_ID,
  SPORT_LEAGUES,
  fetchWithFallback,
  getDefaultLeague,
  jsonResponse,
  mapStatus,
  normalizeCricketLinescores,
  normalizeLeagueParam,
  normalizeRosterGroups,
  normalizeScoreboardEvent,
  normalizeSportParam,
  parseDateRange,
  siteApiUrl
} from "./_shared.js";

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

  if (!response.ok) {
    throw new Error(`Internal request failed: ${response.status} for ${path}`);
  }

  return response.json();
}

async function fetchExternalJson(sport, league, resource, query = {}) {
  const response = await fetchWithFallback(buildFallbackUrls(sport, league, resource, query), {}, 5000);
  return response.json();
}

function buildSummaryCandidates(id, sport, league) {
  const normalizedSport = normalizeSportParam(sport, league);
  const normalizedLeague = normalizeLeagueParam(league, normalizedSport);

  const candidates = [];
  const pushCandidate = (candidateSport, candidateLeague) => {
    if (!candidateSport || !candidateLeague) return;
    if (candidates.some((entry) => entry.sport === candidateSport && entry.league === candidateLeague)) return;
    candidates.push({ sport: candidateSport, league: candidateLeague });
  };

  if (normalizedSport === "cricket" && normalizedLeague === "ipl") {
    pushCandidate(normalizedSport, IPL_SERIES_ID);
  }
  pushCandidate(normalizedSport, normalizedLeague);
  (SPORT_LEAGUES[normalizedSport] || []).slice(0, 6).forEach((candidateLeague) => pushCandidate(normalizedSport, candidateLeague));
  pushCandidate("soccer", "eng.1");
  pushCandidate("soccer", "esp.1");
  pushCandidate("basketball", "nba");
  pushCandidate("football", "nfl");

  return candidates.map(({ sport: candidateSport, league: candidateLeague }) =>
    siteApiUrl(candidateSport, candidateLeague, "summary", { event: id })
  );
}

function buildScoreboardCandidates(sport, league) {
  const normalizedSport = normalizeSportParam(sport, league);
  const normalizedLeague = normalizeLeagueParam(league, normalizedSport);
  const candidates = [];
  const dates = parseDateRange(6);
  const pushPair = (candidateSport, candidateLeague) => {
    if (!candidateSport || !candidateLeague) return;
    if (candidates.some((entry) => entry.sport === candidateSport && entry.league === candidateLeague)) return;
    candidates.push({ sport: candidateSport, league: candidateLeague });
  };

  if (normalizedSport === "cricket" && normalizedLeague === "ipl") {
    pushPair(normalizedSport, IPL_SERIES_ID);
  }
  pushPair(normalizedSport, normalizedLeague);
  (SPORT_LEAGUES[normalizedSport] || []).slice(0, 4).forEach((candidateLeague) => pushPair(normalizedSport, candidateLeague));
  pushPair("soccer", "eng.1");
  pushPair("basketball", "nba");
  pushPair("football", "nfl");

  return candidates.flatMap(({ sport: candidateSport, league: candidateLeague }) =>
    dates.map((date) => ({ sport: candidateSport, league: candidateLeague, date }))
  );
}

function getCompetitionContext(data = {}) {
  const header = data.header || {};
  const competition = header.competitions?.[0] || data.competitions?.[0] || {};
  const competitors = competition.competitors || [];
  return {
    header,
    competition,
    competitors,
    home: competitors.find((entry) => entry.homeAway === "home") || {},
    away: competitors.find((entry) => entry.homeAway === "away") || {}
  };
}

function uniqueBy(items = [], keyBuilder = (item) => JSON.stringify(item)) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyBuilder(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sanitizeDisplayText(value = "") {
  if (typeof value !== "string") return value;
  return value
    .replace(/\u00c3\u0082\u00c2\u00b7|\u00c2\u00b7|\u00b7/g, " - ")
    .replace(/\u00c3\u0083\u00c2\u00a2\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00ac\u00c3\u00a2\u20ac\u201d\u00c2\u009d|\u00c3\u00a2\u20ac\u201d|\u2014|\u2013/g, " - ")
    .replace(/\u00c3\u0083\u00c2\u00a2\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00ac\u00c3\u201a\u00c2\u00a2|\u00c3\u00a2\u20ac\u00a2/g, " - ")
    .replace(/\u00c3\u201a|\u00c2/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripHtmlMarkup(value = "") {
  return sanitizeDisplayText(
    String(value || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function extractInitialStateFromHtml(html = "") {
  const match = String(html || "").match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\});/s);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    return null;
  }
}

function stripHtmlToStructuredLines(value = "") {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|header|footer|main|aside|li|ul|ol|tr|td|th|table|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<(p|div|section|article|header|footer|main|aside|li|ul|ol|tr|td|th|table|h1|h2|h3|h4|h5|h6)(\s[^>]*)?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => sanitizeDisplayText(line))
    .filter(Boolean);
}

function findStructuredSectionLines(lines = [], heading = "", endHeadings = []) {
  const startIndex = lines.findIndex((line) => line.toLowerCase() === heading.toLowerCase());
  if (startIndex === -1) return [];

  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const candidate = lines[index].toLowerCase();
    if (endHeadings.some((entry) => candidate === String(entry || "").toLowerCase())) {
      endIndex = index;
      break;
    }
  }

  return lines.slice(startIndex + 1, endIndex);
}

function looksLikeStructuredPlayerName(line = "") {
  const clean = sanitizeDisplayText(line);
  if (!clean) return false;
  if (clean.length > 42) return false;
  if (/\d/.test(clean)) return false;
  if (!/[a-z]/i.test(clean)) return false;
  if (/^(current batsmen|current bowlers|fall of wickets|partnership|scorecard|match details|summary)$/i.test(clean)) return false;
  return clean.split(/\s+/).length <= 6;
}

function buildCricketLiveBattersFromLines(lines = []) {
  const batters = [];
  for (let index = 0; index < lines.length; index += 1) {
    const name = sanitizeDisplayText(lines[index] || "");
    if (!looksLikeStructuredPlayerName(name)) continue;

    let statLine = "";
    for (let offset = 1; offset <= 4 && (index + offset) < lines.length; offset += 1) {
      const candidate = sanitizeDisplayText(lines[index + offset] || "");
      if (/\d+\*?\s*\(\d+\s*(?:b|ball|balls)?\)/i.test(candidate)) {
        statLine = candidate;
        break;
      }
    }
    if (!statLine) continue;

    const match = statLine.match(/(\d+)(\*)?\s*\((\d+)\s*(?:b|ball|balls)?\)/i);
    if (!match) continue;

    const runs = Number(match[1] || 0);
    const balls = Number(match[3] || 0);
    if (!Number.isFinite(runs) || !Number.isFinite(balls)) continue;

    const strikeRate = balls > 0 ? ((runs / balls) * 100) : null;
    batters.push({
      name,
      runs,
      balls,
      primary: `${runs}${match[2] ? "*" : ""}`,
      meta: strikeRate !== null
        ? `${balls} BALL${balls === 1 ? "" : "S"} | SR ${strikeRate.toFixed(1)}`
        : `${balls} BALL${balls === 1 ? "" : "S"}`
    });
  }

  return uniqueBy(batters, (entry) => entry.name.toLowerCase()).slice(0, 2);
}

function buildCricketLiveBowlersFromLines(lines = []) {
  const bowlers = [];
  for (let index = 0; index < lines.length; index += 1) {
    const name = sanitizeDisplayText(lines[index] || "");
    if (!looksLikeStructuredPlayerName(name)) continue;

    let statLine = "";
    for (let offset = 1; offset <= 4 && (index + offset) < lines.length; offset += 1) {
      const candidate = sanitizeDisplayText(lines[index + offset] || "");
      if (/^\d+(?:\.\d+)?-\d+-\d+-\d+$/.test(candidate) || /\b\d+\s*\/\s*\d+\b/.test(candidate)) {
        statLine = candidate;
        break;
      }
    }
    if (!statLine) continue;

    let primary = "";
    let meta = "";
    const spellMatch = statLine.match(/^(\d+(?:\.\d+)?)\-(\d+)\-(\d+)\-(\d+)$/);
    const figuresMatch = statLine.match(/(\d+)\s*\/\s*(\d+)/);
    if (spellMatch) {
      const overs = Number(spellMatch[1] || 0);
      const runs = Number(spellMatch[3] || 0);
      const wickets = Number(spellMatch[4] || 0);
      const economy = overs > 0 ? (runs / overs) : null;
      primary = `${wickets}/${runs}`;
      meta = economy !== null ? `ECON ${economy.toFixed(1)}` : `OVERS ${spellMatch[1]}`;
    } else if (figuresMatch) {
      primary = `${figuresMatch[1]}/${figuresMatch[2]}`;
      meta = "Current spell";
    } else {
      continue;
    }

    bowlers.push({
      name,
      primary,
      meta
    });
  }

  return uniqueBy(bowlers, (entry) => entry.name.toLowerCase()).slice(0, 2);
}

function buildCricketLiveStateFromHtml(html = "") {
  const lines = stripHtmlToStructuredLines(html);
  if (!lines.length) return null;

  const batters = buildCricketLiveBattersFromLines(
    findStructuredSectionLines(lines, "Current Batsmen", [
      "Current bowlers",
      "Fall of wickets",
      "Match details",
      "Scorecard",
      "Match Centre"
    ])
  );
  const bowlers = buildCricketLiveBowlersFromLines(
    findStructuredSectionLines(lines, "Current bowlers", [
      "Fall of wickets",
      "Current batsmen",
      "Match details",
      "Scorecard",
      "Match Centre"
    ])
  );

  if (!batters.length && !bowlers.length) return null;
  return { batters, bowlers };
}

function looksLikeRealCricketCommentary(entries = []) {
  return entries.some((entry) => {
    const text = sanitizeDisplayText(entry?.text || entry?.player || "").toLowerCase();
    return /\bto\b/.test(text) || /\b(four|six|wicket|out|run|lbw|caught|bowled)\b/.test(text);
  });
}

function normalizeCricketCommentaryEvent(entry = {}) {
  const rawEvent = String(entry?.event ?? "").trim().toUpperCase();
  if (rawEvent === "W") return "wicket";
  if (rawEvent === "6") return "six";
  if (rawEvent === "4") return "four";
  if (rawEvent === "0") return "dot";
  if (/^[1-5]$/.test(rawEvent)) return "run";
  return "commentary";
}

function buildCricketCommentaryFromPageState(pageState = {}) {
  const overs = pageState?.gamePackage?.partCommentary?.overs || [];
  const flattened = overs.flatMap((over) =>
    (over?.comments || []).map((comment) => ({
      time: String(comment?.timeStamp ?? over?.overNo ?? "").trim(),
      text: stripHtmlMarkup(comment?.text || ""),
      player: stripHtmlMarkup(comment?.dismissalText || comment?.pre || ""),
      type: normalizeCricketCommentaryEvent(comment),
      side: "neutral",
      commId: String(comment?.commId || ""),
      commSeq: Number(comment?.commSeq || 0)
    }))
  );

  return uniqueBy(
    flattened
      .filter((entry) => entry.text)
      .sort((left, right) => (right.commSeq || 0) - (left.commSeq || 0))
      .map(({ commId, commSeq, ...entry }) => entry),
    (entry) => `${entry.time}:${entry.text}:${entry.type}`
  ).slice(0, 18);
}

function isSyntheticTimelineEntries(entries = [], summary = {}) {
  if (!entries.length) return true;
  const blockedTexts = new Set(
    [
      sanitizeDisplayText(summary?.statusText || "").toLowerCase(),
      sanitizeDisplayText(summary?.time || "").toLowerCase(),
      sanitizeDisplayText(summary?.venue ? `Venue: ${summary.venue}` : "").toLowerCase()
    ].filter(Boolean)
  );

  return entries.every((entry) => {
    const time = String(entry?.time || "").trim().toUpperCase();
    const text = sanitizeDisplayText(entry?.text || entry?.player || "").toLowerCase();
    return ["LIVE", "UPDATE", "DATE", "VENUE", "STAR", "RESULT"].includes(time)
      || blockedTexts.has(text)
      || text.startsWith("scheduled for ");
  });
}

function buildCricketTimelineFromCommentary(entries = []) {
  return entries.slice(0, 12).map((entry) => ({
    time: entry.time || "LIVE",
    type: entry.type || "commentary",
    text: entry.text || entry.player || "Match update",
    player: entry.player || entry.text || "",
    side: entry.side || "neutral"
  }));
}

async function hydrateCricketCommentary(summary = {}, summaryData = {}) {
  if (summary?.sport !== "cricket") return summary;

  const summaryHref = summaryData?.header?.links?.find((entry) => Array.isArray(entry?.rel) && entry.rel.includes("summary"))?.href
    || summaryData?.header?.links?.[0]?.href
    || "";
  if (!summaryHref) return summary;

  try {
    const html = await fetchText(summaryHref);
    const liveState = buildCricketLiveStateFromHtml(html);
    if (looksLikeRealCricketCommentary(summary.commentary || [])) {
      return liveState
        ? {
            ...summary,
            cricketLive: liveState
          }
        : summary;
    }

    const pageState = extractInitialStateFromHtml(html);
    const commentary = buildCricketCommentaryFromPageState(pageState);
    if (!commentary.length) {
      return liveState
        ? {
            ...summary,
            cricketLive: liveState
          }
        : summary;
    }

    return {
      ...summary,
      ...(liveState ? { cricketLive: liveState } : {}),
      commentary,
      timeline: isSyntheticTimelineEntries(summary.timeline || [], summary)
        ? buildCricketTimelineFromCommentary(commentary)
        : (summary.timeline || [])
    };
  } catch (error) {
    return summary;
  }
}

function sanitizeDisplayPayload(value, seen = new WeakMap()) {
  if (typeof value === "string") return sanitizeDisplayText(value);
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);

  if (Array.isArray(value)) {
    const next = value.map((entry) => sanitizeDisplayPayload(entry, seen));
    seen.set(value, next);
    return next;
  }

  const next = {};
  seen.set(value, next);
  Object.entries(value).forEach(([key, entry]) => {
    next[key] = sanitizeDisplayPayload(entry, seen);
  });
  return next;
}

function normalizeStatValue(entry = {}) {
  const value = entry.displayValue ?? entry.value ?? entry.summary ?? entry.display ?? "";
  return String(value || "").trim();
}

function buildStatPairs(homeStats = [], awayStats = []) {
  const awayMap = new Map();
  awayStats.forEach((entry) => {
    const key = String(entry.name || entry.label || entry.displayName || entry.abbreviation || "").trim().toLowerCase();
    if (key) awayMap.set(key, entry);
  });

  const stats = [];
  homeStats.forEach((entry) => {
    const key = String(entry.name || entry.label || entry.displayName || entry.abbreviation || "").trim().toLowerCase();
    const label = entry.label || entry.displayName || entry.name || entry.abbreviation || "";
    const homeValue = normalizeStatValue(entry);
    const awayValue = normalizeStatValue(awayMap.get(key) || {});
    if (!label || (!homeValue && !awayValue)) return;
    stats.push({
      label,
      home: homeValue || '-',
      away: awayValue || '-'
    });
  });

  if (!stats.length) {
    awayStats.forEach((entry) => {
      const label = entry.label || entry.displayName || entry.name || entry.abbreviation || "";
      const awayValue = normalizeStatValue(entry);
      if (!label || !awayValue) return;
      stats.push({
        label,
        home: '-',
        away: awayValue
      });
    });
  }

  return uniqueBy(stats, (entry) => `${entry.label}:${entry.home}:${entry.away}`);
}

function formatLeaderValue(leader = {}) {
  const name = leader.athlete?.shortName || leader.athlete?.displayName || "";
  const value = leader.displayValue || leader.value || "";
  return [name, value].filter(Boolean).join(" ").trim();
}

function buildSyntheticStatsFromContext(data = {}) {
  const { competition, home, away } = getCompetitionContext(data);
  const stats = [];

  const directStats = buildStatPairs(home.statistics || [], away.statistics || []);
  if (directStats.length) return directStats.slice(0, 8);

  const homeRecord = home.records?.[0]?.summary || "";
  const awayRecord = away.records?.[0]?.summary || "";
  if (homeRecord || awayRecord) {
    stats.push({
      label: "Record",
      home: homeRecord || '-',
      away: awayRecord || '-'
    });
  }

  const maxLeaderGroups = Math.max(home.leaders?.length || 0, away.leaders?.length || 0);
  for (let index = 0; index < maxLeaderGroups; index += 1) {
    const homeGroup = home.leaders?.[index] || {};
    const awayGroup = away.leaders?.[index] || {};
    const label = homeGroup.displayName || awayGroup.displayName || homeGroup.name || awayGroup.name || "";
    const homeValue = formatLeaderValue(homeGroup.leaders?.[0] || {});
    const awayValue = formatLeaderValue(awayGroup.leaders?.[0] || {});
    if (!label || (!homeValue && !awayValue)) continue;
    stats.push({
      label,
      home: homeValue || '-',
      away: awayValue || '-'
    });
  }

  const lastPlayText = competition.situation?.lastPlay?.text || data.situation?.lastPlay?.text || "";
  const statusText = competition.status?.type?.detail || competition.status?.type?.shortDetail || "";
  if (lastPlayText || statusText) {
    stats.push({
      label: "Latest Update",
      home: (lastPlayText || statusText || "Match update").slice(0, 54),
      away: statusText || mapStatus(competition.status?.type?.state)
    });
  }

  return uniqueBy(stats, (entry) => `${entry.label}:${entry.home}:${entry.away}`).slice(0, 8);
}

function buildSyntheticLineupFromLeaders(competitor = {}) {
  const players = (competitor.leaders || [])
    .flatMap((group, groupIndex) =>
      (group.leaders || []).map((leader, leaderIndex) => ({
        name: leader.athlete?.displayName || leader.athlete?.shortName || "",
        number: leader.athlete?.jersey || "",
        position: group.displayName || group.name || "Key Player",
        starter: groupIndex === 0 || leaderIndex === 0,
        face: leader.athlete?.headshot?.href || FALLBACK_LOGO
      }))
    )
    .filter((entry) => entry.name);

  return uniqueBy(players, (entry) => entry.name.toLowerCase()).slice(0, 8);
}

function buildLineupFromBoxscore(data = {}, side = "home", teamId = "") {
  const boxes = data.boxscore?.players || [];
  const box = boxes.find((entry) => {
    const boxTeamId = String(entry.team?.id || entry.team?.$ref || "");
    return (teamId && boxTeamId.includes(String(teamId))) || entry.homeAway === side;
  });

  if (!box?.statistics?.length) return [];

  const players = box.statistics
    .flatMap((group, groupIndex) =>
      (group.athletes || []).map((athlete, athleteIndex) => ({
        name: athlete.athlete?.displayName || athlete.displayName || athlete.name || "",
        number: athlete.athlete?.jersey || athlete.jersey || "",
        position: athlete.athlete?.position?.abbreviation || athlete.position?.abbreviation || group.displayName || "Player",
        starter: athlete.starter ?? (groupIndex === 0 && athleteIndex < 5),
        face: athlete.athlete?.headshot?.href || athlete.headshot?.href || FALLBACK_LOGO
      }))
    )
    .filter((entry) => entry.name);

  return uniqueBy(players, (entry) => entry.name.toLowerCase()).slice(0, 12);
}

function inferTimelineSide(teamId = "", homeId = "", awayId = "") {
  if (teamId && String(teamId) === String(homeId)) return "home";
  if (teamId && String(teamId) === String(awayId)) return "away";
  return "neutral";
}

function formatTimelineDate(value = "") {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function buildSyntheticTimelineFromContext(data = {}, homeId = "", awayId = "") {
  const { header, competition, home, away } = getCompetitionContext(data);
  const items = [];
  const statusType = competition.status?.type || {};
  const displayClock = competition.status?.displayClock || statusType.shortDetail || statusType.detail || "";
  const lastPlayText = competition.situation?.lastPlay?.text || data.situation?.lastPlay?.text || "";
  const lastPlayTeamId = competition.situation?.lastPlay?.team?.id || data.situation?.lastPlay?.team?.id || "";

  if (lastPlayText) {
    items.push({
      time: displayClock || "LIVE",
      type: "event",
      text: lastPlayText,
      player: lastPlayText,
      side: inferTimelineSide(lastPlayTeamId, homeId, awayId)
    });
  }

  const statusText = statusType.detail || statusType.shortDetail || statusType.description || "";
  if (statusText) {
    items.push({
      time: displayClock || mapStatus(statusType.state).toUpperCase(),
      type: mapStatus(statusType.state) === "finished" ? "result" : "event",
      text: statusText,
      player: statusText,
      side: "neutral"
    });
  }

  const scheduledText = formatTimelineDate(competition.date || header.date || "");
  if (scheduledText) {
    items.push({
      time: "DATE",
      type: "event",
      text: `Scheduled for ${scheduledText}`,
      player: `Scheduled for ${scheduledText}`,
      side: "neutral"
    });
  }

  if (competition.venue?.fullName) {
    items.push({
      time: "VENUE",
      type: "event",
      text: `Venue: ${competition.venue.fullName}`,
      player: `Venue: ${competition.venue.fullName}`,
      side: "neutral"
    });
  }

  [
    { side: "home", competitor: home },
    { side: "away", competitor: away }
  ].forEach(({ side, competitor }) => {
    const leaderGroup = competitor.leaders?.[0];
    const leader = leaderGroup?.leaders?.[0];
    const leaderText = formatLeaderValue(leader);
    if (!leaderText) return;
    items.push({
      time: "STAR",
      type: "event",
      text: leaderText,
      player: leaderText,
      side
    });
  });

  return uniqueBy(items, (entry) => `${entry.time}:${entry.text}:${entry.side}`).slice(0, 8);
}

function buildSyntheticLineupFromTeam(team = {}) {
  const leader = team.leader || null;
  if (!leader?.name && !leader?.value) return [];
  return [
    {
      name: leader.name || team.name || "Key Player",
      number: "",
      position: "Key Player",
      starter: true,
      face: team.logo || FALLBACK_LOGO
    }
  ];
}

function buildSyntheticStatsFromMatch(match = {}) {
  const stats = [];
  if (match.homeTeam?.record || match.awayTeam?.record) {
    stats.push({
      label: "Record",
      home: match.homeTeam?.record || '-',
      away: match.awayTeam?.record || '-'
    });
  }

  if (match.homeTeam?.leader || match.awayTeam?.leader) {
    stats.push({
      label: "Top Performer",
      home: [match.homeTeam?.leader?.name, match.homeTeam?.leader?.value].filter(Boolean).join(' ') || '-',
      away: [match.awayTeam?.leader?.name, match.awayTeam?.leader?.value].filter(Boolean).join(' ') || '-'
    });
  }

  if (match.statusText || match.time) {
    stats.push({
      label: "Match Status",
      home: match.statusText || match.time || match.status || "Update",
      away: match.league || match.leagueSlug || "League"
    });
  }

  return uniqueBy(stats, (entry) => `${entry.label}:${entry.home}:${entry.away}`).slice(0, 6);
}

function buildSyntheticTimelineFromMatch(match = {}) {
  const items = [];
  if (match.statusText || match.time) {
    const statusText = match.statusText || match.time || `${match.status || "scheduled"} update`;
    items.push({
      time: match.time || match.status?.toUpperCase() || "UPDATE",
      type: match.status === "finished" ? "result" : "event",
      text: statusText,
      player: statusText,
      side: "neutral"
    });
  }

  const scheduledText = formatTimelineDate(match.date || "");
  if (scheduledText) {
    items.push({
      time: "DATE",
      type: "event",
      text: `Scheduled for ${scheduledText}`,
      player: `Scheduled for ${scheduledText}`,
      side: "neutral"
    });
  }

  if (match.venue) {
    items.push({
      time: "VENUE",
      type: "event",
      text: `Venue: ${match.venue}`,
      player: `Venue: ${match.venue}`,
      side: "neutral"
    });
  }

  [
    { side: "home", team: match.homeTeam || {} },
    { side: "away", team: match.awayTeam || {} }
  ].forEach(({ side, team }) => {
    if (!team.leader?.name && !team.leader?.value) return;
    const leaderText = [team.leader?.name, team.leader?.value].filter(Boolean).join(" ");
    items.push({
      time: "STAR",
      type: "event",
      text: leaderText,
      player: leaderText,
      side
    });
  });

  return uniqueBy(items, (entry) => `${entry.time}:${entry.text}:${entry.side}`).slice(0, 6);
}

function normalizeStats(data = {}) {
  const boxscoreTeams = data.boxscore?.teams || [];
  const homeStats = boxscoreTeams.find((team) => team.homeAway === "home")?.statistics || [];
  const awayStats = boxscoreTeams.find((team) => team.homeAway === "away")?.statistics || [];
  const boxscoreStats = buildStatPairs(homeStats, awayStats);
  if (boxscoreStats.length) return boxscoreStats.slice(0, 8);
  return buildSyntheticStatsFromContext(data);
}

function normalizeLineup(data = {}, side = "home") {
  const roster = data.rosters?.find((entry) => entry.homeAway === side);
  if (roster?.roster?.length) {
    return roster.roster.map((entry) => ({
      name: entry.athlete?.displayName || "",
      number: entry.jersey || "",
      position: entry.position?.abbreviation || "",
      starter: Boolean(entry.starter),
      face: entry.athlete?.headshot?.href || FALLBACK_LOGO
    }));
  }

  const { home, away } = getCompetitionContext(data);
  const competitor = side === "home" ? home : away;
  const teamId = competitor.team?.id || "";
  const boxscoreLineup = buildLineupFromBoxscore(data, side, teamId);
  if (boxscoreLineup.length) return boxscoreLineup;

  return buildSyntheticLineupFromLeaders(competitor);
}

function mapRosterToLineup(roster = []) {
  return roster
    .filter((athlete) => athlete?.fullName)
    .slice(0, 18)
    .map((athlete, index) => ({
      name: athlete.fullName || athlete.shortName || "Player",
      number: athlete.jersey || "",
      position: athlete.position?.abbreviation || athlete.position?.displayName || "Player",
      starter: index < 5,
      face: athlete.headshot?.href || FALLBACK_LOGO
    }));
}

async function fetchRosterFallback(sport = "soccer", league = "eng.1", teamId = "") {
  if (!teamId) return [];
  try {
    const rosterData = await fetchJson(siteApiUrl(sport, league, `teams/${teamId}/roster`));
    return mapRosterToLineup(normalizeRosterGroups(rosterData));
  } catch (error) {
    return [];
  }
}

async function hydrateSummaryLineups(summary = {}, sport = "soccer", league = "eng.1") {
  const needsHomeRoster = !(Array.isArray(summary.homeTeam?.lineup) && summary.homeTeam.lineup.length);
  const needsAwayRoster = !(Array.isArray(summary.awayTeam?.lineup) && summary.awayTeam.lineup.length);
  if (!needsHomeRoster && !needsAwayRoster) return summary;

  const [homeRoster, awayRoster] = await Promise.all([
    needsHomeRoster ? fetchRosterFallback(sport, league, summary.homeTeam?.id || "") : Promise.resolve([]),
    needsAwayRoster ? fetchRosterFallback(sport, league, summary.awayTeam?.id || "") : Promise.resolve([])
  ]);

  return {
    ...summary,
    homeTeam: {
      ...(summary.homeTeam || {}),
      lineup: needsHomeRoster ? homeRoster : (summary.homeTeam?.lineup || [])
    },
    awayTeam: {
      ...(summary.awayTeam || {}),
      lineup: needsAwayRoster ? awayRoster : (summary.awayTeam?.lineup || [])
    }
  };
}

function normalizeTimeline(data = {}, homeId = "", awayId = "") {
  const plays = data.plays || data.header?.competitions?.[0]?.details || [];
  const timeline = (plays || [])
    .slice(-50) // Increased from 40 to 50 for more history
    .reverse()
    .map((play) => {
      const text = play.text || play.athletesInvolved?.[0]?.displayName || "";
      const type = (play.type?.text || play.type?.name || "").toLowerCase();
      const teamId = play.team?.id || "";
      let side = "neutral";
      if (teamId === homeId) side = "home";
      if (teamId === awayId) side = "away";

      // Enhanced event typing
      let eventType = "event";
      if (type.includes("goal") || type.includes("score")) eventType = "goal";
      else if (type.includes("yellow") || type.includes("caution")) eventType = "yellow-card";
      else if (type.includes("red") || type.includes("ejection")) eventType = "red-card";
      else if (type.includes("sub") || type.includes("replace")) eventType = "substitution";
      else if (type.includes("shot") || type.includes("attempt")) eventType = "shot";
      else if (type.includes("foul") || type.includes("penalty")) eventType = "foul";
      else if (type.includes("corner")) eventType = "corner";
      else if (type.includes("var") || type.includes("review")) eventType = "var";

      return {
        time: play.clock?.displayValue || play.clock?.value || "0'",
        type: eventType,
        text: text, // Keep original text
        player: play.athletesInvolved?.[0]?.displayName || "",
        side,
        score: play.homeScore !== undefined ? `${play.homeScore} - ${play.awayScore}` : null
      };
    });

  if (timeline.length) return timeline;
  return buildSyntheticTimelineFromContext(data, homeId, awayId);
}

function normalizeOdds(data = {}) {
  const odds = data.pickcenter?.[0] || null;
  if (!odds) return null;

  return {
    details: odds.details || "Match Odds",
    homeOdds: odds.homeTeamOdds?.moneyLine || odds.homeTeamOdds?.current?.moneyLine || "-",
    awayOdds: odds.awayTeamOdds?.moneyLine || odds.awayTeamOdds?.current?.moneyLine || "-",
    drawOdds: odds.drawOdds?.moneyLine || odds.drawOdds?.current?.moneyLine || null
  };
}

function normalizeSummary(data = {}, fallbackSport = "soccer", fallbackLeague = "eng.1") {
  const header = data.header || {};
  const competition = header.competitions?.[0] || {};
  const home = competition.competitors?.find((entry) => entry.homeAway === "home") || {};
  const away = competition.competitors?.find((entry) => entry.homeAway === "away") || {};
  const statusType = competition.status?.type || {};
  const timeline = normalizeTimeline(data, home.team?.id || "", away.team?.id || "");
  const newsItems = Array.isArray(data.news) ? data.news : [];
  const commentary = (data.commentary || []).map((entry) => ({
    time: entry.time || entry.clock?.displayValue || "",
    text: entry.text || "",
    type: entry.type?.text || "commentary"
  }));
  if (!commentary.length && timeline.length) {
    timeline.slice(0, 6).forEach((entry) => {
      commentary.push({
        time: entry.time || "",
        text: entry.text || entry.player || "",
        type: entry.type || "commentary"
      });
    });
  }

  return {
    id: header.id || competition.id || "",
    sport: fallbackSport,
    leagueSlug: fallbackLeague,
    league: data.leagues?.[0]?.name || header.league?.name || fallbackLeague.toUpperCase(),
    status: mapStatus(statusType.state),
    statusText: statusType.detail || statusType.description || statusType.shortDetail || "",
    time: statusType.shortDetail || statusType.detail || "",
    date: competition.date || header.competitions?.[0]?.date || "",
    venue: competition.venue?.fullName || "",
    broadcast: competition.broadcasts?.map((entry) => entry.media?.shortName || entry.names?.join(", ")).filter(Boolean).join(", "),
    homeTeam: {
      id: home.team?.id || "",
      name: home.team?.displayName || home.team?.name || "Home Team",
      abbreviation: home.team?.abbreviation || "",
      logo: home.team?.logos?.[0]?.href || home.team?.logo || FALLBACK_LOGO,
      score: home.score || "0",
      record: home.records?.[0]?.summary || "",
      lineup: normalizeLineup(data, "home"),
      linescores: normalizeCricketLinescores(home.linescores || [])
    },
    awayTeam: {
      id: away.team?.id || "",
      name: away.team?.displayName || away.team?.name || "Away Team",
      abbreviation: away.team?.abbreviation || "",
      logo: away.team?.logos?.[0]?.href || away.team?.logo || FALLBACK_LOGO,
      score: away.score || "0",
      record: away.records?.[0]?.summary || "",
      lineup: normalizeLineup(data, "away"),
      linescores: normalizeCricketLinescores(away.linescores || [])
    },
    stats: normalizeStats(data),
    timeline,
    commentary: commentary.concat(newsItems.map((entry) => ({ text: entry.headline, type: "news" }))),
    odds: normalizeOdds(data),
    h2h: [],
    situation: data.situation || null
  };
}

function normalizeFallbackScoreboardSummary(event = {}, sport = "soccer", league = "eng.1", leagueName = "") {
  const normalized = normalizeScoreboardEvent(event, sport, league, leagueName);
  const syntheticTimeline = buildSyntheticTimelineFromMatch(normalized);
  return {
    id: normalized.id,
    sport: normalized.sport,
    leagueSlug: normalized.leagueSlug,
    league: normalized.league,
    status: normalized.status,
    statusText: normalized.statusText,
    time: normalized.time,
    date: normalized.date,
    venue: normalized.venue,
    broadcast: normalized.broadcast,
    homeTeam: {
      ...normalized.homeTeam,
      lineup: buildSyntheticLineupFromTeam(normalized.homeTeam)
    },
    awayTeam: {
      ...normalized.awayTeam,
      lineup: buildSyntheticLineupFromTeam(normalized.awayTeam)
    },
    stats: buildSyntheticStatsFromMatch(normalized),
    timeline: syntheticTimeline,
    commentary: syntheticTimeline.map((entry) => ({
      time: entry.time,
      text: entry.text || entry.player || "",
      type: entry.type || "commentary"
    })),
    odds: null,
    h2h: [],
    situation: null
  };
}

function normalizeFeedFallbackSummary(match = {}, h2h = []) {
  const syntheticTimeline = buildSyntheticTimelineFromMatch(match);
  return {
    id: match.id || "",
    sport: match.sport || "soccer",
    leagueSlug: match.leagueSlug || "eng.1",
    league: match.league || (match.leagueSlug || "MATCH").toUpperCase(),
    status: match.status || "upcoming",
    statusText: match.statusText || "",
    time: match.time || "",
    date: match.date || "",
    venue: match.venue || "",
    broadcast: match.broadcast || "",
    homeTeam: {
      ...(match.homeTeam || {}),
      name: match.homeTeam?.name || "Home Team",
      logo: match.homeTeam?.logo || FALLBACK_LOGO,
      score: match.homeTeam?.score || "0",
      lineup: Array.isArray(match.homeTeam?.lineup) && match.homeTeam.lineup.length
        ? match.homeTeam.lineup
        : buildSyntheticLineupFromTeam(match.homeTeam || {})
    },
    awayTeam: {
      ...(match.awayTeam || {}),
      name: match.awayTeam?.name || "Away Team",
      logo: match.awayTeam?.logo || FALLBACK_LOGO,
      score: match.awayTeam?.score || "0",
      lineup: Array.isArray(match.awayTeam?.lineup) && match.awayTeam.lineup.length
        ? match.awayTeam.lineup
        : buildSyntheticLineupFromTeam(match.awayTeam || {})
    },
    stats: buildSyntheticStatsFromMatch(match),
    timeline: syntheticTimeline,
    commentary: syntheticTimeline.map((entry) => ({
      time: entry.time,
      text: entry.text || entry.player || "",
      type: entry.type || "commentary"
    })),
    odds: null,
    h2h,
    situation: null
  };
}

function hasUsefulSummaryText(value = "", blocked = []) {
  const text = String(value || "").trim();
  if (!text) return false;
  return !blocked.some((entry) => text.toLowerCase() === String(entry || "").trim().toLowerCase());
}

function isUsefulSummaryDate(value = "") {
  const text = String(value || "").trim();
  if (!text) return false;
  const normalized = text.toLowerCase();
  if (["scheduled event", "regular season", "preseason", "postseason", "loading..."].includes(normalized)) {
    return false;
  }
  return Number.isFinite(Date.parse(text));
}

function isGenericTeam(team = {}) {
  const name = String(team.name || team.fullName || "").trim().toLowerCase();
  const abbreviation = String(team.abbreviation || "").trim().toLowerCase();
  return !name || ["home team", "away team", "home", "away", "tbd"].includes(name)
    || ["hom", "awa", "tbd"].includes(abbreviation);
}

function needsSummaryHydration(summary = {}) {
  if (!summary?.homeTeam || !summary?.awayTeam) return true;
  if (isGenericTeam(summary.homeTeam) || isGenericTeam(summary.awayTeam)) return true;
  if (!hasUsefulSummaryText(summary.league, ["sports event", "upcoming event"])) return true;
  if (!isUsefulSummaryDate(summary.date)) return true;
  if (summary.status === "upcoming" && !hasUsefulSummaryText(summary.venue, ["tbd", "tbd stadium"])) return true;

  const hasStats = Array.isArray(summary.stats) && summary.stats.length > 0;
  const hasTimeline = Array.isArray(summary.timeline) && summary.timeline.length > 0;
  const hasLineups = (Array.isArray(summary.homeTeam?.lineup) && summary.homeTeam.lineup.length > 0)
    || (Array.isArray(summary.awayTeam?.lineup) && summary.awayTeam.lineup.length > 0);

  if ((summary.status === "live" || summary.status === "finished") && (!hasStats || !hasTimeline || !hasLineups)) return true;
  if (summary.status === "upcoming" && (!Array.isArray(summary.h2h) || !summary.h2h.length)) return true;
  return false;
}

function pickSummaryText(primary, fallback, blocked = []) {
  if (hasUsefulSummaryText(primary, blocked)) return String(primary).trim();
  if (hasUsefulSummaryText(fallback, blocked)) return String(fallback).trim();
  return String(primary || fallback || "").trim();
}

function pickSummaryDate(primary, fallback) {
  if (isUsefulSummaryDate(primary)) return String(primary).trim();
  if (isUsefulSummaryDate(fallback)) return String(fallback).trim();
  return pickSummaryText(primary, fallback, ["scheduled event", "regular season", "preseason", "postseason", "loading..."]);
}

function mergeSummaryPayload(primary = {}, fallback = {}) {
  const primaryHome = primary.homeTeam || {};
  const primaryAway = primary.awayTeam || {};
  const fallbackHome = fallback.homeTeam || {};
  const fallbackAway = fallback.awayTeam || {};

  return {
    ...fallback,
    ...primary,
    sport: primary.sport || fallback.sport || "soccer",
    leagueSlug: primary.leagueSlug || fallback.leagueSlug || "eng.1",
    league: pickSummaryText(primary.league, fallback.league, ["sports event", "upcoming event"]),
    status: primary.status || fallback.status || "upcoming",
    statusText: pickSummaryText(primary.statusText, fallback.statusText),
    time: pickSummaryText(primary.time, fallback.time, ["00:00"]),
    date: pickSummaryDate(primary.date, fallback.date),
    venue: pickSummaryText(primary.venue, fallback.venue, ["tbd", "tbd stadium"]),
    broadcast: pickSummaryText(primary.broadcast, fallback.broadcast),
    stats: Array.isArray(primary.stats) && primary.stats.length ? primary.stats : (fallback.stats || []),
    timeline: Array.isArray(primary.timeline) && primary.timeline.length ? primary.timeline : (fallback.timeline || []),
    commentary: Array.isArray(primary.commentary) && primary.commentary.length ? primary.commentary : (fallback.commentary || []),
    odds: primary.odds || fallback.odds || null,
    h2h: Array.isArray(primary.h2h) && primary.h2h.length ? primary.h2h : (fallback.h2h || []),
    situation: primary.situation || fallback.situation || null,
    homeTeam: {
      ...fallbackHome,
      ...primaryHome,
      name: !isGenericTeam(primaryHome) ? (primaryHome.name || fallbackHome.name || "Home Team") : (fallbackHome.name || primaryHome.name || "Home Team"),
      fullName: !isGenericTeam(primaryHome) ? (primaryHome.fullName || fallbackHome.fullName || primaryHome.name || fallbackHome.name || "Home Team") : (fallbackHome.fullName || primaryHome.fullName || fallbackHome.name || primaryHome.name || "Home Team"),
      logo: primaryHome.logo || fallbackHome.logo || FALLBACK_LOGO,
      score: primaryHome.score ?? fallbackHome.score ?? "0",
      lineup: Array.isArray(primaryHome.lineup) && primaryHome.lineup.length ? primaryHome.lineup : (fallbackHome.lineup || [])
    },
    awayTeam: {
      ...fallbackAway,
      ...primaryAway,
      name: !isGenericTeam(primaryAway) ? (primaryAway.name || fallbackAway.name || "Away Team") : (fallbackAway.name || primaryAway.name || "Away Team"),
      fullName: !isGenericTeam(primaryAway) ? (primaryAway.fullName || fallbackAway.fullName || primaryAway.name || fallbackAway.name || "Away Team") : (fallbackAway.fullName || primaryAway.fullName || fallbackAway.name || primaryAway.name || "Away Team"),
      logo: primaryAway.logo || fallbackAway.logo || FALLBACK_LOGO,
      score: primaryAway.score ?? fallbackAway.score ?? "0",
      lineup: Array.isArray(primaryAway.lineup) && primaryAway.lineup.length ? primaryAway.lineup : (fallbackAway.lineup || [])
    }
  };
}

function buildTeamKeySet(team = {}) {
  return new Set(
    [
      team.id,
      team.abbreviation,
      team.name,
      team.fullName
    ]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean)
  );
}

function isSameMatchup(match = {}, homeTeam = {}, awayTeam = {}) {
  const homeKeys = buildTeamKeySet(homeTeam);
  const awayKeys = buildTeamKeySet(awayTeam);
  const candidateHomeKeys = buildTeamKeySet(match.homeTeam || {});
  const candidateAwayKeys = buildTeamKeySet(match.awayTeam || {});

  const hasKeyMatch = (left, right) => [...left].some((value) => right.has(value));
  const direct = hasKeyMatch(homeKeys, candidateHomeKeys) && hasKeyMatch(awayKeys, candidateAwayKeys);
  const reverse = hasKeyMatch(homeKeys, candidateAwayKeys) && hasKeyMatch(awayKeys, candidateHomeKeys);
  return direct || reverse;
}

function formatHeadToHeadDate(value = "") {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function normalizeHeadToHead(matches = [], homeTeam = {}, awayTeam = {}, excludeId = "") {
  return uniqueBy(
    matches
      .filter((match) => String(match.id) !== String(excludeId))
      .filter((match) => match.status === "finished")
      .filter((match) => isSameMatchup(match, homeTeam, awayTeam))
      .sort((left, right) => new Date(right.date) - new Date(left.date))
      .slice(0, 5)
      .map((match) => ({
        date: formatHeadToHeadDate(match.date),
        home: match.homeTeam?.abbreviation || match.homeTeam?.name || "Home",
        away: match.awayTeam?.abbreviation || match.awayTeam?.name || "Away",
        score: `${match.homeTeam?.score || "0"} - ${match.awayTeam?.score || "0"}`,
        result: match.statusText || "Final"
      })),
    (entry) => `${entry.date}:${entry.home}:${entry.away}:${entry.score}`
  );
}

async function buildHeadToHeadFallback(request, match = {}, sport = "soccer", league = "eng.1") {
  if (!match.homeTeam || !match.awayTeam) return [];

  const candidates = [];
  const pushCandidate = (path, params = {}) => {
    const key = `${path}:${JSON.stringify(params)}`;
    if (candidates.some((entry) => entry.key === key)) return;
    candidates.push({ key, path, params });
  };

  pushCandidate("/api/results", { sport, league, days: 7 });
  pushCandidate("/api/results", { sport, days: 7 });
  pushCandidate("/api/results", { sport: "all", days: 7 });

  const matches = [];
  for (const candidate of candidates) {
    try {
      const data = await fetchInternalJson(request, candidate.path, candidate.params);
      matches.push(...(data.matches || []));
    } catch (error) {
      continue;
    }
  }

  return normalizeHeadToHead(matches, match.homeTeam, match.awayTeam, match.id);
}

async function findFeedFallback(request, id, sport, league) {
  const normalizedSport = normalizeSportParam(sport, league);
  const normalizedLeague = normalizeLeagueParam(league, normalizedSport);
  const candidates = [];
  const pushCandidate = (path, params = {}) => {
    const key = `${path}:${JSON.stringify(params)}`;
    if (candidates.some((candidate) => candidate.key === key)) return;
    candidates.push({ key, path, params });
  };

  pushCandidate("/api/results", { sport: normalizedSport, league: normalizedLeague, days: 7 });
  pushCandidate("/api/results", { sport: normalizedSport, days: 7 });
  pushCandidate("/api/live", { sport: normalizedSport, league: normalizedLeague });
  pushCandidate("/api/live", { sport: normalizedSport });
  pushCandidate("/api/upcoming", { sport: normalizedSport, league: normalizedLeague, days: 7 });
  pushCandidate("/api/upcoming", { sport: normalizedSport, days: 7 });
  pushCandidate("/api/results", { sport: "all", days: 7 });
  pushCandidate("/api/live", { sport: "all" });
  pushCandidate("/api/upcoming", { sport: "all", days: 7 });

  for (const candidate of candidates) {
    try {
      const data = await fetchInternalJson(request, candidate.path, candidate.params);
      const match = (data.matches || []).find((entry) => String(entry.id) === String(id));
      if (match) {
        const h2h = await buildHeadToHeadFallback(request, match, normalizedSport, normalizedLeague);
        return normalizeFeedFallbackSummary(match, h2h);
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

async function findScoreboardFallback(id, sport, league) {
  const candidates = buildScoreboardCandidates(sport, league);
  for (const candidate of candidates) {
    try {
      const data = await fetchExternalJson(candidate.sport, candidate.league, "scoreboard", { dates: candidate.date, limit: 100 });
      const event = (data.events || []).find((entry) => String(entry.id) === String(id));
      if (event) {
        return normalizeFallbackScoreboardSummary(
          event,
          candidate.sport,
          candidate.league,
          data.leagues?.[0]?.name || candidate.league.toUpperCase()
        );
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

function getMatchResponseCacheSeconds(payload = {}, fallbackCacheSeconds = 15) {
  const normalizedStatus = String(payload?.status || "").toLowerCase();
  if (normalizedStatus === "live") return 4;
  if (normalizedStatus === "upcoming") return 20;
  return fallbackCacheSeconds;
}

function jsonMatchResponse(payload, fallbackCacheSeconds = 15, status = 200) {
  const cacheSeconds = getMatchResponseCacheSeconds(payload, fallbackCacheSeconds);
  const response = jsonResponse(payload, cacheSeconds, status);
  const normalizedStatus = String(payload?.status || "").toLowerCase();
  if (normalizedStatus === "live") {
    response.headers.set(
      "Cache-Control",
      "public, max-age=4, s-maxage=4, stale-while-revalidate=2, stale-if-error=30"
    );
    response.headers.set("X-Cache-TTL-Reason", "live-match-fast-refresh");
  }
  return response;
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const sport = normalizeSportParam(url.searchParams.get("sport") || "soccer", url.searchParams.get("league") || "");
  const league = normalizeLeagueParam(url.searchParams.get("league") || "", sport || getDefaultLeague("soccer"));

  if (!id) {
    return jsonResponse({ notFound: true, meta: buildFeedMeta({ degraded: true }) }, 30, 404);
  }

  try {
    let summaryData = null;
    for (const candidate of buildSummaryCandidates(id, sport, league)) {
      try {
        const candidateUrl = new URL(candidate);
        const pathMatch = candidateUrl.pathname.match(/\/sports\/([^/]+)\/([^/]+)\/summary$/);
        if (!pathMatch) continue;
        const [, candidateSport, candidateLeague] = pathMatch;
        const eventId = candidateUrl.searchParams.get("event") || id;
        summaryData = await fetchExternalJson(candidateSport, candidateLeague, "summary", { event: eventId });
        if (summaryData?.header?.competitions?.length) break;
      } catch (error) {
        summaryData = null;
      }
    }

    if (!summaryData?.header?.competitions?.length) {
      const feedFallback = await findFeedFallback(request, id, sport, league);
      if (feedFallback) {
        const rosterHydratedFeed = await hydrateSummaryLineups(feedFallback, sport, league);
        return jsonMatchResponse({ ...sanitizeDisplayPayload(rosterHydratedFeed), meta: buildFeedMeta({ fallback: "feed" }) }, 15);
      }

      const fallback = await findScoreboardFallback(id, sport, league);
      if (!fallback) {
        return jsonResponse({ notFound: true, meta: buildFeedMeta({ degraded: true }) }, 30, 404);
      }
      const rosterHydratedFallback = await hydrateSummaryLineups(fallback, sport, league);
      return jsonMatchResponse({ ...sanitizeDisplayPayload(rosterHydratedFallback), meta: buildFeedMeta() }, 15);
    }

    let normalizedSummary = normalizeSummary(summaryData, sport, league);
    normalizedSummary = await hydrateCricketCommentary(normalizedSummary, summaryData);
    normalizedSummary = await hydrateSummaryLineups(normalizedSummary, sport, league);
    normalizedSummary = sanitizeDisplayPayload(normalizedSummary);
    if (needsSummaryHydration(normalizedSummary)) {
      const feedFallback = await findFeedFallback(request, id, sport, league);
      if (feedFallback) {
        const mergedSummary = mergeSummaryPayload(normalizedSummary, feedFallback);
        const rosterHydratedMerged = await hydrateSummaryLineups(mergedSummary, sport, league);
        return jsonMatchResponse({ ...sanitizeDisplayPayload(rosterHydratedMerged), meta: buildFeedMeta({ fallback: "summary+feed" }) }, 15);
      }

      const scoreboardFallback = await findScoreboardFallback(id, sport, league);
      if (scoreboardFallback) {
        const mergedSummary = mergeSummaryPayload(normalizedSummary, scoreboardFallback);
        const rosterHydratedMerged = await hydrateSummaryLineups(mergedSummary, sport, league);
        return jsonMatchResponse({ ...sanitizeDisplayPayload(rosterHydratedMerged), meta: buildFeedMeta({ fallback: "summary+scoreboard" }) }, 15);
      }
    }

    return jsonMatchResponse({ ...normalizedSummary, meta: buildFeedMeta() }, 15);
  } catch (error) {
    return jsonResponse({ error: error.message, meta: buildFeedMeta({ degraded: true }) }, 15, 500);
  }
}
