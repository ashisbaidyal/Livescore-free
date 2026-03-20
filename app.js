import { state } from "./js/state.js";
import { qs, qsa, escapeHtml } from "./js/utils.js";
import { REFRESH_INTERVAL_MS, THEME_KEY } from "./js/constants.js";
import { refreshData, syncMatchRealtimeState } from "./js/api.js";
import { loadHistory, loadFeedbackNotes, loadFavoriteMatches, loadNotificationPrefs, loadLanguagePreference, loadBackgroundPreferences } from "./js/storage.js";
import { navigate, handleRouteFromQueryFallback, migrateLegacyHashPath, parseRoute } from "./js/routing.js";
import { renderRoute } from "./js/ui-pages.js";
import { applyTheme, detectThemeByTime, cycleThemeMode, toggleSearch, executeSearch, renderFooterContent, maybeShowSupportPopup, initScrollAnimations } from "./js/ui-core.js";

// Enable API debugging for troubleshooting
if (typeof localStorage !== 'undefined') {
  if (localStorage.getItem('DEBUG_API') === 'true') {
    window.__API_DEBUG__ = true;
    console.log('%c[DEBUG MODE] API debugging enabled', 'color: #ff9900; font-weight: bold;');
  }
  // Check and report provider status
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('show-api-status') === 'true') {
    console.log('%c[API Status Check]', 'color: #0066cc; font-weight: bold;', state.providerStatus);
  }
}

async function rerenderActiveDataRoute() {
  if (document.hidden) return;
  const initialPath = state.activePath;
  await renderRoute();
}

function wireGlobalEvents() {
  window.addEventListener("popstate", () => {
    renderRoute();
  });

  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-link]");
    if (link) {
      e.preventDefault();
      const href = link.getAttribute("href");
      navigate(href);
    }

    if (e.target.closest("[data-theme-cycle]")) {
      cycleThemeMode();
    }

    if (e.target.closest("[data-search-toggle]")) {
      toggleSearch();
    }
  });

  const searchInput = qs("#search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      executeSearch(e.target.value);
    });
  }
}

async function init() {
  try {
    console.log("Initializing app...");
    renderFooterContent();
    wireGlobalEvents();
    
    // Load state
    loadHistory();
    loadFeedbackNotes();
    loadFavoriteMatches();
    loadLanguagePreference();

    // Theme
    const savedTheme = localStorage.getItem(THEME_KEY);
    applyTheme(savedTheme || detectThemeByTime());

    // Routing
    handleRouteFromQueryFallback();
    migrateLegacyHashPath();

    // Initial Render
    await renderRoute();

    // Data bootstrap
    await refreshData({ silent: true });
    await renderRoute();

    // Loops
    // 15-second Kinetic Match Refresh
    setInterval(async () => {
      const prevCount = state.liveMatches.length;
      const prevMatches = JSON.parse(JSON.stringify(state.liveMatches));
      
      await refreshData({ silent: true });
      
      // Patch updates to the DOM instead of full re-render
      state.liveMatches.forEach(match => {
        const old = prevMatches.find(m => m.slug === match.slug && m.sportGroup === match.sportGroup);
        if (old) {
          const hasUpdate = old.homeScore !== match.homeScore || 
                           old.awayScore !== match.awayScore || 
                           old.statusDetail !== match.statusDetail;
          if (hasUpdate) {
            // Update match card
            syncMatchRealtimeState(match, {
              homeScore: match.homeScore,
              awayScore: match.awayScore,
              status: match.status,
              statusDetail: match.statusDetail
            });

            // Patch Home Hero if it matches this match
            const heroSpot = document.getElementById("hero-spotlight");
            if (heroSpot && heroSpot.getAttribute("data-match-key") === `${match.sportGroup}:${match.slug}`) {
               const heroHomeScore = document.getElementById("hero-home-score");
               const heroAwayScore = document.getElementById("hero-away-score");
               const heroStatus = document.getElementById("hero-status");
               
               if (heroHomeScore) heroHomeScore.textContent = match.homeScore;
               if (heroAwayScore) heroAwayScore.textContent = match.awayScore;
               if (heroStatus) {
                 import("./js/ui-matches.js").then(m => {
                   if (heroStatus) heroStatus.innerHTML = m.statusBadge(match);
                 });
               }
            }

            // Patch Match Detail page if open
            const detailMain = document.querySelector(".match-hero-main");
            if (detailMain && detailMain.getAttribute("data-match-key") === `${match.sportGroup}:${match.slug}`) {
               const dh = document.getElementById("detail-home-score");
               const da = document.getElementById("detail-away-score");
               const ds = document.getElementById("detail-status");
               if (dh) dh.textContent = match.homeScore;
               if (da) da.textContent = match.awayScore;
               if (ds) {
                 import("./js/ui-matches.js").then(m => {
                   if (ds) ds.innerHTML = m.statusBadge(match);
                 });
               }
            }
          }
        }
      });

      // Only perform full re-render if structural changes occurred (new matches)
      if (state.liveMatches.length !== prevCount) {
        await rerenderActiveDataRoute();
      }
    }, REFRESH_INTERVAL_MS);

    // 5-minute Newsroom Refresh
    setInterval(async () => {
      if (document.hidden) return;
      const newsGrid = document.getElementById("home-news-grid") || document.getElementById("news-page-grid");
      if (newsGrid) {
        import("./js/ui-pages.js").then(p => {
           // This will re-fetch if cache is expired (TTL is 5m now)
           p.hydrateNewsGrid(document, newsGrid.id === "home-news-grid" ? "#home-news-grid" : "#news-page-grid", 12);
        });
      }
    }, 1000 * 60 * 5);

    // 15-minute League Standings Refresh
    setInterval(async () => {
      if (document.hidden) return;
      const standingsMount = document.getElementById("standings-table-mount") || document.getElementById("league-standings-card");
      if (standingsMount) {
        // Find the active league key if on league page, or use featured for home
        const route = parseRoute(state.activePath);
        const leagueKey = route.type === "league" ? route.leagueKey : null;
        if (leagueKey || route.type === "home") {
          import("./js/ui-pages.js").then(p => {
            // For home, it uses featured. For league, it uses the route key.
            // We can simplify by just calling renderRoute if it's been a while,
            // but for "kinetic" we just want to update this specific component.
            const featuredKey = "eng.1"; // Default featured
            p.renderLeagueStandingsCard(standingsMount, leagueKey || featuredKey, "Updated Standings");
          });
        }
      }
    }, 1000 * 60 * 15);

    setInterval(() => {
      const route = parseRoute(state.activePath);
      maybeShowSupportPopup(route);
    }, 60000);

    startKineticTicker();

    state.loading = false;
  } catch (error) {
    console.error("App init failed:", error);
    const main = qs("#main");
    if (main) main.innerHTML = `<div class="message-box">App failed to start: ${escapeHtml(error.message)}</div>`;
  }
}

function startKineticTicker() {
  // Kinetic Ticker: Increments live match clocks locally every second
  // for a "Stadium Spectacle" real-time feel.
  setInterval(() => {
    if (document.hidden || !state.lastUpdatedAt) return;
    
    state.liveMatches.forEach(match => {
      if (match.sportGroup !== "football") return;
      
      const matchId = `match-${match.sportGroup}-${match.slug}`;
      const statusEl = document.getElementById(`${matchId}-status`);
      if (!statusEl) return;

      const badge = statusEl.querySelector(".badge-live");
      if (!badge) return;

      // Extract numeric minute and check if it's currently incrementing
      const raw = match.statusDetail || "";
      const currentMin = parseInt(raw);
      if (isNaN(currentMin)) return;

      // Calculate how many minutes have passed since the last sync
      const elapsedMs = Date.now() - state.lastUpdatedAt;
      const elapsedMins = Math.floor(elapsedMs / 60000);
      
      const displayedMin = currentMin + elapsedMins;
      const suffix = raw.includes("'") ? "'" : "";
      const nextText = `${displayedMin}${suffix}`;

      // Update if changed
      if (badge.textContent.trim() !== nextText && nextText !== raw) {
        // Find the text node after the dot and update it
        const nodes = Array.from(badge.childNodes);
        const textNode = nodes.find(n => n.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.textContent = nextText;
      }
    });
  }, 1000);
}

if (typeof window !== "undefined") {
  init();
}


