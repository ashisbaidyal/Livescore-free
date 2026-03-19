import { 
  qs, 
  qsa, 
  escapeHtml, 
  formatTime 
} from "./utils.js";
import { 
  SPORT_GROUPS, 
  SPORT_IMAGE_MAP, 
  TOP_LEAGUE_KEYS,
  LEAGUE_IMAGE_MAP
} from "./constants.js";
import { 
  routeForMatch, 
  routeForTeam,
  routeForPlayer
} from "./routing.js";
import { 
  getStatusText 
} from "./api.js";

export function toneClassForMatchStatus(status = "") {
  if (status === "live") return "tone-live";
  if (status === "final") return "tone-final";
  return "tone-upcoming";
}

export function renderPmTeamLogo({ teamLogo, teamName, teamAbbr, fallbackIcon, loading = "lazy" }) {
  if (teamLogo) {
    return `<img src="${escapeHtml(teamLogo)}" alt="${escapeHtml(teamName)}" class="pm-team-logo" loading="${loading}" onerror="this.onerror=null;this.replaceWith(document.createRange().createContextualFragment('<div class=\\'pm-team-logo-fallback\\'>${escapeHtml(teamAbbr || fallbackIcon)}</div>'))">`;
  }
  return `<div class="pm-team-logo-fallback">${escapeHtml(teamAbbr || fallbackIcon)}</div>`;
}

export function renderTeamNameControl({ sportGroup, teamId, teamName, teamAbbr, teamLogo, fallbackIcon, className }) {
  const logo = teamLogo || "";
  const route = routeForTeam({ sportGroup, teamId, teamName });
  return `
    <a class="${className}" data-link href="${route}">
      ${renderPmTeamLogo({ teamLogo: logo, teamName, teamAbbr, fallbackIcon })}
      <span>${escapeHtml(teamName)}</span>
    </a>
  `;
}

export function renderPlayerNameControl({ sportGroup, playerId, playerName, playerLogo, fallbackIcon, className }) {
  const route = routeForPlayer({ sportGroup, playerId, playerName });
  return `
    <a class="${className}" data-link href="${route}">
      <span>${escapeHtml(playerName)}</span>
    </a>
  `;
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

export function generatePremiumSportSVG(sportGroup, seedString) {
  let hash = 0;
  const safeSeed = String(seedString || sportGroup || "LiveScoreFree");
  for (let i = 0; i < safeSeed.length; i++) {
    hash = safeSeed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    { bg1: '#050b14', bg2: '#0b1b36', accent: '#3b82f6' },
    { bg1: '#0d0404', bg2: '#2a0a0d', accent: '#ef4444' },
    { bg1: '#040d08', bg2: '#082614', accent: '#10b981' }
  ];
  const p = palettes[Math.abs(hash) % palettes.length];
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${p.bg1};stop-opacity:1"/><stop offset="100%" style="stop-color:${p.bg2};stop-opacity:1"/></linearGradient></defs><rect width="800" height="400" fill="url(#g)"/><circle cx="400" cy="200" r="150" fill="${p.accent}" fill-opacity="0.05"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
}

export function buildAutoBackgroundAttrs({ sportGroup = "", leagueKey = "", seedText = "", fit = "cover", position = "center", strength = 0.22 } = {}) {
  const svgDataUri = generatePremiumSportSVG(sportGroup, seedText || leagueKey);
  return `style="--context-bg-image:url('${svgDataUri}');--context-bg-fit:${fit};--context-bg-position:${position};--context-bg-strength:${strength};"`;
}

export function renderMatchCard(match) {
  const toneClass = toneClassForMatchStatus(match.status);
  const route = routeForMatch(match);
  return `
    <article class="match-card-hero-v2 auto-bg-surface ${toneClass}" data-match-key="${match.sportGroup}:${match.slug}" ${buildAutoBackgroundAttrs({ sportGroup: match.sportGroup, leagueKey: match.leagueKey })}>
      <a class="mcp-link" data-link href="${route}">
        <div class="mcp-header">
          <span class="mcp-league">${escapeHtml(match.leagueLabel)}</span>
          ${statusBadge(match)}
        </div>
        <div class="mcp-teams">
          <div class="mcp-team">
             ${renderPmTeamLogo({ teamLogo: match.homeLogo, teamName: match.homeName, teamAbbr: match.homeAbbr, fallbackIcon: "H" })}
             <span>${escapeHtml(match.homeName)}</span>
          </div>
          <div class="mcp-score">${escapeHtml(match.homeScore)} - ${escapeHtml(match.awayScore)}</div>
          <div class="mcp-team">
             ${renderPmTeamLogo({ teamLogo: match.awayLogo, teamName: match.awayName, teamAbbr: match.awayAbbr, fallbackIcon: "A" })}
             <span>${escapeHtml(match.awayName)}</span>
          </div>
        </div>
      </a>
    </article>
  `;
}

export function renderMatchGrid(matches, emptyMessage) {
  if (!matches.length) return `<div class="message-box">${escapeHtml(emptyMessage)}</div>`;
  return `<div class="grid">${matches.map(renderMatchCard).join("")}</div>`;
}

export function getSportImagePath(sport) {
  return SPORT_IMAGE_MAP[sport] || SPORT_IMAGE_MAP.default;
}

export function getLeagueImagePath(leagueKey, sportGroup) {
  return LEAGUE_IMAGE_MAP[leagueKey] || SPORT_IMAGE_MAP[sportGroup] || SPORT_IMAGE_MAP.default;
}

export function topLeagueSummaries() {
  const items = [];
  for (const key of TOP_LEAGUE_KEYS) {
    const league = LEAGUES[key];
    if (league) {
      const liveCount = (state.liveMatches || []).filter(m => m.leagueKey === key).length;
      items.push({ 
        key, 
        label: league.label, 
        sportGroup: league.sportGroup, 
        live: liveCount 
      });
    }
  }
  return items;
}

export function trendingMatches() {
  return state.matches.slice(0, 10);
}

export function renderSportFilterTabs(matches) {
  const sports = Array.from(new Set(matches.map(m => m.sportGroup)));
  if (sports.length <= 1) return "";
  return `
    <div class="sport-tabs">
       <button class="sport-tab active" data-sport="all">All</button>
       ${sports.map(s => `<button class="sport-tab" data-sport="${s}">${escapeHtml(SPORT_GROUPS[s]?.label || s)}</button>`).join("")}
    </div>
  `;
}

export function bindSportFilterTabs() {
  const tabs = qsa(".sport-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const sport = tab.getAttribute("data-sport");
      const cards = qsa(".match-card-hero-v2");
      cards.forEach(card => {
        const cardSport = card.getAttribute("data-match-key").split(":")[0];
        card.style.display = (sport === "all" || cardSport === sport) ? "" : "none";
      });
    });
  });
}
