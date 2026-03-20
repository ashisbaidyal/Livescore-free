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
  const tickerMatches = [...state.liveMatches, ...state.upcomingMatches].slice(0, 15);

  const tickerHTML = `
    <!-- Live Ticker -->
    <div class="bg-surface-container-low border-b border-white/5 py-3 overflow-hidden">
      <div class="flex animate-[scroll_40s_linear_infinite] whitespace-nowrap gap-12 px-6">
        ${tickerMatches.length > 0 ? tickerMatches.map(m => `
          <div class="flex items-center gap-4">
            <span class="text-[10px] font-black text-primary uppercase italic">${escapeHtml(m.leagueLabel)}</span>
            <span class="text-xs font-bold uppercase">${escapeHtml(m.homeName)} ${m.homeStatus === 'LIVE' ? `${m.homeScore} - ${m.awayScore}` : 'VS'} ${escapeHtml(m.awayName)}</span>
            ${m.homeStatus === 'LIVE' ? `<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>` : ''}
          </div>
        `).join("") : `
          <div class="flex items-center gap-4 opacity-40">
            <span class="text-[10px] font-black uppercase italic">KINETIC FEED</span>
            <span class="text-xs font-bold uppercase">TUNING TO GLOBAL SPORTS FREQUENCIES...</span>
          </div>
        `}
        <!-- Duplicate for seamless scroll -->
        ${tickerMatches.length > 0 ? tickerMatches.map(m => `
          <div class="flex items-center gap-4">
            <span class="text-[10px] font-black text-primary uppercase italic">${escapeHtml(m.leagueLabel)}</span>
            <span class="text-xs font-bold uppercase">${escapeHtml(m.homeName)} ${m.homeStatus === 'LIVE' ? `${m.homeScore} - ${m.awayScore}` : 'VS'} ${escapeHtml(m.awayName)}</span>
            ${m.homeStatus === 'LIVE' ? `<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>` : ''}
          </div>
        `).join("") : ''}
      </div>
    </div>
  `;

  const heroHTML = `
    <!-- Enhanced All-Sports Hero Hub -->
    <section class="relative w-full h-[716px] min-h-[600px] overflow-hidden group">
      <div class="relative w-full h-full">
        <div class="absolute inset-0 z-10">
          <div class="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] scale-110" 
               style="background-image: linear-gradient(to top, rgb(19, 19, 19) 10%, transparent 60%), linear-gradient(to right, rgba(14, 14, 14, 0.9), rgba(14, 14, 14, 0.2)), url('${heroMatch ? (heroMatch.homeBadge || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076&auto=format&fit=crop') : 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop'}');"></div>
          <div class="relative h-full flex flex-col justify-center px-8 md:px-20 max-w-7xl mx-auto">
            <div class="flex items-center gap-3 mb-6">
              <span class="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase">
                <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span> FEATURED ${heroMatch?.homeStatus === 'LIVE' ? 'LIVE' : 'UPCOMING'}
              </span>
              <span class="text-on-surface-variant font-bold text-xs tracking-widest uppercase">${escapeHtml(heroMatch?.leagueLabel || 'Sports Universe')} • Arena Event</span>
            </div>
            ${heroMatch ? `
              <div class="flex items-end gap-6 mb-8">
                <h1 class="font-headline font-black text-6xl md:text-9xl tracking-tighter leading-[0.85] uppercase italic text-on-surface">
                  ${escapeHtml(heroMatch.homeName.substring(0, 3))} <span class="text-primary">${heroMatch.homeScore || 0}-${heroMatch.awayScore || 0}</span> ${escapeHtml(heroMatch.awayName.substring(0, 3))}
                </h1>
                <div class="mb-2 hidden sm:block">
                  <div class="text-xs font-black uppercase text-primary tracking-widest mb-1">Status</div>
                  <div class="text-3xl font-black italic">${escapeHtml(heroMatch.statusLabel || 'Upcoming')}</div>
                </div>
              </div>
            ` : `
              <h1 class="font-headline font-black text-6xl md:text-9xl tracking-tighter leading-[0.85] uppercase italic text-on-surface">
                STADIUM <span class="text-primary">SPECTACLE</span>
              </h1>
            `}
            <div class="flex flex-wrap gap-4 mt-8">
              ${heroMatch ? `
                <a href="${routeForMatch(heroMatch)}" data-link class="bg-primary hover:bg-primary/90 px-10 py-5 rounded-lg text-white font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(204,22,22,0.4)]">
                  <span class="material-symbols-outlined">play_circle</span> Watch 4K Stream
                </a>
              ` : ''}
              <a href="/live" data-link class="bg-white/5 backdrop-blur-md border border-white/20 px-10 py-5 rounded-lg text-on-surface font-black uppercase text-xs tracking-[0.2em] hover:bg-white/10 transition-colors">
                All Live Matches
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  const sportGridHTML = `
    <!-- The Multiverse Grid -->
    <section class="py-20 px-6 max-w-7xl mx-auto">
      <div class="flex justify-between items-end mb-12 border-b border-white/5 pb-8">
        <div>
          <h2 class="text-5xl font-black italic tracking-tighter uppercase mb-3 leading-none">Multiverse of sports</h2>
          <p class="text-on-surface-variant text-xs font-bold tracking-[0.3em] uppercase opacity-60">Navigate every league match in the score universe</p>
        </div>
        <div class="hidden md:block w-32 h-[2px] bg-primary"></div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        ${Object.entries(SPORT_GROUPS).map(([key, sport]) => `
          <a href="/sport/${key}" data-link class="group glass-card p-8 rounded-lg flex flex-col items-center gap-6 hover:bg-primary hover:text-white transition-all duration-500 shadow-xl border border-white/5">
            <span class="material-symbols-outlined text-5xl group-hover:scale-125 transition-transform duration-500">${getSportIcon(key)}</span>
            <span class="font-black text-[10px] tracking-[0.3em] uppercase text-center">${escapeHtml(sport.label)}</span>
          </a>
        `).join("")}
      </div>
    </section>
  `;

  const liveMatchesHTML = `
    <!-- Live Score Grid -->
    <section class="py-16 px-6 max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-12">
        <h2 class="text-4xl font-black italic tracking-tighter uppercase leading-none">Live Scores Center</h2>
        <div class="flex gap-4">
          <a href="/live" data-link class="flex items-center gap-2 bg-white/5 px-4 py-2 rounded font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
            Filter: ALL SPORTS <span class="material-symbols-outlined text-sm">filter_list</span>
          </a>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${state.liveMatches.length > 0 ? state.liveMatches.slice(0, 6).map(m => `
          <a href="${routeForMatch(m)}" data-link class="bg-surface-container border border-white/5 p-6 rounded-lg flex flex-col gap-6 group hover:border-primary/50 transition-all shadow-2xl relative overflow-hidden">
            <div class="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full pointer-events-none"></div>
            <div class="flex justify-between items-center relative">
              <div class="flex items-center gap-2">
                <span class="text-primary font-black italic text-[10px] tracking-widest uppercase">${escapeHtml(m.leagueLabel)}</span>
                <span class="w-1 h-1 bg-white/20 rounded-full"></span>
                <span class="text-[10px] font-black uppercase tracking-widest opacity-60">${escapeHtml(m.statusLabel || 'Live')}</span>
              </div>
              <span class="flex items-center gap-1.5 bg-primary text-white px-2.5 py-1 rounded-sm text-[9px] font-black italic">
                <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
              </span>
            </div>
            <div class="flex justify-between items-center relative">
              <div class="flex flex-col items-center gap-3 w-1/3">
                <div class="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-black italic">${(m.homeName || '').charAt(0)}</div>
                <span class="text-sm font-black uppercase italic tracking-tighter truncate w-full text-center">${escapeHtml(m.homeName)}</span>
              </div>
              <div class="flex flex-col items-center w-1/3">
                <span class="text-4xl font-black italic text-primary">${m.homeScore || 0} - ${m.awayScore || 0}</span>
                <span class="text-[10px] font-black text-on-surface-variant mt-2 tracking-widest uppercase">${m.timeLabel || ''}</span>
              </div>
              <div class="flex flex-col items-center gap-3 w-1/3">
                <div class="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-black italic">${(m.awayName || '').charAt(0)}</div>
                <span class="text-sm font-black uppercase italic tracking-tighter truncate w-full text-center">${escapeHtml(m.awayName)}</span>
              </div>
            </div>
          </a>
        `).join("") : `
          <div class="col-span-full glass-card p-12 text-center flex flex-col items-center gap-4">
            <span class="material-symbols-outlined text-5xl opacity-20">sensors_off</span>
            <p class="text-xs font-black uppercase tracking-widest opacity-40">No live signals detected in the sports multiverse right now.</p>
          </div>
        `}
      </div>
    </section>
  `;

  const scheduledEventsHTML = `
    <!-- Arena Scheduled Events -->
    <section class="py-20 px-6 bg-surface-container-low border-y border-white/5">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center gap-4 mb-16">
          <div class="w-12 h-[2px] bg-primary"></div>
          <h3 class="text-3xl font-black tracking-tighter uppercase leading-none italic">Arena Scheduled Events</h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          ${state.upcomingMatches.slice(0, 4).map(m => `
            <div class="bg-surface-container p-8 rounded-lg border border-white/5 hover:border-primary transition-all duration-500 shadow-xl flex flex-col justify-between h-full group">
              <div>
                <div class="flex justify-between text-[10px] font-black text-on-surface-variant mb-10 uppercase tracking-[0.2em]">
                  <span class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-primary"></span> ${escapeHtml(m.leagueLabel)}
                  </span>
                  <span>${formatDateTime(m.date)}</span>
                </div>
                <div class="flex items-center justify-between mb-12">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center text-sm font-black shadow-inner">${(m.homeName || '').charAt(0)}</div>
                    <span class="text-[10px] font-black uppercase tracking-tight opacity-40 text-center">${escapeHtml(m.homeName)}</span>
                  </div>
                  <span class="text-2xl font-black text-primary italic transform group-hover:scale-125 transition-transform">VS</span>
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center text-sm font-black shadow-inner">${(m.awayName || '').charAt(0)}</div>
                    <span class="text-[10px] font-black uppercase tracking-tight opacity-40 text-center">${escapeHtml(m.awayName)}</span>
                  </div>
                </div>
              </div>
              <a href="${routeForMatch(m)}" data-link class="w-full bg-white/5 group-hover:bg-primary group-hover:text-white py-4 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/10 group-hover:border-transparent text-center">
                Match Center
              </a>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;

  const spotlightHTML = `
    <!-- Featured: Player Spotlight & Standings -->
    <section class="py-24 px-6 max-w-7xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div class="lg:col-span-2 relative h-[600px] rounded-lg overflow-hidden group shadow-2xl">
          <div class="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] group-hover:scale-110" 
               style="background-image: linear-gradient(to top, rgb(14, 14, 14) 20%, transparent 60%), url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076&auto=format&fit=crop');"></div>
          <div class="absolute bottom-0 left-0 p-12 w-full">
            <div class="bg-primary text-white inline-flex items-center gap-3 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-xl rounded-sm">
              <span class="material-symbols-outlined text-sm">military_tech</span> Player of the Century
            </div>
            <h3 class="text-6xl font-black italic uppercase leading-[0.85] mb-4 tracking-tighter">THE STADIUM <br><span class="text-primary">SPECTACLE</span></h3>
            <div class="flex gap-12 mt-10">
              <div>
                <div class="text-[10px] text-on-surface-variant font-black uppercase tracking-widest mb-1 opacity-60">Live Signals</div>
                <div class="text-4xl font-black italic">${state.liveMatches.length}</div>
              </div>
              <div>
                <div class="text-[10px] text-on-surface-variant font-black uppercase tracking-widest mb-1 opacity-60">Arenas</div>
                <div class="text-4xl font-black italic">${Object.keys(LEAGUES).length}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-8">
          <div class="bg-surface-container-low p-10 rounded-lg border border-white/5 shadow-2xl flex-1 flex flex-col" id="home-standings-card">
            <div class="text-center font-black uppercase italic text-xs opacity-30 mt-20">Tuning to Point Tables...</div>
          </div>
          <div class="bg-primary rounded-lg p-8 relative overflow-hidden group cursor-pointer shadow-2xl h-52">
            <div class="relative z-10 h-full flex flex-col justify-between">
              <div>
                <h5 class="text-white font-black italic text-3xl leading-none mb-1 tracking-tighter">KINETIC FEED</h5>
                <p class="text-white/70 font-bold uppercase text-[10px] tracking-[0.2em]">Fuel Your Performance</p>
              </div>
              <a href="/donate" data-link class="bg-white text-black w-fit px-6 py-2.5 rounded font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform">Fuel Now</a>
            </div>
            <div class="absolute right-[-10%] bottom-[-20%] opacity-15 transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-[2s]">
              <span class="material-symbols-outlined text-[15rem]">bolt</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  const newsHTML = `
    <!-- Headline Reports & News -->
    <section class="py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-16">
        <div class="lg:col-span-3">
          <div class="flex items-center gap-4 mb-12">
            <h4 class="text-4xl font-black italic uppercase tracking-tighter leading-none">Headline Reports</h4>
            <div class="flex-1 h-[2px] bg-white/5"></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-10" id="home-news-grid">
            <div class="text-[10px] font-black uppercase tracking-widest opacity-20">Hacking Satellite Downlink...</div>
          </div>
        </div>
        <div>
          <h4 class="text-xl font-black italic uppercase tracking-widest mb-12 text-primary border-b border-primary/20 pb-4">Trending Now</h4>
          <div class="space-y-10">
            ${state.liveMatches.length > 0 ? state.liveMatches.slice(0, 3).map((m, i) => `
              <a href="${routeForMatch(m)}" data-link class="flex gap-6 items-start border-b border-white/5 pb-8 group cursor-pointer">
                <span class="text-3xl font-black text-on-surface/10 italic shrink-0 group-hover:text-primary transition-colors">0${i+1}</span>
                <div>
                  <div class="text-[10px] text-primary font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span> LIVE BROADCAST
                  </div>
                  <h6 class="text-base font-black uppercase leading-tight group-hover:underline tracking-tight">${escapeHtml(m.homeName)} vs ${escapeHtml(m.awayName)}</h6>
                </div>
              </a>
            `).join("") : `
              <div class="text-[10px] font-black uppercase opacity-20 tracking-widest italic">No Trending Signals.</div>
            `}
          </div>
        </div>
      </div>
    </section>
  `;

  container.innerHTML = `
    ${tickerHTML}
    ${heroHTML}
    ${sportGridHTML}
    ${liveMatchesHTML}
    
    <!-- DraftKings Premium Banner -->
    <section class="px-6 max-w-7xl mx-auto mb-20">
      <div class="w-full bg-[#111111] border border-white/5 p-8 relative overflow-hidden rounded-lg group cursor-pointer shadow-2xl">
        <div class="absolute right-0 top-0 h-full w-1/3 opacity-30 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none" 
             style="background-image: url('https://images.unsplash.com/photo-1540747913346-19e3adcc174b?q=80&w=2040&auto=format&fit=crop'); background-size: cover; background-position: center;"></div>
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div class="flex items-center gap-10">
            <div class="bg-white p-5 rounded-lg shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform">
              <span class="text-black font-black italic text-3xl tracking-tighter">BET SMART</span>
            </div>
            <div>
              <h4 class="text-4xl font-black italic uppercase tracking-tighter leading-none mb-3">The Stadium Experience</h4>
              <div class="flex items-center gap-3">
                <span class="bg-primary text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-widest rounded-sm">Premium</span>
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Real-time stats. kinetic broadcast layout.</p>
              </div>
            </div>
          </div>
          <a href="/live" data-link class="bg-primary text-white px-12 py-5 rounded-lg font-black uppercase text-xs tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_40px_rgba(204,22,22,0.3)] whitespace-nowrap text-center">Enter The Arena</a>
        </div>
      </div>
    </section>

    ${scheduledEventsHTML}
    ${spotlightHTML}
    ${newsHTML}
    
    <!-- Support Section -->
    <section class="py-20 px-6 max-w-7xl mx-auto space-y-16 border-t border-white/5">
      <div class="relative w-full rounded-xl overflow-hidden bg-gradient-to-r from-primary to-on-primary-fixed-variant p-8 md:p-12 shadow-2xl group">
        <div class="absolute right-0 top-0 h-full w-1/2 opacity-10 pointer-events-none transform translate-x-1/4">
          <span class="material-symbols-outlined text-[20rem]">broadcast_on_personal</span>
        </div>
        <div class="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div class="max-w-2xl text-center lg:text-left">
            <h3 class="text-5xl font-black italic uppercase tracking-tighter mb-4 leading-none text-white">Fuel the<br>Broadcast</h3>
            <p class="text-white/80 font-bold text-sm uppercase leading-relaxed tracking-wide">Keep the stream alive and ad-free. Support our independent broadcast crew via donation or sponsorship.</p>
          </div>
          <div class="flex flex-wrap justify-center gap-4">
            <a href="/donate" data-link class="bg-white text-black px-8 py-4 rounded-lg font-black uppercase text-[11px] tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl">Support on Ko-fi</a>
            <a href="/advertise" data-link class="bg-black/20 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-lg font-black uppercase text-[11px] tracking-[0.2em] hover:bg-black/30 transition-all">Advertise Here</a>
          </div>
        </div>
      </div>
    </section>
  `;

  // Render Standings
  const standingsMount = qs("#home-standings-card", container);
  if (standingsMount) {
    void renderStandingsTable(standingsMount, "eng.1");
  }

  // Fetch News
  const newsGrid = qs("#home-news-grid", container);
  if (newsGrid) {
    fetchSportsNews().then(articles => {
      if (articles && articles.length > 0) {
        newsGrid.innerHTML = articles.slice(0, 4).map(article => renderHighlightsNewsCard(article)).join("");
      } else {
        newsGrid.innerHTML = '<div class="text-[10px] font-black uppercase opacity-20">No matchday reports found in current sweep.</div>';
      }
    }).catch(() => {
      newsGrid.innerHTML = '<div class="text-[10px] font-black uppercase opacity-20">Transmission error: Failed to fetch arena reports.</div>';
    });
  }
}




function renderHistoryPage(container) {
  setSeo({ title: "Match History | livescoreFree.online", description: "Your recently opened match pages.", path: "/history" });
  container.innerHTML = `
    <div class="p-8 space-y-12">
      <section>
        <div class="flex items-center gap-4 mb-8 border-l-4 border-primary pl-4">
          <h1 class="text-3xl font-black uppercase italic tracking-tighter">Match History</h1>
        </div>
        ${renderMatchGrid(state.history.slice(0, 30), "No browsing history yet.")}
      </section>
    </div>
  `;
}

function renderTopLeaguesPage(container) {
  setSeo({ title: "Top Leagues | livescoreFree.online", description: "Browse major leagues with dedicated overview pages.", path: "/top-leagues" });
  const grouped = Object.entries(LEAGUES).reduce((acc, [key, league]) => {
    if (!acc[league.sportGroup]) acc[league.sportGroup] = [];
    acc[league.sportGroup].push({ key, ...league, live: state.liveMatches.filter((match) => match.leagueKey === key).length });
    return acc;
  }, {});

  container.innerHTML = `
    <div class="p-8 space-y-16">
      <section>
        <div class="mb-12 border-l-4 border-primary pl-4">
          <h1 class="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">Top Leagues</h1>
          <p class="text-xs font-bold uppercase tracking-widest text-on-surface/40 mt-3">Every major competition supported by the real-time score feed.</p>
        </div>
        <div class="space-y-12">
          ${Object.entries(grouped).map(([sportKey, leagues]) => `
            <div class="space-y-6">
              <div class="flex items-center gap-4">
                <span class="text-primary font-black uppercase tracking-widest text-[10px]">${escapeHtml(SPORT_GROUPS[sportKey]?.label || sportKey)}</span>
                <div class="h-[1px] flex-1 bg-white/5"></div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${leagues.map(renderLeagueCard).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </section>
    </div>
  `;
}

async function renderSportPage(container, route) {
  const sportKey = route.sport;
  const sport = SPORT_GROUPS[sportKey];
  if (!sport) return renderNotFoundPage(container);

  setSeo({ 
    title: `${sport.label} | livescoreFree.online Spectacle`, 
    description: sport.description,
    path: `/sport/${sportKey}` 
  });

  const matches = state.matches.filter(m => m.sportGroup === sportKey);
  const liveMatches = matches.filter(m => m.status === "live");
  const leagues = Object.entries(LEAGUES)
    .filter(([_, l]) => l.sportGroup === sportKey)
    .map(([key, l]) => ({ key, ...l }));

  container.innerHTML = `
    <div class="min-h-screen">
      <!-- Sport Hero Hub -->
      <section class="relative h-[500px] overflow-hidden group border-b border-white/5 bg-surface-container-low">
        <div class="absolute inset-0 z-0">
          <div class="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] scale-110 opacity-40 grayscale group-hover:grayscale-0 group-hover:scale-100" 
               style="background-image: linear-gradient(to top, rgb(19, 19, 19) 10%, transparent 80%), url('${getSportImagePath(sportKey)}');"></div>
        </div>
        <div class="relative z-10 h-full flex flex-col justify-center px-8 md:px-20 max-w-7xl mx-auto">
          <div class="flex items-center gap-3 mb-6">
            <span class="bg-primary text-white px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-sm">${escapeHtml(sport.label)} UNIVERSE</span>
            <span class="text-on-surface-variant font-bold text-xs tracking-widest uppercase opacity-60">Kinetic Broadcast Active</span>
          </div>
          <h1 class="font-headline font-black text-6xl md:text-9xl tracking-tighter leading-[0.85] uppercase italic text-on-surface mb-8">
            ${escapeHtml(sport.label)} <span class="text-primary">ARENA</span>
          </h1>
          <p class="text-lg md:text-xl font-medium text-on-surface/60 max-w-2xl leading-relaxed uppercase italic tracking-tight">
            ${escapeHtml(sport.description)}
          </p>
          <div class="flex gap-6 mt-12">
             <div class="flex flex-col">
                <span class="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Live Seats</span>
                <span class="text-4xl font-black italic tracking-tighter">${liveMatches.length}</span>
             </div>
             <div class="w-[1px] h-12 bg-white/10 mx-2"></div>
             <div class="flex flex-col">
                <span class="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.3em] mb-1">Total Signals</span>
                <span class="text-4xl font-black italic tracking-tighter">${matches.length}</span>
             </div>
          </div>
        </div>
      </section>

      <div class="p-8 max-w-7xl mx-auto space-y-24">
        <!-- Live Center -->
        ${liveMatches.length > 0 ? `
          <section>
            <div class="flex items-center justify-between mb-12 border-l-4 border-primary pl-6">
              <h2 class="text-4xl font-black uppercase italic tracking-tighter leading-none">Live Frequencies</h2>
              <a href="/live" data-link class="text-[10px] font-black border-b-2 border-primary pb-1 uppercase tracking-widest hover:text-primary transition-all">All Live Streams</a>
            </div>
            ${renderMatchGrid(liveMatches, "")}
          </section>
        ` : ''}

        <!-- Competition Tiers -->
        <section>
          <div class="flex items-center justify-between mb-12 border-l-4 border-white/20 pl-6">
            <h2 class="text-4xl font-black uppercase italic tracking-tighter leading-none">Arenas & Leagues</h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${leagues.map(renderLeagueCard).join("")}
          </div>
        </section>

        <!-- General Feed -->
        <section>
          <div class="flex items-center justify-between mb-12 border-l-4 border-white/20 pl-6">
            <h2 class="text-4xl font-black uppercase italic tracking-tighter leading-none">Global Match Feed</h2>
          </div>
          ${renderMatchGrid(matches.slice(0, 40), `No ${sport.label} matches identified in current sweep.`)}
        </section>
      </div>
    </div>
  `;
}

async function renderMatchListingPage(container, title, subtitle, path, toneClass, matches) {
  setSeo({ title: `livescoreFree.online | ${title}`, description: subtitle, path });

  container.innerHTML = `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-16 min-h-screen">
      <section>
        <div class="flex justify-between items-end mb-16 pb-8 border-b border-white/5">
          <div>
            <h1 class="text-4xl md:text-7xl font-black tracking-tighter uppercase italic leading-none">${escapeHtml(title)}</h1>
            <p class="text-xs text-on-surface-variant font-bold uppercase tracking-[0.4em] mt-4 opacity-50">${escapeHtml(subtitle)}</p>
          </div>
          <div class="hidden md:flex items-center gap-3">
            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span class="text-[10px] font-black uppercase tracking-widest text-primary">KINETIC FEED ACTIVE</span>
          </div>
        </div>
        ${renderMatchGrid(matches, "No sessions found in this frequency.")}
      </section>

      <!-- Premium Arena Banner -->
      <section class="mt-20">
        <div class="relative w-full aspect-[21/9] md:aspect-[4/1] rounded-lg overflow-hidden group border border-white/5 shadow-2xl">
          <img src="https://images.unsplash.com/photo-1540747913346-19e3adcc174b?q=80&w=2040&auto=format&fit=crop" class="absolute inset-0 w-full h-full object-cover grayscale opacity-20 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000">
          <div class="absolute inset-0 bg-gradient-to-r from-[#0E0E0E] via-[#0E0E0E]/80 to-transparent flex flex-col justify-center px-12">
            <span class="bg-primary text-white text-[9px] font-black px-3 py-1 uppercase tracking-[0.3em] mb-4 w-max rounded-sm">Stadia Elite</span>
            <h2 class="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-6 text-on-surface">THE MULTIVERSE<br>COMMUNITY HUB</h2>
            <div class="flex gap-4">
              <a href="/donate" data-link class="bg-primary text-white px-8 py-3 rounded text-[10px] font-black tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(204,22,22,0.4)]">Support Broadcast</a>
              <a href="/advertise" data-link class="bg-white/5 border border-white/10 px-8 py-3 rounded text-[10px] font-black tracking-widest uppercase text-white hover:bg-white/10 transition-all">Advertise</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

async function renderLeaguePage(container, route) {
  const leagueKey = route.league;
  const league = LEAGUES[leagueKey];
  if (!league) return renderNotFoundPage(container);

  setSeo({ 
    title: `${league.label} | livescoreFree.online Arena Standings`, 
    description: `Track ${league.label} live rankings, point tables, and matchday action on livescoreFree.online.`,
    path: routeForLeague(leagueKey)
  });

  const leagueMatches = state.matches.filter(m => m.leagueKey === leagueKey);

  container.innerHTML = `
    <div class="min-h-screen">
      <!-- League Hero Hub -->
      <section class="relative px-8 pt-16 pb-12 overflow-hidden bg-surface-container-low border-b border-white/5 group">
        <div class="absolute inset-0 z-0 opacity-10 grayscale group-hover:grayscale-0 transition-all duration-700">
           <img src="${getLeagueImagePath(leagueKey, league.sportGroup)}" class="w-full h-full object-cover">
        </div>
        <div class="relative z-10 flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">
          <div class="lg:w-2/3">
            <div class="mb-8">
              <span class="text-[10px] font-bold tracking-[0.3em] text-primary uppercase mb-4 block font-headline">${escapeHtml(league.sportGroup)} ARENA SPECTACLE</span>
              <h1 class="text-5xl md:text-8xl font-headline font-black tracking-tighter uppercase italic leading-[0.9] text-on-surface">
                ${escapeHtml(league.label)} <br><span class="text-primary">TABLES</span>
              </h1>
            </div>
            <div class="flex gap-6 items-center mt-12">
              <div class="bg-primary/10 text-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-2 border border-primary/20">
                 <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                 KINETIC CONNECTION ACTIVE
              </div>
              <div class="text-[10px] font-bold text-on-surface/40 uppercase tracking-[0.2em]">${leagueMatches.length} SEASONS PIPED</div>
            </div>
          </div>
          
          <div class="lg:w-1/3">
             <div class="h-full bg-primary bg-gradient-to-br from-primary to-on-primary p-8 flex flex-col justify-between relative overflow-hidden rounded-xl border border-white/10 shadow-2xl">
                <div>
                  <span class="bg-white/10 text-white text-[10px] font-black px-2 py-1 uppercase tracking-tighter rounded">ARENA PARTNER</span>
                  <h3 class="text-3xl font-black italic uppercase mt-4 tracking-tighter leading-none text-white">FUEL THE<br>BROADCAST</h3>
                </div>
                <button class="bg-white text-black text-[10px] font-black px-6 py-3 rounded hover:bg-on-surface-variant transition-all uppercase tracking-widest w-full md:w-max mt-8">UPGRADE PRO</button>
             </div>
          </div>
        </div>
      </section>

      <div class="p-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div class="xl:col-span-8 space-y-12">
           <div id="league-standings-target"></div>
        </div>
        
        <aside class="xl:col-span-4 flex flex-col gap-10">
          <section>
            <div class="flex items-center gap-3 mb-8 border-l-4 border-on-surface/20 pl-4">
               <h2 class="text-xl font-black tracking-tighter uppercase italic">Matchday Feed</h2>
            </div>
            <div class="flex flex-col gap-4">
              ${leagueMatches.slice(0, 10).map(renderMatchCard).join("")}
            </div>
          </section>
        </aside>
      </div>
    </div>
  `;

  renderStandingsTable(qs("#league-standings-target"), league.leagueId);
}

async function renderMatchPage(container, route) {
  const match = findMatchForRoute(route);
  if (!match) {
    container.innerHTML = `<div class="p-20 text-center uppercase font-black italic tracking-widest opacity-30">Transmitting match data...</div>`;
    await refreshData({ silent: true });
    const retry = findMatchForRoute(route);
    if (!retry) return renderNotFoundPage(container);
    return renderMatchPage(container, route);
  }

  const favoriteKey = `${match.sportGroup}:${match.slug}`;
  const details = await fetchMatchDetails(match);
  const activeTab = state.matchTabBySlug[favoriteKey] || "summary";
  
  setSeo({
    title: `${match.homeName} vs ${match.awayName} | livescoreFree.online Arena`,
    description: `${match.homeName} vs ${match.awayName} live score and match detail center.`,
    path: routeForMatch(match)
  });

  const isLive = match.status === "live";

  container.innerHTML = `
    <div class="min-h-screen">
      <!-- Match Hero (Stadium style) -->
      <section class="relative bg-surface-container-high border-b border-white/5 overflow-hidden">
        <div class="absolute inset-0 opacity-10 grayscale">
           <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076&auto=format&fit=crop" class="w-full h-full object-cover">
        </div>
        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container-high"></div>
        
        <div class="relative z-10 px-8 py-16 md:py-24 max-w-6xl mx-auto">
          <div class="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-20">
            <!-- Home Team -->
            <div class="flex flex-col items-center gap-6 text-center w-full md:w-1/3">
              <div class="w-24 h-24 md:w-32 md:h-32 bg-surface-container rounded-2xl flex items-center justify-center p-4 border border-white/5 shadow-2xl">
                 ${renderPmTeamLogo({ teamLogo: match.homeLogo, teamName: match.homeName, teamAbbr: match.homeAbbr, loading: "eager" })}
              </div>
              <h2 class="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">${escapeHtml(match.homeName)}</h2>
            </div>

            <!-- Score / Status -->
            <div class="flex flex-col items-center gap-6 w-full md:w-1/3 text-center">
              <div id="detail-status" class="flex justify-center">${statusBadge(match)}</div>
              <div class="flex items-baseline gap-4 font-black italic text-7xl md:text-9xl leading-none font-headline tracking-tighter">
                 <span id="detail-home-score" class="${isLive ? 'text-primary' : 'text-on-surface'}">${escapeHtml(match.homeScore || 0)}</span>
                 <span class="text-on-surface/10 text-5xl md:text-7xl">:</span>
                 <span id="detail-away-score" class="${isLive ? 'text-primary' : 'text-on-surface'}">${escapeHtml(match.awayScore || 0)}</span>
              </div>
              <div class="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface/40 border-y border-white/5 py-3 px-6">
                ${escapeHtml(match.leagueLabel)} • ${formatDateTime(match.date)}
              </div>
            </div>

            <!-- Away Team -->
            <div class="flex flex-col items-center gap-6 text-center w-full md:w-1/3">
              <div class="w-24 h-24 md:w-32 md:h-32 bg-surface-container rounded-2xl flex items-center justify-center p-4 border border-white/5 shadow-2xl">
                 ${renderPmTeamLogo({ teamLogo: match.awayLogo, teamName: match.awayName, teamAbbr: match.awayAbbr, loading: "eager" })}
              </div>
              <h2 class="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">${escapeHtml(match.awayName)}</h2>
            </div>
          </div>
        </div>
      </section>

      <!-- Match Content -->
      <div class="p-8 max-w-6xl mx-auto">
        <nav class="flex overflow-x-auto gap-2 mb-12 border-b border-white/5 pb-0">
          ${renderTabButton("summary", "Summary", activeTab)}
          ${renderTabButton("events", "Timeline", activeTab)}
          ${renderTabButton("standings", "Standings", activeTab)}
          ${renderTabButton("analysis", "Head-To-Head", activeTab)}
        </nav>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <main class="lg:col-span-8 space-y-12">
             <div class="match-tab-panel ${activeTab === "summary" ? "block" : "hidden"}" data-tab-panel="summary">
                <section class="space-y-10">
                   <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div class="bg-surface-container-low p-6 rounded-xl border border-white/5">
                         <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 block mb-2">VENUE</span>
                         <p class="font-black italic uppercase text-sm">${escapeHtml(match.venue || 'TBA Arena')}</p>
                      </div>
                      <div class="bg-surface-container-low p-6 rounded-xl border border-white/5">
                         <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 block mb-2">KICKOFF</span>
                         <p class="font-black italic uppercase text-sm">${formatTime(match.date)}</p>
                      </div>
                      <div class="bg-surface-container-low p-6 rounded-xl border border-white/5">
                         <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 block mb-2">EVENTS</span>
                         <p class="font-black italic uppercase text-sm">${details.timeline.length} Piped</p>
                      </div>
                      <div class="bg-surface-container-low p-6 rounded-xl border border-white/5">
                         <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 block mb-2">STATUS</span>
                         <p class="font-black italic uppercase text-sm text-primary">${escapeHtml(match.statusDetail || 'Pending')}</p>
                      </div>
                   </div>
                   
                   <div class="space-y-6">
                     <h3 class="text-xl font-black uppercase italic tracking-tighter border-l-4 border-primary pl-4">Arena Analysis</h3>
                     <div class="bg-surface-container-low rounded-xl border border-white/5 p-8 flex flex-col md:flex-row items-center gap-12">
                        <div class="flex flex-col items-center gap-4 w-full md:w-1/3">
                           <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">${escapeHtml(match.homeName)} Form</span>
                           ${renderFormTrack(getTeamForm(match.homeName, match.sportGroup))}
                        </div>
                        <div class="h-[1px] w-full md:w-[1px] md:h-12 bg-white/5"></div>
                        <div class="flex flex-col items-center gap-4 w-full md:w-1/3">
                           <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Probability Draw</span>
                           <div class="text-4xl font-black italic tracking-tighter">24%</div>
                        </div>
                        <div class="h-[1px] w-full md:w-[1px] md:h-12 bg-white/5"></div>
                        <div class="flex flex-col items-center gap-4 w-full md:w-1/3">
                           <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">${escapeHtml(match.awayName)} Form</span>
                           ${renderFormTrack(getTeamForm(match.awayName, match.sportGroup))}
                        </div>
                     </div>
                   </div>
                </section>
             </div>
             
             <div class="match-tab-panel ${activeTab === "events" ? "block" : "hidden"}" data-tab-panel="events">
                <section class="space-y-8">
                   <h3 class="text-xl font-black uppercase italic tracking-tighter border-l-4 border-primary pl-4">Live Timeline</h3>
                   ${renderTimeline(details.timeline)}
                </section>
             </div>
             
             <div class="match-tab-panel ${activeTab === "standings" ? "block" : "hidden"}" data-tab-panel="standings">
                <section id="match-standings-target"></section>
             </div>
             
             <div class="match-tab-panel ${activeTab === "analysis" ? "block" : "hidden"}" data-tab-panel="analysis">
                <section class="space-y-8">
                   <h3 class="text-xl font-black uppercase italic tracking-tighter border-l-4 border-primary pl-4">Head-to-Head History</h3>
                   <div class="space-y-4">
                      ${renderMatchGrid(getHeadToHead(match).slice(0, 5), "No previous arena meetings indexed.")}
                   </div>
                </section>
             </div>
          </main>
          
          <aside class="lg:col-span-4 space-y-12">
             <div class="bg-surface-container-low rounded-2xl border border-white/5 p-8 space-y-8">
                <div>
                   <span class="text-[10px] font-black uppercase tracking-widest text-primary block mb-1 italic">ARENA PRO INSIGHT</span>
                   <h4 class="text-2xl font-black uppercase italic tracking-tighter leading-tight">PREDICTION ENGINE</h4>
                </div>
                <div class="space-y-6">
                   <div class="flex justify-between items-end">
                      <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Home Win</span>
                      <span class="font-black italic text-lg tracking-tighter">48%</span>
                   </div>
                   <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div class="h-full bg-primary" style="width: 48%"></div>
                   </div>
                   
                   <div class="flex justify-between items-end">
                      <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Away Win</span>
                      <span class="font-black italic text-lg tracking-tighter">28%</span>
                   </div>
                   <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div class="h-full bg-on-surface/10" style="width: 28%"></div>
                   </div>
                </div>
                <button class="w-full bg-surface-container-highest hover:bg-white/5 text-on-surface text-[10px] font-black uppercase tracking-widest py-4 rounded transition-all">DEEP STATS UPGRADE</button>
             </div>
             
             <div class="relative rounded-2xl overflow-hidden aspect-square flex flex-col justify-end p-8 border border-white/5 group">
                <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076&auto=format&fit=crop" class="absolute inset-0 w-full h-full object-cover grayscale opacity-20 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700">
                <div class="relative z-10 space-y-4">
                   <h4 class="text-2xl font-black uppercase italic tracking-tighter leading-tight">STADIUM<br>ADVERTISING</h4>
                   <p class="text-[10px] font-bold uppercase tracking-widest opacity-60">Join the arena network as a premium partner.</p>
                   <a href="#" class="inline-block bg-primary text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded">CONTACT US</a>
                </div>
             </div>
          </aside>
        </div>
      </div>
    </div>
  `;

  if (activeTab === "standings") {
    const target = qs("#match-standings-target", container);
    if (target) renderStandingsTable(target, match.leagueId);
  }

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
  setSeo({ title: "Search Removed | livescoreFree.online", description: "Search feature has been removed.", path: "/search" });
  container.innerHTML = `
    <section class="section">
      <div class="p-20 text-center space-y-6">
        <h1 class="text-4xl font-black uppercase italic tracking-tighter">Search Removed</h1>
        <p class="text-on-surface/40 uppercase tracking-widest font-bold">The search feature is no longer supported in this version of the arena.</p>
        <a data-link href="/" class="btn btn-primary inline-block">Back to Arena Home</a>
      </div>
    </section>
  `;
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
  const sportGroup = item.sportGroup || "soccer";
  const liveCount = Number(item.live || 0);

  return `
    <a href="${routeForLeague(key)}" data-link class="group glass-card p-6 rounded-lg border border-white/5 hover:border-primary transition-all duration-300 relative overflow-hidden flex flex-col gap-6 shadow-xl">
      <div class="flex justify-between items-start">
        <div class="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center p-2 border border-white/5 group-hover:scale-110 transition-transform">
          <img src="${escapeHtml(getLeagueImagePath(key, sportGroup))}" alt="${escapeHtml(label)}" class="w-full h-full object-contain" onerror="this.src='/logo-mark.png';">
        </div>
        ${liveCount > 0 ? `
          <span class="bg-primary/20 text-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Live</span>
        ` : ''}
      </div>
      <div>
        <h4 class="font-black italic uppercase tracking-tighter text-lg leading-tight group-hover:text-primary transition-colors">${escapeHtml(label)}</h4>
        <p class="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mt-2">${liveCount} arenas active</p>
      </div>
      <div class="absolute bottom-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:scale-100 group-hover:rotate-0 transition-all duration-500">
        <span class="material-symbols-outlined text-6xl">stadium</span>
      </div>
    </a>
  `;
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





