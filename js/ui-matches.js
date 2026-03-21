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
      <span class="flex items-center gap-1.5 bg-primary text-white px-2.5 py-1 rounded-sm text-[9px] font-black italic uppercase">
        <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
        ${escapeHtml(match.statusDetail || "LIVE")}
      </span>
    `;
  }
  if (match.status === "final") {
    return `
      <span class="bg-surface-container-highest text-on-surface/40 px-2.5 py-1 rounded-sm text-[9px] font-black tracking-widest uppercase italic">
        FINAL
      </span>
    `;
  }
  return `
    <span class="bg-surface-container-highest text-on-surface/40 px-2.5 py-1 rounded-sm text-[9px] font-black tracking-widest uppercase italic border border-white/5">
      ${escapeHtml(match.statusDetail || "UPCOMING")}
    </span>
  `;
}

export function generatePremiumSportSVG(sportGroup, seedString) {
  let hash = 0;
  const safeSeed = String(seedString || sportGroup || "livescorefree.online");
  for (let i = 0; i < safeSeed.length; i++) {
    hash = safeSeed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    { bg1: '#0d0404', bg2: '#2a0a0d', accent: '#CC1616' },
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

export function renderlivescorefree.onlineMatchCard(match) {
  const route = routeForMatch(match);
  const matchId = `match-${match.sportGroup}-${match.slug}`;
  const isLive = match.status === "live";
  const homeScore = match.homeScore || 0;
  const awayScore = match.awayScore || 0;
  const status = isLive ? (match.statusDetail || "LIVE") : (match.status === "final" ? "FINAL" : formatTime(match.date));

  return `
    <div id="${matchId}" class="glass-card border border-white/5 p-8 rounded-2xl flex flex-col gap-8 group hover:border-primary/50 transition-all shadow-2xl relative overflow-hidden" data-match-key="${match.sportGroup}:${match.slug}">
      <div class="flex justify-between items-center relative">
        <div class="flex items-center gap-2">
          <span class="text-primary font-black italic text-[9px] tracking-[0.3em] font-headline uppercase">${escapeHtml(match.leagueLabel || match.sportGroup)}</span>
          <span class="w-1 h-1 bg-white/20 rounded-full"></span>
          <span class="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 font-headline">ARENA SIGNAL</span>
        </div>
        ${statusBadge(match)}
      </div>
      
      <a href="${route}" data-link class="flex justify-between items-center relative no-underline text-inherit transform group-hover:scale-[1.02] transition-transform duration-500">
        <div class="flex flex-col items-center gap-4 w-1/3">
          <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center font-black italic overflow-hidden border border-white/5 shadow-2xl group-hover:border-primary/30 transition-colors">
            ${renderPmTeamLogo({ teamLogo: match.homeLogo, teamName: match.homeName, teamAbbr: match.homeAbbr, fallbackIcon: (match.homeName || "H")[0] })}
          </div>
          <span class="text-[10px] font-black uppercase italic tracking-tighter text-center truncate w-full font-headline">${escapeHtml(match.homeAbbr || match.homeName)}</span>
        </div>
        
        <div class="flex flex-col items-center w-1/3">
          <span class="text-5xl font-black italic text-primary font-headline tracking-tighter" id="${matchId}-scores">${homeScore} - ${awayScore}</span>
          <span class="text-[10px] font-black text-on-surface/40 mt-3 tracking-[0.2em] uppercase font-headline animate-pulse" id="${matchId}-status-detail">${escapeHtml(status)}</span>
        </div>
        
        <div class="flex flex-col items-center gap-4 w-1/3">
          <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center font-black italic overflow-hidden border border-white/5 shadow-2xl group-hover:border-primary/30 transition-colors">
            ${renderPmTeamLogo({ teamLogo: match.awayLogo, teamName: match.awayName, teamAbbr: match.awayAbbr, fallbackIcon: (match.awayName || "A")[0] })}
          </div>
          <span class="text-[10px] font-black uppercase italic tracking-tighter text-center truncate w-full font-headline">${escapeHtml(match.awayAbbr || match.awayName)}</span>
        </div>
      </a>

      <a href="${route}" data-link class="w-full py-4 kinetic-gradient rounded-xl text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 no-underline opacity-90 hover:opacity-100 transition-all font-headline shadow-lg group-hover:shadow-primary/20">
         <span class="material-symbols-outlined text-lg">play_circle</span> WATCH HD
      </a>
    </div>
  `;
}

export function renderMatchCard(match) {
  return renderlivescorefree.onlineMatchCard(match);
}

export function renderlivescorefree.onlineMatchGrid(matches, emptyMessage = "No arena events live at this frequency.") {
  if (!matches.length) return `<div class="bg-surface-container border border-white/5 p-12 rounded-lg flex flex-col items-center text-center gap-4">
    <span class="material-symbols-outlined text-4xl opacity-20 animate-pulse">sensors_off</span>
    <span class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 font-headline">${escapeHtml(emptyMessage)}</span>
  </div>`;
  return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${matches.map(renderlivescorefree.onlineMatchCard).join("")}</div>`;
}

export function renderMatchGrid(matches, emptyMessage) {
  return renderlivescorefree.onlineMatchGrid(matches, emptyMessage);
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





