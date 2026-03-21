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
    case "live": await renderLivePage(main); break;
    case "trending": await renderTrendingPage(main); break;
    case "results": await renderResultsPage(main); break;
    case "upcoming": await renderUpcomingPage(main); break;
    case "history": renderHistoryPage(main); break;
    case "top-leagues": renderTopLeaguesPage(main); break;
    case "news": await renderNewsPage(main); break;
    case "league": await renderLeaguePage(main, route); break;
    case "match": await renderMatchPage(main, route); break;
    case "sport": renderSportPage(main, route); break;
    case "players": renderPlayersHubPage(main); break;
    case "teams": renderTeamsHubPage(main); break;
    case "player-profile": renderPlayerProfilePage(main, route); break;
    case "team-profile": renderTeamProfilePage(main, route); break;
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
    title: "GoalStream | Kinetic Broadcast | Live Scores & Arena Analytics",
    description: "Navigate the global sports multiverse with GoalStream. High-contrast scores, 4K streams, and elite scouting reports for every major league.",
    path: "/home"
  });

  const liveMatches = state.liveMatches || [];
  const upcomingMatches = state.upcomingMatches || [];
  const heroMatch = liveMatches[0] || upcomingMatches[0] || trendingMatches(1)[0];
  const tickerMatches = [...liveMatches, ...upcomingMatches].slice(0, 15);
  const news = await fetchSportsNews();
  const trendingNews = news.slice(0, 4);
  const sidebarNews = news.slice(4, 8);
  
  // Pick a featured player (Haaland by default as per design)
  const featuredPlayer = {
    firstName: "ERLING",
    lastName: "HAALAND",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBBOhQZUe5UMZsR9l2SEvqL-YAkANLk7t04hbPFTYr_Tg53l9ywmii2QrIFZJNTQMeugZkvRmRrDEdeQPvl8K4X2Tw0xmJKqpMBpFh764rzTviaMTtnm1NHlxt5jpdrWWNVOHuKJQRrt6A8V_qj56Ml2YT-LUk_N_4VKjP-SoUWukm1hOfAQYFZfavLOHSP6KIpMDJM3ZZmwpIcOoPD05NiJqZSpIL8QmZd4FV8O-Y2gGmoSUWG8TwaSAGlSivxcO-e3rs31ET7wrm_",
    stats: [
      { label: "Season Goals", value: "21" },
      { label: "Assists", value: "5" },
      { label: "Win Rate", value: "82%" }
    ]
  };

  container.innerHTML = `
    <div class="scanline"></div>
    
    <!-- Ticker Style Scoreboard -->
    <div class="bg-surface-container-low border-b border-white/5 py-3 overflow-hidden">
      <div class="flex animate-[scroll_40s_linear_infinite] whitespace-nowrap gap-12 px-6">
        ${tickerMatches.length > 0 ? tickerMatches.map(m => `
          <div class="flex items-center gap-4">
            <span class="text-[10px] font-black text-primary uppercase italic font-headline">${escapeHtml(m.leagueLabel || m.sportGroup)}</span>
            <span class="text-xs font-bold uppercase font-headline text-on-surface">${escapeHtml(m.homeName)} ${m.status === 'live' ? \`<span class="text-primary">\${m.homeScore} - \${m.awayScore}</span>\` : 'VS'} ${escapeHtml(m.awayName)}</span>
            ${m.status === 'live' ? '<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>' : ''}
          </div>
        `).join("") : `
          <div class="flex items-center gap-4 opacity-40">
            <span class="text-[10px] font-black uppercase italic font-headline">KINETIC FEED ACTIVATED</span>
            <span class="text-xs font-bold uppercase font-headline">TUNING TO GLOBAL SPORTS FREQUENCIES...</span>
          </div>
        `}
      </div>
    </div>

    <!-- Enhanced Global Hero Hub -->
    <section class="relative w-full min-h-[750px] overflow-hidden group">
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-cover bg-center transition-transform duration-[30s] scale-110 group-hover:scale-100" 
             style="background-image: linear-gradient(to top, #0e0e0e 5%, transparent 50%), 
                    linear-gradient(to right, rgba(14, 14, 14, 0.9) 20%, transparent 70%), 
                    url('${heroMatch?.homeBadge || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076&auto=format&fit=crop'}');"></div>
      </div>

      <div class="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col lg:flex-row gap-12 items-center lg:items-start">
        <!-- Main Content -->
        <div class="flex-1 text-left">
          <div class="flex items-center gap-3 mb-8">
            <span class="bg-primary text-white text-[10px] font-black px-4 py-1 uppercase tracking-widest rounded-sm italic animate-pulse">
              TRANS-GLOBAL LIVE SIGNAL
            </span>
            <span class="text-on-surface/40 text-[10px] font-black uppercase tracking-[0.3em]">ARENA PRIME • NODE 01-A</span>
          </div>

          ${heroMatch ? `
            <h1 class="text-6xl md:text-[9rem] font-black italic uppercase leading-[0.8] tracking-tighter mb-12">
              ${escapeHtml(heroMatch.homeAbbr || heroMatch.homeName.substring(0, 3))} <span class="text-primary text-glow-red">${heroMatch.homeScore || 0}-${heroMatch.awayScore || 0}</span> <br>
              <span class="opacity-40 animate-pulse text-white">${escapeHtml(heroMatch.awayAbbr || heroMatch.awayName.substring(0, 3))}</span>
            </h1>

            <!-- Performance Bars -->
            <div class="max-w-md space-y-8 mb-16">
              <div class="space-y-3">
                 <div class="flex justify-between text-[10px] font-black uppercase tracking-widest italic opacity-60">
                    <span>POSSESSION</span>
                    <span>44% - 56%</span>
                 </div>
                 <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                    <div class="h-full bg-primary" style="width: 44%"></div>
                    <div class="h-full bg-white opacity-20" style="width: 56%"></div>
                 </div>
              </div>
              <div class="space-y-3">
                 <div class="flex justify-between text-[10px] font-black uppercase tracking-widest italic opacity-60">
                    <span>SHOTS (ON)</span>
                    <span>14 (6) - 9 (4)</span>
                 </div>
                 <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                    <div class="h-full bg-primary" style="width: 62%"></div>
                    <div class="h-full bg-white opacity-20" style="width: 38%"></div>
                 </div>
              </div>
            </div>
          ` : `
            <h1 class="text-6xl md:text-[9rem] font-black italic uppercase leading-[0.8] tracking-tighter mb-12">
              GOAL<span class="text-primary text-glow-red">STREAM</span>
            </h1>
          `}

          <div class="flex flex-wrap gap-6">
            <a href="/live" data-link class="px-12 py-5 kinetic-gradient text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-lg shadow-[0_0_50px_rgba(204,22,22,0.4)] hover:scale-105 active:scale-95 transition-all no-underline font-headline">PLAY BROADCAST</a>
            <a href="/analytics" data-link class="px-12 py-5 bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-lg hover:bg-white/10 transition-all no-underline font-headline">VIEW ARENA ANALYTICS</a>
          </div>
        </div>

        <!-- Sidebar Widgets -->
        <div class="w-full lg:w-96 flex flex-col gap-6">
          <!-- Upcoming Next Card -->
          <div class="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden group/card shadow-2xl">
            <div class="absolute top-0 right-0 p-8 opacity-5 group-hover/card:opacity-10 transition-opacity">
               <span class="material-symbols-outlined text-8xl">event_upcoming</span>
            </div>
            <span class="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6 block italic">UPCOMING NEXT</span>
            <h3 class="text-2xl font-black italic uppercase tracking-tighter mb-4 leading-none">MANCHESTER DERBY</h3>
            <p class="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest mb-8 italic">PREMIER LEAGUE • TODAY 19:30</p>
            <div class="flex items-center gap-4">
               <div class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs">MU</div>
               <span class="text-xs font-black opacity-20">VS</span>
               <div class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs">MC</div>
            </div>
          </div>

          <!-- Live Odds / Volume Card -->
          <div class="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl">
            <div class="flex items-center justify-between mb-8">
               <span class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic">LIVE VOLUMES</span>
               <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/DraftKings_logo.svg/2560px-DraftKings_logo.svg.png" class="h-4 opacity-60 grayscale invert brightness-200" alt="DraftKings">
            </div>
            <div class="grid grid-cols-2 gap-4">
               <div class="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-primary transition-all cursor-pointer group/odds">
                  <div class="text-[9px] font-black text-on-surface/30 group-hover/odds:text-primary mb-1">HOME</div>
                  <div class="text-xl font-black italic tracking-tighter">2.14</div>
               </div>
               <div class="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-primary transition-all cursor-pointer group/odds">
                  <div class="text-[9px] font-black text-on-surface/30 group-hover/odds:text-primary mb-1">AWAY</div>
                  <div class="text-xl font-black italic tracking-tighter">3.40</div>
               </div>
               <div class="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-primary transition-all cursor-pointer group/odds">
                  <div class="text-[9px] font-black text-on-surface/30 group-hover/odds:text-primary mb-1">DRAW</div>
                  <div class="text-xl font-black italic tracking-tighter">3.05</div>
               </div>
               <div class="p-4 bg-primary text-white rounded-xl flex items-center justify-center">
                  <span class="material-symbols-outlined text-2xl font-black">trending_up</span>
               </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Content Divider Icons (as seen in image) -->
      <div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 opacity-20">
         <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
         <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
         <span class="w-1.5 h-1.5 rounded-full bg-white/40"></span>
         <span class="w-1.5 h-1.5 rounded-full bg-white/20"></span>
      </div>
    </section>

    <!-- Kinetic Grid: All Sectors -->
    <section class="py-24 px-6 max-w-7xl mx-auto">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div class="border-l-4 border-primary pl-8">
          <h2 class="text-6xl font-black italic tracking-tighter uppercase mb-4 leading-none font-headline text-on-surface">LEAGUE MULTIVERSE</h2>
          <p class="text-on-surface-variant text-[11px] font-black tracking-[0.4em] uppercase opacity-40 font-headline">Navigate every elite match frequency globally</p>
        </div>
        <div class="flex gap-1.5">
           <div class="w-12 h-1 bg-primary"></div>
           <div class="w-4 h-1 bg-white/20"></div>
           <div class="w-2 h-1 bg-white/10"></div>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        ${Object.entries(SPORT_GROUPS).map(([key, sport]) => `
          <a class="group glass-card p-10 rounded-2xl flex flex-col items-center gap-8 hover:bg-primary transition-all duration-700 shadow-2xl border border-white/5 no-underline transform hover:-translate-y-2 active:scale-95" href="/sport/${key}" data-link>
            <span class="material-symbols-outlined text-6xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-700 text-on-surface group-hover:text-white">${getSportIcon(key)}</span>
            <span class="font-black text-[11px] tracking-[0.5em] uppercase font-headline text-on-surface/40 group-hover:text-white transition-colors">${escapeHtml(sport.label)}</span>
          </a>
        `).join("")}
      </div>
    </section>

    <!-- Core Score Relay -->
    <section class="py-20 px-6 max-w-7xl mx-auto bg-surface-container-low rounded-3xl border border-white/5 shadow-inner">
      <div class="flex flex-col sm:flex-row items-center justify-between mb-16 gap-6 px-4">
        <div class="flex items-center gap-6">
           <span class="material-symbols-outlined text-4xl text-primary animate-pulse italic">sensors</span>
           <h2 class="text-5xl font-black italic tracking-tighter uppercase leading-none font-headline">LIVE ARENA SIGNAL</h2>
        </div>
        <a href="/live" data-link class="group flex items-center gap-4 bg-white/5 px-10 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all no-underline font-headline border border-white/10 hover:border-transparent">
          VIEW FULL FEED <span class="material-symbols-outlined text-lg group-hover:translate-x-2 transition-transform">arrow_forward</span>
        </a>
      </div>
      <div class="px-2">
        ${renderGoalStreamMatchGrid(liveMatches.slice(0, 6), "Scanning for active signals in the live multiverse...")}
      </div>
    </section>

    <!-- DraftKings Middle Banner -->
    <section class="py-12 px-6 max-w-7xl mx-auto">
       <div class="relative rounded-3xl h-32 overflow-hidden flex items-center justify-between px-12 group cursor-pointer shadow-2xl border border-white/5">
          <div class="absolute inset-0 bg-[#004a29] z-0"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10"></div>
          <div class="relative z-20 flex items-center gap-8">
             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/DraftKings_logo.svg/2560px-DraftKings_logo.svg.png" class="h-8 invert brightness-0" alt="DraftKings">
             <div class="flex flex-col">
                <span class="text-white text-2xl font-black italic uppercase tracking-tighter">BET $5, GET $200</span>
                <span class="text-white/40 text-[10px] font-black uppercase tracking-widest italic leading-none">INSTANTLY IN BONUS BETS • ARENA EXCLUSIVE</span>
             </div>
          </div>
          <div class="relative z-20 hidden md:flex items-center gap-6">
             <div class="flex gap-1">
                <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                <span class="w-10 h-0.5 bg-white/40 mt-1"></span>
             </div>
             <button class="bg-white text-black px-8 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">ACTIVATE SIGNAL</button>
          </div>
       </div>
    </section>
    <!-- Arena Scheduled Events -->
    <section class="py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
      <div class="flex items-end justify-between mb-16 border-l-4 border-secondary pl-8">
        <div class="text-left">
          <h2 class="text-5xl font-black italic tracking-tighter uppercase leading-none font-headline text-secondary">ARENA SCHEDULED EVENTS</h2>
          <p class="text-[11px] font-black tracking-[0.4em] uppercase opacity-40 font-headline mt-4">Calibrating upcoming multisector transmissions</p>
        </div>
        <div class="hidden md:flex items-center gap-3 bg-secondary/10 px-6 py-3 rounded-lg border border-secondary/20">
           <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
           <span class="text-[10px] font-black uppercase tracking-widest text-secondary font-headline italic">BROADCAST SIGNAL CLEAR</span>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${upcomingMatches.slice(0, 6).map(renderGoalStreamMatchCard).join("")}
      </div>
    </section>

    <!-- Elite Analytics Hub: Arena Table & Athlete Spotlight -->
    <section class="py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
       <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <!-- Arena Table (Standings) -->
          <div class="lg:col-span-4 flex flex-col gap-6">
             <div class="p-8 bg-surface-container-low rounded-[2rem] border border-white/5 flex-1 relative overflow-hidden group">
                <span class="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8 block italic">ARENA TABLE RANKINGS</span>
                <div class="space-y-4" id="arena-table-standings">
                   ${topLeagueSummaries().slice(0, 7).map((l, i) => `
                      <a href="/league/${l.key}" data-link class="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all no-underline group/item hover:border-primary/20">
                         <div class="flex items-center gap-4">
                            <span class="text-xl font-black italic opacity-20 group-hover/item:opacity-100 transition-opacity text-primary">${String(i + 1).padStart(2, '0')}</span>
                            <span class="text-xs font-black uppercase tracking-widest font-headline">${escapeHtml(l.label)}</span>
                         </div>
                         <div class="flex items-center gap-3">
                            ${l.live > 0 ? `<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#cc1616]"></span>` : ''}
                            <span class="material-symbols-outlined text-[16px] opacity-10 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all text-primary">east</span>
                         </div>
                      </a>
                   `).join("")}
                </div>
                <div class="mt-8 pt-6 border-t border-white/5">
                   <a href="/top-leagues" data-link class="text-[10px] font-black text-on-surface/40 hover:text-primary transition-colors uppercase tracking-[0.3em] no-underline italic">ACCESS FULL MULTIVERSE TABLE →</a>
                </div>
             </div>
          </div>

          <!-- Athlete Analytics (Highlight Card) -->
          <div class="lg:col-span-5 relative group rounded-[2rem] overflow-hidden bg-[#0e0e0e] shadow-2xl h-[600px] lg:h-auto">
             <img src="${featuredPlayer.image}" class="absolute inset-0 w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[20s]" alt="Athlete Analytics">
             <div class="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-transparent"></div>
             <div class="absolute bottom-10 left-10 right-10">
                <span class="bg-primary text-white text-[9px] font-black px-4 py-1.5 uppercase tracking-widest mb-6 inline-block rounded-sm italic shadow-lg">ATHLETE ANALYTICS</span>
                <h2 class="text-6xl font-black italic uppercase tracking-tighter leading-none text-white mb-8">
                   ${featuredPlayer.firstName}<br><span class="text-primary text-glow-red">${featuredPlayer.lastName}</span>
                </h2>
                <div class="grid grid-cols-3 gap-8">
                   ${featuredPlayer.stats.map(s => `
                      <div class="flex flex-col">
                         <span class="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">${s.label}</span>
                         <span class="text-3xl font-black italic tracking-tighter text-white">${s.value}</span>
                      </div>
                   `).join("")}
                </div>
             </div>
             <div class="absolute top-10 right-10 p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="material-symbols-outlined text-primary">analytics</span>
             </div>
          </div>

          <!-- Gatorade Sidebar Ad (Vertical) -->
          <div class="lg:col-span-3 flex flex-col gap-6">
             <div class="relative flex-1 rounded-[2rem] overflow-hidden group stadium-shadow border border-white/5 min-h-[400px]">
                <img src="https://images.unsplash.com/photo-1544441893-675973e31d35?q=80&w=2070&auto=format&fit=crop" class="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700">
                <div class="absolute inset-0 bg-gradient-to-t from-[#ea6309] via-[#ea6309]/40 to-transparent"></div>
                <div class="absolute inset-0 flex flex-col justify-end p-10 text-left">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Gatorade_G_logo.svg?q=80&w=100" class="h-12 w-max mb-6 drop-shadow-xl invert brightness-0" alt="Gatorade">
                   <h3 class="text-4xl font-black italic uppercase tracking-tighter text-white leading-none mb-4">FUEL THE<br>FUEL</h3>
                   <p class="text-[10px] font-black text-white/80 uppercase tracking-widest mb-8 leading-relaxed italic">Optimize your performance signal for the ultra-hub.</p>
                   <button class="bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all">SHOP NOW</button>
                </div>
             </div>
          </div>
       </div>
    </section>

    <!-- HEADLINE REPORTS & NEWS -->
    <section class="py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
      <div class="flex items-end justify-between mb-16 border-l-4 border-primary pl-8">
        <div class="text-left">
          <h2 class="text-5xl font-black italic tracking-tighter uppercase leading-none font-headline">HEADLINE REPORTS</h2>
          <p class="text-[11px] font-black tracking-[0.4em] uppercase opacity-40 font-headline mt-4">Verified intelligence from the arena network</p>
        </div>
        <a href="/news" data-link class="text-[10px] font-black text-primary border-b-2 border-primary/20 pb-2 uppercase tracking-[0.4em] hover:text-white transition-all no-underline font-headline italic">RSS MULTIVERSE FEED →</a>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <!-- Main Feature News -->
        <div class="lg:col-span-8 flex flex-col gap-12">
           ${trendingNews.map(item => renderGoalStreamNewsCard(item, "horizontal")).join("")}
        </div>
        
        <!-- Sidebar: Trending Now & Odds -->
        <div class="lg:col-span-4 flex flex-col gap-8">
           <div class="p-8 bg-surface-container-low rounded-[2rem] border border-white/5 mb-4">
              <h3 class="text-xs font-black uppercase tracking-[0.4em] text-primary mb-8 italic">TRENDING NOW</h3>
              <div class="space-y-8">
                 ${sidebarNews.map((item, i) => `
                   <a class="flex gap-4 group no-underline text-left" href="${item.url || '#'}" target="_blank">
                      <span class="text-3xl font-black italic text-on-surface/10 group-hover:text-primary transition-colors">${i + 1}</span>
                      <div class="flex flex-col gap-1">
                         <span class="text-[8px] font-black uppercase tracking-widest text-on-surface/40 italic">${escapeHtml(item.source || 'BROADCAST')}</span>
                         <h4 class="text-sm font-black uppercase italic leading-tight tracking-tighter group-hover:text-primary transition-colors">${escapeHtml(item.title)}</h4>
                      </div>
                   </a>
                 `).join("")}
              </div>
           </div>
           
           <!-- Betting / Odds Banner Ads -->
           <div class="relative rounded-[2rem] overflow-hidden aspect-[4/5] stadium-shadow group border border-white/5">
              <img src="https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=2070&auto=format&fit=crop" class="absolute inset-0 w-full h-full object-cover grayscale opacity-20 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[10s]">
              <div class="absolute inset-0 bg-gradient-to-t from-[#690003] via-[#690003]/40 to-transparent"></div>
              <div class="absolute inset-0 flex flex-col justify-end p-10 text-left">
                 <span class="bg-white text-black text-[10px] font-black px-3 py-1 uppercase tracking-widest mb-6 w-max rounded-sm italic">ARENA BETTING</span>
                 <h3 class="text-4xl font-black italic uppercase tracking-tighter text-white leading-none mb-6">KINETIC<br>ODDS ENGINE</h3>
                 <p class="text-[10px] font-black text-white opacity-60 uppercase tracking-widest mb-10 leading-relaxed italic">Real-time betting frequencies synced with the elite multiverse centers.</p>
                 <button class="bg-white text-black py-4 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-2xl active:scale-95 transition-all">DEPOSIT SIGNAL</button>
              </div>
           </div>
        </div>
      </div>
    </section>

    <!-- NICHE LEAGUES COVERAGE -->
    <section class="py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div class="border-l-4 border-primary pl-8">
          <h2 class="text-5xl font-black italic tracking-tighter uppercase mb-4 leading-none font-headline">NICHE FREQUENCIES</h2>
          <p class="text-[11px] font-black tracking-[0.4em] uppercase opacity-40 font-headline">Exploring the outer rim of the sports multiverse</p>
        </div>
        <div class="flex gap-1.5">
           <div class="w-12 h-1 bg-white/20"></div>
           <div class="w-4 h-1 bg-primary"></div>
           <div class="w-2 h-1 bg-white/10"></div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        ${['mma', 'f1', 'tennis', 'cricket'].map(sportKey => `
          <a href="/sport/${sportKey}" data-link class="group glass-card p-8 rounded-2xl border border-white/5 no-underline flex flex-col gap-6 hover:bg-surface-container-high transition-all">
             <div class="flex justify-between items-center">
                <span class="material-symbols-outlined text-4xl text-primary group-hover:scale-110 transition-transform font-headline">${getSportIcon(sportKey)}</span>
                <span class="text-[8px] font-black uppercase tracking-widest text-on-surface/20 group-hover:text-primary italic font-headline">Sector ${sportKey.toUpperCase()}</span>
             </div>
             <h4 class="text-xl font-black uppercase italic tracking-tighter group-hover:text-primary transition-colors font-headline">${escapeHtml(SPORT_GROUPS[sportKey]?.label || sportKey)}</h4>
             <p class="text-[10px] font-bold text-on-surface opacity-40 uppercase tracking-widest leading-relaxed font-headline">Transmission active in 4 sub-sectors. Tactical data stream operational.</p>
          </a>
        `).join("")}
      </div>
    </section>

    <!-- EA SPORTS FC 26 BIG FOOTER AD -->
    <section class="py-12 px-6 max-w-7xl mx-auto">
       <div class="relative rounded-[3rem] h-[300px] overflow-hidden group shadow-2xl border border-white/5">
          <img src="https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2070&auto=format&fit=crop" class="absolute inset-0 w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[10s]">
          <div class="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
          <div class="relative z-10 h-full flex flex-col justify-center p-16 text-left">
             <div class="flex items-center gap-4 mb-6">
                <span class="text-4xl font-black italic text-white tracking-tighter">EA SPORTS</span>
                <span class="text-primary text-4xl font-black italic tracking-tighter">FC 26</span>
             </div>
             <p class="text-white text-xl font-black uppercase italic tracking-widest mb-8 leading-none">PRE-SYNC THE ARENA DATA NOW</p>
             <button class="w-max bg-primary text-white px-12 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(204,22,22,0.4)] hover:scale-105 transition-transform">PRE-ORDER FREQUENCY</button>
          </div>
          <div class="absolute right-10 bottom-10 opacity-20 group-hover:opacity-40 transition-opacity">
             <span class="material-symbols-outlined text-[10rem] text-primary">sports_soccer</span>
          </div>
       </div>
    </section>

    <!-- FUEL THE BROADCAST: Global CTA -->
    <section class="py-32 px-6 max-w-7xl mx-auto">
       <div class="relative rounded-[3rem] p-12 md:p-24 overflow-hidden shadow-2xl border border-white/5 group bg-[#0e0e0e]">
          <div class="absolute inset-0 z-0">
             <img src="https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop" class="w-full h-full object-cover grayscale opacity-20 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[10s]">
          </div>
          <div class="absolute inset-0 bg-gradient-to-r from-[#0e0e0e] via-[#0e0e0e]/80 to-transparent"></div>
          <div class="relative z-10 max-w-2xl text-left">
             <span class="bg-primary text-white text-[10px] font-black px-4 py-1 uppercase tracking-widest mb-8 inline-block rounded-sm italic font-headline">COMMUNITY COLLECTIVE</span>
             <h2 class="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none text-white mb-8 font-headline">FUEL THE <br><span class="text-primary text-glow-red">BROADCAST</span></h2>
             <p class="text-sm md:text-lg font-black text-on-surface opacity-40 uppercase tracking-[0.2em] mb-12 leading-relaxed italic font-headline">GoalStream is powered by the kinetic energy of its fans. Support the transmission and unlock the ultra-multiverse tier.</p>
             <div class="flex flex-wrap gap-6">
                <a href="${DONATION_KOFI_URL}" target="_blank" class="px-12 py-5 kinetic-gradient text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-lg shadow-[0_0_50px_rgba(204,22,22,0.4)] active:scale-95 transition-all no-underline font-headline">SUPPORT ENGINE</a>
                <a href="/about" data-link class="px-12 py-5 bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-lg hover:bg-white/10 transition-all no-underline font-headline">OUR MISSION</a>
             </div>
          </div>
          <div class="absolute right-0 bottom-0 p-12 hidden lg:block opacity-10 group-hover:opacity-20 transition-opacity">
             <span class="material-symbols-outlined text-[15rem] text-primary">volunteer_activism</span>
          </div>
       </div>
    </section>
  `;



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
  setSeo({ 
    title: "Leagues Hub | GoalStream Kinetic Directory", 
    description: "Browse the global map of elite sports competitions and active arena frequencies.", 
    path: "/top-leagues" 
  });

  const grouped = Object.entries(LEAGUES).reduce((acc, [key, league]) => {
    if (!acc[league.sportGroup]) acc[league.sportGroup] = [];
    acc[league.sportGroup].push({ key, ...league, live: state.liveMatches.filter((match) => match.leagueKey === key).length });
    return acc;
  }, {});

  container.innerHTML = `
    <!-- Top Leagues Kinetic Header -->
    <section class="p-6 md:p-8">
      <div class="relative w-full h-[400px] bg-surface-container-high overflow-hidden rounded-xl group border border-white/5">
        <img class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
             src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2093&auto=format&fit=crop" 
             alt="Dynamic Arena Atmosphere"/>
        <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
        <div class="absolute bottom-0 left-0 p-10 max-w-2xl text-left">
          <div class="inline-flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <span class="material-symbols-outlined text-xs" style="font-variation-settings: 'FILL' 1;">sensors</span>
             GLOBAL MAP: COMPETITION DIRECTORY
          </div>
          <h1 class="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-on-surface mb-4 leading-none">ELITE <span class="text-primary text-glow-red">ARENAS</span></h1>
          <p class="text-sm text-on-surface/60 font-medium max-w-md mb-6 leading-relaxed uppercase tracking-widest">Scanning every major signal across the sports multi-verse. Active broadcasting in all sectors.</p>
          <div class="flex gap-4">
            <button class="px-8 py-3 kinetic-gradient text-[10px] font-black uppercase tracking-widest rounded active:scale-95 transition-all">SCAN LIVE NOW</button>
            <button class="px-8 py-3 bg-white/5 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest rounded hover:bg-white/10 active:scale-95 transition-all">FULL CALENDAR</button>
          </div>
        </div>
      </div>
    </section>

    <!-- League Directory -->
    <div class="px-6 md:px-8 pb-20 space-y-16 max-w-7xl mx-auto">
      ${Object.entries(grouped).map(([sportKey, leagues]) => `
        <section>
          <div class="flex items-end justify-between mb-8 border-l-4 border-primary pl-6">
            <div class="text-left">
              <h2 class="text-3xl font-black italic uppercase tracking-tighter">${escapeHtml(SPORT_GROUPS[sportKey]?.label || sportKey)}</h2>
              <p class="text-[10px] font-bold text-on-surface opacity-40 uppercase tracking-widest">Elite Broadcasting Active • ${leagues.length} Competitions</p>
            </div>
            <a class="text-[10px] font-black text-primary uppercase tracking-widest hover:underline no-underline italic" href="/sport/${sportKey}" data-link>Sector View →</a>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${leagues.map(l => `
              <a href="${routeForLeague(l.key)}" data-link class="bg-surface-container-high border border-white/5 rounded p-5 hover:bg-surface-container-highest transition-colors group relative overflow-hidden no-underline text-left">
                <div class="flex justify-between items-start mb-6">
                  <div class="w-12 h-12 bg-white/5 rounded flex items-center justify-center p-2 group-hover:bg-primary/20 transition-all">
                    <img src="${escapeHtml(getLeagueImagePath(l.key, l.sportGroup))}" alt="${escapeHtml(l.label)}" class="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all">
                  </div>
                  ${l.live > 0 ? `
                    <div class="bg-secondary-container/20 text-secondary-container border border-secondary-container/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase animate-pulse">Live Now</div>
                  ` : `
                    <div class="bg-white/5 text-on-surface opacity-20 border border-white/5 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Archive</div>
                  `}
                </div>
                <h3 class="text-lg font-black uppercase tracking-tight mb-1 group-hover:text-primary transition-colors italic">${escapeHtml(l.label)}</h3>
                <p class="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest mb-6">${escapeHtml(LEAGUE_REGIONS[l.key] || 'Global')} • ${escapeHtml(SPORT_GROUPS[l.sportGroup]?.label || l.sportGroup)}</p>
                <div class="w-full py-3 bg-white/5 group-hover:bg-primary group-hover:text-white transition-all text-[10px] font-black uppercase tracking-widest rounded-sm text-center">View Arena Hub</div>
              </a>
            `).join("")}
          </div>
        </section>
      `).join("")}

      <!-- Official Partners Section (GoalStream Style) -->
      <div class="w-full py-12 bg-surface-container-lowest border border-white/5 rounded-xl flex flex-col items-center justify-center gap-8 overflow-hidden relative stadium-shadow mt-12">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
        <span class="text-[10px] font-black text-on-surface opacity-20 uppercase tracking-[0.5em] absolute top-4">Official Broadcast Partners</span>
        <div class="flex flex-wrap items-center justify-center gap-12 md:gap-20 z-10 px-6">
          <div class="opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2 grayscale brightness-200">
            <span class="text-2xl font-black italic">EA SPORTS</span>
            <span class="text-[8px] border border-white/40 px-1 font-bold">IT'S IN THE GAME</span>
          </div>
          <div class="opacity-40 hover:opacity-100 transition-opacity grayscale brightness-200">
            <span class="text-2xl font-black italic">DRAFTKINGS</span>
          </div>
          <div class="opacity-40 hover:opacity-100 transition-opacity grayscale brightness-200">
            <span class="text-2xl font-black italic">ROLEX</span>
          </div>
          <div class="opacity-40 hover:opacity-100 transition-opacity grayscale brightness-200">
            <span class="text-2xl font-black italic">NIKE</span>
          </div>
          <div class="opacity-40 hover:opacity-100 transition-opacity grayscale brightness-200">
            <span class="text-2xl font-black italic">PUMA</span>
          </div>
        </div>
        <p class="text-[9px] font-black opacity-10 uppercase tracking-[0.3em]">GoalStream Kinetic Signal • Encrypted Feed</p>
      </div>
    </div>
  `;
}

async function renderSportPage(container, route) {
  const sportKey = route.sport;
  const sport = SPORT_GROUPS[sportKey];
  if (!sport) return renderNotFoundPage(container);

  setSeo({ 
    title: `${sport.label} | GoalStream Spectacle`, 
    description: sport.description,
    path: `/sport/${sportKey}` 
  });

  const matches = state.matches.filter(m => m.sportGroup === sportKey);
  const liveMatches = matches.filter(m => m.status === "live");
  const leagues = Object.entries(LEAGUES)
    .filter(([_, l]) => l.sportGroup === sportKey)
    .map(([key, l]) => ({ key, ...l, live: liveMatches.filter(m => m.leagueKey === key).length }));

  container.innerHTML = `
    <!-- Sport Hero Hub -->
    <section class="relative h-[500px] overflow-hidden group border-b border-white/5 bg-surface-container-low stadium-shadow text-left">
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] scale-110 opacity-40 grayscale group-hover:grayscale-0 group-hover:scale-100" 
             style="background-image: linear-gradient(to top, rgba(14, 14, 14, 1) 10%, transparent 80%), url('${escapeHtml(getSportImagePath(sportKey))}');"></div>
      </div>
      <div class="relative z-10 h-full flex flex-col justify-center px-8 md:px-20 max-w-7xl mx-auto">
        <div class="flex items-center gap-3 mb-6">
          <span class="bg-primary text-white px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-sm italic">${escapeHtml(sport.label)} SECTOR</span>
          <span class="text-on-surface-variant font-black text-[10px] tracking-[0.3em] uppercase opacity-40 italic">Kinetic Feed Active</span>
        </div>
        <h1 class="font-headline font-black text-7xl md:text-9xl tracking-tighter leading-[0.85] uppercase italic text-on-surface mb-8">
          ${escapeHtml(sport.label)} <span class="text-primary text-glow-red">ARENA</span>
        </h1>
        <p class="text-xs md:text-sm font-black text-on-surface/40 max-w-2xl leading-relaxed uppercase italic tracking-[0.2em]">
          ${escapeHtml(sport.description)}
        </p>
        <div class="flex gap-10 mt-12">
           <div class="flex flex-col">
              <span class="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 italic">Active Arenas</span>
              <span class="text-5xl font-black italic tracking-tighter text-glow-red">${liveMatches.length}</span>
           </div>
           <div class="w-[1px] h-12 bg-white/10 mx-2"></div>
           <div class="flex flex-col">
              <span class="text-[10px] font-black text-on-surface/20 uppercase tracking-[0.4em] mb-2 italic">Total Signals</span>
              <span class="text-5xl font-black italic tracking-tighter opacity-40">${matches.length}</span>
           </div>
        </div>
      </div>
    </section>

    <!-- Content Area -->
    <div class="p-8 max-w-7xl mx-auto space-y-24 pb-24">
      <!-- Live Center -->
      ${liveMatches.length > 0 ? `
        <section>
          <div class="flex items-end justify-between mb-12 border-l-4 border-secondary pl-6">
            <div class="text-left">
              <h2 class="text-4xl font-black uppercase italic tracking-tighter leading-none text-secondary">Live Frequencies</h2>
              <p class="text-[10px] font-bold text-on-surface opacity-40 uppercase tracking-widest mt-2">Active Broadcasting in Sector ${escapeHtml(sportKey.toUpperCase())}</p>
            </div>
            <a href="/live" data-link class="text-[10px] font-black text-secondary border-b-2 border-secondary/20 pb-1 uppercase tracking-widest hover:text-secondary transition-all italic">All Global Streams →</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${liveMatches.map(renderMatchCard).join("")}
          </div>
        </section>
      ` : ''}

      <!-- Competition Directory -->
      <section>
        <div class="flex items-end justify-between mb-12 border-l-4 border-primary pl-6">
          <div class="text-left">
            <h2 class="text-4xl font-black uppercase italic tracking-tighter leading-none">Elite Competitions</h2>
            <p class="text-[10px] font-bold text-on-surface opacity-40 uppercase tracking-widest mt-2">Certified Arena Partners • ${leagues.length} Sectors</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${leagues.map(l => `
            <a href="${routeForLeague(l.key)}" data-link class="bg-surface-container-high border border-white/5 rounded p-6 hover:bg-surface-container-highest transition-colors group relative overflow-hidden no-underline text-left">
              <div class="flex justify-between items-start mb-8">
                <div class="w-14 h-14 bg-white/5 rounded-lg flex items-center justify-center p-3 group-hover:bg-primary/20 transition-all">
                  <img src="${escapeHtml(getLeagueImagePath(l.key, l.sportGroup))}" alt="${escapeHtml(l.label)}" class="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all">
                </div>
                ${l.live > 0 ? `
                  <div class="bg-secondary/20 text-secondary border border-secondary/30 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest animate-pulse">Live</div>
                ` : `
                  <div class="bg-white/5 text-on-surface opacity-20 border border-white/5 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest italic">Standby</div>
                `}
              </div>
              <h3 class="text-xl font-black uppercase tracking-tight mb-2 group-hover:text-primary transition-colors italic">${escapeHtml(l.label)}</h3>
              <p class="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest mb-8">${escapeHtml(LEAGUE_REGIONS[l.key] || 'Global Sector')}</p>
              <div class="w-full py-4 bg-white/5 group-hover:bg-primary group-hover:text-white transition-all text-[10px] font-black uppercase tracking-widest rounded-sm text-center shadow-lg">Access Hub</div>
            </a>
          `).join("")}
        </div>
      </section>

      <!-- Fuel The Broadcast Integration -->
      <div class="w-full py-16 bg-surface-container-lowest border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-10 overflow-hidden relative stadium-shadow">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
        <div class="text-center z-10 px-6">
          <span class="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-4 block animate-pulse">PRO BROADCAST FEED</span>
          <h2 class="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white leading-none mb-6">UNLEASH THE<br><span class="text-glow-red text-primary">KINETIC ENGINE</span></h2>
          <p class="text-xs font-black text-on-surface/40 uppercase tracking-[0.3em] max-w-xl mx-auto leading-relaxed mb-10">Upgrade to Pro Ultra 4K and support the next generation of sports transmission.</p>
          <button class="px-12 py-4 kinetic-gradient text-xs font-black uppercase tracking-widest rounded shadow-2xl active:scale-95 transition-all">GO PRO NOW</button>
        </div>
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
    title: `${league.label} | GoalStream Arena Standings`, 
    description: `Track ${league.label} live rankings, point tables, and matchday action on GoalStream.`,
    path: routeForLeague(leagueKey)
  });

  const leagueMatches = state.matches.filter(m => m.leagueKey === leagueKey);
  const liveMatches = leagueMatches.filter(m => m.status === "live");
  const upcomingMatches = leagueMatches.filter(m => m.status === "upcoming").slice(0, 5);
  const resultMatches = leagueMatches.filter(m => m.status === "final").slice(0, 5);

  container.innerHTML = `
    <!-- League Hero Hub -->
    <section class="relative px-8 pt-16 pb-12 overflow-hidden bg-surface-container-low border-b border-white/5 group stadium-shadow">
      <div class="absolute inset-0 z-0 opacity-10 grayscale group-hover:grayscale-0 transition-all duration-700">
         <img src="${escapeHtml(getLeagueImagePath(leagueKey, league.sportGroup))}" class="w-full h-full object-cover">
      </div>
      <div class="relative z-10 flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">
        <div class="lg:w-2/3 text-left">
          <div class="mb-8">
            <span class="text-[10px] font-black tracking-[0.4em] text-primary uppercase mb-4 block font-headline italic">ARENA TRANSMISSION: SECTOR ${escapeHtml(league.sportGroup.toUpperCase())}</span>
            <h1 class="text-6xl md:text-8xl font-headline font-black tracking-tighter uppercase italic leading-[0.85] text-on-surface">
              ${escapeHtml(league.label.split(' ')[0])} <br><span class="text-primary text-glow-red">${escapeHtml(league.label.split(' ').slice(1).join(' ') || 'LEAGUE')}</span>
            </h1>
          </div>
          <div class="flex flex-wrap gap-6 items-center mt-12">
            <div class="bg-primary/10 text-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-2 border border-primary/20">
               <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
               KINETIC CONNECTION SECURE
            </div>
            <div class="text-[10px] font-black text-on-surface/40 uppercase tracking-[0.3em] italic">${leagueMatches.length} SEASON SIGNALS PIPED</div>
          </div>
        </div>
        
        <!-- Premium Sidebar Ad (GoalStream Style) -->
        <div class="lg:w-1/3">
           <div class="h-full bg-gradient-to-br from-[#cc1616] to-[#690003] p-8 flex flex-col justify-between relative overflow-hidden rounded-xl border border-white/10 shadow-2xl">
              <div class="absolute -right-12 -top-12 w-48 h-48 border-[20px] border-white/5 rounded-full animate-spin-slow"></div>
              <div>
                <span class="bg-white text-black text-[10px] font-black px-2 py-1 uppercase tracking-tighter rounded">PRO BROADCAST</span>
                <h3 class="text-3xl font-black italic uppercase mt-6 tracking-tighter leading-none text-white">ARENA<br>MASTERCLASS</h3>
                <p class="text-[10px] text-white/60 font-black uppercase tracking-widest mt-4">Multi-Angle 4K Coverage Active</p>
              </div>
              <button class="bg-white text-black text-[10px] font-black px-8 py-3 rounded-sm hover:bg-on-surface-variant transition-all uppercase tracking-widest w-full mt-8 shadow-xl active:scale-95">UPGRADE TO PRO</button>
           </div>
        </div>
      </div>
    </section>

    <!-- Sub-Navigation (Kinetic Tabs) -->
    <div class="sticky top-16 z-30 bg-[#0e0e0e]/95 backdrop-blur-xl border-b border-white/5 px-8 h-16 flex items-center shadow-xl">
      <div class="flex items-center gap-8 max-w-7xl mx-auto w-full overflow-x-auto scrollbar-hide">
        <button class="text-primary font-black uppercase tracking-tighter italic text-xs border-b-2 border-primary h-full px-4">OVERVIEW</button>
        <button class="text-on-surface/40 hover:text-white font-black uppercase tracking-tighter italic text-xs h-full px-4 transition-colors">SCHEDULE</button>
        <button class="text-on-surface/40 hover:text-white font-black uppercase tracking-tighter italic text-xs h-full px-4 transition-colors">RESULTS</button>
        <button class="text-on-surface/40 hover:text-white font-black uppercase tracking-tighter italic text-xs h-full px-4 transition-colors">TEAMS</button>
        <button class="text-on-surface/40 hover:text-white font-black uppercase tracking-tighter italic text-xs h-full px-4 transition-colors">PLAYERS</button>
      </div>
    </div>

    <div class="p-8 max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-12">
      <!-- Main Content Area: Table -->
      <div class="xl:col-span-8 space-y-16">
         <!-- Arena Standings Table -->
         <div id="league-standings-target" class="stadium-shadow min-h-[400px]">
             <!-- Hydrated by renderStandingsTable -->
             <div class="p-20 text-center flex flex-col items-center gap-6 opacity-20">
                <span class="material-symbols-outlined text-6xl animate-spin">sync</span>
                <p class="text-xs font-black uppercase tracking-[0.4em]">Synchronizing Arena Tables...</p>
             </div>
         </div>

         <!-- Featured News Section (Abstracted from News Grid) -->
         <section class="border-t border-white/5 pt-16">
            <div class="flex items-end justify-between mb-8 border-l-4 border-primary pl-6">
              <div class="text-left">
                <h2 class="text-3xl font-black italic uppercase tracking-tighter">Sector Analysis</h2>
                <p class="text-[10px] font-bold text-on-surface opacity-40 uppercase tracking-widest">Tactical Feed & News Signals</p>
              </div>
              <a href="/news" data-link class="text-[10px] font-black text-primary uppercase tracking-widest hover:underline no-underline italic">Global Feed →</a>
            </div>
            <div id="league-news-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div class="bg-white/5 p-8 rounded-xl border border-white/10 uppercase font-black text-xs tracking-widest opacity-20 text-center">Scanning news frequencies...</div>
            </div>
         </section>
      </div>
      
      <!-- Side Rail: Matchday Feed -->
      <aside class="xl:col-span-4 flex flex-col gap-12">
        <!-- Live Feed if any -->
        ${liveMatches.length > 0 ? `
          <section>
            <h3 class="text-xs font-black uppercase tracking-[.3em] text-secondary mb-6 flex items-center gap-2">
              <span class="w-2 h-2 bg-secondary rounded-full animate-ping"></span> Live Broadcasts
            </h3>
            <div class="space-y-4">
              ${liveMatches.map(renderMatchCard).join("")}
            </div>
          </section>
        ` : ''}

        <!-- Upcoming Schedule -->
        <section>
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xs font-black uppercase tracking-[.3em] text-primary italic">Upcoming Cycle</h3>
            <span class="text-[9px] font-bold opacity-30 uppercase tracking-widest">${upcomingMatches.length} Transmissions</span>
          </div>
          <div class="space-y-4">
            ${upcomingMatches.map(renderMatchCard).join("")}
          </div>
        </section>

        <!-- Strategy Insight Banner -->
        <div class="bg-surface-container-high p-8 rounded-xl border border-white/5 stadium-shadow text-left">
          <span class="material-symbols-outlined text-4xl text-secondary mb-6">bolt</span>
          <h4 class="text-xl font-black uppercase italic leading-none mb-4">TACTICAL<br>ENGINE</h4>
          <p class="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest leading-relaxed mb-8 italic">Expected Goals across this sector are trending at <span class="text-secondary">1.24x</span> efficiency.</p>
          <div class="h-1 w-full bg-white/5 rounded-full overflow-hidden">
             <div class="h-full bg-secondary w-[72%] shadow-[0_0_15px_rgba(98,223,123,0.5)]"></div>
          </div>
        </div>

        <!-- Recent Final Scores -->
        <section>
          <h3 class="text-xs font-black uppercase tracking-[.3em] text-on-surface/40 mb-6 italic">Historical Archive</h3>
          <div class="space-y-4">
            ${resultMatches.map(renderMatchCard).join("")}
          </div>
        </section>
      </aside>
    </div>
  `;

  // Hydrate dynamic components
  const sportsDbIds = { "eng.1": "4328", "esp.1": "4335", "ita.1": "4332", "ger.1": "4331", "fra.1": "4334", "ned.1": "4337", "ger.2": "4331", "ita.2": "4332" };
  const target = qs("#league-standings-target");
  if (target) {
    if (sportsDbIds[leagueKey]) {
      await renderStandingsTable(target, sportsDbIds[leagueKey]);
    } else {
      // Fallback for leagues not in mapping
      const payload = await fetchJson(`/api/standings?league=${encodeURIComponent(leagueKey)}`).catch(() => null);
      target.innerHTML = renderStandingsMarkup(Array.isArray(payload?.data) ? payload.data : []);
    }
  }

  // Hydrate News
  hydrateNewsGrid(container, "#league-news-grid", 2);
}

async function renderMatchPage(container, route) {
  const match = findMatchForRoute(route);
  if (!match) {
    container.innerHTML = `<div class="p-20 text-center flex flex-col items-center gap-6 opacity-30">
      <span class="material-symbols-outlined text-6xl animate-spin">sensors</span>
      <p class="text-xs font-black uppercase tracking-[0.4em]">Transmitting arena signals...</p>
    </div>`;
    await refreshData({ silent: true });
    const retry = findMatchForRoute(route);
    if (!retry) return renderNotFoundPage(container);
    return renderMatchPage(container, route);
  }

  const favoriteKey = `${match.sportGroup}:${match.slug}`;
  const details = await fetchMatchDetails(match);
  const activeTab = state.matchTabBySlug[favoriteKey] || "summary";
  
  setSeo({
    title: `${match.homeName} vs ${match.awayName} | GoalStream Arena`,
    description: `${match.homeName} vs ${match.awayName} live score and match detail center.`,
    path: routeForMatch(match)
  });

  const isLive = match.status === "live";

  container.innerHTML = `
    <div class="min-h-screen stadium-shadow">
      <!-- Match Hero (Stadium style) -->
      <section class="relative bg-surface-container-high border-b border-white/5 overflow-hidden stadium-shadow">
        <div class="absolute inset-0 opacity-10 grayscale mix-blend-overlay">
           <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076&auto=format&fit=crop" class="w-full h-full object-cover">
        </div>
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-[#131313]/50 to-[#131313]"></div>
        
        <div class="relative z-10 px-8 py-16 md:py-24 max-w-6xl mx-auto">
          <div class="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-20">
            <!-- Home Team -->
            <div class="flex-1 flex flex-col items-center md:items-end text-center md:text-right group">
               <div class="w-24 h-24 md:w-32 md:h-32 mb-6 bg-surface-container rounded-full p-5 shadow-2xl group-hover:scale-105 transition-transform duration-500 border border-white/5 relative">
                  <div class="absolute inset-0 bg-primary/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <img src="${escapeHtml(getTeamLogo(match.homeName, match.sportGroup))}" class="w-full h-full object-contain relative z-10">
               </div>
               <h2 class="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">${escapeHtml(match.homeName)}</h2>
               <p class="text-[10px] font-black uppercase tracking-[0.4em] text-on-surface/40 italic">Sector Commander</p>
            </div>

            <!-- Score / Status -->
            <div class="flex flex-col items-center px-10">
               <div class="mb-8 flex flex-col items-center gap-4">
                  ${isLive ? `
                    <div class="bg-primary/20 text-primary border border-primary/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 animate-pulse">
                       <span class="w-2 h-2 bg-primary rounded-full"></span>
                       ${escapeHtml(match.statusDetail || 'LIVE TRANSMISSION')}
                    </div>
                  ` : `
                    <div class="bg-white/5 text-on-surface/40 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic">
                       ${escapeHtml(match.statusDetail || formatDateTime(match.date))}
                    </div>
                  `}
               </div>
               
               <div class="flex items-center gap-6 md:gap-10">
                  <span class="text-7xl md:text-9xl font-black italic tracking-tighter text-on-surface text-glow-red">${escapeHtml(match.homeScore)}</span>
                  <span class="text-4xl md:text-6xl font-thin text-on-surface/20 italic">:</span>
                  <span class="text-7xl md:text-9xl font-black italic tracking-tighter text-on-surface/60">${escapeHtml(match.awayScore)}</span>
               </div>

               <div class="mt-12 flex flex-col items-center gap-4">
                  <span class="text-[10px] font-black uppercase tracking-[0.5em] text-on-surface/20 italic">${escapeHtml(match.leagueLabel)}</span>
                  <button class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors group">
                    <span class="material-symbols-outlined text-lg group-hover:animate-pulse">sensors</span>
                    ARENA BROADCAST FEED
                  </button>
               </div>
            </div>

            <!-- Away Team -->
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

async function renderPlayersHubPage(container) {
  setSeo({
    title: "Ultimate Players Hub | GoalStream",
    description: "Explore the profiles, stats, and legacies of the world's greatest athletes.",
    path: "/players"
  });

  container.innerHTML = `
    <div class="min-h-screen">
      <!-- Hero Slider Section (Lionel Messi as featured) -->
      <section class="relative h-[600px] w-full overflow-hidden stadium-shadow">
        <img src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1972&auto=format&fit=crop" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-gradient-to-r from-[#131313] via-[#131313]/50 to-transparent"></div>
        <div class="absolute inset-0 flex items-center px-12 lg:px-24">
          <div class="max-w-2xl space-y-6 text-left">
            <div class="flex items-center gap-4">
              <span class="bg-primary text-on-primary px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-sm italic">LEGENDARY STATUS</span>
              <span class="text-on-surface-variant text-[10px] font-black tracking-widest uppercase opacity-40 italic">GOALSTREAM FEATURE</span>
            </div>
            <h1 class="text-7xl lg:text-9xl font-black italic tracking-tighter uppercase leading-[0.8] text-on-surface drop-shadow-2xl">
              Lionel<br/><span class="text-primary text-glow-red">Messi</span>
            </h1>
            <p class="text-xs font-black text-on-surface/40 max-w-md uppercase tracking-widest leading-loose italic">8-time Ballon d'Or winner. World Cup Champion. The greatest of all time continues his legacy in the arena.</p>
            <div class="flex gap-4 pt-4">
              <button class="kinetic-gradient text-white px-8 py-4 font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all">VIEW CAREER STATS</button>
              <button class="bg-white/5 backdrop-blur-md border border-white/10 text-white px-8 py-4 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">WATCH HIGHLIGHTS</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Player Directory Filters -->
      <section class="px-6 lg:px-12 py-12 border-b border-white/5">
        <div class="flex flex-wrap items-center justify-between gap-8 max-w-7xl mx-auto">
          <div class="text-left">
            <h2 class="text-4xl font-black uppercase italic tracking-tighter leading-none">Global <span class="text-primary text-glow-red">Directory</span></h2>
            <p class="text-[10px] font-bold text-on-surface opacity-40 uppercase tracking-widest mt-2">Active Athlete Records • 4,200+ Verified Profiles</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="bg-primary text-on-primary px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded shadow-xl">ALL SPORTS</button>
            ${Object.keys(SPORT_GROUPS).slice(0, 5).map(s => `
              <button class="bg-surface-container-high text-on-surface/40 px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded hover:bg-white/5 hover:text-white transition-all">${s}</button>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- Trending Players Grid -->
      <section class="px-6 lg:px-12 py-16 max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-12 border-l-4 border-secondary pl-6">
           <div class="text-left">
              <h3 class="text-2xl font-black uppercase italic tracking-tighter leading-none text-secondary">Kinetic Pulse</h3>
              <p class="text-[10px] font-bold text-on-surface opacity-40 uppercase tracking-widest mt-2">Trending Athletes in Sector Prime</p>
           </div>
           <a href="#" class="text-[10px] font-black text-secondary border-b border-secondary/20 pb-1 uppercase tracking-widest">Global Archives →</a>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <!-- Featured Player Cards (Placeholder for now) -->
           ${Array.from({length: 8}).map((_, i) => `
              <div class="bg-surface-container-high border border-white/5 rounded-xl overflow-hidden group hover:border-primary/20 transition-all stadium-shadow text-left">
                 <div class="relative h-48 bg-surface-container overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=1974&auto=format&fit=crop" class="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#131313] to-transparent opacity-60"></div>
                    <div class="absolute bottom-4 left-4">
                       <p class="text-[8px] font-black text-primary uppercase tracking-widest italic">Forward</p>
                       <h4 class="text-xl font-black uppercase italic tracking-tighter">Athlete ${i+1}</h4>
                    </div>
                 </div>
                 <div class="p-6 space-y-4">
                    <div class="flex justify-between items-center text-[8px] font-black uppercase tracking-widest opacity-40">
                       <span>Sector</span>
                       <span class="text-white">Football</span>
                    </div>
                    <div class="flex justify-between items-center text-[8px] font-black uppercase tracking-widest opacity-40">
                       <span>Arena</span>
                       <span class="text-white">Europe Primary</span>
                    </div>
                    <button class="w-full border border-white/5 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all rounded">INTEL PROFILE</button>
                 </div>
              </div>
           `).join("")}
        </div>
      </section>

      <!-- Premium Banner Integration -->
      <section class="p-8 max-w-7xl mx-auto">
         <div class="bg-gradient-to-r from-[#1fa64a]/20 to-transparent border border-[#1fa64a]/20 p-10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-10 text-left relative overflow-hidden">
            <div class="absolute -right-20 -top-20 w-80 h-80 bg-[#1fa64a]/5 rounded-full blur-3xl"></div>
            <div class="relative z-10">
               <span class="text-[10px] font-black text-[#1fa64a] uppercase tracking-[0.4em] mb-4 block">OFFICIAL ARENA PARTNER</span>
               <h3 class="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">FUEL THE<br><span class="text-[#1fa64a]">BROADCAST</span></h3>
               <p class="text-xs font-black text-on-surface opacity-40 uppercase tracking-widest mt-6 max-w-md italic">Join the GoalStream collective. Support independent sports transmission and unlock ultra-kinetic features.</p>
            </div>
            <button class="bg-[#1fa64a] text-black px-12 py-4 font-black uppercase tracking-widest text-[10px] rounded-lg shadow-2xl active:scale-95 transition-all relative z-10">UNLEASH NOW</button>
         </div>
      </section>
    </div>
  `;
}

async function renderTeamsHubPage(container) {
  setSeo({
    title: "Ultimate Teams Hub | GoalStream",
    description: "Connect with the world's most elite sports organizations and club legacies.",
    path: "/teams"
  });

  container.innerHTML = `
    <div class="min-h-screen">
      <!-- Teams Video/Hero Header -->
      <section class="relative h-[500px] overflow-hidden stadium-shadow bg-surface-container-low border-b border-white/5">
        <div class="absolute inset-0 opacity-20 grayscale mix-blend-overlay">
           <img src="https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=1978&auto=format&fit=crop" class="w-full h-full object-cover">
        </div>
        <div class="absolute inset-0 bg-gradient-to-b from-[#131313]/0 to-[#131313]"></div>
        <div class="relative z-10 h-full flex flex-col justify-center px-8 md:px-20 max-w-7xl mx-auto text-left">
           <div class="flex items-center gap-3 mb-6">
             <span class="bg-secondary text-white px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-sm italic">ULTIMATE CLUBS</span>
             <span class="text-on-surface-variant font-black text-[10px] tracking-[0.3em] uppercase opacity-40 italic">Active Tactical Intel</span>
           </div>
           <h1 class="text-7xl md:text-9xl font-black italic tracking-tighter uppercase leading-[0.8] text-white mb-8">
             ULTIMATE<br/><span class="text-secondary text-glow-green">TEAMS HUB</span>
           </h1>
           <p class="text-xs font-black text-on-surface opacity-40 max-w-2xl uppercase tracking-[0.2em] leading-loose italic">
              From historic dynasties to modern juggernauts. Explore the tactical DNA and legacy metrics of the world's elite sports organizations.
           </p>
        </div>
      </section>

      <!-- Search & Filters -->
      <section class="px-6 lg:px-12 py-12 border-b border-white/5">
        <div class="flex flex-wrap items-center justify-between gap-8 max-w-7xl mx-auto">
           <div class="relative w-full max-w-md">
              <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40">search</span>
              <input type="text" placeholder="LOCATE UNIT / TEAM..." class="w-full bg-surface-container-high border-none py-4 px-12 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl focus:ring-1 focus:ring-secondary transition-all">
           </div>
           <div class="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-40">
              <span class="text-secondary">ACTIVE SECTORS:</span>
              <span class="hover:text-white cursor-pointer transition-colors">SOCCER</span>
              <span class="hover:text-white cursor-pointer transition-colors">NBA</span>
              <span class="hover:text-white cursor-pointer transition-colors">NFL</span>
              <span class="hover:text-white cursor-pointer transition-colors">MLB</span>
           </div>
        </div>
      </section>

      <!-- Teams Grid -->
      <section class="px-6 lg:px-12 py-16 max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           ${Array.from({length: 12}).map((_, i) => `
              <div class="bg-surface-container-high border border-white/5 rounded-2xl p-8 hover:bg-surface-container-highest transition-all group relative overflow-hidden stadium-shadow text-center">
                 <div class="absolute -right-10 -top-10 w-32 h-32 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-all"></div>
                 <div class="w-24 h-24 bg-surface-container rounded-full mx-auto mb-6 p-5 border border-white/5 group-hover:scale-110 transition-all duration-500 shadow-xl">
                    <img src="https://images.thesportsdb.com/images/media/team/badge/xqwpuy1471203233.png" class="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all">
                 </div>
                 <h4 class="text-xl font-black uppercase italic tracking-tighter mb-2 group-hover:text-secondary transition-colors">Team Unit ${i+1}</h4>
                 <p class="text-[9px] font-bold uppercase tracking-widest text-on-surface opacity-30 mb-8">Europe Primary Sector</p>
                 <div class="grid grid-cols-2 gap-3 mb-8">
                    <div class="bg-white/5 p-3 rounded-lg text-left">
                       <span class="text-[7px] font-black uppercase opacity-40 block tracking-widest">Strength</span>
                       <span class="text-sm font-black text-secondary">92%</span>
                    </div>
                    <div class="bg-white/5 p-3 rounded-lg text-left">
                       <span class="text-[7px] font-black uppercase opacity-40 block tracking-widest">Rank</span>
                       <span class="text-sm font-black text-white">#${i+1}</span>
                    </div>
                 </div>
                 <button class="w-full py-4 bg-white/5 text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-secondary hover:text-black transition-all shadow-lg italic">Command Post Hub</button>
              </div>
           `).join("")}
        </div>
      </section>
    </div>
  `;
}

async function renderPlayerProfilePage(container, route) {
   // Placeholder for player profile intel
   setSeo({ title: "Player Profile Intel | GoalStream", description: "In-depth kinetic metrics and career mission logs." });
   container.innerHTML = `<div class="p-20 text-center flex flex-col items-center gap-8 opacity-40">
      <span class="material-symbols-outlined text-7xl animate-pulse">monitoring</span>
      <p class="text-xs font-black uppercase tracking-[0.5em] italic">Transmitting Athlete Tactical Data...</p>
      <button class="mt-8 px-10 py-3 bg-white/5 text-[10px] font-black uppercase tracking-widest rounded hover:bg-white/10 transition-all" onclick="window.history.back()">ABORT SEARCH</button>
   </div>`;
}

async function renderTeamProfilePage(container, route) {
   // Placeholder for team profile intel
   setSeo({ title: "Team Tactical Intel | GoalStream", description: "Strategic squad metrics and arena achievement records." });
   container.innerHTML = `<div class="p-20 text-center flex flex-col items-center gap-8 opacity-40">
      <span class="material-symbols-outlined text-7xl animate-pulse">hub</span>
      <p class="text-xs font-black uppercase tracking-[0.5em] italic">Accessing Unit Command Post...</p>
      <button class="mt-8 px-10 py-3 bg-white/5 text-[10px] font-black uppercase tracking-widest rounded hover:bg-white/10 transition-all" onclick="window.history.back()">ABORT SEARCH</button>
   </div>`;
}

function renderDonatePage(container) {
  setSeo({ 
    title: "Support the Arena | GoalStream Collective", 
    description: "Help fund server costs and real-time kinetic sports coverage.", 
    path: "/donate" 
  });
  
  const trust = getTrustSignals();
  container.innerHTML = `
    <section class="min-h-screen py-24 px-8 max-w-5xl mx-auto stadium-shadow">
      <div class="border-l-4 border-primary pl-8 mb-16 text-left">
        <span class="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block">GOALSTREAM COLLECTIVE</span>
        <h1 class="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-6">FUEL THE<br><span class="text-glow-red text-primary">BROADCAST</span></h1>
        <p class="text-xs font-black text-on-surface opacity-40 uppercase tracking-widest max-w-xl leading-loose italic">Independent sports transmission requires collective energy. Your support keeps the signals clear and the data real-time.</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        <div class="bg-surface-container-high p-6 rounded-xl border border-white/5 text-left group hover:border-primary/20 transition-all">
          <span class="text-3xl font-black italic tracking-tighter text-primary group-hover:text-glow-red transition-all">${trust.monthlyUsers.toLocaleString()}</span>
          <p class="text-[8px] font-bold uppercase tracking-widest opacity-40 mt-2">Active Receivers</p>
        </div>
        <div class="bg-surface-container-high p-6 rounded-xl border border-white/5 text-left group hover:border-primary/20 transition-all">
          <span class="text-3xl font-black italic tracking-tighter text-white">${trust.indexedPages.toLocaleString()}</span>
          <p class="text-[8px] font-bold uppercase tracking-widest opacity-40 mt-2">Sectors Logged</p>
        </div>
        <div class="bg-surface-container-high p-6 rounded-xl border border-white/5 text-left group hover:border-primary/20 transition-all">
          <span class="text-3xl font-black italic tracking-tighter text-white">${state.matches.length}</span>
          <p class="text-[8px] font-bold uppercase tracking-widest opacity-40 mt-2">Live Frequencies</p>
        </div>
        <div class="bg-surface-container-high p-6 rounded-xl border border-white/5 text-left group hover:border-primary/20 transition-all">
          <span class="text-3xl font-black italic tracking-tighter text-white">${state.favoriteMatches.length}</span>
          <p class="text-[8px] font-bold uppercase tracking-widest opacity-40 mt-2">Saved Points</p>
        </div>
      </div>

      <div class="bg-gradient-to-br from-[#cc1616] via-[#690003] to-[#0e0e0e] p-12 rounded-2xl relative overflow-hidden stadium-shadow text-left">
        <div class="absolute -right-20 -top-20 w-80 h-80 border-[30px] border-white/5 rounded-full animate-spin-slow"></div>
        <div class="relative z-10 space-y-8">
           <h3 class="text-3xl font-black italic uppercase tracking-tighter text-white leading-tight">INITIATE KO-FI<br>COMMAND</h3>
           <p class="text-xs font-black text-white/60 uppercase tracking-widest max-w-md leading-relaxed italic">Direct funding for hosting, API maintenance, and premium design development. Join the elite supporters.</p>
           <a href="${escapeHtml(DONATION_KOFI_URL)}" target="_blank" class="inline-block bg-white text-black px-12 py-4 text-[10px] font-black uppercase tracking-widest rounded shadow-2xl active:scale-95 transition-all no-underline">TRANSMIT SUPPORT</a>
        </div>
      </div>

      <div class="mt-24 pt-12 border-t border-white/5">
         <div class="flex flex-col md:flex-row items-center justify-between gap-10">
            <div class="text-left">
               <h4 class="text-xl font-black italic uppercase tracking-tighter mb-4">SPONSOR SECTOR</h4>
               <p class="text-[10px] font-bold text-on-surface opacity-30 uppercase tracking-widest max-w-sm italic">Brand placement across the GoalStream universe for premium sports traffic.</p>
            </div>
            ${renderInlineSponsorCard("Elite Brand Placement", "/advertise")}
         </div>
      </div>
    </section>
  `;
}async function renderNewsPage(container) {
  setSeo({ 
    title: "Newsroom | Livescorefree Kinetic Broadcast", 
    description: "Editorial sports coverage, tactical analysis, and premium headlines from the GoalStream universe.", 
    path: "/news" 
  });
  
  container.innerHTML = `
    <!-- Kinetic Hero Results Slider (News Style) -->
    <section class="relative w-full h-[600px] overflow-hidden group">
      <div class="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] group-hover:scale-105" 
           style="background-image: linear-gradient(to top, #0e0e0e 10%, transparent 80%), url('https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop')"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/40 to-transparent"></div>
      <div class="relative h-full flex flex-col justify-end p-8 md:p-16 space-y-6 max-w-7xl mx-auto">
        <div class="flex items-center gap-3">
          <span class="bg-primary text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm">KINETIC REPORT</span>
          <span class="text-white/60 text-xs font-bold uppercase tracking-tighter">Global Sports Newsroom</span>
        </div>
        <div class="space-y-4">
          <h1 class="text-5xl md:text-8xl font-black font-headline uppercase leading-none tracking-tighter text-on-surface">
            Latest Arena<br/><span class="text-primary">Reports</span>
          </h1>
          <p class="max-w-2xl text-on-surface/70 text-sm md:text-lg font-medium border-l-4 border-primary pl-4 uppercase italic tracking-tight">
            DEEP ANALYSIS AND VIRAL MOMENTS FROM THE WORLD'S ELITE LEAGUES. PIPED DIRECTLY TO THE HUB.
          </p>
        </div>
      </div>
    </section>

    <!-- Results Grid / News Index -->
    <div class="p-8 max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-12 border-l-4 border-primary pl-4">
         <h2 class="text-3xl font-black italic uppercase tracking-tighter">Editorial Grid</h2>
         <div class="flex items-center gap-4 text-[10px] font-black text-on-surface/40 uppercase tracking-widest" id="news-count">SCANNING FEED...</div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="news-page-grid">
         <div class="col-span-full py-20 text-center opacity-20 uppercase font-black tracking-widest italic">Piping news signals into the arena...</div>
      </div>
    </div>

    <!-- Multi-League Directory (Footer Style) -->
    <section class="bg-surface-container-high border-t border-white/5 py-16 px-8 mt-20">
      <div class="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12">
        <div class="space-y-6">
          <h4 class="text-xs font-black uppercase text-primary tracking-widest border-b border-primary/20 pb-2">Global Signal</h4>
          <p class="text-[10px] font-bold text-on-surface/40 leading-relaxed uppercase">livescorefree kinetic broadcast aggregates real-time data and editorial content for elite sport enthusiasts.</p>
        </div>
        ${Object.entries(SPORT_GROUPS).slice(0, 3).map(([key, sport]) => `
          <div class="space-y-4">
            <h4 class="text-xs font-black uppercase text-primary tracking-widest border-b border-primary/20 pb-2">${escapeHtml(sport.label)}</h4>
            <ul class="space-y-2 text-[10px] font-bold uppercase text-on-surface/60">
              ${Object.entries(LEAGUES).filter(([_, l]) => l.sportGroup === key).slice(0, 4).map(([lk, lv]) => `
                <li><a href="${routeForLeague(lk)}" data-link class="hover:text-primary transition-colors">${escapeHtml(lv.label)}</a></li>
              `).join("")}
            </ul>
          </div>
        `).join("")}
      </div>
    </section>
  `;
  void hydrateNewsGrid(container, "#news-page-grid", 12, "#news-count");
}

function renderContactPage(container) {
  setSeo({ 
    title: "Contact the Hub | GoalStream Center", 
    description: "Support, advertising, and arena partnership contact page.", 
    path: "/contact" 
  });
  
  container.innerHTML = `
    <section class="min-h-screen py-24 px-8 max-w-5xl mx-auto stadium-shadow text-left">
      <div class="border-l-4 border-primary pl-8 mb-16">
        <span class="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">ARENA SUPPORT UNIT</span>
        <h1 class="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-6">CONTACT THE<br><span class="text-glow-red text-primary">COMMAND CENTER</span></h1>
        <p class="text-xs font-black text-on-surface opacity-40 uppercase tracking-widest max-w-xl leading-loose italic">Transmit your inquiries directly to our tactical response team.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <!-- Contact Card 1 -->
        <div class="bg-surface-container-high border border-white/5 p-10 rounded-2xl group hover:border-primary/20 transition-all relative overflow-hidden">
           <div class="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
           <span class="text-[10px] font-black text-primary uppercase tracking-widest mb-6 block italic">Signal Channel 01</span>
           <h3 class="text-2xl font-black italic uppercase tracking-tighter mb-4">BROADCAST SUPPORT</h3>
           <p class="text-xs font-black text-on-surface/40 uppercase tracking-widest leading-relaxed mb-10 italic">Reporting feed disruptions or tactical errors in the match data stream.</p>
           <a href="mailto:support@livescoreFree.online" class="text-primary text-xs font-black uppercase tracking-widest border-b border-primary/20 pb-1 hover:text-white transition-all no-underline">support@livescoreFree.online</a>
        </div>

        <!-- Contact Card 2 -->
        <div class="bg-surface-container-high border border-white/5 p-10 rounded-2xl group hover:border-secondary/20 transition-all relative overflow-hidden">
           <div class="absolute -right-10 -top-10 w-32 h-32 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-all"></div>
           <span class="text-[10px] font-black text-secondary uppercase tracking-widest mb-6 block italic">Signal Channel 02</span>
           <h3 class="text-2xl font-black italic uppercase tracking-tighter mb-4">ELITE PARTNERSHIPS</h3>
           <p class="text-xs font-black text-on-surface/40 uppercase tracking-widest leading-relaxed mb-10 italic">Inquiries regarding brand placement, sponsorship, and arena collaborations.</p>
           <a href="/advertise" data-link class="text-secondary text-xs font-black uppercase tracking-widest border-b border-secondary/20 pb-1 hover:text-white transition-all no-underline">VIEW MEDIA KIT →</a>
        </div>
      </div>
    </section>
  `;
}

function renderAboutPage(container) {
  setSeo({ 
    title: "About the Project | GoalStream Protocol", 
    description: "The logic and vision behind the ultimate kinetic sports platform.", 
    path: "/about" 
  });
  
  container.innerHTML = `
    <section class="min-h-screen py-24 px-8 max-w-5xl mx-auto stadium-shadow text-left">
      <div class="border-l-4 border-primary pl-8 mb-16">
        <span class="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">PROTOCOL OVERVIEW</span>
        <h1 class="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-6">THE<br><span class="text-glow-red text-primary">GOALSTREAM VISION</span></h1>
        <p class="text-xs font-black text-on-surface opacity-40 uppercase tracking-widest max-w-xl leading-loose italic">A faster, lighter, and more immersive way to experience the world's elite sports data.</p>
      </div>

      <div class="space-y-12 mb-24">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
           <div class="md:col-span-4">
              <span class="text-[10px] font-black text-primary uppercase tracking-widest italic block mb-2">01. PHILOSOPHY</span>
              <h3 class="text-2xl font-black italic uppercase tracking-tighter">DATA AS ENERGY</h3>
           </div>
           <div class="md:col-span-8">
              <p class="text-xs font-black text-on-surface/60 uppercase tracking-widest leading-loose italic">GoalStream was built on the belief that sports data shouldn't be static. It should feel kinetic, alive, and immersive. Every score, every card, and every timeline event is a pulse in the global arena.</p>
           </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
           <div class="md:col-span-4">
              <span class="text-[10px] font-black text-primary uppercase tracking-widest italic block mb-2">02. TECHNOLOGY</span>
              <h3 class="text-2xl font-black italic uppercase tracking-tighter">ELITE PIPELINES</h3>
           </div>
           <div class="md:col-span-8">
              <p class="text-xs font-black text-on-surface/60 uppercase tracking-widest leading-loose italic">Aggregating major global feeds into a unified high-performance protocol. Our engine ensures that data is transmitted with sub-second accuracy across all sectors.</p>
           </div>
        </div>
      </div>
    </section>
  `;
}

function renderFeedbackPage(container) {
  setSeo({ 
    title: "Feedback Terminal | GoalStream Hub", 
    description: "Submit tactical reports and feedback directly to the protocol team.", 
    path: "/feedback" 
  });
  
  container.innerHTML = `
    <section class="min-h-screen py-24 px-8 max-w-5xl mx-auto stadium-shadow text-left">
      <div class="border-l-4 border-secondary pl-8 mb-16">
        <span class="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mb-4 block italic">TACTICAL REPORTING</span>
        <h1 class="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-6">FEEDBACK<br><span class="text-glow-green text-secondary">TERMINAL</span></h1>
        <p class="text-xs font-black text-on-surface opacity-40 uppercase tracking-widest max-w-xl leading-loose italic">Store local tactical notes and protocol feedback directly in your browser's encrypted sector.</p>
      </div>

      <div class="space-y-8">
        <div class="bg-surface-container-high border border-white/5 rounded-2xl p-8 stadium-shadow">
           <textarea id="feedback-notes" class="w-full bg-transparent border-none text-[10px] font-black uppercase tracking-widest leading-loose min-h-[300px] focus:ring-0 placeholder:opacity-20 italic" placeholder="BEGIN TRANSMISSION OVERRIDE...">${escapeHtml(state.feedbackNotes.join("\n\n"))}</textarea>
        </div>
        <div class="flex flex-wrap gap-4">
           <button class="bg-secondary text-black px-10 py-4 text-[10px] font-black uppercase tracking-widest rounded shadow-2xl active:scale-95 transition-all italic" id="save-feedback">COMMIT TO SECTOR</button>
           <button class="bg-white/5 text-white px-10 py-4 text-[10px] font-black uppercase tracking-widest rounded hover:bg-white/10 transition-all italic" id="refresh-feedback-data">REFRESH ARENA DATA</button>
        </div>
      </div>
    </section>
  `;
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
  container.innerHTML = `
    <section class="min-h-screen py-24 px-8 max-w-5xl mx-auto text-left">
      <div class="border-l-4 border-primary pl-8 mb-16">
        <h1 class="text-5xl font-black italic uppercase tracking-tighter leading-none mb-6">${escapeHtml(title)}</h1>
        <p class="text-xs font-black text-on-surface opacity-40 uppercase tracking-widest leading-loose italic">${escapeHtml(lead)}</p>
      </div>
      <div class="article-body text-on-surface/60 text-xs font-black uppercase tracking-widest leading-loose italic space-y-6">
        ${bodyHtml}
      </div>
    </section>
  `;
}

function renderNotFoundPage(container) {
  setSeo({ title: "Signal Lost | 404 Not Found", description: "The requested arena route could not be located." });
  container.innerHTML = `
    <section class="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div class="relative mb-12">
        <span class="material-symbols-outlined text-9xl text-primary opacity-20 animate-pulse">explore_off</span>
        <div class="absolute inset-0 flex items-center justify-center">
           <span class="text-6xl font-black italic tracking-tighter text-white">404</span>
        </div>
      </div>
      <h1 class="text-4xl font-black italic uppercase tracking-tighter mb-4">SIGNAL LOST</h1>
      <p class="text-[10px] font-black text-on-surface opacity-40 uppercase tracking-[0.3em] mb-12 italic">THE REQUESTED ARENA ROUTE DOES NOT EXIST IN THIS SECTOR.</p>
      <a data-link href="/home" class="bg-primary text-black px-12 py-4 text-[10px] font-black uppercase tracking-widest rounded shadow-2xl active:scale-95 transition-all no-underline italic">ABORT AND RECALL HOME</a>
    </section>
  `;
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
}async function renderLivePage(container) {
  setSeo({ 
    title: "Live Score Centre | Livescorefree Kinetic Broadcast", 
    description: "Immersive live coverage of global sports competitions. Real-time scores, tactical reports, and arena tables for every match in progress.", 
    path: "/live" 
  });

  const liveMatches = state.liveMatches || [];
  const finalMatches = state.finalMatches || [];
  const upcomingMatches = state.upcomingMatches || [];
  const featured = liveMatches[0] || upcomingMatches[0];

  let heroHTML = "";
  if (featured) {
    heroHTML = `
      <section class="relative h-96 w-full overflow-hidden flex items-end">
        <div class="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] scale-110" 
             style="background-image: linear-gradient(to top, #0e0e0e 10%, transparent 80%), url('${getSportImagePath(featured.sportGroup)}');"></div>
        <div class="relative w-full px-8 pb-12 z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-7xl mx-auto">
          <div>
            <div class="flex items-center space-x-3 mb-4">
              <span class="px-3 py-1 bg-primary text-white font-black text-[10px] tracking-widest rounded-sm backdrop-blur-md uppercase">LIVE NOW</span>
              <span class="text-primary font-bold text-sm tracking-tighter uppercase">${liveMatches.length} MATCHES IN PROGRESS</span>
            </div>
            <h1 class="text-6xl md:text-8xl font-black font-headline uppercase tracking-tighter leading-none text-on-surface">
              Live Score<br/><span class="text-primary">Centre</span>
            </h1>
          </div>
          <div class="flex space-x-4">
             <a href="${routeForMatch(featured)}" data-link class="kinetic-gradient px-8 py-4 text-white font-black uppercase text-xs tracking-widest rounded-sm hover:scale-105 transition-transform active:scale-95 shadow-xl no-underline">
               View Multi-Stream
             </a>
          </div>
        </div>
      </section>
    `;
  } else {
    heroHTML = `
      <section class="relative h-96 w-full overflow-hidden flex items-end bg-surface-container-low">
        <div class="relative w-full px-8 pb-12 z-10 max-w-7xl mx-auto">
          <h1 class="text-6xl md:text-8xl font-black font-headline uppercase tracking-tighter leading-none text-on-surface opacity-20">
            Live Score<br/>Centre
          </h1>
          <p class="text-xs font-black uppercase tracking-[0.3em] opacity-40 mt-6">Scanning global sports frequencies for live signals...</p>
        </div>
      </section>
    `;
  }

  container.innerHTML = `
    ${heroHTML}
    
    <!-- Category Filter Bar -->
    <div class="sticky top-16 z-30 w-full bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/5 px-8 py-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
      <div class="flex items-center space-x-8 max-w-7xl mx-auto">
        <button class="text-primary border-b-2 border-primary pb-1 font-black text-[10px] tracking-widest uppercase">ALL SPORTS</button>
        ${Object.entries(SPORT_GROUPS).map(([key, sport]) => `
          <a href="/sport/${key}" data-link class="text-on-surface/50 hover:text-primary font-bold text-[10px] tracking-widest uppercase transition-colors">${escapeHtml(sport.label)}</a>
        `).join("")}
      </div>
    </div>

    <!-- Main Live Grid -->
    <section class="px-8 py-16 max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${liveMatches.length > 0 ? liveMatches.map(m => `
          <a href="${routeForMatch(m)}" data-link class="group bg-surface-container-high rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative">
            <div class="p-6">
              <div class="flex justify-between items-start mb-8">
                <div class="flex flex-col">
                  <span class="text-[10px] font-black tracking-[0.2em] text-primary uppercase italic">${escapeHtml(m.leagueLabel)}</span>
                  <span class="text-[9px] font-bold text-on-surface/40 uppercase mt-1 tracking-widest">${escapeHtml(m.statusLabel || 'Live')}</span>
                </div>
                <span class="text-primary font-black text-xs italic tracking-tighter">${m.statusDetail || 'In Progress'}</span>
              </div>
              <div class="space-y-8 mb-8">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center font-black italic shadow-inner border border-white/5">
                      ${m.homeLogo ? `<img src="${m.homeLogo}" alt="" class="w-6 h-6 object-contain">` : (m.homeAbbr || m.homeName.charAt(0))}
                    </div>
                    <span class="font-black text-lg tracking-tight italic uppercase">${escapeHtml(m.homeName)}</span>
                  </div>
                  <span class="text-3xl font-black italic text-primary">${m.homeScore || 0}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center font-black italic shadow-inner border border-white/5">
                      ${m.awayLogo ? `<img src="${m.awayLogo}" alt="" class="w-6 h-6 object-contain">` : (m.awayAbbr || m.awayName.charAt(0))}
                    </div>
                    <span class="font-black text-lg tracking-tight italic uppercase">${escapeHtml(m.awayName)}</span>
                  </div>
                  <span class="text-3xl font-black italic text-primary">${m.awayScore || 0}</span>
                </div>
              </div>
              <div class="flex gap-2">
                <div class="flex-1 bg-surface-container-highest py-3 rounded text-[10px] font-black tracking-widest uppercase text-center opacity-70">Arena Hub</div>
                <button class="flex-1 kinetic-gradient py-3 rounded text-[10px] font-black tracking-widest uppercase text-white shadow-xl text-center">Live Stream</button>
              </div>
            </div>
          </a>
        `).join("") : `
          <div class="col-span-full py-32 text-center flex flex-col items-center gap-6 opacity-20">
            <span class="material-symbols-outlined text-7xl">sensors_off</span>
            <p class="text-xs font-black uppercase tracking-[0.3em]">No live match signals detected right now.</p>
          </div>
        `}
      </div>
    </section>

    <!-- Recent Results (Tonal Transition) -->
    <section class="bg-surface-container-low py-16 px-8 mt-12">
      <div class="max-w-7xl mx-auto">
        <div class="flex justify-between items-center mb-10 border-b border-white/5 pb-4">
          <h2 class="text-4xl font-black font-headline uppercase tracking-tighter leading-none">Recent <span class="text-primary">Results</span></h2>
          <a class="text-primary font-bold text-[10px] tracking-widest uppercase hover:underline no-underline" href="/results" data-link>View Archive</a>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          ${finalMatches.slice(0, 4).map(m => `
            <a href="${routeForMatch(m)}" data-link class="bg-surface-container p-4 rounded-lg border border-white/5 hover:bg-surface-container-high transition-colors group no-underline">
              <div class="flex justify-between text-[9px] font-black text-on-surface/40 mb-3 uppercase tracking-widest">
                <span>${escapeHtml(m.leagueLabel)}</span>
                <span class="text-primary">FINAL</span>
              </div>
              <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-sm uppercase">${escapeHtml(m.homeName)}</span>
                <span class="font-black text-lg ${Number(m.homeScore) >= Number(m.awayScore) ? 'text-primary' : ''}">${m.homeScore}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-bold text-sm uppercase">${escapeHtml(m.awayName)}</span>
                <span class="font-black text-lg ${Number(m.awayScore) >= Number(m.homeScore) ? 'text-primary' : ''}">${m.awayScore}</span>
              </div>
            </a>
          `).join("")}
        </div>
      </div>
    </section>

    <!-- Upcoming Today Section -->
    <section class="py-20 px-8 max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-10 border-b border-white/5 pb-4">
        <h2 class="text-4xl font-black font-headline uppercase tracking-tighter leading-none">Upcoming <span class="text-primary">Today</span></h2>
        <a class="text-primary font-bold text-[10px] tracking-widest uppercase hover:underline no-underline" href="/upcoming" data-link>Full Schedule</a>
      </div>
      <div class="flex overflow-x-auto gap-6 pb-8 scrollbar-hide">
        ${upcomingMatches.slice(0, 8).map(m => `
          <a href="${routeForMatch(m)}" data-link class="flex-none w-72 bg-surface-container-high p-6 rounded-xl border-l-4 border-primary shadow-2xl group transition-colors no-underline">
            <div class="text-[10px] font-black text-primary tracking-widest uppercase mb-4">${escapeHtml(m.sportLabel)} / ${formatDateTime(m.date).split(',')[1]}</div>
            <div class="space-y-4 mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-white/5 font-black italic text-[10px]">
                   ${m.homeAbbr || m.homeName.charAt(0)}
                </div>
                <span class="font-bold uppercase tracking-tight text-sm">${escapeHtml(m.homeName)}</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-white/5 font-black italic text-[10px]">
                   ${m.awayAbbr || m.awayName.charAt(0)}
                </div>
                <span class="font-bold uppercase tracking-tight text-sm">${escapeHtml(m.awayName)}</span>
              </div>
            </div>
            <button class="w-full py-2 border border-white/10 text-[9px] font-black tracking-widest uppercase group-hover:bg-primary group-hover:text-white transition-all">Match Hub</button>
          </a>
        `).join("")}
      </div>
    </section>

    <!-- Global Niche Coverage Banner -->
    <section class="px-8 pb-20 max-w-7xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 bg-surface-container-high p-8 rounded-xl border border-white/5 relative overflow-hidden group shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          <div class="absolute right-[-5%] bottom-[-10%] opacity-10 group-hover:scale-110 transition-transform duration-700">
            <span class="material-symbols-outlined text-[200px] text-primary">public</span>
          </div>
          <div class="relative z-10">
            <h3 class="text-3xl font-black font-headline uppercase tracking-tighter mb-4">Global Niche Coverage</h3>
            <p class="text-on-surface/60 max-w-lg mb-8 text-sm leading-relaxed uppercase font-bold italic">Experience live data and broadcasts from over 800 professional leagues worldwide. From South American Tier-3 Soccer to European Table Tennis Pro League, we miss nothing.</p>
            <div class="flex flex-wrap gap-3">
              <span class="px-4 py-2 bg-surface-container-lowest text-[9px] font-bold border border-white/10 tracking-widest uppercase cursor-pointer hover:border-primary transition-colors">Liga MX</span>
              <span class="px-4 py-2 bg-surface-container-lowest text-[9px] font-bold border border-white/10 tracking-widest uppercase cursor-pointer hover:border-primary transition-colors">EuroCup</span>
              <span class="px-4 py-2 bg-surface-container-lowest text-[9px] font-bold border border-white/10 tracking-widest uppercase cursor-pointer hover:border-primary transition-colors">K-League</span>
              <span class="px-4 py-2 bg-surface-container-lowest text-[9px] font-bold border border-white/10 tracking-widest uppercase cursor-pointer hover:border-primary transition-colors">Snooker</span>
            </div>
          </div>
        </div>
        <div class="bg-primary p-8 rounded-xl flex flex-col justify-between shadow-[0_20px_40px_rgba(0,0,0,0.4)] cursor-pointer group hover:scale-[1.02] transition-transform">
          <div>
            <span class="material-symbols-outlined text-4xl mb-4 text-white" style="font-variation-settings: 'FILL' 1;">campaign</span>
            <h3 class="text-2xl font-black font-headline uppercase tracking-tighter mb-2 text-white">Support the Stream</h3>
            <p class="text-white/80 text-sm font-bold uppercase italic">Partner with GoalStream's elite broadcast network. Keep our premium live coverage 100% free for everyone.</p>
          </div>
          <a href="/donate" data-link class="bg-white text-primary py-3 font-black text-[10px] tracking-widest uppercase rounded-sm mt-8 transition-transform hover:scale-[1.05] active:scale-95 text-center no-underline">BECOME A PARTNER</a>
        </div>
      </div>
    </section>
  `;
}

async function renderTrendingPage(container) {
  setSeo({ 
    title: "Trending Hub | Livescorefree Kinetic Forecast", 
    description: "Peak engagement sports trends and real-time global buzz. Track the most discussed matches and viral arena moments.", 
    path: "/trending" 
  });

  const matches = trendingMatches(6);
  const featured = matches[0];

  let heroHTML = "";
  if (featured) {
    heroHTML = `
      <section class="relative w-full h-[650px] bg-surface-container-lowest overflow-hidden stadium-shadow group">
        <div class="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay scale-110 group-hover:scale-100 transition-transform duration-[10s]" style="background-image: url('${getSportImagePath(featured.sportGroup)}')"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
        <div class="relative h-full flex flex-col justify-end p-12 max-w-7xl mx-auto w-full text-left">
          <div class="flex items-center gap-3 mb-6">
            <span class="bg-secondary text-on-secondary-container text-[10px] font-black px-3 py-1 rounded tracking-[0.3em] flex items-center gap-2 italic">
               <span class="material-symbols-outlined text-[12px] fill">bolt</span> PEAK TREND
            </span>
            <span class="text-primary font-black text-[11px] tracking-[0.2em] uppercase italic opacity-60">${escapeHtml(featured.leagueLabel)} • Global Showcase</span>
          </div>
          <h1 class="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] mb-8 text-glow-red">
            ${escapeHtml(featured.homeName)} <br/> <span class="text-primary text-glow-red">VS</span> ${escapeHtml(featured.awayName)}
          </h1>
          <div class="flex flex-wrap items-center gap-8">
            <div class="flex items-center gap-6 bg-white/5 backdrop-blur-md px-6 py-4 rounded-lg border border-white/10">
              <div class="text-center">
                <p class="text-[10px] uppercase opacity-50 mb-1">Engagement</p>
                <p class="font-black text-xl italic tracking-tighter">${(Math.random() * 20 + 80).toFixed(1)}K</p>
              </div>
              <div class="h-10 w-px bg-white/10"></div>
              <div class="text-center">
                <p class="text-[10px] uppercase opacity-50 mb-1">Social Heat</p>
                <div class="flex items-center gap-1 text-secondary">
                  <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
                  <span class="font-bold text-xl uppercase tracking-tighter">Extreme</span>
                </div>
              </div>
            </div>
            <a href="${routeForMatch(featured)}" data-link class="bg-primary px-8 py-5 rounded-lg text-white font-black uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all shadow-[0_0_40px_rgba(204,22,22,0.4)] no-underline">
              Watch Stream <span class="material-symbols-outlined">play_circle</span>
            </a>
          </div>
        </div>
      </section>
    `;
  } else {
    heroHTML = `
      <section class="relative w-full h-[400px] bg-surface-container-low flex items-center justify-center p-8">
         <div class="text-center">
            <h1 class="text-6xl font-black italic uppercase tracking-tighter opacity-20">Trending Hub</h1>
            <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mt-4">Scanning Social Signals...</p>
         </div>
      </section>
    `;
  }

  container.innerHTML = `
    ${heroHTML}
    
    <div class="p-8 grid grid-cols-1 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
      <div class="xl:col-span-3 space-y-12">
        <div class="flex items-end justify-between border-l-4 border-primary pl-4">
          <div>
            <h2 class="text-4xl font-black italic tracking-tighter uppercase leading-none">Live & Rising</h2>
            <p class="text-on-surface/50 text-xs uppercase tracking-widest mt-2">Real-time global engagement spikes</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${matches.slice(0, 9).map(m => `
            <a href="${routeForMatch(m)}" data-link class="bg-surface-container-high p-6 rounded-xl border border-white/5 transition-all hover:scale-[1.02] hover:border-primary/20 shadow-xl group no-underline">
              <div class="flex justify-between items-start mb-6">
                <span class="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded flex items-center gap-1 uppercase">
                  <span class="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span> ${escapeHtml(m.statusDetail || 'Trending')}
                </span>
              </div>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center font-bold text-[10px]">
                      ${m.homeLogo ? `<img src="${m.homeLogo}" alt="" class="w-6 h-6 object-contain">` : (m.homeAbbr || m.homeName.charAt(0))}
                    </div>
                    <span class="font-bold text-sm tracking-tight">${escapeHtml(m.homeName)}</span>
                  </div>
                  <span class="text-2xl font-black">${escapeHtml(m.homeScore)}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center font-bold text-[10px]">
                      ${m.awayLogo ? `<img src="${m.awayLogo}" alt="" class="w-6 h-6 object-contain">` : (m.awayAbbr || m.awayName.charAt(0))}
                    </div>
                    <span class="font-bold text-sm tracking-tight">${escapeHtml(m.awayName)}</span>
                  </div>
                  <span class="text-2xl font-black">${escapeHtml(m.awayScore)}</span>
                </div>
              </div>
              <div class="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                <p class="text-[10px] text-on-surface/40 uppercase font-bold tracking-widest">${escapeHtml(m.leagueLabel)}</p>
                <span class="material-symbols-outlined text-primary text-sm">analytics</span>
              </div>
            </a>
          `).join("")}
          
          <div class="relative overflow-hidden rounded-xl bg-[#050505] border border-secondary/20 p-6 flex flex-col justify-between">
            <span class="text-[9px] font-black text-secondary tracking-widest uppercase mb-2 block">Premium Sponsor</span>
            <h3 class="text-xl font-black italic uppercase tracking-tighter text-white">EARN 2X POINTS ON MATCHDAY</h3>
            <button class="w-full py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded mt-4">Book Slot</button>
          </div>
        </div>

        <!-- Viral Moments -->
        <div class="space-y-6 pt-12">
          <h3 class="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            Viral Moments <span class="bg-primary-container px-2 text-[10px] not-italic rounded tracking-normal">SOCIAL CLIP CLOUD</span>
          </h3>
          <div id="viral-moments-grid" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
             <!-- Populated by news or defaults -->
             <div class="message-box col-span-full">Loading viral match spikes...</div>
          </div>
        </div>
      </div>

      <aside class="space-y-8">
        <section class="glass-card p-6 rounded-xl border border-white/5 bg-surface-container-high/40">
          <h3 class="font-black italic uppercase tracking-tighter text-lg mb-6 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">news</span> Why Trending?
          </h3>
          <div class="space-y-6" id="trending-reasons">
            <div class="group cursor-pointer">
              <p class="text-secondary font-black text-[10px] tracking-widest uppercase mb-1">Engagement</p>
              <h4 class="font-bold text-sm group-hover:text-primary transition-colors">Global matchday volume is 42% higher than average today.</h4>
            </div>
          </div>
        </section>
      </aside>
    </div>
  `;

  await hydrateNewsGrid(container, "#viral-moments-grid", 4);
}

async function renderUpcomingPage(container) {
  setSeo({ 
    title: "Schedule Centre | Livescorefree Kinetic Forecast", 
    description: "The full matchday universe upcoming fixtures and global schedules. Plan your elite sports viewing with our real-time arena tracking.", 
    path: "/upcoming" 
  });

  const matches = state.upcomingMatches || [];
  const featured = matches[0];

  let heroHTML = "";
  if (featured) {
    heroHTML = `
      <section class="relative h-[500px] overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-transparent to-transparent z-10"></div>
        <img alt="Stadium Atmosphere" class="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[5s] opacity-60" src="${getSportImagePath(featured.sportGroup)}"/>
        <div class="relative z-20 h-full flex flex-col justify-end p-12 max-w-7xl mx-auto w-full text-left">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
            <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            Next Global Event
          </div>
          <h1 class="text-6xl md:text-8xl font-black font-headline tracking-tighter leading-none mb-4 uppercase italic text-on-surface">
            UPCOMING <span class="text-primary text-glow-red">SCHEDULE</span>
          </h1>
          <div class="flex flex-col md:flex-row items-start md:items-center gap-8 bg-surface-container-high/60 backdrop-blur-md p-6 border-l-4 border-primary max-w-3xl stadium-shadow">
            <div class="flex items-center gap-6">
              <div class="text-center">
                <p class="text-[10px] uppercase opacity-40 mb-1">STARTS</p>
                <p class="text-3xl font-black font-headline italic tracking-tighter">${formatDateTime(featured.date).split(',')[1]}</p>
              </div>
              <div class="h-10 w-[1px] bg-white/10 hidden md:block"></div>
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center font-black italic text-xl shadow-inner border border-white/5">
                   ${featured.homeAbbr || featured.homeName.charAt(0)}
                </div>
                <span class="text-xs font-bold italic opacity-30">VS</span>
                <div class="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center font-black italic text-xl shadow-inner border border-white/5">
                   ${featured.awayAbbr || featured.awayName.charAt(0)}
                </div>
              </div>
            </div>
            <div>
              <p class="text-primary font-black uppercase text-xs tracking-widest italic">${escapeHtml(featured.leagueLabel)}</p>
              <p class="text-on-surface/80 text-sm font-bold uppercase tracking-tight">${escapeHtml(featured.homeName)} vs ${escapeHtml(featured.awayName)}</p>
            </div>
          </div>
        </div>
      </section>
    `;
  } else {
    heroHTML = `
      <section class="relative h-[450px] overflow-hidden group bg-surface-container-low">
        <div class="relative z-20 h-full flex flex-col justify-end p-12 max-w-7xl mx-auto">
          <h1 class="text-6xl md:text-8xl font-black font-headline tracking-tighter leading-none mb-4 uppercase italic opacity-10">UPCOMING SCHEDULE</h1>
          <p class="text-xs font-black uppercase tracking-[0.4em] opacity-40">Syncing global event calendars...</p>
        </div>
      </section>
    `;
  }

  container.innerHTML = `
    ${heroHTML}
    
    <!-- Date Filter Bar -->
    <div class="sticky top-16 z-30 bg-[#0e0e0e]/95 backdrop-blur-lg border-b border-white/5 px-8 py-4">
      <div class="flex items-center gap-4 overflow-x-auto scrollbar-hide max-w-7xl mx-auto">
        <button class="px-6 py-2 rounded-full bg-primary text-white font-black text-[10px] tracking-widest uppercase whitespace-nowrap">TODAY</button>
        <button class="px-6 py-2 rounded-full bg-surface-container-high hover:bg-surface-bright transition-colors text-on-surface/60 hover:text-on-surface font-black text-[10px] tracking-widest uppercase whitespace-nowrap">TOMORROW</button>
        <button class="px-6 py-2 rounded-full bg-surface-container-high hover:bg-surface-bright transition-colors text-on-surface/60 hover:text-on-surface font-black text-[10px] tracking-widest uppercase whitespace-nowrap">LIVE FEED</button>
        <div class="flex-1"></div>
        <button class="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest px-4 border-l border-white/10 no-underline">
          <span class="material-symbols-outlined text-sm">filter_list</span> ALL EVENTS
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-12 p-8 max-w-7xl mx-auto">
      <!-- Match Listings -->
      <div class="xl:col-span-8 space-y-16">
        ${Object.entries(SPORT_GROUPS).map(([sportKey, sport]) => {
          const sportMatches = matches.filter(m => m.sportGroup === sportKey);
          if (sportMatches.length === 0) return "";
          return `
            <div class="space-y-8">
              <div class="flex items-center gap-4 border-l-4 border-primary pl-6">
                <span class="material-symbols-outlined text-primary text-3xl">${getSportIcon(sportKey)}</span>
                <h2 class="text-3xl font-black uppercase tracking-tighter italic leading-none">${escapeHtml(sport.label)} <span class="text-xs opacity-40 ml-2 not-italic tracking-normal">${sportMatches.length} SESSIONS</span></h2>
              </div>
              <div class="grid gap-4">
                ${sportMatches.map(m => `
                  <a href="${routeForMatch(m)}" data-link class="group bg-surface-container-high/40 border border-white/5 hover:border-primary/20 transition-all duration-300 p-6 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden stadium-shadow no-underline">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] -z-10 group-hover:bg-primary/10 transition-colors"></div>
                    <div class="w-full md:w-32 text-center md:text-left">
                      <p class="text-lg font-black text-primary uppercase italic tracking-tighter leading-none">${formatDateTime(m.date).split(',')[1]}</p>
                      <p class="text-[9px] opacity-40 uppercase tracking-[0.2em] mt-1 font-bold">KINETIC FEED</p>
                    </div>
                    <div class="flex-1 flex items-center justify-between gap-4 w-full">
                      <div class="flex-1 flex flex-col md:flex-row items-center justify-end gap-5">
                        <span class="font-black text-lg order-2 md:order-1 uppercase italic tracking-tighter">${escapeHtml(m.homeName)}</span>
                        <div class="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center font-black italic text-[10px] order-1 md:order-2 border border-white/5 shadow-inner">
                          ${m.homeLogo ? `<img src="${m.homeLogo}" alt="" class="w-6 h-6 object-contain">` : (m.homeAbbr || m.homeName.charAt(0))}
                        </div>
                      </div>
                      <div class="px-3 py-1 bg-surface-container-highest rounded text-[10px] font-black opacity-20 italic">VS</div>
                      <div class="flex-1 flex flex-col md:flex-row items-center justify-start gap-5">
                        <div class="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center font-black italic text-[10px] border border-white/5 shadow-inner">
                          ${m.awayLogo ? `<img src="${m.awayLogo}" alt="" class="w-6 h-6 object-contain">` : (m.awayAbbr || m.awayName.charAt(0))}
                        </div>
                        <span class="font-black text-lg uppercase italic tracking-tighter">${escapeHtml(m.awayName)}</span>
                      </div>
                    </div>
                    <div class="w-full md:w-48 flex flex-col items-center md:items-end gap-3">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm text-primary opacity-60">stadium</span>
                        <span class="text-[10px] font-black uppercase tracking-widest text-on-surface opacity-60">${escapeHtml(m.leagueLabel)}</span>
                      </div>
                      <button class="flex items-center gap-2 bg-white/5 hover:bg-primary hover:text-white transition-all px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-sm group/btn border border-white/10">
                        <span class="material-symbols-outlined text-sm group-hover/btn:fill">notifications</span> Set Reminder
                      </button>
                    </div>
                  </a>
                `).join("")}
              </div>
            </div>
          `;
        }).join("") || `<div class="col-span-full py-40 text-center flex flex-col items-center gap-6 opacity-20"><span class="material-symbols-outlined text-8xl">event_busy</span><p class="text-xs font-black uppercase tracking-[0.4em]">No match transmissions scheduled today.</p></div>`}
      </div>

      <!-- Sidebar Content -->
      <aside class="xl:col-span-4 space-y-12">
        <!-- Trending Series: Bento Style -->
        <div class="bg-surface-container-high p-8 rounded-xl border border-white/5 stadium-shadow">
          <h3 class="text-xl font-black uppercase tracking-tighter italic mb-8 flex items-center gap-3">
            <span class="w-2 h-5 bg-primary rounded-sm"></span> Trending Series
          </h3>
          <div class="space-y-4">
             ${trendingMatches(3).map(m => `
                <a href="${routeForMatch(m)}" data-link class="block p-5 bg-[#0e0e0e]/40 border-l-2 border-primary hover:translate-x-1 transition-transform cursor-pointer no-underline group">
                  <p class="text-[10px] uppercase font-black text-primary mb-2 tracking-widest italic">${escapeHtml(m.leagueLabel)} • ${m.statusLabel || 'Hot'}</p>
                  <p class="font-black text-sm uppercase italic tracking-tight group-hover:text-primary transition-colors">${escapeHtml(m.homeName)} vs ${escapeHtml(m.awayName)}</p>
                  <p class="text-[9px] font-bold opacity-30 mt-2 uppercase tracking-widest">Signal engagement high</p>
                </a>
             `).join("")}
          </div>
        </div>

        <!-- Fan Poll (Sleek Dark) -->
        <div class="bg-surface-container-high p-8 rounded-xl border border-white/5 relative overflow-hidden stadium-shadow">
          <div class="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[60px]"></div>
          <h3 class="text-xl font-black uppercase tracking-tighter italic mb-6">Arena Consensus</h3>
          <p class="text-sm font-bold uppercase tracking-tight italic opacity-70 mb-8 leading-relaxed">Who dominates the next global broadcast cycle?</p>
          <div class="space-y-3">
            <button class="w-full p-4 bg-[#0e0e0e]/40 border border-white/5 hover:border-primary/40 transition-all text-left flex justify-between items-center group rounded-sm shadow-inner">
              <span class="font-black text-[11px] uppercase tracking-widest">Home Advantage</span>
              <span class="text-[10px] font-black opacity-30 group-hover:opacity-100 transition-opacity">42%</span>
            </button>
            <button class="w-full p-4 bg-[#0e0e0e]/40 border border-white/5 hover:border-primary/40 transition-all text-left flex justify-between items-center group rounded-sm shadow-inner">
              <span class="font-black text-[11px] uppercase tracking-widest">Away Sweep</span>
              <span class="text-[10px] font-black opacity-30 group-hover:opacity-100 transition-opacity">51%</span>
            </button>
            <button class="w-full p-4 bg-[#0e0e0e]/40 border border-white/5 hover:border-primary/40 transition-all text-left flex justify-between items-center group rounded-sm shadow-inner">
              <span class="font-black text-[11px] uppercase tracking-widest">Global Draw</span>
              <span class="text-[10px] font-black opacity-30 group-hover:opacity-100 transition-opacity">7%</span>
            </button>
          </div>
          <p class="text-[9px] font-black opacity-30 mt-8 text-center uppercase tracking-[0.3em]">1.2M BROADCST SIGNALS CAPTURED</p>
        </div>

        <!-- Promo Section -->
        <div class="relative rounded-xl h-72 overflow-hidden group stadium-shadow">
          <img class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 grayscale group-hover:grayscale-0" src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1973&auto=format&fit=crop" alt="Premium Promo"/>
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          <div class="absolute bottom-8 left-8 right-8">
            <p class="text-[10px] font-black uppercase tracking-[0.3em] bg-primary text-white px-3 py-1 mb-4 inline-block italic">Pro Access</p>
            <h4 class="text-3xl font-black italic uppercase tracking-tighter leading-none text-white">GoalStream+</h4>
            <p class="text-xs font-bold opacity-70 mt-3 uppercase tracking-tight text-white leading-relaxed">Multi-angle 4K streams & ad-free elite experience.</p>
            <a href="/donate" data-link class="inline-block mt-6 px-6 py-2 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-sm no-underline hover:scale-105 transition-transform active:scale-95">Upgrade Hub</a>
          </div>
        </div>
      </aside>
    </div>
  `;
}

async function renderResultsPage(container) {
  setSeo({ 
    title: "Archive Hub | Livescorefree Kinetic Archive", 
    description: "Completed match finality and deep tactical analysis from the global archive. Scan post-match metrics and arena reports.", 
    path: "/results" 
  });

  const matches = state.finalMatches || [];
  const featured = matches[0];

  let heroHTML = "";
  if (featured) {
    heroHTML = `
      <section class="relative h-[600px] w-full overflow-hidden bg-black group stadium-shadow">
        <div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-40 grayscale group-hover:grayscale-0" style="background-image: url('${getSportImagePath(featured.sportGroup)}')"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
        <div class="relative h-full flex flex-col justify-end px-12 pb-16 max-w-7xl mx-auto w-full text-left">
          <div class="flex items-center gap-3 mb-6">
            <span class="bg-primary text-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] rounded-sm">FINAL TRANSIMISSION</span>
            <span class="text-on-surface-variant font-black text-[11px] uppercase tracking-widest italic opacity-60">${escapeHtml(featured.leagueLabel)}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
            <div class="flex flex-col items-start gap-3">
              <span class="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-none">${featured.homeAbbr || featured.homeName.slice(0,3).toUpperCase()}</span>
              <span class="text-on-surface font-black text-xl uppercase tracking-tighter italic opacity-40">${escapeHtml(featured.homeName)}</span>
            </div>
            <div class="flex flex-col items-center gap-6">
              <div class="flex items-center gap-6 bg-white/5 backdrop-blur-xl p-4 md:p-8 rounded-2xl border border-white/10 stadium-shadow">
                <span class="text-7xl md:text-9xl font-black text-primary italic leading-none">${featured.homeScore}</span>
                <span class="text-4xl text-white/20 font-black italic">:</span>
                <span class="text-7xl md:text-9xl font-black text-white italic leading-none">${featured.awayScore}</span>
              </div>
              <div class="flex flex-col items-center">
                <span class="text-secondary font-black uppercase tracking-[0.3em] text-[10px] italic">ARENA SIGNAL TERMINATED</span>
              </div>
            </div>
            <div class="flex flex-col items-end gap-3 text-right">
              <span class="text-6xl md:text-8xl font-black italic tracking-tighter text-white/30 uppercase leading-none">${featured.awayAbbr || featured.awayName.slice(0,3).toUpperCase()}</span>
              <span class="text-on-surface font-black text-xl uppercase tracking-tighter italic opacity-40">${escapeHtml(featured.awayName)}</span>
            </div>
          </div>
        </div>
        <!-- Slider Indicators (Visual Only) -->
        <div class="absolute bottom-12 right-12 flex gap-3">
          <div class="w-16 h-1 bg-primary rounded-full shadow-[0_0_20px_rgba(204,22,22,0.8)]"></div>
          <div class="w-16 h-1 bg-white/10 rounded-full hover:bg-white/30 cursor-pointer transition-colors"></div>
          <div class="w-16 h-1 bg-white/10 rounded-full hover:bg-white/30 cursor-pointer transition-colors"></div>
        </div>
      </section>
    `;
  } else {
    heroHTML = `
      <section class="relative h-[400px] bg-surface-container-low flex items-center justify-center p-8">
         <div class="text-center">
            <h1 class="text-6xl font-black italic uppercase tracking-tighter opacity-10">ARCHIVE HUB</h1>
            <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mt-4 italic">Scanning Recorded Broadcasts...</p>
         </div>
      </section>
    `;
  }

  container.innerHTML = `
    ${heroHTML}
    
    <!-- League Filter Bar -->
    <section class="bg-[#0e0e0e]/95 backdrop-blur-lg sticky top-16 z-40 py-6 px-12 flex items-center gap-6 overflow-x-auto scrollbar-hide border-b border-white/5 shadow-xl">
      <div class="flex items-center gap-6 max-w-7xl mx-auto w-full">
        <button class="px-6 py-2 rounded-full bg-primary text-white font-black uppercase tracking-widest text-[10px] whitespace-nowrap shadow-lg">All Results</button>
        ${Object.entries(SPORT_GROUPS).map(([key, sport]) => `
          <a href="/sport/${key}" data-link class="px-6 py-2 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface/60 hover:text-white font-black uppercase tracking-widest text-[10px] whitespace-nowrap transition-all no-underline">${escapeHtml(sport.label)}</a>
        `).join("")}
      </div>
    </section>

    <div class="max-w-7xl mx-auto w-full px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
      <!-- Results Grid -->
      <div class="lg:col-span-8 space-y-12">
        <div class="flex justify-between items-end border-l-4 border-primary pl-6">
          <div>
            <h2 class="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">Global <span class="text-primary text-glow-red">Archive</span></h2>
            <p class="text-on-surface/40 font-black uppercase tracking-widest text-[10px] mt-2">Historical match logs across all sectors</p>
          </div>
          <a href="/history" data-link class="text-primary font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:underline no-underline italic">Personal History <span class="material-symbols-outlined text-sm">history</span></a>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          ${matches.slice(0, 12).map(m => `
            <a href="${routeForMatch(m)}" data-link class="bg-surface-container-high/40 p-6 rounded-xl border-l-[6px] ${Number(m.homeScore) > Number(m.awayScore) ? 'border-primary' : 'border-white/10'} flex flex-col justify-between group cursor-pointer transition-all hover:scale-[1.02] stadium-shadow no-underline">
              <div class="flex justify-between items-center mb-8">
                <span class="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface opacity-40">${escapeHtml(m.leagueLabel)}</span>
                <span class="bg-white/5 px-2 py-0.5 rounded text-[9px] font-black text-primary uppercase tracking-widest">FINAL</span>
              </div>
              <div class="space-y-6 mb-8">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-4">
                    <div class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black italic border border-white/5 shadow-inner">
                      ${m.homeLogo ? `<img src="${m.homeLogo}" alt="" class="w-6 h-6 object-contain">` : (m.homeAbbr || m.homeName.charAt(0))}
                    </div>
                    <span class="font-black text-lg text-on-surface uppercase italic tracking-tighter">${escapeHtml(m.homeName)}</span>
                  </div>
                  <span class="text-3xl font-black ${Number(m.homeScore) >= Number(m.awayScore) ? 'text-primary' : 'text-on-surface/20'} italic">${m.homeScore}</span>
                </div>
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-4">
                    <div class="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black italic border border-white/5 shadow-inner">
                      ${m.awayLogo ? `<img src="${m.awayLogo}" alt="" class="w-6 h-6 object-contain">` : (m.awayAbbr || m.awayName.charAt(0))}
                    </div>
                    <span class="font-black text-lg text-on-surface uppercase italic tracking-tighter">${escapeHtml(m.awayName)}</span>
                  </div>
                  <span class="text-3xl font-black ${Number(m.awayScore) >= Number(m.homeScore) ? 'text-primary' : 'text-on-surface/20'} italic">${m.awayScore}</span>
                </div>
              </div>
              <div class="flex justify-between items-center pt-6 border-t border-white/5">
                 <p class="text-[9px] font-black uppercase opacity-20 tracking-widest">Session Concluded</p>
                 <span class="text-primary font-black text-[10px] uppercase tracking-widest italic group-hover:translate-x-1 transition-transform">Match Hub →</span>
              </div>
            </a>
          `).join("")}
        </div>
      </div>

      <!-- Side Rails (Premium Ads) -->
      <aside class="xl:col-span-4 space-y-12">
        <!-- DraftKings Kinetic -->
        <div class="bg-[#0e0e0e] border border-primary/20 p-8 rounded-xl stadium-shadow relative overflow-hidden group">
          <div class="absolute -top-12 -right-12 w-32 h-32 bg-primary blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div class="flex justify-between items-center mb-8">
            <span class="font-black italic text-white text-2xl uppercase tracking-tighter">DRAFTKINGS</span>
            <span class="text-[9px] bg-primary/10 px-2 py-0.5 rounded text-primary font-black tracking-widest uppercase">PROMOTED</span>
          </div>
          <p class="text-white font-black text-2xl leading-none uppercase italic tracking-tighter mb-6">BET $5, GET $200 INSTANTLY IN BONUS BETS.</p>
          <ul class="space-y-3 mb-10">
            <li class="text-[10px] text-white/50 font-black uppercase tracking-widest flex items-center gap-3">
               <span class="material-symbols-outlined text-sm text-primary">verified</span> New Arena Entrants
            </li>
            <li class="text-[10px] text-white/50 font-black uppercase tracking-widest flex items-center gap-3">
               <span class="material-symbols-outlined text-sm text-primary">verified</span> Kinetic Parlay Boost
            </li>
          </ul>
          <a href="/donate" data-link class="block w-full bg-primary text-white font-black uppercase text-xs py-4 tracking-widest rounded-sm text-center no-underline shadow-[0_0_30px_rgba(204,22,22,0.4)] active:scale-95 transition-all">ACTIVATE NOW</a>
        </div>

        <!-- Strategy Insight -->
        <div class="bg-surface-container-high p-8 rounded-xl border border-white/5 stadium-shadow">
          <h3 class="text-xl font-black uppercase tracking-tighter italic mb-6">Arena xG Metric</h3>
          <p class="text-sm font-bold opacity-60 uppercase mb-8 leading-relaxed italic">Global finish efficiency is trending at <span class="text-secondary">1.12x</span> expected goals across current live sectors.</p>
          <div class="space-y-4">
             <div class="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-secondary w-[88%] shadow-[0_0_15px_rgba(98,223,123,0.5)]"></div>
             </div>
             <p class="text-[9px] font-black uppercase tracking-widest opacity-30 text-center">Spectral Finish Reliability High</p>
          </div>
        </div>
      </aside>
    </div>

    <!-- Featured Analysis Spotlight -->
    <section class="bg-surface-container-low py-24 px-8 mt-12 border-t border-white/5">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <span class="text-primary font-black uppercase tracking-[0.4em] text-[10px] italic">Strategic Tactical Feed</span>
            <h2 class="text-6xl font-black italic uppercase tracking-tighter text-white mt-6 mb-8 leading-tight">ARENA<br/>MASTERCLASS</h2>
            <p class="text-on-surface/50 font-bold uppercase italic text-lg mb-12 leading-relaxed max-w-xl">Deep tactical analysis of the latest peak engagement results. From high-line paralysis to Rodri's pivot play efficiency.</p>
            <div id="results-analysis-news" class="grid grid-cols-1 gap-6">
              <!-- Inline Tactical News -->
              <div class="message-box bg-white/5 p-8 rounded-xl border border-white/10 uppercase font-black text-xs tracking-widest opacity-40">Scanning post-match data streams...</div>
            </div>
          </div>
          <div class="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer shadow-2xl stadium-shadow">
            <div class="absolute inset-0 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-700" style="background-image: url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2093&auto=format&fit=crop')"></div>
            <div class="absolute inset-0 bg-primary/20 mix-blend-overlay"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-24 h-24 rounded-full bg-white/10 backdrop-blur-3xl flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20 shadow-2xl">
                <span class="material-symbols-outlined text-5xl text-white" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  await hydrateNewsGrid(container, "#results-analysis-news", 1);
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





