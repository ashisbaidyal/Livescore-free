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
    return `
      <span class="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5 uppercase">
        <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
        ${escapeHtml(match.statusDetail || "LIVE")}
      </span>
    `;
  }
  if (match.status === "final") {
    return `
      <span class="bg-surface-container-highest text-on-surface/40 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">
        FINAL
      </span>
    `;
  }
  return `
    <span class="bg-surface-container-highest text-on-surface/40 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">
      ${escapeHtml(match.statusDetail || "UPCOMING")}
    </span>
  `;
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
  const route = routeForMatch(match);
  const matchId = `match-${match.sportGroup}-${match.slug}`;
  const isLive = match.status === "live";

  return `
    <div id="${matchId}" class="bg-surface-container-high rounded-xl overflow-hidden group border border-white/5 hover:border-primary/30 transition-all" data-match-key="${match.sportGroup}:${match.slug}">
      <a href="${route}" data-link class="p-5 flex flex-col gap-4 no-underline text-inherit block">
        <div class="flex justify-between items-center">
          <span class="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest font-headline">${escapeHtml(match.leagueLabel)}</span>
          <div id="${matchId}-status">
            ${statusBadge(match)}
          </div>
        </div>
        
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center border border-white/5 font-black text-[10px] uppercase">
                ${renderPmTeamLogo({ teamLogo: match.homeLogo, teamName: match.homeName, teamAbbr: match.homeAbbr, fallbackIcon: (match.homeName || "H")[0] })}
              </div>
              <span class="font-bold text-lg font-headline tracking-tighter truncate max-w-[140px]">${escapeHtml(match.homeName)}</span>
            </div>
            <span id="${matchId}-home-score" class="text-3xl font-black italic font-headline ${isLive ? 'text-primary' : 'text-on-surface'}">${escapeHtml(match.homeScore || 0)}</span>
          </div>
          
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center border border-white/5 font-black text-[10px] uppercase">
                ${renderPmTeamLogo({ teamLogo: match.awayLogo, teamName: match.awayName, teamAbbr: match.awayAbbr, fallbackIcon: (match.awayName || "A")[0] })}
              </div>
              <span class="font-bold text-lg font-headline tracking-tighter truncate max-w-[140px] ${isLive ? 'text-on-surface' : 'text-on-surface/60'}">${escapeHtml(match.awayName)}</span>
            </div>
            <span id="${matchId}-away-score" class="text-3xl font-black italic font-headline ${isLive ? 'text-primary' : 'text-on-surface/60'}">${escapeHtml(match.awayScore || 0)}</span>
          </div>
        </div>
        
        <div class="pt-4 border-t border-white/5 flex items-center gap-3">
          <div class="bg-surface-container-lowest px-3 py-1 rounded text-[10px] font-bold text-primary italic uppercase tracking-tighter">
             ${formatTime(match.date)}
          </div>
          <span id="${matchId}-meta" class="text-[11px] font-medium text-on-surface/70 truncate uppercase tracking-tighter">
            ${match.venue ? escapeHtml(match.venue) : formatDate(match.date)}
          </span>
        </div>
      </a>
    </div>
  `;
}

export function renderMatchGrid(matches, emptyMessage) {
  if (!matches.length) return `<div class="message-box">${escapeHtml(emptyMessage)}</div>`;
  return `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">${matches.map(renderMatchCard).join("")}</div>`;
}

export function getSportIcon(sportGroup) {
  const icons = {
    football: "sports_soccer",
    basketball: "sports_basketball",
    nfl: "sports_football",
    tennis: "sports_tennis",
    mma: "sports_mma",
    f1: "settings_input_antenna",
    cricket: "sports_cricket",
    hockey: "sports_hockey",
    baseball: "sports_baseball",
    rugby: "sports_rugby"
  };
  return icons[sportGroup] || "sports_soccer";
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





