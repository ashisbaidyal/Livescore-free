import { 
  state, 
} from "./js/state.js";
import { 
  qs, 
  qsa, 
  escapeHtml 
} from "./js/utils.js";
import { 
  REFRESH_INTERVAL_MS,
  THEME_KEY
} from "./js/constants.js";
import {
  refreshData
} from "./js/api.js";
import {
  loadHistory,
  loadFeedbackNotes,
  loadFavoriteMatches,
  loadNotificationPrefs,
  loadLanguagePreference,
  loadBackgroundPreferences
} from "./js/storage.js";
import {
  navigate,
  handleRouteFromQueryFallback,
  migrateLegacyHashPath,
  parseRoute
} from "./js/routing.js";
import {
  renderRoute
} from "./js/ui-pages.js";
import {
  applyTheme,
  detectThemeByTime,
  cycleThemeMode,
  toggleSearch,
  executeSearch,
  renderFooterContent,
  maybeShowSupportPopup,
  initScrollAnimations
} from "./js/ui-core.js";

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
    setInterval(async () => {
      await refreshData({ silent: true });
      await rerenderActiveDataRoute();
    }, REFRESH_INTERVAL_MS);

    setInterval(() => {
      const route = parseRoute(state.activePath);
      maybeShowSupportPopup(route);
    }, 60000);

    state.loading = false;
    console.log("App initialized successfully.");
  } catch (error) {
    console.error("App init failed:", error);
    const main = qs("#main");
    if (main) main.innerHTML = `<div class="message-box">App failed to start: ${escapeHtml(error.message)}</div>`;
  }
}

if (typeof window !== "undefined") {
  init();
}
