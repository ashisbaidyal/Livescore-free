import {
  qs,
  escapeHtml,
  formatDateTime,
  renderDonationProgress,
  getTrustSignals
} from "./utils.js";
import { state } from "./state.js";
import { SPORT_GROUPS, LEAGUES, TOP_LEAGUE_KEYS, DONATION_KOFI_URL } from "./constants.js";
import { parseRoute, getCurrentPath, routeForMatch, routeForLeague } from "./routing.js";
import {
  renderMatchGrid,
  renderPmTeamLogo,
  statusBadge,
  getLeagueImagePath,
  getSportImagePath,
  getSportIcon,
  topLeagueSummaries,
  trendingMatches,
  buildAutoBackgroundAttrs
} from "./ui-matches.js";
import {
  setSeo,
  applyPageClassesForRoute,
  initScrollAnimations,
  showToast,
  renderSeoHeroPanel,
  renderHeroShareActions,
  renderMatchInsightPanel,
  wireMatchTabs,
  renderMatchInfoGrid,
  renderFormTrack,
  renderProviderStatusBar
} from "./ui-core.js";
import { renderStandingsTable } from "./ui-standings.js";
import { refreshData } from "./api.js";
import { toggleFavoriteKey, saveFeedbackNotes } from "./storage.js";
import { fetchSportsNews, renderHighlightsNewsCard } from "./news.js";

const MATCH_DETAILS_CACHE = new Map();

export async function renderRoute() {
  const path = getCurrentPath();
  const route = parseRoute(path);
  state.activePath = path;
  applyPageClassesForRoute(route);
  
  // Render provider status bar if there are issues
  renderProviderStatusBar();

  const main = qs("#main");
  if (!main) return;

  switch (route.type) {
    case "home": await renderHomePage(main); break;
    case "live": await renderMatchListingPage(main, "Live Score Now", "Every live match currently in progress.", "/live", "tone-live", state.liveMatches); break;
    case "trending": await renderMatchListingPage(main, "Trending Matches", "High-interest matches ranked by live activity.", "/trending", "tone-trending", trendingMatches(24)); break;
    case "results": await renderMatchListingPage(main, "Today's Results", "Completed matches and latest final scorelines.", "/results", "tone-results", state.finalMatches); break;
    case "upcoming": await renderMatchListingPage(main, "Upcoming Matches", "Scheduled fixtures and pre-match pages.", "/upcoming", "tone-upcoming", state.upcomingMatches); break;
    case "history": renderHistoryPage(main); break;
    case "top-leagues": renderTopLeaguesPage(main); break;
    case "news": await renderNewsPage(main); break;
    case "search": renderSearchPage(main); break;
    case "league": await renderLeaguePage(main, route); break;
    case "match": await renderMatchPage(main, route); break;
    case "sport": renderSportPage(main, route); break;
    case "donate": renderDonatePage(main); break;
    case "feedback": renderFeedbackPage(main); break;
    case "advertise": renderSimpleArticle(main, "Advertise on livescoreFree.online", "Use homepage, sport, league, and match inventory for sports traffic.", "<p>This route is now live in the site router and can be used as your media kit landing page.</p>"); break;
    case "data-sources": renderDataSourcesPage(main); break;
    case "privacy-policy": renderSimpleArticle(main, "Privacy Policy", "How browser storage and basic site data are handled.", "<p>Favorites, history, language, theme, and feedback are stored locally in the browser.</p>"); break;
    case "terms-of-service": renderSimpleArticle(main, "Terms of Service", "Terms for using the livescoreFree.online website and score feeds.", "<p>Replace this placeholder with your final legal text.</p>"); break;
    case "dmca-policy": renderSimpleArticle(main, "DMCA Policy", "How takedown requests are handled.", "<p>Replace this placeholder with your DMCA process and contact details.</p>"); break;
    case "contact": renderContactPage(main); break;
    case "about": renderAboutPage(main); break;
    default: renderNotFoundPage(main); break;
  }

  initScrollAnimations();
  window.scrollTo(0, 0);
}

async function renderHomePage(container) {
  setSeo({
    title: "livescoreFree.online | The Stadium Spectacle | Live Scores & Arena Coverage",
    description: "Track the global matchday universe with livescoreFree.online. High-contrast scores, headline reports, and arena tables for every major competition.",
    path: "/home"
  });

  const heroMatch = state.liveMatches[0] || state.upcomingMatches[0] || trendingMatches(1)[0];
  
  // Ticker Matches (shuffle or slice)
  const tickerMatches = [...state.liveMatches, ...state.upcomingMatches].slice(0, 10);

  const tickerHTML = `
    <!-- Live Ticker -->
    <div class="bg-primary/10 border-b border-primary/20 py-2 overflow-hidden whitespace-nowrap relative">
      <div class="inline-flex animate-[progress_30s_linear_infinite] gap-12 items-center">
        ${tickerMatches.length > 0 ? tickerMatches.map(m => `
          <div class="flex items-center gap-4">
            <span class="text-[10px] font-black uppercase text-primary">${escapeHtml(m.leagueLabel)}</span>
            <span class="text-[11px] font-bold uppercase">${escapeHtml(m.homeName)} ${m.homeScore || 0} - ${m.awayScore || 0} ${escapeHtml(m.awayName)}</span>
          </div>
        `).join('<div class="w-1 h-1 bg-primary/30 rounded-full"></div>') : '<span class="text-[10px] font-bold opacity-40 uppercase px-6">Tuning to Arena... No live matches in current frequency.</span>'}
      </div>
    </div>
  `;

  const heroHTML = heroMatch ? `
    <!-- Hero Hub -->
    <section class="relative w-full aspect-video md:aspect-[21/9] overflow-hidden group">
      <div class="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" 
           style="background-image: linear-gradient(to right, rgba(14,14,14,0.9), rgba(14,14,14,0.4)), url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop')"></div>
      <div class="relative h-full flex flex-col justify-center px-8 md:px-20 max-w-7xl mx-auto">
        <div class="flex items-center gap-3 mb-6">
          <span class="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase pulse-red">
            <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span> LIVE NOW
          </span>
          <span class="text-on-surface/60 font-black text-xs tracking-tighter uppercase font-headline">${escapeHtml(heroMatch.leagueLabel)}</span>
        </div>
        <h1 class="font-headline font-black text-4xl md:text-8xl tracking-tighter leading-[0.85] mb-8 uppercase italic text-on-surface flex flex-wrap gap-x-4">
          <span class="truncate max-w-full">${escapeHtml(heroMatch.homeName)}</span>
          <span class="text-primary">${heroMatch.homeScore || 0}:${heroMatch.awayScore || 0}</span>
          <span class="truncate max-w-full">${escapeHtml(heroMatch.awayName)}</span>
        </h1>
        <div class="flex flex-wrap gap-4 mb-12">
          <button class="bg-primary px-8 py-4 rounded text-white font-black uppercase text-xs tracking-widest flex items-center gap-3 transition-transform active:scale-95">
            <span class="material-symbols-outlined text-lg">play_circle</span> MATCH HUB
          </button>
          <a href="${routeForMatch(heroMatch)}" data-link class="glass-card px-8 py-4 rounded text-white font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-white/5 transition-colors">
            LIVE ANALYTICS
          </a>
        </div>
      </div>
      <div class="absolute bottom-12 right-12 hidden lg:flex flex-col items-end gap-2 text-right">
        <div class="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Match Intensity</div>
        <div class="flex gap-1">
          <div class="w-8 h-1 bg-primary"></div>
          <div class="w-8 h-1 bg-primary"></div>
          <div class="w-8 h-1 bg-primary/30"></div>
          <div class="w-8 h-1 bg-primary/20"></div>
        </div>
      </div>
    </section>
  ` : '';

  const sportGridHTML = `
    <!-- Multiverse Grid -->
    <section class="py-20 px-6 max-w-7xl mx-auto border-b border-white/5">
      <div class="flex justify-between items-end mb-12">
        <div>
          <h2 class="text-4xl font-black italic tracking-tighter uppercase mb-4 leading-none">The Multiverse</h2>
          <p class="text-[10px] font-black text-primary uppercase tracking-[0.4em]">EXPLORE EVERY ARENA</p>
        </div>
        <div class="w-32 h-[1px] bg-primary"></div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        ${Object.entries(SPORT_GROUPS).map(([key, sport]) => `
          <a href="/sport/${key}" data-link class="group glass-card p-8 flex flex-col items-center gap-6 hover:bg-primary transition-all duration-300">
            <span class="material-symbols-outlined text-4xl group-hover:scale-125 transition-transform duration-500">${getSportIcon(key) || 'sports_soccer'}</span>
            <span class="font-black text-[10px] tracking-widest uppercase text-center">${escapeHtml(sport.label)}</span>
          </a>
        `).join("")}
      </div>
    </section>
  `;

  const liveMatchesHTML = `
    <!-- Live Scores Center -->
    <section class="py-20 px-6 max-w-7xl mx-auto">
      <div class="flex items-center gap-6 mb-16">
        <h2 class="text-4xl font-black italic tracking-tighter uppercase leading-none">Live Scores</h2>
        <div class="flex-1 h-[1px] bg-white/5"></div>
        <div class="flex items-center gap-3">
          <span class="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
          <span class="text-[10px] font-black uppercase tracking-widest text-primary">${state.liveMatches.length} ARENAS ACTIVE</span>
        </div>
      </div>
      ${state.liveMatches.length > 0 ? `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          ${state.liveMatches.slice(0, 4).map(m => `
            <a href="${routeForMatch(m)}" data-link class="group glass-card p-10 flex flex-col gap-8 hover:bg-white/5 transition-all relative overflow-hidden">
              <div class="scanline"></div>
              <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
                <span>${escapeHtml(m.leagueLabel)}</span>
                <span class="text-primary font-black">${m.statusLabel || 'LIVE'}</span>
              </div>
              <div class="flex justify-between items-center px-4">
                <div class="flex flex-col items-center gap-4 w-1/3">
                  <div class="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-xl font-black">${(m.homeName || '').charAt(0)}</div>
                  <span class="text-sm font-black uppercase italic tracking-tighter text-center">${escapeHtml(m.homeName)}</span>
                </div>
                <div class="flex flex-col items-center w-1/3">
                  <span class="text-5xl font-black italic text-primary tracking-tighter">
                    ${m.homeScore || 0}:${m.awayScore || 0}
                  </span>
                  <span class="text-[10px] font-black uppercase tracking-widest mt-4 opacity-40">Scoreline</span>
                </div>
                <div class="flex flex-col items-center gap-4 w-1/3">
                  <div class="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-xl font-black">${(m.awayName || '').charAt(0)}</div>
                  <span class="text-sm font-black uppercase italic tracking-tighter text-center">${escapeHtml(m.awayName)}</span>
                </div>
              </div>
            </a>
          `).join("")}
        </div>
      ` : `
        <div class="glass-card p-20 text-center flex flex-col items-center gap-6">
          <span class="material-symbols-outlined text-6xl opacity-10">sensors_off</span>
          <p class="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 leading-relaxed max-w-xs px-1">
            The arena is currently quiet. Tuning frequencies for incoming matchday signals.
          </p>
        </div>
      `}
    </section>
  `;

  const upcomingHTML = `
    <!-- Scheduled Events -->
    <section class="py-20 bg-surface-container-low border-y border-white/5">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex justify-between items-end mb-16">
          <div>
            <h3 class="text-4xl font-black italic tracking-tighter uppercase mb-4 leading-none">Scheduled Events</h3>
            <p class="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.4em]">NEXT 12 HOURS OF SPECTACLE</p>
          </div>
          <button class="bg-white/5 px-6 py-3 rounded text-[10px] font-black uppercase tracking-widest border border-white/10 hover:border-primary transition-all">View All</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          ${state.upcomingMatches.slice(0, 8).map(m => `
            <a href="${routeForMatch(m)}" data-link class="glass-card p-8 group hover:bg-white/5 transition-all">
              <div class="flex justify-between text-[10px] font-black opacity-30 mb-8 uppercase tracking-widest font-headline">
                <span>${escapeHtml(m.leagueLabel)}</span>
                <span>${formatDateTime(m.date)}</span>
              </div>
              <div class="flex items-center justify-between gap-4 mb-8">
                <span class="text-xs font-black uppercase italic tracking-tighter truncate w-1/3">${escapeHtml(m.homeName)}</span>
                <span class="text-xs font-black text-primary italic">VS</span>
                <span class="text-xs font-black uppercase italic tracking-tighter text-right truncate w-1/3">${escapeHtml(m.awayName)}</span>
              </div>
              <button class="w-full bg-white/5 py-4 rounded text-[10px] font-black uppercase tracking-widest group-hover:bg-primary transition-colors">SET REMINDER</button>
            </a>
          `).join("")}
        </div>
      </div>
    </section>
  `;

  const newsAndStandingsHTML = `
    <!-- Headline Reports & Standings -->
    <section class="py-20 px-6 max-w-7xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-16">
        <div class="lg:col-span-3">
          <div class="flex items-center gap-6 mb-12">
            <h4 class="text-4xl font-black italic uppercase tracking-tighter leading-none">Headline Reports</h4>
            <div class="flex-1 h-[1px] bg-white/5"></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12" id="home-news-grid">
            <div class="text-[10px] font-black uppercase tracking-widest opacity-30">Decrypting satellite data...</div>
          </div>
        </div>
        <div class="lg:col-span-1">
          <h4 class="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-8">Point Table [Premier League]</h4>
          <div id="home-standings-card" class="glass-card rounded-lg p-1 min-h-[400px]"></div>
        </div>
      </div>
    </section>
  `;

  container.innerHTML = `
    ${tickerHTML}
    ${heroHTML}
    ${sportGridHTML}
    ${liveMatchesHTML}
    ${upcomingHTML}
    ${newsAndStandingsHTML}
    
    <!-- Fuel the Broadcast -->
    <section class="py-20 px-6 max-w-7xl mx-auto border-t border-white/5 mt-20">
      <div class="glass-card p-16 rounded-3xl flex flex-col items-center text-center gap-8 relative overflow-hidden">
        <div class="absolute inset-0 bg-primary opacity-5"></div>
        <span class="material-symbols-outlined text-6xl text-primary animate-pulse">volunteer_activism</span>
        <h2 class="text-5xl font-black italic tracking-tighter uppercase max-w-2xl">Fuel The Kinetic Broadcast</h2>
        <p class="text-on-surface/40 text-xs font-medium tracking-widest uppercase leading-loose max-w-xl">
          Livescorefree is an independent arena built for the community. Support our stream expansion and feature development on Ko-fi.
        </p>
        <a href="/donate" data-link class="bg-primary px-12 py-5 rounded-full text-white font-black uppercase text-sm tracking-widest transform hover:scale-105 transition-transform active:scale-95 shadow-[0_10px_30px_rgba(204,22,22,0.4)]">
          SUPPORT VIA KO-FI
        </a>
      </div>
    </section>
  `;

  // Render Standings
  const mount = qs("#home-standings-card", container);
  if (mount) {
    void renderLeagueStandingsCard(mount, "eng.1", "Featured Table");
  }

  // Fetch News
  setTimeout(() => {
    const newsGrid = qs("#home-news-grid", container);
    if (newsGrid) {
      fetchApi('/news')
        .then(data => {
          if (data && data.articles && data.articles.length > 0) {
            newsGrid.innerHTML = data.articles.slice(0, 4).map((article, i) => `
              <a href="${escapeHtml(article.url || '#')}" target="_blank" class="group block">
                <div class="relative aspect-video rounded-xl overflow-hidden mb-6 bg-surface-container">
                  ${article.urlToImage ? `<img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="${escapeHtml(article.urlToImage)}" alt="news"/>` : ''}
                  <div class="absolute inset-0 bg-gradient-to-t from-[#0E0E0E] to-transparent opacity-60"></div>
                </div>
                <div class="flex items-center gap-3 mb-4">
                  <span class="w-8 h-[2px] bg-primary"></span>
                  <span class="text-[10px] font-black uppercase tracking-widest text-primary">${escapeHtml(article.source?.name || 'ARENA NEWS')}</span>
                </div>
                <h5 class="text-2xl font-black uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">${escapeHtml(article.title)}</h5>
              </a>
            `).join("");
          } else {
            newsGrid.innerHTML = '<div class="text-[10px] font-black uppercase opacity-30">No matchday reports found in current sweep.</div>';
          }
        })
        .catch(() => {
          newsGrid.innerHTML = '<div class="text-[10px] font-black uppercase opacity-30">Transmission error: Failed to fetch arena reports.</div>';
        });
    }
  }, 100);
}


function renderLsfHero(match) {
  return `
    <section class="hero lsf-hero" style="background: var(--gs-inverse-surface); color: white; padding: 100px 20px; position: relative; overflow: hidden;">
      <div class="hero-inner-content" style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;">
        <div class="hero-text">
          <span class="premium-kicker" style="color: var(--gs-primary); display: block; margin-bottom: 20px; font-size: 1.2rem;">Stadium Spectacle</span>
          <h1 style="font-size: 4rem; line-height: 0.9; margin-bottom: 30px; font-weight: 800;">Real Matchday Intensity</h1>
          <p style="font-size: 1.25rem; opacity: 0.8; margin-bottom: 40px; font-family: var(--soccer-font-body);">Track the pulse of the arena with livescoreFree.online's brutalist match centers and real-time kinetic scoreboards.</p>
          <div class="hero-actions" style="display: flex; gap: 20px;">
             <a data-link href="/live" class="btn btn-primary" style="padding: 16px 32px; font-size: 1.1rem;">Open Live Board</a>
             <a data-link href="${routeForMatch(match)}" class="btn" style="background: transparent; color: white; border: 2px solid white; padding: 14px 30px;">Match Center</a>
          </div>
        </div>
        <div id="hero-spotlight" class="hero-match-spotlight glass-panel" style="padding: 60px 40px; text-align: center; border: 4px solid var(--gs-primary);" data-match-key="${match.sportGroup}:${match.slug}">
           <span class="premium-kicker" style="color: var(--gs-primary); margin-bottom: 30px; display: block;">Live From Arena</span>
           <div class="hero-match-teams" style="display: flex; align-items: center; justify-content: center; gap: 40px; margin-bottom: 40px;">
              <div class="hero-team">
                <div style="font-size: 1.2rem; font-weight: 800;">${escapeHtml(match.homeName)}</div>
              </div>
              <div class="hero-massive-score" style="font-size: 6rem; font-weight: 800; line-height: 1; color: var(--gs-primary); font-family: var(--soccer-font-head);">
                <span id="hero-home-score">${escapeHtml(match.homeScore)}</span><span style="color: white; font-size: 4rem; margin: 0 10px;">:</span><span id="hero-away-score">${escapeHtml(match.awayScore)}</span>
              </div>
              <div class="hero-team">
                <div style="font-size: 1.2rem; font-weight: 800;">${escapeHtml(match.awayName)}</div>
              </div>
           </div>
           <div class="hero-match-meta">
              <div id="hero-status" class="badge badge-live pulsate-live" style="background: var(--gs-primary); color: white; padding: 8px 16px; display: inline-block;">${statusBadge(match)}</div>
              <div id="hero-meta" style="margin-top: 16px; font-weight: 600; opacity: 0.7;">${escapeHtml(match.leagueLabel)} | ${formatDateTime(match.date)}</div>
           </div>
        </div>
      </div>
      <div class="hero-ambient-texture" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(45deg, var(--gs-primary) 0%, transparent 100%); opacity: 0.05; pointer-events: none;"></div>
    </section>
  `;
}

function renderHistoryPage(container) {
  setSeo({ title: "Match History | livescoreFree.online", description: "Your recently opened match pages.", path: "/history" });
  container.innerHTML = `<section class="section tone-history"><div class="section-head"><div><h1>Match History</h1><p>Recent matches opened from the live score center.</p></div></div>${renderMatchGrid(state.history.slice(0, 30), "No browsing history yet.")}</section>`;
}

function renderTopLeaguesPage(container) {
  setSeo({ title: "Top Leagues | livescoreFree.online", description: "Browse major leagues with dedicated overview pages.", path: "/top-leagues" });
  const grouped = Object.entries(LEAGUES).reduce((acc, [key, league]) => {
    if (!acc[league.sportGroup]) acc[league.sportGroup] = [];
    acc[league.sportGroup].push({ key, ...league, live: state.liveMatches.filter((match) => match.leagueKey === key).length });
    return acc;
  }, {});

  container.innerHTML = `<section class="section tone-league"><div class="section-head"><div><h1>Top Leagues</h1><p>Every major competition supported by the real-time score feed.</p></div></div>${Object.entries(grouped).map(([sportKey, leagues]) => `<div class="league-group-block"><div class="section-head"><div><h2>${escapeHtml(SPORT_GROUPS[sportKey]?.label || sportKey)}</h2><p>${escapeHtml(SPORT_GROUPS[sportKey]?.description || "League hub")}</p></div></div><div class="league-grid">${leagues.map(renderLeagueCard).join("")}</div></div>`).join("")}</section>`;
}

function renderSportPage(container, route) {
  const sport = SPORT_GROUPS[route.sport];
  if (!sport) return renderNotFoundPage(container);
  const matches = state.matches.filter((match) => match.sportGroup === route.sport);
  const liveMatches = matches.filter((match) => match.status === "live");
  const leagues = Object.entries(LEAGUES).filter(([, league]) => league.sportGroup === route.sport).map(([key, league]) => ({ key, ...league, live: state.liveMatches.filter((match) => match.leagueKey === key).length }));

  setSeo({ title: `${sport.label} Live Scores | livescoreFree.online`, description: sport.description, path: `/sport/${route.sport}` });
  container.innerHTML = `
    <section class="hero" ${buildAutoBackgroundAttrs({ sportGroup: route.sport, seedText: route.sport, strength: 0.28 })}>
      <div class="hero-inner-content"><div class="hero-text"><span class="hero-eyebrow">Sport Hub</span><h1 class="hero-title">${escapeHtml(sport.label)}</h1><p class="hero-lead">${escapeHtml(sport.description)}</p><div class="hero-actions"><a data-link href="/live" class="btn btn-primary">Open Live Scores</a><a data-link href="/top-leagues" class="btn">Top Leagues</a></div></div><div class="hero-side-card"><div class="hero-side-label">Live Matches</div><div class="hero-side-score">${liveMatches.length}</div><div class="hero-side-meta">${matches.length} total match cards loaded</div></div></div>
    </section>
    ${renderSectionWithMatches("tone-live", `Live ${sport.label}`, `All currently active matches in ${sport.label.toLowerCase()}.`, "/live", liveMatches, `No ${sport.label.toLowerCase()} matches are live right now.`)}
    ${renderSectionWithMatches("tone-upcoming", `All ${sport.label} Matches`, "Combined feed of live, upcoming, and recent results.", "", matches.slice(0, 30), `No ${sport.label.toLowerCase()} matches are available yet.`)}
    <section class="section tone-league"><div class="section-head"><div><h2>${escapeHtml(sport.label)} Leagues</h2><p>Jump directly into competition-level pages.</p></div></div><div class="league-grid">${leagues.map(renderLeagueCard).join("")}</div></section>
  `;
}

async function renderLeaguePage(container, route) {
  const league = LEAGUES[route.leagueKey];
  if (!league) return renderNotFoundPage(container);

  const matches = state.matches.filter((match) => match.leagueKey === route.leagueKey);
  const liveMatches = matches.filter((match) => match.status === "live");
  const upcomingMatches = matches.filter((match) => match.status === "upcoming");
  const finalMatches = matches.filter((match) => match.status === "final");

  setSeo({
    title: `${league.label} Live Scores, Fixtures & Results | livescoreFree.online`,
    description: `${league.label} live scores, fixtures, results, and standings in one league hub.`,
    path: routeForLeague(route.leagueKey)
  });

  container.innerHTML = `
    <section class="hero" ${buildAutoBackgroundAttrs({ sportGroup: league.sportGroup, leagueKey: route.leagueKey, seedText: route.leagueKey, strength: 0.28 })}>
      <div class="hero-inner-content">
        <div class="hero-text">
          <span class="hero-eyebrow">League Hub</span>
          <h1 class="hero-title">${escapeHtml(league.label)}</h1>
          <p class="hero-lead">${escapeHtml(SPORT_GROUPS[league.sportGroup]?.description || "League coverage")}</p>
          <div class="hero-actions">
            <a data-link href="/sport/${league.sportGroup}" class="btn">Open Sport Hub</a>
            <a data-link href="/live" class="btn btn-primary">Live Score Now</a>
          </div>
        </div>
        <div class="hero-side-card">
          <div class="hero-side-label">League Activity</div>
          <div class="hero-side-score">${liveMatches.length}</div>
          <div class="hero-side-meta">Live matches right now</div>
        </div>
      </div>
    </section>
    <section class="section tone-league">
      <div class="trust-grid">
        <div class="trust-card"><strong>${matches.length}</strong><span>Total matches loaded</span></div>
        <div class="trust-card"><strong>${liveMatches.length}</strong><span>Live now</span></div>
        <div class="trust-card"><strong>${upcomingMatches.length}</strong><span>Upcoming</span></div>
        <div class="trust-card"><strong>${finalMatches.length}</strong><span>Results</span></div>
      </div>
    </section>
    ${renderSectionWithMatches("tone-live", `Live In ${league.label}`, "Current games in progress for this competition.", "", liveMatches, `No ${league.label} matches are live right now.`)}
    ${renderSectionWithMatches("tone-upcoming", "Upcoming Fixtures", `Next scheduled kickoffs for ${league.label}.`, "", upcomingMatches, `No upcoming ${league.label} fixtures are currently available.`)}
    ${renderSectionWithMatches("tone-results", "Recent Results", `Recently completed matches from ${league.label}.`, "", finalMatches, `No completed ${league.label} matches are available yet.`)}
    <div id="league-standings-card"></div>
  `;

  const mount = qs("#league-standings-card", container);
  if (mount) {
    void renderLeagueStandingsCard(mount, route.leagueKey, `${league.label} Standings`);
  }
}

async function renderMatchPage(container, route) {
  const match = findMatchForRoute(route);
  if (!match) {
    container.innerHTML = `<div class="message-box">Match not found. Refreshing data...</div>`;
    await refreshData({ silent: true });
    const retry = findMatchForRoute(route);
    if (!retry) return renderNotFoundPage(container);
    return renderMatchPage(container, route);
  }

  const favoriteKey = `${match.sportGroup}:${match.slug}`;
  const details = await fetchMatchDetails(match);
  const activeTab = state.matchTabBySlug[favoriteKey] || "summary";
  const infoItems = [
    { label: "League", value: match.leagueLabel },
    { label: "Kickoff", value: formatDateTime(match.date) },
    { label: "Venue", value: match.venue || "Venue TBC" },
    { label: "Status", value: match.statusDetail || match.status }
  ];

  setSeo({
    title: `${match.homeName} vs ${match.awayName} | livescoreFree.online Match Center`,
    description: `${match.homeName} vs ${match.awayName} live score, timeline, and match center.`,
    path: routeForMatch(match)
  });

  container.innerHTML = `
    <section class="match-hero auto-bg-surface" ${buildAutoBackgroundAttrs({ sportGroup: match.sportGroup, leagueKey: match.leagueKey, seedText: match.slug, strength: 0.3 })}>
      <div class="match-hero-main" data-match-key="${match.sportGroup}:${match.slug}">
        <div class="mh-team">${renderPmTeamLogo({ teamLogo: match.homeLogo, teamName: match.homeName, teamAbbr: match.homeAbbr, loading: "eager" })}<span>${escapeHtml(match.homeName)}</span><small>${escapeHtml(match.homeAbbr || "")}</small></div>
        <div class="mh-score-block">
          <div class="mh-score">
            <span id="detail-home-score">${escapeHtml(match.homeScore)}</span> - <span id="detail-away-score">${escapeHtml(match.awayScore)}</span>
          </div>
          <div id="detail-status" class="mh-meta">${statusBadge(match)}</div>
          <div id="detail-meta" class="mh-submeta">${escapeHtml(match.leagueLabel)} | ${escapeHtml(formatDateTime(match.date))}</div>
        </div>
        <div class="mh-team">${renderPmTeamLogo({ teamLogo: match.awayLogo, teamName: match.awayName, teamAbbr: match.awayAbbr, loading: "eager" })}<span>${escapeHtml(match.awayName)}</span><small>${escapeHtml(match.awayAbbr || "")}</small></div>
      </div>
    </section>
    <section class="section tone-live">${renderMatchInfoGrid(infoItems)}</section>
    <div class="match-content-layout">
      <main class="match-main-area">
        <nav class="match-tabs">
          ${renderTabButton("summary", "Summary", activeTab)}
          ${renderTabButton("events", "Timeline", activeTab)}
          ${renderTabButton("standings", "Standings", activeTab)}
          ${renderTabButton("analysis", "Analysis", activeTab)}
        </nav>
        <div class="match-tab-panel ${activeTab === "summary" ? "active" : ""}" data-tab-panel="summary">
          <section class="section tone-live"><div class="section-head"><div><h2>Match Summary</h2><p>Live score status, venue context, and recent form.</p></div></div><div class="trust-grid"><div class="trust-card"><strong>${escapeHtml(match.homeScore)}</strong><span>${escapeHtml(match.homeName)}</span></div><div class="trust-card"><strong>${escapeHtml(match.awayScore)}</strong><span>${escapeHtml(match.awayName)}</span></div><div class="trust-card"><strong>${details.timeline.length}</strong><span>Timeline events</span></div><div class="trust-card"><strong>${details.standings.length}</strong><span>Standings rows</span></div></div></section>
          <section class="section tone-upcoming"><div class="section-head"><div><h2>Recent Form</h2><p>Last completed results stored in local history.</p></div></div><div class="trust-grid"><div class="trust-card"><strong>${escapeHtml(match.homeName)}</strong><span>${renderFormTrack(getTeamForm(match.homeName, match.sportGroup))}</span></div><div class="trust-card"><strong>${escapeHtml(match.awayName)}</strong><span>${renderFormTrack(getTeamForm(match.awayName, match.sportGroup))}</span></div></div></section>
        </div>
        <div class="match-tab-panel ${activeTab === "events" ? "active" : ""}" data-tab-panel="events"><section class="section tone-live"><div class="section-head"><div><h2>Timeline</h2><p>Event feed from the detail endpoint for this match.</p></div></div>${renderTimeline(details.timeline)}</section></div>
        <div class="match-tab-panel ${activeTab === "standings" ? "active" : ""}" data-tab-panel="standings"><section class="section tone-league"><div class="section-head"><div><h2>Standings Snapshot</h2><p>Table rows from the league standings API.</p></div></div>${renderStandingsMarkup(details.standings)}</section></div>
        <div class="match-tab-panel ${activeTab === "analysis" ? "active" : ""}" data-tab-panel="analysis"><section class="section tone-history"><div class="section-head"><div><h2>Head-to-Head</h2><p>Previous meetings stored in your local match history.</p></div></div>${renderMatchGrid(getHeadToHead(match).slice(0, 5), "No head-to-head history is available in local storage yet.")}</section></div>
      </main>
      <aside class="match-side-area">${renderMatchInsightPanel({ match, statPairs: [], infoItems, favoriteKey, isFavorite: state.favoriteMatches.includes(favoriteKey) })}</aside>
    </div>
  `;

  wireMatchTabs(match);
  wireFavoriteButton();
}

function renderDonatePage(container) {
  setSeo({ title: "Support livescoreFree.online", description: "Help fund server costs and real-time sports coverage.", path: "/donate" });
  const trust = getTrustSignals();
  container.innerHTML = `
    <section class="section tone-support">
      <div class="section-head"><div><h1>Support livescoreFree.online</h1><p>Community support keeps the score feed, pages, and APIs online.</p></div></div>
      ${renderDonationProgress()}
      <div class="trust-grid">
        <div class="trust-card"><strong>${trust.monthlyUsers.toLocaleString()}</strong><span>Monthly users reached</span></div>
        <div class="trust-card"><strong>${trust.indexedPages.toLocaleString()}</strong><span>Pages supported</span></div>
        <div class="trust-card"><strong>${state.matches.length}</strong><span>Match cards in memory</span></div>
        <div class="trust-card"><strong>${state.favoriteMatches.length}</strong><span>Saved favorites</span></div>
      </div>
      <div class="support-kofi-card">
        <div>
          <span class="premium-kicker">Ko-fi Funding</span>
          <h3>Support hosting, API maintenance, and premium design work</h3>
          <p>This page now has a direct Ko-fi CTA so the donation flow feels like a real supporter page instead of placeholder copy.</p>
        </div>
        <a class="btn btn-primary" href="${escapeHtml(DONATION_KOFI_URL)}" target="_blank" rel="noopener noreferrer">Open Ko-fi</a>
      </div>
      <div class="premium-ad-shell">
        <div class="premium-ad-copy">
          <span class="premium-kicker">Sponsor Support</span>
          <h3>Brand placement can help fund the site as well</h3>
          <p>Use this section for a premium sponsor unit or keep it tied to your current ad network inventory.</p>
        </div>
        ${renderInlineSponsorCard("Sponsor this supporter page", "/advertise")}
      </div>
    </section>
  `;
}

async function renderNewsPage(container) {
  setSeo({ title: "Sports News | livescoreFree.online", description: "Editorial sports coverage and premium news cards.", path: "/news" });
  container.innerHTML = `
    <section class="hero" ${buildAutoBackgroundAttrs({ sportGroup: "football", seedText: "news", strength: 0.22 })}>
      <div class="hero-inner-content">
        <div class="hero-text">
          <span class="hero-eyebrow">Club Newsroom</span>
          <h1 class="hero-title">Latest Sports News</h1>
          <p class="hero-lead">A premium editorial layer on top of the live score platform.</p>
        </div>
        <div class="hero-side-card">
          <div class="hero-side-label">Stories</div>
          <div class="hero-side-score" id="news-count">...</div>
          <div class="hero-side-meta">Pulled from the current sports news feed</div>
        </div>
      </div>
    </section>
    <section class="section tone-trust">
      <div class="section-head"><div><h2>Latest News</h2><p>Editorial cards to give the website a full portal feel.</p></div></div>
      <div class="premium-news-grid" id="news-page-grid"><div class="message-box">Loading sports news...</div></div>
    </section>
  `;
  void hydrateNewsGrid(container, "#news-page-grid", 12, "#news-count");
}

function renderSearchPage(container) {
  setSeo({ title: "Search Matches | livescoreFree.online", description: "Find live, upcoming, and result match pages fast.", path: "/search" });
  const popular = trendingMatches(8);
  container.innerHTML = `
    <section class="section tone-sport">
      <div class="section-head"><div><h1>Search Matches</h1><p>Use quick match shortcuts or the browser search below.</p></div></div>
      <div class="search-page-panel">
        <input id="search-page-input" class="search-page-input" type="search" placeholder="Search teams, leagues, or matchups">
        <div id="search-page-results" class="search-page-results"></div>
      </div>
    </section>
    <section class="section tone-trending">
      <div class="section-head"><div><h2>Popular Searches</h2><p>Quick entry points into active match centers.</p></div></div>
      ${renderMatchGrid(popular, "No trending matches are available right now.")}
    </section>
  `;

  const input = qs("#search-page-input", container);
  const results = qs("#search-page-results", container);
  if (input && results) {
    const renderResults = (value) => {
      const query = String(value || "").trim().toLowerCase();
      if (!query) {
        results.innerHTML = `<div class="message-box">Start typing a team name, league, or matchup.</div>`;
        return;
      }
      const matches = state.matches.filter((match) => {
        return match.homeName.toLowerCase().includes(query) ||
          match.awayName.toLowerCase().includes(query) ||
          match.leagueLabel.toLowerCase().includes(query);
      }).slice(0, 20);
      results.innerHTML = matches.length ? renderMatchGrid(matches, "") : `<div class="message-box">No matches matched "${escapeHtml(query)}".</div>`;
    };
    renderResults("");
    input.addEventListener("input", () => renderResults(input.value));
  }
}

function renderContactPage(container) {
  setSeo({ title: "Contact livescoreFree.online", description: "Support, advertising, and matchday partnership contact page.", path: "/contact" });
  container.innerHTML = `
    <section class="section tone-legal">
      <div class="section-head"><div><h1>Contact Us</h1><p>Support, partnerships, sponsor inquiries, and general feedback.</p></div></div>
      <div class="contact-premium-layout">
        <div class="contact-premium-card">
          <span class="premium-kicker">Customer Support</span>
          <h3>Reach the livescoreFree.online team</h3>
          <p>Email: <a href="mailto:support@livescoreFree.online">support@livescoreFree.online</a></p>
          <p>Use the feedback page if you want to save notes locally during development or QA.</p>
          <div class="club-story-actions">
            <a class="btn btn-primary" data-link href="/feedback">Open Feedback</a>
            <a class="btn" data-link href="/advertise">Advertise</a>
          </div>
        </div>
        <div class="contact-premium-card">
          <span class="premium-kicker">How To Reach Us</span>
          <h3>Business and sponsorship</h3>
          <ul class="contact-list">
            <li>Live score partnerships</li>
            <li>Sponsor and ad slot inquiries</li>
            <li>Brand collaborations and traffic deals</li>
            <li>Bug reports and feed corrections</li>
          </ul>
        </div>
      </div>
    </section>
  `;
}

function renderAboutPage(container) {
  setSeo({ title: "About livescoreFree.online", description: "About the premium live-score platform and its club-style design direction.", path: "/about" });
  container.innerHTML = `
    <section class="section tone-trust">
      <div class="section-head"><div><h1>About livescoreFree.online</h1><p>A live-score website rebuilt to feel closer to a premium soccer-club experience.</p></div></div>
      <div class="club-premium-layout">
        <div class="club-story-card">
          <span class="premium-kicker">The Platform</span>
          <h3>Real data, premium presentation</h3>
          <p>livescoreFree.online aggregates match data, league standings, and sports news into a faster fan-facing product with dedicated sport hubs, league pages, match centers, and sponsor-ready content blocks.</p>
        </div>
        <div class="club-story-card">
          <span class="premium-kicker">This Update</span>
          <h3>Template-style sections across the full repo</h3>
          <p>The site now includes a fuller homepage story, ad modules, editorial/news sections, search, sponsor surfaces, and a Ko-fi support page in addition to live, upcoming, and results data.</p>
        </div>
      </div>
    </section>
  `;
}

function renderFeedbackPage(container) {
  setSeo({ title: "Feedback | livescoreFree.online", description: "Send feedback about the live score website and API experience.", path: "/feedback" });
  container.innerHTML = `<section class="section tone-support"><div class="section-head"><div><h1>Feedback</h1><p>Store local feedback notes directly in the browser for review.</p></div></div><div class="article-body"><textarea id="feedback-notes" style="width:100%;min-height:220px;">${escapeHtml(state.feedbackNotes.join("\n\n"))}</textarea><div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap;"><button class="btn btn-primary" id="save-feedback" type="button">Save Feedback</button><button class="btn" id="refresh-feedback-data" type="button">Refresh Match Data</button></div></div></section>`;
  const saveBtn = qs("#save-feedback", container);
  const refreshBtn = qs("#refresh-feedback-data", container);
  const notes = qs("#feedback-notes", container);
  if (saveBtn && notes) saveBtn.addEventListener("click", () => {
    state.feedbackNotes = String(notes.value || "").split(/\n{2,}/).map((item) => item.trim()).filter(Boolean).slice(0, 100);
    saveFeedbackNotes();
    showToast("Feedback notes saved locally.");
  });
  if (refreshBtn) refreshBtn.addEventListener("click", async () => {
    refreshBtn.disabled = true;
    try {
      await refreshData();
      showToast("Match data refreshed.");
    } catch (_error) {
      showToast("Refresh failed.");
    } finally {
      refreshBtn.disabled = false;
    }
  });
}

function renderDataSourcesPage(container) {
  renderSimpleArticle(
    container,
    "Data Sources",
    "Live score data and supporting media services used by the site.",
    `<table class="source-table"><thead><tr><th>Provider</th><th>Purpose</th><th>Status</th></tr></thead><tbody><tr><td>ESPN</td><td>Primary scoreboards, events, and standings</td><td>${state.providerStatus.espn.ok ? "Active" : "Degraded"}</td></tr><tr><td>TheSportsDB</td><td>League visuals and supplemental event coverage</td><td>${state.providerStatus.sportsdb.ok ? "Active" : "Degraded"}</td></tr><tr><td>Cloudflare Functions</td><td>Timeline, standings, proxy, and site APIs</td><td>Active</td></tr></tbody></table>`
  );
}

function renderSimpleArticle(container, title, lead, bodyHtml) {
  container.innerHTML = `<article class="section tone-legal"><div class="section-head"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(lead)}</p></div></div><div class="article-body">${bodyHtml}</div></article>`;
}

function renderNotFoundPage(container) {
  container.innerHTML = `<section class="section tone-results"><div class="section-head"><div><h1>404 Not Found</h1><p>The route does not exist in the current site map.</p></div></div><a data-link href="/home" class="btn btn-primary">Go Home</a></section>`;
}

async function renderMatchListingPage(container, title, description, path, toneClass, matches) {
  setSeo({ title: `${title} | livescoreFree.online`, description, path });
  const groupedBySport = matches.reduce((acc, match) => {
    acc[match.sportGroup] = (acc[match.sportGroup] || 0) + 1;
    return acc;
  }, {});

  container.innerHTML = `
    <section class="hero" ${buildAutoBackgroundAttrs({ sportGroup: matches[0]?.sportGroup || "football", seedText: path, strength: 0.26 })}>
      <div class="hero-inner-content"><div class="hero-text"><span class="hero-eyebrow">Full Match Feed</span><h1 class="hero-title">${escapeHtml(title)}</h1><p class="hero-lead">${escapeHtml(description)}</p></div><div class="hero-side-card"><div class="hero-side-label">Loaded Cards</div><div class="hero-side-score">${matches.length}</div><div class="hero-side-meta">Across ${Object.keys(groupedBySport).length || 1} sports</div></div></div>
    </section>
    <section class="section ${toneClass}"><div class="section-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div></div><div class="trust-grid">${Object.entries(groupedBySport).map(([sportKey, count]) => `<div class="trust-card"><strong>${count}</strong><span>${escapeHtml(SPORT_GROUPS[sportKey]?.label || sportKey)}</span></div>`).join("") || `<div class="trust-card"><strong>0</strong><span>No matches</span></div>`}</div></section>
    <section class="section ${toneClass}">${renderMatchGrid(matches, `No matches found for ${title.toLowerCase()}.`)}</section>
  `;
}

async function fetchMatchDetails(match) {
  const cacheKey = `${match.leagueKey}:${match.id}:${match.sourceId || ""}`;
  const cached = MATCH_DETAILS_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.time < 10000) return cached.data;
  const [timeline, standings] = await Promise.all([
    fetchJson(`/api/timeline?match=${encodeURIComponent(match.sourceId || match.id)}`).then((data) => Array.isArray(data?.data) ? data.data : []).catch(() => []),
    fetchJson(`/api/standings?league=${encodeURIComponent(match.leagueKey)}`).then((data) => Array.isArray(data?.data) ? data.data : []).catch(() => [])
  ]);
  const data = { timeline, standings };
  MATCH_DETAILS_CACHE.set(cacheKey, { time: Date.now(), data });
  return data;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

async function hydrateNewsGrid(container, selector, limit = 3, countSelector = "") {
  const mount = qs(selector, container);
  if (!mount) return;
  try {
    const articles = (await Promise.race([
      fetchSportsNews(),
      new Promise((resolve) => setTimeout(() => resolve([]), 4500))
    ])).slice(0, limit);
    mount.innerHTML = articles.length
      ? articles.map(renderHighlightsNewsCard).join("")
      : `<div class="message-box">News is unavailable right now.</div>`;
    if (countSelector) {
      const countNode = qs(countSelector, container);
      if (countNode) countNode.textContent = String(articles.length);
    }
  } catch (_error) {
    mount.innerHTML = `<div class="message-box">News is unavailable right now.</div>`;
    if (countSelector) {
      const countNode = qs(countSelector, container);
      if (countNode) countNode.textContent = "0";
    }
  }
}

async function renderLeagueStandingsCard(container, leagueKey, heading) {
  const league = LEAGUES[leagueKey];
  if (!league) return;
  container.innerHTML = `<section class="section tone-league"><div class="section-head"><div><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(league.label)} table pulled from the standings service.</p></div></div><div id="standings-table-mount"></div></section>`;
  const mount = qs("#standings-table-mount", container);
  if (!mount) return;

  const sportsDbIds = { "eng.1": "4328", "esp.1": "4335", "ita.1": "4332", "ger.1": "4331", "fra.1": "4334" };
  if (sportsDbIds[leagueKey]) {
    await renderStandingsTable(mount, sportsDbIds[leagueKey]);
    if (mount.innerHTML.trim()) return;
  }

  const payload = await fetchJson(`/api/standings?league=${encodeURIComponent(leagueKey)}`).catch(() => null);
  mount.innerHTML = renderStandingsMarkup(Array.isArray(payload?.data) ? payload.data : []);
}

function renderStandingsMarkup(rows) {
  if (!rows.length) return `<div class="message-box">Standings are not available for this competition yet.</div>`;
  return `<div class="table-responsive"><table class="standings-table"><thead><tr><th>Pos</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody id="standings-markup-body">${rows.map((row) => `<tr><td>${escapeHtml(row.rank || row.intRank || "-")}</td><td class="team-cell">${row.teamLogo || row.strTeamBadge ? `<img src="${escapeHtml(row.teamLogo || row.strTeamBadge)}" alt="" class="team-badge-sm">` : ""}<span>${escapeHtml(row.teamName || row.strTeam || "Unknown")}</span></td><td>${escapeHtml(row.played || row.intPlayed || "-")}</td><td>${escapeHtml(row.won || row.intWin || "-")}</td><td>${escapeHtml(row.drawn || row.intDraw || "-")}</td><td>${escapeHtml(row.lost || row.intLoss || "-")}</td><td>${escapeHtml(row.goalDifference || row.intGoalDifference || "-")}</td><td><strong>${escapeHtml(row.points || row.intPoints || "-")}</strong></td></tr>`).join("")}</tbody></table></div>`;
}

function renderTimeline(events) {
  if (!events.length) return `<div class="message-box">Timeline data is not available yet for this match.</div>`;
  return `<div id="timeline-list-container" class="timeline-list">${events.map((event) => `<article class="timeline-item"><strong>${escapeHtml(event.minute || event.clock || "-")}</strong><div><div>${escapeHtml(event.description || event.type || "Event")}</div><span>${escapeHtml(event.team || event.player || "")}</span></div></article>`).join("")}</div>`;
}

function renderTabButton(id, label, activeTab) {
  return `<button class="match-tab-btn ${activeTab === id ? "active" : ""}" data-match-tab="${id}" type="button">${escapeHtml(label)}</button>`;
}

function renderHeroMatch(match) {
  return `<section class="hero" ${buildAutoBackgroundAttrs({ sportGroup: match.sportGroup, leagueKey: match.leagueKey, seedText: match.slug, strength: 0.32 })}><div class="hero-inner-content"><div class="hero-text"><span class="hero-eyebrow">Matchday Center</span><h1 class="hero-title">${escapeHtml(match.homeName)} vs ${escapeHtml(match.awayName)}</h1><p class="hero-lead">${escapeHtml(match.leagueLabel)} | ${escapeHtml(match.statusDetail || formatDateTime(match.date))}</p><div class="hero-actions"><a data-link href="${routeForMatch(match)}" class="btn btn-primary">Open Match Center</a><a data-link href="/live" class="btn">View Live Scores</a></div></div><div class="hero-side-card"><div class="hero-side-label">Current Score</div><div class="hero-side-score">${escapeHtml(match.homeScore)} - ${escapeHtml(match.awayScore)}</div><div class="hero-side-meta">${statusBadge(match)}</div></div></div></section>`;
}

function renderClubHomeHero(match, trust) {
  return `
    <section class="hero club-home-hero" ${buildAutoBackgroundAttrs({ sportGroup: match.sportGroup, leagueKey: match.leagueKey, seedText: match.slug, strength: 0.34 })}>
      <div class="hero-inner-content club-home-hero-grid">
        <div class="hero-text">
          <span class="hero-eyebrow">Global Matchday Hub</span>
          <h1 class="hero-title">Premium Live Sports For Every Major Competition</h1>
          <p class="hero-lead">Track live scores, upcoming fixtures, results, standings, and news across world football and every supported sport from one dynamic homepage.</p>
          <div class="hero-actions">
            <a data-link href="/live" class="btn btn-primary">Open Live Scores</a>
            <a data-link href="${routeForMatch(match)}" class="btn">Featured Match Center</a>
          </div>
          <div class="hero-stats-strip">
            <div><strong>${state.liveMatches.length}</strong><span>Live Matches</span></div>
            <div><strong>${trust.countries}</strong><span>Regions</span></div>
            <div><strong>${trust.sportsCovered}</strong><span>Sports</span></div>
          </div>
        </div>
        <div class="home-hero-match-card">
          <span class="premium-kicker">Featured Match</span>
          <div class="home-hero-match-teams">
            <div class="hero-team-shell">${renderPmTeamLogo({ teamLogo: match.homeLogo, teamName: match.homeName, teamAbbr: match.homeAbbr, loading: "eager" })}<strong>${escapeHtml(match.homeName)}</strong></div>
            <div class="home-hero-score">${escapeHtml(match.homeScore)}<span>:</span>${escapeHtml(match.awayScore)}</div>
            <div class="hero-team-shell">${renderPmTeamLogo({ teamLogo: match.awayLogo, teamName: match.awayName, teamAbbr: match.awayAbbr, loading: "eager" })}<strong>${escapeHtml(match.awayName)}</strong></div>
          </div>
          <div class="home-hero-meta">${statusBadge(match)}<small>${escapeHtml(match.leagueLabel)} | ${escapeHtml(match.statusDetail || formatDateTime(match.date))}</small></div>
          <a class="btn btn-primary" data-link href="${routeForMatch(match)}">Watch Match Center</a>
        </div>
      </div>
    </section>
  `;
}

function renderHeroFallback() {
  return `<section class="hero" style="background-image:url('/hero-stadium.png')">${renderSeoHeroPanel({ eyebrow: "Matchday Center", title: "Live Scores Across Every Major Sport", lead: "Real match data, fast score updates, tables, fixtures, and full match pages.", actionsHtml: renderHeroShareActions() })}</section>`;
}

function renderSectionWithMatches(toneClass, title, description, href, matches, emptyText) {
  return `<section class="section ${toneClass}"><div class="section-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div>${href ? `<a class="section-view-all" data-link href="${href}">View All</a>` : ""}</div>${renderMatchGrid(matches, emptyText)}</section>`;
}

function renderInlineSponsorCard(title = "Feature your brand here", route = "/advertise") {
  return `<div class="inline-sponsor-card"><span class="premium-kicker">Ad Slot</span><h4>${escapeHtml(title)}</h4><p>Premium inventory for sportsbook, fantasy, streaming, merchandise, or fan engagement brands.</p><a class="btn btn-primary" data-link href="${route}">Book This Slot</a></div>`;
}

function renderCompactMatchRail(title, lead, matches, href) {
  return `
    <section class="fixture-rail-card">
      <div class="fixture-rail-head">
        <div>
          <span class="premium-kicker">Matchday</span>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(lead)}</p>
        </div>
        <a class="section-view-all" data-link href="${href}">View All</a>
      </div>
      <div class="fixture-rail-list">
        ${matches.map((match) => `
          <a class="fixture-rail-item" data-link href="${routeForMatch(match)}">
            <div class="fixture-rail-top">
              <span>${escapeHtml(match.leagueLabel)}</span>
              ${statusBadge(match)}
            </div>
            <div class="fixture-rail-teams">
              <strong>${escapeHtml(match.homeName)}</strong>
              <span>${escapeHtml(match.homeScore)} - ${escapeHtml(match.awayScore)}</span>
              <strong>${escapeHtml(match.awayName)}</strong>
            </div>
            <div class="fixture-rail-meta">${escapeHtml(match.statusDetail || formatDateTime(match.date))}</div>
          </a>
        `).join("") || `<div class="message-box">No matches available yet.</div>`}
      </div>
    </section>
  `;
}

function renderLeagueCard(item) {
  const key = item.key || "";
  const label = item.label || key;
  const sportGroup = item.sportGroup || "football";
  return `<a class="league-card" data-link href="${routeForLeague(key)}"><img src="${escapeHtml(getLeagueImagePath(key, sportGroup))}" alt="${escapeHtml(label)}" onerror="this.onerror=null;this.src='/logo-mark.png';"><strong>${escapeHtml(label)}</strong><span>${Number(item.live || 0)} live now</span></a>`;
}

function findMatchForRoute(route) {
  return state.matches.find((match) => match.slug === route.slug && match.sportGroup === route.sport) || state.history.find((match) => match.slug === route.slug && match.sportGroup === route.sport);
}

function getHeadToHead(match) {
  return state.history.filter((item) => {
    const direct = item.homeName === match.homeName && item.awayName === match.awayName;
    const reverse = item.homeName === match.awayName && item.awayName === match.homeName;
    return direct || reverse;
  });
}

function getTeamForm(teamName, sportGroup) {
  return state.history
    .filter((item) => item.sportGroup === sportGroup && (item.homeName === teamName || item.awayName === teamName))
    .slice(0, 5)
    .map((item) => {
      const teamScore = Number(item.homeName === teamName ? item.homeScore : item.awayScore);
      const oppScore = Number(item.homeName === teamName ? item.awayScore : item.homeScore);
      if (Number.isNaN(teamScore) || Number.isNaN(oppScore)) return "D";
      if (teamScore > oppScore) return "W";
      if (teamScore < oppScore) return "L";
      return "D";
    });
}

function wireFavoriteButton() {
  const button = qs("[data-favorite-match]");
  if (!button) return;
  button.addEventListener("click", () => {
    const key = button.getAttribute("data-favorite-match");
    const isFavorite = toggleFavoriteKey(key);
    button.classList.toggle("active", isFavorite);
    button.textContent = isFavorite ? "Saved to Favorites" : "Add to Favorites";
    showToast(isFavorite ? "Match added to favorites." : "Match removed from favorites.");
  });
}





