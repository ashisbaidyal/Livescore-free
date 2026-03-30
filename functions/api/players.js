import {
  buildFeedMeta,
  coreApiUrl,
  dedupeById,
  fetchJson,
  jsonResponse,
  normalizeAthlete,
  normalizeLeagueParam,
  normalizeSportParam,
  resolveTeamFromRef,
  SPORT_LEAGUES,
  isIplLeague,
  fetchText,
  getIplSquadArticleUrl,
  getIplScoreboardUrl,
  normalizeTeamEntry,
  normalizeScoreboardEvent
} from "./_shared.js";

function stripHtml(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value = "") {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function deriveShortName(fullName = "") {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return parts.join(" ");
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

async function getIplPlayers(limit = 24) {
  const [scoreboard, html] = await Promise.all([
    fetchJson(getIplScoreboardUrl()),
    fetchText(getIplSquadArticleUrl()).catch(() => "")
  ]);

  const teams = (scoreboard.teams || []).map((t) => normalizeTeamEntry(t, "cricket", "ipl"));
  const teamByKey = new Map(teams.map((t) => [String(t.name || "").toLowerCase().replace(/[^a-z0-9]+/g, ""), t]));
  const athletes = [];
  const seen = new Set();

  const headings = Array.from(html.matchAll(/<h2>([\s\S]*?)<\/h2>/gi));
  headings.forEach((heading, idx) => {
    const teamName = stripHtml(heading[1]);
    const key = String(teamName).toLowerCase().replace(/[^a-z0-9]+/g, "");
    const team = teamByKey.get(key);
    if (!team) return;
    const start = (heading.index || 0) + heading[0].length;
    const end = headings[idx + 1]?.index || html.length;
    const section = html.slice(start, end);
    const rosterMatch = section.match(/<p><b>Full(?:\s+[^<]+)?\s+squad<\/b><\/p>\s*<ul>([\s\S]*?)<\/ul>/i);
    if (!rosterMatch) return;
    const categories = Array.from(rosterMatch[1].matchAll(/<li>\s*<p><b>([^<]+)<\/b>:\s*([\s\S]*?)<\/li>/gi));
    categories.forEach((cat) => {
      const category = stripHtml(cat[1]);
      const names = stripHtml(cat[2]).replace(/\s*,\s*/g, ",").replace(/\.+$/, "").split(",").map((n) => n.trim()).filter(Boolean);
      names.forEach((name) => {
        const id = `ipl-${team.id}-${slugify(name)}`;
        if (seen.has(id)) return;
        seen.add(id);
        athletes.push({
          id,
          fullName: name,
          shortName: deriveShortName(name),
          position: { name: category, displayName: category, abbreviation: category.slice(0, 3).toUpperCase() },
          headshot: { href: team.logo || "" },
          team: { id: team.id, name: team.name, abbreviation: team.abbreviation, logo: team.logo },
          sport: "cricket",
          league: "ipl"
        });
      });
    });
  });

  return athletes.slice(0, limit);
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const inputSport = url.searchParams.get("sport") || url.searchParams.get("s") || "soccer";
  const inputLeague = url.searchParams.get("league") || url.searchParams.get("l") || "";
  const sport = normalizeSportParam(inputSport, inputLeague);
  const league = inputLeague
    ? normalizeLeagueParam(inputLeague, sport)
    : sport === "all" ? "" : normalizeLeagueParam("", sport);
  const parsedLimit = parseInt(url.searchParams.get("limit") || "24", 10);
  const limit = Math.max(1, Math.min(Number.isFinite(parsedLimit) ? parsedLimit : 24, 48));
  const teamId = url.searchParams.get("team") || "";

  try {
    if (isIplLeague(sport, league)) {
      const athletes = await getIplPlayers(limit);
      const filtered = teamId ? athletes.filter((a) => String(a.team?.id) === String(teamId)) : athletes;
      return jsonResponse({
        athletes: filtered,
        meta: buildFeedMeta({ type: "players", sport, league })
      }, 300);
    }

    const leagues = league
      ? [{ sport, league }]
      : (SPORT_LEAGUES[sport] || []).slice(0, 3).map((l) => ({ sport, league: l }));

    const results = await Promise.all(
      leagues.map(async ({ sport: s, league: l }) => {
        try {
          const list = await fetchJson(coreApiUrl(s, l, "athletes", { limit, active: "true" }));
          const refs = (list.items || list.entries || list.athletes || [])
            .map((i) => i.$ref || i.ref || i.href || "")
            .filter(Boolean)
            .slice(0, limit);
          return Promise.all(
            refs.map(async (ref) => {
              try {
                const detail = await fetchJson(ref);
                const athlete = normalizeAthlete(detail, { sport: s, league: l });
                const team = athlete.teamRef ? await resolveTeamFromRef(athlete.teamRef) : null;
                return {
                  ...athlete,
                  team: team ? { id: team.id, name: team.name, abbreviation: team.abbreviation, logo: team.logo } : null
                };
              } catch { return null; }
            })
          );
        } catch { return []; }
      })
    );

    const athletes = dedupeById(results.flat().filter(Boolean));
    const filtered = teamId ? athletes.filter((a) => String(a.team?.id) === String(teamId)) : athletes;

    return jsonResponse({
      athletes: filtered.slice(0, limit),
      meta: buildFeedMeta({ type: "players", sport, league, feeds: leagues.length })
    }, 300);
  } catch (error) {
    return jsonResponse({
      athletes: [],
      error: error.message,
      meta: buildFeedMeta({ degraded: true, type: "players", sport, league })
    }, 30, 500);
  }
}
