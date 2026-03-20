import { 
  qs, 
  qsa, 
  escapeHtml, 
  formatTime,
  formatDate
} from "./utils.js";
import { 
  SPORT_GROUPS, 
  SPORT_IMAGE_MAP, 
  TOP_LEAGUE_KEYS,
  LEAGUE_IMAGE_MAP,
  LEAGUES
} from "./constants.js";
import { state } from "./state.js";
import { 
  routeForMatch, 
  routeForTeam,
  routeForPlayer
} from "./routing.js";

export function toneClassForMatchStatus(status = "") {
  if (status === "live") return "tone-live";
  if (status === "final") return "tone-final";
  return "tone-upcoming";
}

export function renderPmTeamLogo({ teamLogo, teamName, teamAbbr, fallbackIcon, loading = "lazy" }) {
  if (teamLogo) {
    return `<img src="${escapeHtml(teamLogo)}" alt="${escapeHtml(teamName)}" class="pm-team-logo" loading="${loading}" onerror="this.onerror=null;this.replaceWith(document.createRange().createContextualFragment('<div class=\\'pm-team-logo-fallback\\'>${escapeHtml(teamAbbr || fallbackIcon)}</div>'))" style="border-radius: 4px !important; width: 32px; height: 32px; object-fit: contain;">`;
  }
  return `<div class="pm-team-logo-fallback" style="border-radius: 4px !important; width: 32px; height: 32px; background: var(--gs-surface-high); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem;">${escapeHtml(teamAbbr || fallbackIcon)}</div>`;
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
    return `<span class="badge badge-live" style="background: var(--gs-primary); color: white; border-radius: 0 !important; font-weight: 800; padding: 6px 12px; font-size: 0.75rem;"><span class="badge-dot pulsate-live" style="width: 6px; height: 6px; background: white; border-radius: 50% !important; display: inline-block; margin-right: 6px;"></span>${escapeHtml(match.statusDetail || "LIVE")}</span>`;
  }
  if (match.status === "final") {
    return `<span class="badge badge-final" style="background: var(--gs-inverse-surface); color: white; border-radius: 0 !important; font-weight: 800; padding: 6px 12px; font-size: 0.75rem;">FINAL</span>`;
  }
  return `<span class="badge badge-upcoming" style="background: var(--gs-surface-high); color: var(--gs-on-surface); border-radius: 0 !important; font-weight: 800; padding: 6px 12px; font-size: 0.75rem;">${escapeHtml(match.statusDetail || "UPCOMING")}</span>`;
}

export function generatePremiumSportSVG(sportGroup, seedString) {
  let hash = 0;
  const safeSeed = String(seedString || sportGroup || "livescoreFree.online");
  for (let i = 0; i < safeSeed.length; i++) {
    hash = safeSeed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    { bg1: '#0d0404', bg2: '#2a0a0d', accent: '#ae131a' },
    { bg1: '#050b14', bg2: '#0b162a', accent: '#3b82f6' },
    { bg1: '#041008', bg2: '#082614', accent: '#10b981' }
  ];
  const p = palettes[Math.abs(hash) % palettes.length];
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${p.bg1};stop-opacity:1"/><stop offset="100%" style="stop-color:${p.bg2};stop-opacity:1"/></linearGradient></defs><rect width="800" height="400" fill="url(#g)"/><rect x="350" y="150" width="100" height="100" fill="${p.accent}" fill-opacity="0.1" transform="rotate(45 400 200)"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
}

export function buildAutoBackgroundAttrs({ sportGroup = "", leagueKey = "", seedText = "", fit = "cover", position = "center", strength = 0.22 } = {}) {
  const svgDataUri = generatePremiumSportSVG(sportGroup, seedText || leagueKey);
  return `style="--context-bg-image:url('${svgDataUri}');--context-bg-fit:${fit};--context-bg-position:${position};--context-bg-strength:${strength};"`;
}

export function renderMatchCard(match) {
  const toneClass = toneClassForMatchStatus(match.status);
  const route = routeForMatch(match);
  const matchId = `match-${match.sportGroup}-${match.slug}`;
  
  return `
    <article id="${matchId}" class="match-ticket gs-depth-shadow ${toneClass}" data-match-key="${match.sportGroup}:${match.slug}" style="background: var(--gs-surface-lowest); border: none; margin-bottom: 2px;">
      <a class="ticket-link" data-link href="${route}" style="display: block; text-decoration: none; color: inherit; padding: 24px;">
        <div class="ticket-body" style="display: flex; align-items: center; justify-content: space-between; gap: 24px;">
          <div class="ticket-team" style="flex: 1; text-align: left; display: flex; align-items: center; gap: 16px;">
            ${renderPmTeamLogo({ teamLogo: match.homeLogo, teamName: match.homeName, teamAbbr: match.homeAbbr, fallbackIcon: "H" })}
            <div class="ticket-team-name" style="font-family: var(--soccer-font-head); font-weight: 700; text-transform: uppercase; font-size: 1.1rem; letter-spacing: -0.01em;">${escapeHtml(match.homeName)}</div>
          </div>
          
          <div class="ticket-center" style="text-align: center; min-width: 120px; border-left: 2px solid var(--gs-surface-low); border-right: 2px solid var(--gs-surface-low); padding: 0 20px;">
            <div class="ticket-score" style="display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 2rem; font-weight: 800; font-family: var(--soccer-font-head); line-height: 1;">
              <span id="${matchId}-home-score" class="${match.status === 'live' ? 'pulsate-live' : ''}" style="${match.status === 'live' ? 'color: var(--gs-primary);' : ''}">${escapeHtml(match.homeScore)}</span>
              <span style="opacity: 0.3; font-size: 1.2rem;">:</span>
              <span id="${matchId}-away-score" class="${match.status === 'live' ? 'pulsate-live' : ''}" style="${match.status === 'live' ? 'color: var(--gs-primary);' : ''}">${escapeHtml(match.awayScore)}</span>
            </div>
            <div id="${matchId}-status" class="ticket-status" style="margin-top: 10px;">
               ${statusBadge(match)}
            </div>
          </div>
          
          <div class="ticket-team" style="flex: 1; text-align: right; display: flex; align-items: center; justify-content: flex-end; gap: 16px;">
            <div class="ticket-team-name" style="font-family: var(--soccer-font-head); font-weight: 700; text-transform: uppercase; font-size: 1.1rem; letter-spacing: -0.01em;">${escapeHtml(match.awayName)}</div>
            ${renderPmTeamLogo({ teamLogo: match.awayLogo, teamName: match.awayName, teamAbbr: match.awayAbbr, fallbackIcon: "A" })}
          </div>
        </div>
        
        <div class="ticket-footer" style="margin-top: 20px; padding-top: 16px; border-top: 2px solid var(--gs-surface-low); display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--gs-on-surface); opacity: 0.6;">
          <span>${escapeHtml(match.leagueLabel)} ${match.venue ? `| ${escapeHtml(match.venue)}` : ''}</span>
          <span id="${matchId}-meta">${formatDate(match.date)} @ ${formatTime(match.date)}</span>
        </div>
      </a>
    </article>
  `;
}

export function renderMatchGrid(matches, emptyMessage) {
  if (!matches.length) return `<div class="message-box">${escapeHtml(emptyMessage)}</div>`;
  return `<div class="grid" style="display: flex; flex-direction: column; gap: 4px;">${matches.map(renderMatchCard).join("")}</div>`;
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

export function trendingMatches(limit = 10) {
  return [...state.matches]
    .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
    .slice(0, limit);
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





