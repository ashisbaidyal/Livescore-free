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
  const trust = getTrustSignals();
  
  // livescoreFree.online Layout Construction
  container.innerHTML = `

<!-- Hero Slider Section -->
<section class="relative w-full h-[716px] min-h-[500px] overflow-hidden group">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" data-alt="Wide shot of a professional soccer match under stadium lights" style="background-image: linear-gradient(to right, rgba(14,14,14,0.9), rgba(14,14,14,0.2)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuB2IvR-jmcJ0VGKTrBYh0phyyK-_fqQIU1lTkuSjtZkOMD0XZfu3NeXxF6ux9nvQOSMuKpnbFLyLS0MAMZ1LDBoWi55Ia3TNddkCs4xgHED83fU2eVbHkDKlxwmSDJvsTJRimIsPn6X8SEd6NuMwuRjxPLLghAJUKke3oinSA_WqlO0XqXLqKtBnZxZGlSymnrH2TVJ6qelV400MPhTFSQQxvanR9UNX0lDUZG8raTqs2qj8v_em1VMY6BIOwuIi3crBeDvm2Qv6lpB')"></div>
<div class="relative h-full flex flex-col justify-center px-8 md:px-20 max-w-7xl mx-auto">
<div class="flex items-center gap-3 mb-6">
<span class="flex items-center gap-2 bg-[#CC1616] text-white px-3 py-1 rounded-sm text-xs font-black tracking-widest uppercase">
<span class="w-2 h-2 bg-white rounded-full animate-pulse"></span> LIVE
                    </span>
<span class="text-on-surface-variant font-bold text-sm tracking-tighter uppercase">Premier League • Matchday 24</span>
</div>
<h1 class="font-headline font-black text-6xl md:text-8xl tracking-tighter leading-[0.9] mb-8 uppercase italic text-on-surface">
                    LIV <span class="text-primary">2 - 1</span> ARS
                </h1>
<div class="flex flex-wrap gap-4 mb-12">
<button class="bg-gradient-to-r from-primary to-primary-container px-8 py-4 rounded-md text-on-primary font-black uppercase text-sm tracking-widest flex items-center gap-2 transition-transform active:scale-95">
<span class="material-symbols-outlined">play_circle</span> Watch Stream
                    </button>
<button class="bg-transparent border border-outline-variant/30 px-8 py-4 rounded-md text-on-surface font-black uppercase text-sm tracking-widest hover:bg-white/5 transition-colors">
                        Match Details
                    </button>
</div>
<!-- Slider Nav -->
<div class="flex gap-4 items-center">
<div class="w-12 h-1 bg-primary"></div>
<div class="w-12 h-1 bg-white/20 hover:bg-white/40 cursor-pointer"></div>
<div class="w-12 h-1 bg-white/20 hover:bg-white/40 cursor-pointer"></div>
<div class="w-12 h-1 bg-white/20 hover:bg-white/40 cursor-pointer"></div>
<div class="ml-4 text-xs font-bold tracking-widest text-on-surface-variant">01 / 04</div>
</div>
</div>
<!-- Sport Indicators Thumbnails Overlay -->
<div class="absolute bottom-10 right-10 hidden md:flex flex-col gap-3">
<div class="glass-card p-3 flex items-center gap-4 rounded-lg opacity-100 border-l-4 border-primary">
<div class="w-12 h-12 bg-surface-container rounded bg-cover bg-center" data-alt="Soccer match thumbnail" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBxPp4di5g7RZZs5cPVJaCd0DtBr7_J9I6LPCEKUEUB5PmDYnN-WgDZcC0kwiIndbzwJUrsszn8GTFKsQ2dp7Gxqm7nqxISXiRSZJql49FQ7vB2IFL_IJ0LABWRaNeSvgrHbBZ7lu8p939gAKHsxf872Dq5J5bPE07BVH2i-0EV93EeYU-gWVjNHEKaN8ETsc89MJOwxDtjfnPk-SFU9JfUxChr_LBbKgeTJ0qf5sbwtlxTeJT2savWygZv9SUeE3IfaTeJ1oZuM-J8')"></div>
<div>
<div class="text-[10px] text-primary font-bold tracking-widest uppercase">Soccer</div>
<div class="text-xs font-bold text-on-surface">LIV v ARS</div>
</div>
</div>
<div class="glass-card p-3 flex items-center gap-4 rounded-lg opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
<div class="w-12 h-12 bg-surface-container rounded bg-cover bg-center" data-alt="NBA match thumbnail" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBBexGNpjcnz0ykFN9dOU02yHjhTY-wbE69O7UAl4hgdht1cCGo_zXKxNNhGAbgCF9w6pGlyRRDAsAO9v5ANMNMBroSimVk38YBkcfpJTB4Kn_XxICagKMgNvPXODTB1C-tKRvjkAcpybcA7ZaTE6hZadNHuFojFYPIs5-M_FoxI5fpwuQikpd6j7S1WLHnoIPhYgJzIVfAudQ9DEMqkGlws3e8ztqnwiSwnffo75O8z2esNyG4MfvxVmP9DISvPYSLCmeLQIJ5G_39')"></div>
<div>
<div class="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">NBA</div>
<div class="text-xs font-bold text-on-surface">LAL v GSW</div>
</div>
</div>
</div>
</section>
<!-- Multiverse (All Sports) Grid -->
<section class="py-16 px-6 max-w-7xl mx-auto">
<div class="flex justify-between items-end mb-10">
<div>
<h2 class="text-4xl font-black italic tracking-tighter uppercase mb-2">The Multiverse</h2>
<p class="text-on-surface-variant text-sm tracking-wide">EXPLORE EVERY ARENA IN THE STREAM</p>
</div>
<div class="w-24 h-[1px] bg-primary"></div>
</div>
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
<a class="group glass-card p-6 rounded-xl flex flex-col items-center gap-4 hover:bg-primary-container transition-colors" href="#">
<span class="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">sports_soccer</span>
<span class="font-bold text-xs tracking-widest uppercase">Soccer</span>
</a>
<a class="group glass-card p-6 rounded-xl flex flex-col items-center gap-4 hover:bg-primary-container transition-colors" href="#">
<span class="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">sports_basketball</span>
<span class="font-bold text-xs tracking-widest uppercase">NBA</span>
</a>
<a class="group glass-card p-6 rounded-xl flex flex-col items-center gap-4 hover:bg-primary-container transition-colors" href="#">
<span class="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">sports_football</span>
<span class="font-bold text-xs tracking-widest uppercase">NFL</span>
</a>
<a class="group glass-card p-6 rounded-xl flex flex-col items-center gap-4 hover:bg-primary-container transition-colors" href="#">
<span class="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">sports_tennis</span>
<span class="font-bold text-xs tracking-widest uppercase">Tennis</span>
</a>
<a class="group glass-card p-6 rounded-xl flex flex-col items-center gap-4 hover:bg-primary-container transition-colors" href="#">
<span class="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">sports_mma</span>
<span class="font-bold text-xs tracking-widest uppercase">UFC</span>
</a>
<a class="group glass-card p-6 rounded-xl flex flex-col items-center gap-4 hover:bg-primary-container transition-colors" href="#">
<span class="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">settings_input_antenna</span>
<span class="font-bold text-xs tracking-widest uppercase">F1</span>
</a>
</div>
</section>
<!-- Live Score All Matches Section -->
<section class="py-16 px-6 max-w-7xl mx-auto">
<div class="flex items-center gap-4 mb-10">
<h2 class="text-3xl font-black italic tracking-tighter uppercase">Live Score All Matches</h2>
<div class="flex-1 h-[1px] bg-white/10"></div>
<div class="flex gap-2">
<button class="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5"><span class="material-symbols-outlined text-sm">chevron_left</span></button>
<button class="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5"><span class="material-symbols-outlined text-sm">chevron_right</span></button>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
<!-- Live Card 1 -->
<div class="bg-surface-container border-l-4 border-primary p-5 flex flex-col gap-4 group hover:bg-surface-container-high transition-all">
<div class="flex justify-between items-center">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-sm">sports_soccer</span>
<span class="text-[10px] font-black uppercase tracking-widest opacity-60">Premier League</span>
</div>
<span class="flex items-center gap-1.5 bg-[#CC1616] text-white px-2 py-0.5 rounded-sm text-[9px] font-black">
<span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                        </span>
</div>
<div class="flex justify-between items-center px-2">
<div class="flex flex-col items-center gap-1">
<span class="font-black italic text-lg tracking-tighter">MUN</span>
</div>
<div class="flex flex-col items-center">
<span class="text-2xl font-black italic text-primary">3 - 2</span>
<span class="text-[9px] font-bold opacity-40 uppercase">72'</span>
</div>
<div class="flex flex-col items-center gap-1">
<span class="font-black italic text-lg tracking-tighter">AVL</span>
</div>
</div>
</div>
<!-- Live Card 2 -->
<div class="bg-surface-container border-l-4 border-primary p-5 flex flex-col gap-4 group hover:bg-surface-container-high transition-all">
<div class="flex justify-between items-center">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-sm">sports_basketball</span>
<span class="text-[10px] font-black uppercase tracking-widest opacity-60">NBA</span>
</div>
<span class="flex items-center gap-1.5 bg-[#CC1616] text-white px-2 py-0.5 rounded-sm text-[9px] font-black">
<span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                        </span>
</div>
<div class="flex justify-between items-center px-2">
<div class="flex flex-col items-center gap-1">
<span class="font-black italic text-lg tracking-tighter">PHX</span>
</div>
<div class="flex flex-col items-center">
<span class="text-2xl font-black italic text-primary">102 - 98</span>
<span class="text-[9px] font-bold opacity-40 uppercase">Q4 4:12</span>
</div>
<div class="flex flex-col items-center gap-1">
<span class="font-black italic text-lg tracking-tighter">DEN</span>
</div>
</div>
</div>
<!-- Live Card 3 -->
<div class="bg-surface-container border-l-4 border-primary p-5 flex flex-col gap-4 group hover:bg-surface-container-high transition-all">
<div class="flex justify-between items-center">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-sm">sports_football</span>
<span class="text-[10px] font-black uppercase tracking-widest opacity-60">NFL</span>
</div>
<span class="flex items-center gap-1.5 bg-[#CC1616] text-white px-2 py-0.5 rounded-sm text-[9px] font-black">
<span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                        </span>
</div>
<div class="flex justify-between items-center px-2">
<div class="flex flex-col items-center gap-1">
<span class="font-black italic text-lg tracking-tighter">DAL</span>
</div>
<div class="flex flex-col items-center">
<span class="text-2xl font-black italic text-primary">24 - 17</span>
<span class="text-[9px] font-bold opacity-40 uppercase">Q3 12:05</span>
</div>
<div class="flex flex-col items-center gap-1">
<span class="font-black italic text-lg tracking-tighter">SF</span>
</div>
</div>
</div>
</div>
</section>
<!-- Ad 1 (Leaderboard Style) -->
<section class="px-6 max-w-7xl mx-auto mb-16">
<div class="w-full h-32 bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] border border-white/5 flex items-center justify-between px-10 relative overflow-hidden rounded-md">
<div class="absolute left-0 top-0 w-1 h-full bg-[#CC1616]"></div>
<div class="flex items-center gap-8 z-10">
<div class="bg-white p-3 rounded-sm">
<span class="text-black font-black italic text-xl">DRAFTKINGS</span>
</div>
<div>
<h4 class="text-xl font-black italic uppercase tracking-tighter leading-none mb-1">Bet $5, Get $200 Instantly</h4>
<p class="text-[10px] font-bold uppercase tracking-widest text-primary">New Customers Only • Limited Time Offer</p>
</div>
</div>
<button class="bg-[#CC1616] text-white px-8 py-3 rounded font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition-all z-10">Bet Now</button>
<div class="absolute right-0 top-0 h-full w-1/2 opacity-10 bg-cover bg-center" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBxPp4di5g7RZZs5cPVJaCd0DtBr7_J9I6LPCEKUEUB5PmDYnN-WgDZcC0kwiIndbzwJUrsszn8GTFKsQ2dp7Gxqm7nqxISXiRSZJql49FQ7vB2IFL_IJ0LABWRaNeSvgrHbBZ7lu8p939gAKHsxf872Dq5J5bPE07BVH2i-0EV93EeYU-gWVjNHEKaN8ETsc89MJOwxDtjfnPk-SFU9JfUxChr_LBbKgeTJ0qf5sbwtlxTeJT2savWygZv9SUeE3IfaTeJ1oZuM-J8')"></div>
</div>
</section>
<!-- Upcoming Matches Grid -->
<section class="py-16 px-6 bg-surface-container-low">
<div class="max-w-7xl mx-auto">
<h3 class="text-2xl font-black tracking-tighter uppercase mb-8 flex items-center gap-3">
<span class="w-8 h-[2px] bg-primary"></span> Upcoming Matches Scheduled
                </h3>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
<!-- Match Card -->
<div class="bg-surface-container p-6 rounded-lg border border-white/5 hover:border-primary/50 transition-colors cursor-pointer">
<div class="flex justify-between text-[10px] font-bold text-on-surface-variant mb-6 uppercase tracking-widest">
<span>La Liga</span>
<span>21:00 Today</span>
</div>
<div class="flex items-center justify-between mb-8">
<div class="flex flex-col items-center gap-2">
<div class="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-xs font-black">RMA</div>
<span class="text-xs font-bold uppercase tracking-tight">Real Madrid</span>
</div>
<span class="text-xl font-black text-primary italic">VS</span>
<div class="flex flex-col items-center gap-2">
<div class="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-xs font-black">BAR</div>
<span class="text-xs font-bold uppercase tracking-tight">Barcelona</span>
</div>
</div>
<button class="w-full bg-surface-container-highest py-3 rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors">Set Reminder</button>
</div>
<!-- Repeat Match Card -->
<div class="bg-surface-container p-6 rounded-lg border border-white/5">
<div class="flex justify-between text-[10px] font-bold text-on-surface-variant mb-6 uppercase tracking-widest">
<span>NBA</span>
<span>02:30 AM</span>
</div>
<div class="flex items-center justify-between mb-8">
<div class="flex flex-col items-center gap-2">
<div class="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-xs font-black">BOS</div>
<span class="text-xs font-bold uppercase tracking-tight">Celtics</span>
</div>
<span class="text-xl font-black text-primary italic">VS</span>
<div class="flex flex-col items-center gap-2">
<div class="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-xs font-black">MIA</div>
<span class="text-xs font-bold uppercase tracking-tight">Heat</span>
</div>
</div>
<button class="w-full bg-surface-container-highest py-3 rounded text-[10px] font-black uppercase tracking-widest">Set Reminder</button>
</div>
<div class="bg-surface-container p-6 rounded-lg border border-white/5">
<div class="flex justify-between text-[10px] font-bold text-on-surface-variant mb-6 uppercase tracking-widest">
<span>EPL</span>
<span>15:00 Tomorrow</span>
</div>
<div class="flex items-center justify-between mb-8">
<div class="flex flex-col items-center gap-2">
<div class="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-xs font-black">MCI</div>
<span class="text-xs font-bold uppercase tracking-tight">Man City</span>
</div>
<span class="text-xl font-black text-primary italic">VS</span>
<div class="flex flex-col items-center gap-2">
<div class="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-xs font-black">CHE</div>
<span class="text-xs font-bold uppercase tracking-tight">Chelsea</span>
</div>
</div>
<button class="w-full bg-surface-container-highest py-3 rounded text-[10px] font-black uppercase tracking-widest">Set Reminder</button>
</div>
<div class="bg-surface-container p-6 rounded-lg border border-white/5">
<div class="flex justify-between text-[10px] font-bold text-on-surface-variant mb-6 uppercase tracking-widest">
<span>NFL</span>
<span>19:00 Tomorrow</span>
</div>
<div class="flex items-center justify-between mb-8">
<div class="flex flex-col items-center gap-2">
<div class="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-xs font-black">KC</div>
<span class="text-xs font-bold uppercase tracking-tight">Chiefs</span>
</div>
<span class="text-xl font-black text-primary italic">VS</span>
<div class="flex flex-col items-center gap-2">
<div class="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-xs font-black">PHI</div>
<span class="text-xs font-bold uppercase tracking-tight">Eagles</span>
</div>
</div>
<button class="w-full bg-surface-container-highest py-3 rounded text-[10px] font-black uppercase tracking-widest">Set Reminder</button>
</div>
</div>
</div>
</section>
<!-- Featured Section (Player & Standings) -->
<section class="py-16 px-6 max-w-7xl mx-auto">
<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
<!-- Featured Player -->
<div class="lg:col-span-2 relative h-[500px] rounded-2xl overflow-hidden group">
<div class="absolute inset-0 bg-cover bg-center" data-alt="Erling Haaland in Manchester City kit celebrating" style="background-image: linear-gradient(to top, #0E0E0E, transparent), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCbd33Tw5OIpBIYnIgyko5dPTUgdbWRiR1u_uW2EX1XUffYntyAFVUOdJbBhhdAlnEwer4n4tldTDqM07QqGgDAV1NcjSs68GSKwVc0q-nAoOZE79hAd3AiTfRpB8F4jCUCFjGyIlX3APpqWS4FlCEnH3gG2DapaACepElFXKofTdbp-5jp0XmAWWQqI-9XhrIJgOXfjz6kZmGCRVAMpDrbohFVnJ1Ul5KlurZzBtFtrN1st9zwQl-peQh-1xYnUgZ0dToswcZ_MpnH')"></div>
<div class="absolute bottom-0 left-0 p-10 w-full">
<div class="bg-primary text-on-primary inline-block px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Player of the Month</div>
<h3 class="text-5xl font-black italic uppercase leading-none mb-2 tracking-tighter">Erling <br/><span class="text-primary">Haaland</span></h3>
<div class="flex gap-8 mt-6">
<div>
<div class="text-xs text-on-surface-variant font-bold uppercase">Goals</div>
<div class="text-2xl font-black">21</div>
</div>
<div>
<div class="text-xs text-on-surface-variant font-bold uppercase">Assists</div>
<div class="text-2xl font-black">5</div>
</div>
<div>
<div class="text-xs text-on-surface-variant font-bold uppercase">Matches</div>
<div class="text-2xl font-black">18</div>
</div>
</div>
</div>
</div>
<!-- League Standings + Sidebar Ad -->
<div class="flex flex-col gap-6">
<div class="bg-surface-container-low p-8 rounded-2xl flex-1">
<div class="flex justify-between items-center mb-6">
<h4 class="font-black italic text-xl uppercase tracking-tighter">Point Table</h4>
<select class="bg-surface-container-high border-none text-[10px] font-black uppercase tracking-widest rounded px-4">
<option>EPL</option>
<option>La Liga</option>
<option>Bundesliga</option>
</select>
</div>
<div class="space-y-4">
<div class="flex items-center justify-between text-xs py-2 border-b border-white/5">
<div class="flex items-center gap-3">
<span class="font-bold text-primary">1</span>
<span class="font-black uppercase">Liverpool</span>
</div>
<span class="font-black">54</span>
</div>
<div class="flex items-center justify-between text-xs py-2 border-b border-white/5">
<div class="flex items-center gap-3">
<span class="font-bold">2</span>
<span class="font-black uppercase">Man City</span>
</div>
<span class="font-black">52</span>
</div>
<div class="flex items-center justify-between text-xs py-2 border-b border-white/5">
<div class="flex items-center gap-3">
<span class="font-bold">3</span>
<span class="font-black uppercase">Arsenal</span>
</div>
<span class="font-black">52</span>
</div>
</div>
<button class="w-full mt-6 py-3 text-[10px] font-black uppercase tracking-widest text-primary hover:underline transition-all">View Full Standings</button>
</div>
<!-- Ad 2 (Contextual Sidebar) -->
<div class="bg-[#CC1616] rounded-2xl p-6 relative overflow-hidden group">
<div class="relative z-10">
<h5 class="text-white font-black italic text-2xl leading-none mb-2">GATORADE</h5>
<p class="text-white/80 font-bold uppercase text-[10px] tracking-widest mb-4">Fuel Your Game</p>
<button class="bg-white text-black px-4 py-2 rounded text-[9px] font-black uppercase tracking-widest">Shop Now</button>
</div>
<div class="absolute right-[-20%] bottom-[-20%] opacity-20 transform group-hover:scale-110 transition-transform duration-700">
<span class="material-symbols-outlined text-[8rem]">bolt</span>
</div>
</div>
</div>
</div>
</section>
<!-- News & Trending -->
<section class="py-16 px-6 max-w-7xl mx-auto bg-surface-container-lowest">
<div class="grid grid-cols-1 lg:grid-cols-4 gap-12">
<div class="lg:col-span-3">
<h4 class="text-3xl font-black italic uppercase tracking-tighter mb-8">Headline Reports</h4>
<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
<article class="group cursor-pointer">
<div class="relative aspect-video rounded-xl overflow-hidden mb-4">
<img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" data-alt="Close up of a soccer ball hitting the net" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5SQkOxZ45Zgf_5mO-NggsCaG-uUbb7c73D1U0WahWWlSvgspmWQAorx-fJ51xHPX3si_zpElo0xo0QhoD8OInGt9Z5uJVtgiHY5vuTU3sYVy27SGVILNVDHtO51Tw7wRauxMU8url4WVyv7HxPwxg0hef9dXmPW8PyqAKbQ33HFWQBEj6pV8SyOZmYFJYsq3nFEeIjmjXl2z9zRT5ldqqFNxXJ0YdTcOq7zarvkWdh8Xc-gl9WLQpOFMSxYoj5-gmJiVScAQS4ECl"/>
<div class="absolute top-4 left-4 bg-primary text-on-primary px-2 py-1 text-[10px] font-black uppercase tracking-widest">Football</div>
</div>
<h5 class="text-xl font-black uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">Tactical breakdown: How Emery neutralized Guardiola's system</h5>
<p class="text-on-surface-variant text-sm mt-2 line-clamp-2">A deep dive into the high-pressing mechanism that led to a historic upset at Villa Park.</p>
</article>
<article class="group cursor-pointer">
<div class="relative aspect-video rounded-xl overflow-hidden mb-4">
<img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" data-alt="NBA basketball court with players in motion blurred" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB87KD953n7dAS1N0LMRUB5yMb3dsql74C2F4yZ_pl2JNlJC4Hgh9dIAr6DnmWGl_luhjR2NijGSXPyV1ckJujw1JDRVAGRHktkn4XPcyVlA28XG2N9udFCkoAOrEYReEKUbP17tnQz1WTL39LUqBeY_pJKzXIug7RUsaIbYKf_vYWKatZxFZYodKChpizfrMtVVcyzkKrtJTRcuDOmkpqEGPMsybDS0zs04n6O3OAVQYDghwg58kXZK-qul5Ir6xAOIWOKHDpqDBBE"/>
<div class="absolute top-4 left-4 bg-primary text-on-primary px-2 py-1 text-[10px] font-black uppercase tracking-widest">NBA</div>
</div>
<h5 class="text-xl font-black uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">Trade Rumors: Lakers eye veteran point guard before deadline</h5>
<p class="text-on-surface-variant text-sm mt-2 line-clamp-2">The latest insider reports on the Western Conference's shifting power dynamics.</p>
</article>
</div>
</div>
<div>
<h4 class="text-xl font-black italic uppercase tracking-tighter mb-8 text-primary">Trending Now</h4>
<div class="space-y-6">
<div class="flex gap-4 items-start border-b border-white/5 pb-4 group cursor-pointer">
<span class="text-2xl font-black text-on-surface-variant/20 italic">01</span>
<div>
<div class="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Transfer News</div>
<h6 class="text-sm font-black uppercase group-hover:underline">Mbappe reaches agreement with Madrid</h6>
</div>
</div>
<div class="flex gap-4 items-start border-b border-white/5 pb-4 group cursor-pointer">
<span class="text-2xl font-black text-on-surface-variant/20 italic">02</span>
<div>
<div class="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Formula 1</div>
<h6 class="text-sm font-black uppercase group-hover:underline">Hamilton confirms Ferrari move for 2025</h6>
</div>
</div>
<div class="flex gap-4 items-start border-b border-white/5 pb-4 group cursor-pointer">
<span class="text-2xl font-black text-on-surface-variant/20 italic">03</span>
<div>
<div class="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Tennis</div>
<h6 class="text-sm font-black uppercase group-hover:underline">Djokovic injury update ahead of Wimbledon</h6>
</div>
</div>
</div>
</div>
</div>
</section>
<!-- Niche Leagues -->
<section class="py-16 px-6 max-w-7xl mx-auto">
<h4 class="text-xl font-black italic uppercase tracking-tighter mb-8 opacity-60">Niche Leagues Coverage</h4>
<div class="flex flex-wrap gap-4">
<span class="bg-surface-container-high px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest border border-white/5 hover:border-primary cursor-pointer transition-colors">MLS</span>
<span class="bg-surface-container-high px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest border border-white/5 hover:border-primary cursor-pointer transition-colors">Saudi Pro League</span>
<span class="bg-surface-container-high px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest border border-white/5 hover:border-primary cursor-pointer transition-colors">Eredivisie</span>
<span class="bg-surface-container-high px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest border border-white/5 hover:border-primary cursor-pointer transition-colors">Liga MX</span>
<span class="bg-surface-container-high px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest border border-white/5 hover:border-primary cursor-pointer transition-colors">J-League</span>
</div>
</section>
<!-- Fuel the Broadcast (Ad/Support) -->
<section class="p-6 max-w-7xl mx-auto mb-8">
<div class="bg-gradient-to-r from-primary-container to-[#0E0E0E] rounded-2xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10">
<div class="relative z-10">
<h4 class="text-4xl font-black italic uppercase tracking-tighter leading-none mb-4">Fuel the <br/><span class="text-primary">Broadcast</span></h4>
<p class="text-on-surface-variant max-w-md text-sm font-medium">Keep the stream alive and ad-free. Support our independent broadcast crew via Ko-fi or sponsor a segment.</p>
</div>
<div class="flex gap-4 relative z-10">
<button class="bg-white text-black px-8 py-4 rounded-md font-black uppercase text-xs tracking-widest hover:bg-primary transition-colors">Support on Ko-Fi</button>
<button class="bg-transparent border border-white/20 px-8 py-4 rounded-md font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-colors">Advertise Here</button>
</div>
<div class="absolute -right-20 -top-20 opacity-10">
<span class="material-symbols-outlined text-[20rem]">broadcast_on_personal</span>
</div>
</div>
</section>
<!-- Ad 3 (Premium Footer Banner) -->
<section class="p-6 max-w-7xl mx-auto mb-16">
<div class="h-64 rounded-2xl relative overflow-hidden bg-cover bg-center flex items-center px-12" style="background-image: linear-gradient(to right, rgba(0,0,0,0.9), transparent), url('https://lh3.googleusercontent.com/aida-public/AB6AXuB87KD953n7dAS1N0LMRUB5yMb3dsql74C2F4yZ_pl2JNlJC4Hgh9dIAr6DnmWGl_luhjR2NijGSXPyV1ckJujw1JDRVAGRHktkn4XPcyVlA28XG2N9udFCkoAOrEYReEKUbP17tnQz1WTL39LUqBeY_pJKzXIug7RUsaIbYKf_vYWKatZxFZYodKChpizfrMtVVcyzkKrtJTRcuDOmkpqEGPMsybDS0zs04n6O3OAVQYDghwg58kXZK-qul5Ir6xAOIWOKHDpqDBBE')">
<div class="relative z-10">
<h4 class="text-5xl font-black italic uppercase tracking-tighter leading-none mb-4">EA SPORTS <br/><span class="text-[#CC1616]">FC 26</span></h4>
<p class="text-white/60 font-bold uppercase tracking-widest text-xs mb-8">The World's Game. Pre-Order Now.</p>
<button class="bg-[#CC1616] text-white px-10 py-4 rounded font-black uppercase text-sm tracking-widest hover:brightness-110">Pre-Order</button>
</div>
<div class="absolute right-0 top-0 h-full w-full bg-gradient-to-l from-transparent via-transparent to-black/80"></div>
</div>
</section>

`;

  const leagueKey = TOP_LEAGUE_KEYS.find((key) => state.matches.some((match) => match.leagueKey === key)) || "eng.1";
  const mount = qs("#home-standings-card", container);
  if (mount) {
    void renderLeagueStandingsCard(mount, leagueKey, "Featured Table");
  }
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





