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
    case "advertise": renderSimpleArticle(main, "Advertise on LiveScoreFree", "Use homepage, sport, league, and match inventory for sports traffic.", "<p>This route is now live in the site router and can be used as your media kit landing page.</p>"); break;
    case "data-sources": renderDataSourcesPage(main); break;
    case "privacy-policy": renderSimpleArticle(main, "Privacy Policy", "How browser storage and basic site data are handled.", "<p>Favorites, history, language, theme, and feedback are stored locally in the browser.</p>"); break;
    case "terms-of-service": renderSimpleArticle(main, "Terms of Service", "Terms for using the LiveScoreFree website and score feeds.", "<p>Replace this placeholder with your final legal text.</p>"); break;
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
    title: "livescorefree.online | The Stadium Spectacle | Live Scores & Arena Coverage",
    description: "Track the global matchday universe with livescorefree.online. High-contrast scores, headline reports, and arena tables for every major competition.",
    path: "/home"
  });

  const heroMatch = state.liveMatches[0] || state.upcomingMatches[0] || trendingMatches(1)[0];
  const trust = getTrustSignals();
  
  // livescorefree.online Layout Construction
  container.innerHTML = `
    <!-- 1. The Hero: Stadium Spectacle -->
    ${heroMatch ? renderLsfHero(heroMatch) : renderHeroFallback()}

    <!-- 2. The Multiverse: Arena Navigation -->
    <section class="section tone-trust">
      <div class="section-head">
        <div>
          <span class="premium-kicker" style="color: var(--gs-primary);">The Multiverse</span>
          <h2>Navigate the Arena</h2>
          <p>Jump directly into the streaming universe for any major sport.</p>
        </div>
      </div>
      <div class="world-sports-grid">
        ${Object.entries(SPORT_GROUPS).map(([key, sport]) => `
          <a class="world-sport-card gs-depth-shadow" data-link href="/sport/${key}" style="background: var(--gs-surface-lowest); border: none;">
            <img src="${escapeHtml(getSportImagePath(key))}" alt="${escapeHtml(sport.label)}" style="width: 48px; height: 48px; border-radius: 4px !important;">
            <strong style="margin-top: 12px; font-size: 1.1rem;">${escapeHtml(sport.label)}</strong>
            <span style="color: var(--gs-primary); font-weight: 600;">Explore Arena</span>
          </a>
        `).join("")}
      </div>
    </section>

    <!-- 3. Live Scores Center -->
    <section class="section tone-live">
      <div class="section-head">
        <div>
          <span class="premium-kicker" style="color: var(--gs-primary);">Center Circle</span>
          <h2>Live Scores Center</h2>
          <p>${state.liveMatches.length} matches currently active in the arena.</p>
        </div>
        <a class="section-view-all" data-link href="/live">Open Live Board</a>
      </div>
      ${renderMatchGrid(state.liveMatches.slice(0, 8), "The arena is currently quiet. Check back soon for live kickoffs.")}
    </section>

    <!-- 4. Headline Reports: Editorial Hub -->
    <section class="section tone-league">
      <div class="section-head">
        <div>
          <span class="premium-kicker" style="color: var(--gs-primary);">Press Box</span>
          <h2>Headline Reports</h2>
          <p>Tactical breakdowns and insider reports from across the global network.</p>
        </div>
        <a class="section-view-all" data-link href="/news">Full Newsroom</a>
      </div>
      <div class="news-editorial-grid" id="home-news-grid">
         <div class="message-box">Loading reports from the wire...</div>
      </div>
    </section>

    <!-- 5. Arena Table: Featured Partnership -->
    <section class="section tone-trust" style="background: var(--gs-inverse-surface); color: var(--gs-surface-lowest);">
      <div class="section-head">
        <div style="color: inherit;">
          <span class="premium-kicker" style="color: var(--gs-primary);">Arena Table</span>
          <h2 style="color: white;">Featured Partnership</h2>
        </div>
      </div>
      <div class="arena-partnership-block" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; align-items: center;">
        <div class="partnership-copy">
          <h3 style="font-size: 2rem; margin-bottom: 20px;">Fuel Your Performance</h3>
          <p style="opacity: 0.8; font-size: 1.1rem; margin-bottom: 30px;">livescorefree.online partners with the world's most iconic brands to keep the kinetic broadcast alive. Connect with us for premium sponsorship inventory across our sports hubs.</p>
          <a class="btn btn-primary" data-link href="/advertise">Inquire for Sponsorship</a>
        </div>
        <div class="partnership-image" style="background: var(--gs-surface-low); padding: 40px; text-align: center; color: var(--gs-on-surface);">
          <div style="font-size: 3rem; font-weight: 800; color: var(--gs-primary);">GATORADE</div>
          <p style="margin-top: 20px; font-weight: 600;">The World's #1 Sports Drink</p>
        </div>
      </div>
    </section>

    <!-- 6. Fuel The Broadcast: Support -->
    <section class="section tone-support">
       <div class="section-head">
        <div>
          <span class="premium-kicker" style="color: var(--gs-primary);">Backstage</span>
          <h2>Fuel The Broadcast</h2>
          <p>Keep the stream alive and ad-free. Support our independent broadcast crew.</p>
        </div>
      </div>
      <div class="support-premium-banner gs-depth-shadow" style="background: var(--gs-surface-lowest); padding: 40px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 30px;">
        <div style="max-width: 600px;">
          <h3>Join the Foundation Circle</h3>
          <p>livescorefree.online is built for fans, by fans. Your support helps us scale our real-time data feeds and expand our coverage of niche leagues worldwide.</p>
        </div>
        <div class="support-actions">
           <a class="btn btn-primary" href="https://ko-fi.com" target="_blank" style="padding: 20px 40px; font-size: 1.2rem;">Support via Ko-fi</a>
        </div>
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
          <p style="font-size: 1.25rem; opacity: 0.8; margin-bottom: 40px; font-family: var(--soccer-font-body);">Track the pulse of the arena with livescorefree.online's brutalist match centers and real-time kinetic scoreboards.</p>
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
  setSeo({ title: "Match History | livescorefree.online", description: "Your recently opened match pages.", path: "/history" });
  container.innerHTML = `<section class="section tone-history"><div class="section-head"><div><h1>Match History</h1><p>Recent matches opened from the live score center.</p></div></div>${renderMatchGrid(state.history.slice(0, 30), "No browsing history yet.")}</section>`;
}

function renderTopLeaguesPage(container) {
  setSeo({ title: "Top Leagues | livescorefree.online", description: "Browse major leagues with dedicated overview pages.", path: "/top-leagues" });
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

  setSeo({ title: `${sport.label} Live Scores | LiveScoreFree`, description: sport.description, path: `/sport/${route.sport}` });
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
    title: `${league.label} Live Scores, Fixtures & Results | livescorefree.online`,
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
    title: `${match.homeName} vs ${match.awayName} | LiveScoreFree Match Center`,
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
  setSeo({ title: "Support LiveScoreFree", description: "Help fund server costs and real-time sports coverage.", path: "/donate" });
  const trust = getTrustSignals();
  container.innerHTML = `
    <section class="section tone-support">
      <div class="section-head"><div><h1>Support LiveScoreFree</h1><p>Community support keeps the score feed, pages, and APIs online.</p></div></div>
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
  setSeo({ title: "Sports News | livescorefree.online", description: "Editorial sports coverage and premium news cards.", path: "/news" });
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
  setSeo({ title: "Search Matches | livescorefree.online", description: "Find live, upcoming, and result match pages fast.", path: "/search" });
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
  setSeo({ title: "Contact livescorefree.online", description: "Support, advertising, and matchday partnership contact page.", path: "/contact" });
  container.innerHTML = `
    <section class="section tone-legal">
      <div class="section-head"><div><h1>Contact Us</h1><p>Support, partnerships, sponsor inquiries, and general feedback.</p></div></div>
      <div class="contact-premium-layout">
        <div class="contact-premium-card">
          <span class="premium-kicker">Customer Support</span>
          <h3>Reach the livescorefree.online team</h3>
          <p>Email: <a href="mailto:support@livescorefree.online">support@livescorefree.online</a></p>
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
  setSeo({ title: "About livescorefree.online", description: "About the premium live-score platform and its club-style design direction.", path: "/about" });
  container.innerHTML = `
    <section class="section tone-trust">
      <div class="section-head"><div><h1>About livescorefree.online</h1><p>A live-score website rebuilt to feel closer to a premium soccer-club experience.</p></div></div>
      <div class="club-premium-layout">
        <div class="club-story-card">
          <span class="premium-kicker">The Platform</span>
          <h3>Real data, premium presentation</h3>
          <p>LiveScoreFree aggregates match data, league standings, and sports news into a faster fan-facing product with dedicated sport hubs, league pages, match centers, and sponsor-ready content blocks.</p>
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
  setSeo({ title: "Feedback | livescorefree.online", description: "Send feedback about the live score website and API experience.", path: "/feedback" });
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
  setSeo({ title: `${title} | livescorefree.online`, description, path });
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
