import { 
  qs, 
  qsa, 
  escapeHtml, 
  formatDate,
  formatTime,
  renderDonationProgress
} from "./utils.js";
import { 
  state 
} from "./state.js";
import { 
  SPORT_GROUPS, 
  LEAGUES,
  TOP_LEAGUE_KEYS
} from "./constants.js";
import { 
  parseRoute,
  getCurrentPath,
  routeForMatch,
  routeForLeague
} from "./routing.js";
import { 
  renderMatchGrid,
  renderMatchCard,
  renderPmTeamLogo,
  statusBadge,
  getSportImagePath,
  getLeagueImagePath,
  buildAutoBackgroundAttrs,
  topLeagueSummaries,
  trendingMatches
} from "./ui-matches.js";
import { 
  setSeo,
  applyPageClassesForRoute,
  initScrollAnimations,
  renderSeoHeroPanel,
  renderHeroShareActions,
  renderMatchInsightPanel,
  wireMatchTabs,
  showToast
} from "./ui-core.js";
import {
  refreshData
} from "./api.js";

export async function renderRoute() {
  const path = getCurrentPath();
  const route = parseRoute(path);
  console.log("renderRoute called for path:", path, "Route:", route);
  state.activePath = path;
  
  applyPageClassesForRoute(route);

  const main = qs("#main");
  if (!main) {
    console.error("Critical: #main container not found!");
    return;
  }

  switch (route.type) {
    case "home": await renderHomePage(main); break;
    case "live": await renderLivePage(main); break;
    case "trending": await renderTrendingPage(main); break;
    case "results": await renderResultsPage(main); break;
    case "upcoming": await renderUpcomingPage(main); break;
    case "history": await renderHistoryPage(main); break;
    case "top-leagues": await renderTopLeaguesPage(main); break;
    case "league": await renderLeaguePage(main, route); break;
    case "match": await renderMatchPage(main, route); break;
    case "sport": await renderSportPage(main, route); break;
    case "advertise": renderArticlePage(main, "Advertise", "Boost your reach with LiveScoreFree.", "<p>LiveScoreFree is a community-powered platform reaching thousands of sports fans worldwide. Contact us for premium ad placements.</p>"); break;
    case "data-sources": renderArticlePage(main, "Data Sources", "Our trusted data partners.", "<p>We source our live scores from industry leaders including ESPN, TheSportsDB, and official league feeds to ensure maximum accuracy and speed.</p>"); break;
    case "dmca-policy": renderArticlePage(main, "DMCA Policy", "Copyright and safety guidelines.", "<p>LiveScoreFree respects intellectual property rights. If you believe your content has been used without authorization, please contact our DMCA agent.</p>"); break;
    case "contact": renderArticlePage(main, "Contact Us", "We're here to help.", "<p>Questions or feedback? Reach out to the LiveScoreFree team at support@livescorefree.online.</p>"); break;
    case "about": renderArticlePage(main, "About LiveScoreFree", "Our mission and vision.", "<p>LiveScoreFree was built by fans, for fans. We provide a community-powered, ad-supported platform for the most accurate and fastest live scores available.</p>"); break;
    case "not-found": renderNotFoundPage(main); break;
    default: renderNotFoundPage(main);
  }

  initScrollAnimations();
  window.scrollTo(0, 0);
}

async function renderHomePage(container) {
  setSeo({
    title: "LiveScoreFree | Real-time Sports Scores",
    description: "Free live sports scores and updates.",
    path: "/home"
  });

  const trending = trendingMatches();
  const topLeagues = topLeagueSummaries();

  container.innerHTML = `
    <section class="hero auto-bg-surface" ${buildAutoBackgroundAttrs({ seedText: "home", strength: 0.1 })}>
      ${renderSeoHeroPanel({
        eyebrow: "Live Score Excellence",
        title: "LiveScoreFree Community Scoreboard",
        lead: "Fast scores, deep stats, and upcoming fixtures for every fan.",
        actionsHtml: renderHeroShareActions()
      })}
    </section>
    
    <section class="section">
      <div class="section-head"><h2>Trending Matches</h2></div>
      ${renderMatchGrid(trending, "No trending matches found.")}
    </section>

    <section class="section">
      <div class="section-head"><h2>Top Leagues</h2></div>
      <div class="league-grid">
        ${topLeagues.map(l => `
          <a class="league-card" data-link href="${routeForLeague(l.key)}">
            <img src="${getLeagueImagePath(l.key, l.sportGroup)}" alt="${l.label}">
            <strong>${l.label}</strong>
            <span class="badge ${l.live > 0 ? "badge-live" : ""}">${l.live} Live</span>
          </a>
        `).join("")}
      </div>
    </section>
  `;
}

async function renderLivePage(container) {
  const matches = state.liveMatches;
  setSeo({ title: "Live Scores Now", description: "Real-time scores.", path: "/live" });
  container.innerHTML = `
    <section class="section">
      <div class="section-head"><h1>Live Scores</h1></div>
      ${renderMatchGrid(matches, "No matches are live right now.")}
    </section>
  `;
}

async function renderTrendingPage(container) {
  const matches = state.matches.slice(0, 20);
  setSeo({ title: "Trending Matches", description: "Most popular matches.", path: "/trending" });
  container.innerHTML = `
    <section class="section">
      <div class="section-head"><h1>Trending</h1></div>
      ${renderMatchGrid(matches, "Nothing trending yet.")}
    </section>
  `;
}

async function renderResultsPage(container) {
  const matches = state.finalMatches;
  setSeo({ title: "Today's Results", description: "Final scores today.", path: "/results" });
  container.innerHTML = `
    <section class="section">
      <div class="section-head"><h1>Results</h1></div>
      ${renderMatchGrid(matches, "No results for today yet.")}
    </section>
  `;
}

async function renderUpcomingPage(container) {
  const matches = state.upcomingMatches;
  setSeo({ title: "Upcoming Fixtures", description: "Upcoming matches schedule.", path: "/upcoming" });
  container.innerHTML = `
    <section class="section">
      <div class="section-head"><h1>Upcoming</h1></div>
      ${renderMatchGrid(matches, "No upcoming matches found.")}
    </section>
  `;
}

async function renderHistoryPage(container) {
  const matches = state.history;
  setSeo({ title: "Recently Viewed", description: "Your match history.", path: "/history" });
  container.innerHTML = `
    <section class="section">
      <div class="section-head"><h1>History</h1></div>
      ${renderMatchGrid(matches, "No history found. Start browsing matches!")}
    </section>
  `;
}

async function renderTopLeaguesPage(container) {
  const topLeagues = topLeagueSummaries();
  setSeo({ title: "Top Leagues Feed", description: "Browse top sports leagues.", path: "/top-leagues" });
  container.innerHTML = `
    <section class="section">
      <div class="section-head"><h1>Top Leagues</h1></div>
      <div class="grid">
        ${topLeagues.map(l => `<a class="card" data-link href="${routeForLeague(l.key)}">${l.label}</a>`).join("")}
      </div>
    </section>
  `;
}

async function renderLeaguePage(container, route) {
  const key = route.leagueKey;
  const league = LEAGUES[key] || { label: "League Details", sportGroup: "football" };
  setSeo({ title: `${league.label} Live`, description: `Live scores for ${league.label}.`, path: `/league/${key}` });
  
  const matches = state.matches.filter(m => m.leagueKey === key);
  container.innerHTML = `
    <section class="section">
      <div class="section-head">
        <img src="${getLeagueImagePath(key, league.sportGroup)}" style="width:64px;" alt="">
        <h1>${league.label}</h1>
      </div>
      ${renderMatchGrid(matches, `No active matches found for ${league.label}.`)}
    </section>
  `;
}

async function renderMatchPage(container, route) {
  const match = state.matches.find(m => m.slug === route.slug && m.sportGroup === route.sport) || 
                state.history.find(m => m.slug === route.slug && m.sportGroup === route.sport);
  
  if (!match) {
    container.innerHTML = `<div class="message-box">Match not found or loading...</div>`;
    return;
  }

  setSeo({ title: `${match.homeName} vs ${match.awayName}`, description: "Live match details.", path: routeForMatch(match) });

  container.innerHTML = `
    <section class="match-hero auto-bg-surface" ${buildAutoBackgroundAttrs({ sportGroup: match.sportGroup, leagueKey: match.leagueKey })}>
       <div class="match-hero-main">
          <div class="mh-team">
             ${renderPmTeamLogo({ teamLogo: match.homeLogo, teamName: match.homeName, teamAbbr: match.homeAbbr, loading: "auto" })}
             <span>${escapeHtml(match.homeName)}</span>
          </div>
          <div class="mh-score">${escapeHtml(match.homeScore)} - ${escapeHtml(match.awayScore)}</div>
          <div class="mh-team">
             ${renderPmTeamLogo({ teamLogo: match.awayLogo, teamName: match.awayName, teamAbbr: match.awayAbbr, loading: "auto" })}
             <span>${escapeHtml(match.awayName)}</span>
          </div>
       </div>
    </section>
    
    <div class="match-content-layout">
       <main class="match-main-area">
          <nav class="match-tabs">
             <button class="match-tab-btn active" data-match-tab="summary">Summary</button>
             <button class="match-tab-btn" data-match-tab="stats">Stats</button>
          </nav>
          <div class="match-tab-panel active" data-tab-panel="summary">
             <div class="message-box">Live match timeline and events.</div>
          </div>
          <div class="match-tab-panel" data-tab-panel="stats">
             <div class="message-box">Match statistics will appear here.</div>
          </div>
       </main>
       <aside class="match-side-area">
          ${renderMatchInsightPanel({ match, statPairs: [], infoItems: [], isFavorite: state.favoriteMatches.includes(`${match.sportGroup}:${match.slug}`) })}
       </aside>
    </div>
  `;
  
  wireMatchTabs(match);
}

async function renderSportPage(container, route) {
  const sport = SPORT_GROUPS[route.sport] || { label: "Sport" };
  setSeo({ title: `${sport.label} Scores`, description: `Live scores for ${sport.label}.`, path: `/sport/${route.sport}` });
  const matches = state.matches.filter(m => m.sportGroup === route.sport);
  container.innerHTML = `
    <section class="section">
      <div class="section-head"><h1>${sport.label}</h1></div>
      ${renderMatchGrid(matches, `No matches for ${sport.label} right now.`)}
    </section>
  `;
}

function renderArticlePage(container, title, lead, bodyHtml) {
  container.innerHTML = `
    <article class="article-page">
      <div class="section-head">
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(lead)}</p>
      </div>
      <div class="article-body">${bodyHtml}</div>
    </article>
  `;
}

function renderFeedbackPage(container) {
  container.innerHTML = `
    <section class="section">
       <h1>Feedback</h1>
       <p>Tell us what you think.</p>
       <textarea id="feedback-notes" style="width:100%;height:200px;"></textarea>
       <button class="btn btn-primary" id="save-feedback">Save Feedback</button>
    </section>
  `;
}

function renderNotFoundPage(container) {
  container.innerHTML = `
    <section class="section">
      <h1>404 Not Found</h1>
      <p>The page you requested does not exist.</p>
      <a data-link href="/home" class="btn btn-primary">Go Home</a>
    </section>
  `;
}
