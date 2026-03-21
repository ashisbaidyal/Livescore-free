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

export function renderKineticMatchCard(m) {
  const route = routeForMatch(m);
  const matchId = `match-${m.sportGroup}-${m.slug}`;
  const isLive = m.status === "live";
  
  return `
    <a href="${route}" data-link data-sport-group="${m.sportGroup}" 
       class="live-match-card-item group block bg-[#141414] rounded-2xl border border-white/5 hover:border-primary/50 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden no-underline text-on-surface">
      
      <!-- Top Strip: League & Status -->
      <div class="px-6 py-3 border-b border-white/5 flex justify-between items-center bg-black/20">
        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic truncate max-w-[70%]">
          ${escapeHtml(m.leagueLabel || m.sportGroup)}
        </span>
        <div class="flex items-center gap-2">
          ${isLive ? `
            <span class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <span class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
              <span class="text-[8px] font-black uppercase text-primary italic">LIVE</span>
            </span>
          ` : `
            <span class="text-[9px] font-bold text-on-surface/30 uppercase tracking-widest italic">${m.status === 'final' ? 'FINAL' : formatTime(m.date)}</span>
          `}
        </div>
      </div>

      <!-- Main Content: Teams & Scores -->
      <div class="p-8 flex items-center justify-between gap-4 relative">
        <!-- Shine Effect -->
        <div class="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

        <!-- Home Team -->
        <div class="flex flex-col items-center gap-3 flex-1">
          <div class="w-16 h-16 rounded-full bg-black/40 border border-white/5 p-3 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            ${renderPmTeamLogo({ teamLogo: m.homeLogo, teamName: m.homeName, teamAbbr: m.homeAbbr, fallbackIcon: (m.homeName || "H")[0] })}
          </div>
          <span class="text-[10px] font-black uppercase text-center truncate w-full tracking-tighter opacity-80 group-hover:opacity-100">${escapeHtml(m.homeName)}</span>
        </div>

        <!-- Score / VS -->
        <div class="flex flex-col items-center gap-1 z-10">
          <div class="flex items-center gap-4 text-4xl font-black italic tracking-tighter">
            <span class="${isLive ? 'text-white' : 'text-on-surface/40'}" id="${matchId}-home-score">${m.homeScore || 0}</span>
            <span class="text-primary/20">-</span>
            <span class="${isLive ? 'text-white' : 'text-on-surface/40'}" id="${matchId}-away-score">${m.awayScore || 0}</span>
          </div>
          ${isLive ? `
            <span class="text-[9px] font-black uppercase tracking-[0.3em] text-primary italic animate-pulse" id="${matchId}-status-detail">${escapeHtml(m.statusDetail || 'IN PROGRESS')}</span>
          ` : `
            <span class="text-[9px] font-black uppercase tracking-[0.3em] text-on-surface/20 italic">ARENA SIGNAL</span>
          `}
        </div>

        <!-- Away Team -->
        <div class="flex flex-col items-center gap-3 flex-1">
          <div class="w-16 h-16 rounded-full bg-black/40 border border-white/5 p-3 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            ${renderPmTeamLogo({ teamLogo: m.awayLogo, teamName: m.awayName, teamAbbr: m.awayAbbr, fallbackIcon: (m.awayName || "A")[0] })}
          </div>
          <span class="text-[10px] font-black uppercase text-center truncate w-full tracking-tighter opacity-80 group-hover:opacity-100">${escapeHtml(m.awayName)}</span>
        </div>
      </div>

      <!-- Footer: Call to Action -->
      <div class="px-6 py-4 bg-black/40 flex items-center justify-between border-t border-white/5">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-xs text-on-surface/20" style="font-variation-settings: 'wght' 200;">sensors</span>
          <span class="text-[8px] font-bold text-on-surface/20 uppercase tracking-widest">ENCRYPTED FEED v2</span>
        </div>
        <div class="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
          <span class="text-[9px] font-black uppercase tracking-widest text-primary italic">STADIUM HUB</span>
          <span class="material-symbols-outlined text-sm text-primary">arrow_forward</span>
        </div>
      </div>
    </a>
  `;
}

export function renderLivescoreFreeMatchCard(match) {
  if (match.status === 'live') return renderKineticMatchCard(match);
  const route = routeForMatch(match);
  const isFinal = match.status === 'final';
  
  return `
    <a href="${route}" data-link class="bg-surface-container border border-white/5 p-6 rounded-lg flex flex-col gap-6 group hover:border-primary/50 transition-all shadow-2xl relative overflow-hidden no-underline text-on-surface">
      <div class="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full pointer-events-none"></div>
      <div class="flex justify-between items-center relative">
        <div class="flex items-center gap-2">
          <span class="text-primary font-black italic text-[10px] tracking-widest">${escapeHtml(match.leagueLabel || match.sportGroup)}</span>
          <span class="w-1 h-1 bg-white/20 rounded-full"></span>
          <span class="text-[10px] font-black uppercase tracking-widest opacity-60">${isFinal ? 'FINAL' : 'UPCOMING'}</span>
        </div>
        ${statusBadge(match)}
      </div>
      <div class="flex justify-between items-center relative">
        <div class="flex flex-col items-center gap-3 w-1/3">
          <img src="${escapeHtml(match.homeBadge || match.homeLogo || '')}" class="w-12 h-12 object-contain bg-white/5 rounded-full p-1" alt="${escapeHtml(match.homeName)}">
          <span class="text-sm font-black uppercase italic tracking-tighter text-center">${escapeHtml(match.homeAbbr || (match.homeName ? match.homeName.substring(0,6) : 'HOME'))}</span>
        </div>
        <div class="flex flex-col items-center w-1/3">
          <span class="text-4xl font-black italic ${isFinal ? 'text-white' : 'text-primary'}">${match.homeScore || 0} - ${match.awayScore || 0}</span>
          <span class="text-[10px] font-black text-on-surface-variant mt-2 tracking-widest uppercase">${escapeHtml(match.statusDetail || (isFinal ? 'FINISHED' : 'WAITING'))}</span>
        </div>
        <div class="flex flex-col items-center gap-3 w-1/3">
          <img src="${escapeHtml(match.awayBadge || match.awayLogo || '')}" class="w-12 h-12 object-contain bg-white/5 rounded-full p-1" alt="${escapeHtml(match.awayName)}">
          <span class="text-sm font-black uppercase italic tracking-tighter text-center">${escapeHtml(match.awayAbbr || (match.awayName ? match.awayName.substring(0,6) : 'AWAY'))}</span>
        </div>
      </div>
    </a>
  `;
}

export function renderMatchCard(match) {
  return renderLivescoreFreeMatchCard(match);
}


export function renderLivescoreFreeMatchGrid(matches, emptyMessage = "No arena events live at this frequency.") {
  if (!matches.length) return `<div class="bg-surface-container border border-white/5 p-12 rounded-lg flex flex-col items-center text-center gap-4">
    <span class="material-symbols-outlined text-4xl opacity-20 animate-pulse">sensors_off</span>
    <span class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 font-headline">${escapeHtml(emptyMessage)}</span>
  </div>`;
  return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${matches.map(renderLivescoreFreeMatchCard).join("")}</div>`;
}

export function renderMatchGrid(matches, emptyMessage) {
  return renderLivescoreFreeMatchGrid(matches, emptyMessage);
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





