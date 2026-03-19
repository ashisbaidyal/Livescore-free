import { 
  qs, 
  qsa, 
  escapeHtml, 
  formatTime, 
  formatDate,
  formatDateTime,
  getAbsoluteUrlForPath,
  getResolvedTargetLanguage,
  slugify,
  compactTeamLabel
} from "./utils.js?v=20260319c";
import { 
  state 
} from "./state.js?v=20260319c";
import { 
  THEME_KEY, 
  SUPPORT_POPUP_KEY, 
  SUPPORT_POPUP_INTERVAL_MS, 
  APP_BOOT_TS,
  SEO_BASE,
  GLOBAL_SEO_KEYWORDS,
  SUPPORTED_LANGUAGES,
  LANGUAGE_KEY,
  SPORT_GROUPS
} from "./constants.js?v=20260319c";
import { 
  normalizeLanguageCode
} from "./utils.js?v=20260319c";
import {
  routeForLeague,
  routeForTeam,
  routeForPlayer,
  routeForMatch,
  findMatch
} from "./routing.js?v=20260319c";
import {
  getSportImagePath,
  statusBadge,
  renderPmTeamLogo,
  buildAutoBackgroundAttrs
} from "./ui-matches.js?v=20260319c";

export function showToast(text) {
  const toast = qs("#toast");
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

export function detectThemeByTime() {
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "night";
  const hour = new Date().getHours();
  return hour >= 7 && hour < 18 ? "day" : "night";
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const metaTheme = document.querySelector("#meta-theme-color");
  if (metaTheme) {
    metaTheme.setAttribute("content", theme === "day" ? "#dfeafa" : "#071322");
  }
}

export function cycleThemeMode() {
  if (state.themeMode === "auto") state.themeMode = "night";
  else if (state.themeMode === "night") state.themeMode = "day";
  else state.themeMode = "auto";

  if (state.themeMode === "auto") {
    localStorage.removeItem(THEME_KEY);
    applyTheme(detectThemeByTime());
  } else {
    localStorage.setItem(THEME_KEY, state.themeMode);
    applyTheme(state.themeMode);
  }
  showToast(`Theme switched to ${state.themeMode}.`);
}

export function setSeo({ title, description, keywords, path, structuredData }) {
  const mergedKeywords = Array.from(new Set([...GLOBAL_SEO_KEYWORDS, ...(keywords || [])].map((item) => String(item || "").trim()).filter(Boolean)));
  document.title = title;
  setMetaByName("description", description);
  setMetaByName("keywords", mergedKeywords.join(", "));
  setMetaByProperty("og:title", title);
  setMetaByProperty("og:description", description);
  setMetaByProperty("og:url", `${SEO_BASE.origin}${path}`);

  const canonical = qs("#canonical-link");
  if (canonical) canonical.setAttribute("href", `${SEO_BASE.origin}${path}`);
  setStructuredData(structuredData || null);
}

export function setMetaByName(name, content) {
  let node = document.head.querySelector(`meta[name="${name}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute("name", name);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

export function setMetaByProperty(property, content) {
  let node = document.head.querySelector(`meta[property="${property}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute("property", property);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

export function setStructuredData(data) {
  const node = qs("#dynamic-schema");
  if (!node) return;
  node.textContent = data ? JSON.stringify(data) : "";
}

export function setMainPageClasses(...classes) {
  document.body.className = classes.join(" ");
}

export function applyPageClassesForRoute(route) {
  const base = ["page", `page--${route.type}`];
  setMainPageClasses(...base);
}

export function revealChrome() {
  const header = qs(".site-header");
  if (header) header.classList.remove("site-header--hidden");
  const dock = qs(".app-dock");
  if (dock) dock.classList.remove("app-dock--hidden");
}

export function toggleSearch() {
  const overlay = qs("#search-overlay");
  const input = qs("#search-input");
  if (!overlay) return;
  const isHidden = overlay.hasAttribute("hidden");
  if (isHidden) {
    overlay.removeAttribute("hidden");
    if (input) { input.value = ""; input.focus(); }
    document.body.style.overflow = "hidden";
  } else {
    overlay.setAttribute("hidden", "");
    document.body.style.overflow = "";
  }
}

export function executeSearch(query) {
  const q = String(query || "").trim().toLowerCase();
  const results = qs("#search-results");
  if (!results) return;
  if (!q) { results.innerHTML = ""; return; }
  const matches = state.matches.filter(m => m.homeName.toLowerCase().includes(q) || m.awayName.toLowerCase().includes(q));
  results.innerHTML = matches.map(m => `
    <a href="${routeForMatch(m)}" data-link class="search-result">
      <span>${escapeHtml(m.homeName)} vs ${escapeHtml(m.awayName)}</span>
      <small>${escapeHtml(m.leagueLabel)}</small>
    </a>
  `).join("") || '<div class="message-box">No matches found.</div>';
}

export function renderFooterContent() {
  const year = qs("#current-year");
  if (year) year.textContent = new Date().getFullYear();
}

export function maybeShowSupportPopup(route) {
  const lastShown = parseInt(localStorage.getItem(SUPPORT_POPUP_KEY) || "0");
  if (Date.now() - lastShown > SUPPORT_POPUP_INTERVAL_MS) {
    showSupportPopup();
  }
}

export function showSupportPopup() {
  if (qs("#support-popup")) return;
  localStorage.setItem(SUPPORT_POPUP_KEY, String(Date.now()));
  const popup = document.createElement("div");
  popup.id = "support-popup";
  popup.className = "support-popup-overlay";
  popup.innerHTML = `
    <div class="support-popup-card">
      <button class="popup-close" type="button" data-popup-close>&times;</button>
      <h3>Keep LiveScoreFree Running for Everyone</h3>
      <p>Support from <strong>$1</strong> helps keep scores fast and funds new features.</p>
      <div class="popup-actions">
        <a class="btn btn-primary" data-link href="/donate">Support from $1</a>
        <a class="btn" data-link href="/feedback">Send Feedback</a>
      </div>
    </div>
  `;
  document.body.append(popup);
}

export function dismissSupportPopup() {
  const popup = qs("#support-popup");
  if (popup) popup.remove();
}

export function initScrollAnimations() {
  if (typeof IntersectionObserver === "undefined") return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  qsa(".section, .section-head, .grid > *").forEach((el) => observer.observe(el));
}

export function renderTicker() {
  // Logic from app.js to update the progress bar scale
}

export function renderGlobalShareWidget() {
  // logic to render share UI
}

export function renderHeroShareActions() {
  return `
    <div class="hero-actions-row">
      <button class="btn btn-primary" data-share-generic>Share Scores</button>
      <button class="btn" data-theme-cycle>◑ Theme</button>
    </div>
  `;
}

export function renderSeoHeroPanel(config) {
  return `
    <div class="hero-inner-content">
      <div class="hero-text">
        <span class="hero-eyebrow" style="color: var(--soccer-red); font-family: var(--soccer-font-head); text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em; margin-bottom: 12px; display: block;">${escapeHtml(config.eyebrow)}</span>
        <h1 class="hero-title">${escapeHtml(config.title)}</h1>
        <p class="hero-lead">${escapeHtml(config.lead)}</p>
        <div class="hero-actions">${config.actionsHtml}</div>
      </div>
    </div>
  `;
}

export function renderMatchInfoGrid(items) {
  return `
    <div class="match-info-grid">
      ${items.map(item => `
        <div class="info-card">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value || "Unknown")}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

export function renderFormTrack(form) {
  if (!form.length) return '<span class="subtle">No recent final matches.</span>';
  return `
    <div class="form-track">
      ${form.map(result => `<span class="form-chip form-${result.toLowerCase()}">${result}</span>`).join("")}
    </div>
  `;
}

export function selectMatchInsightPairs(match, statPairs) {
  const result = [];
  const labels = ["possession", "shots on target", "total shots", "corners", "yellow cards", "red cards"];
  for (const label of labels) {
    const pair = (statPairs || []).find(p => p.label.toLowerCase().includes(label));
    if (pair) result.push({ label: pair.label, homeDisplay: pair.homeValue, awayDisplay: pair.awayValue });
  }
  return result;
}

export function renderMatchInsightPanel({ match, statPairs, infoItems, favoriteKey, isFavorite }) {
  const sportLabel = match.sportLabel || SPORT_GROUPS[match.sportGroup]?.label || "Match";
  const insightPairs = selectMatchInsightPairs(match, statPairs);
  const homeLabel = match.homeAbbr || compactTeamLabel(match.homeName, match.homeAbbr);
  const awayLabel = match.awayAbbr || compactTeamLabel(match.awayName, match.awayAbbr);
  
  const tableHtml = insightPairs.length 
    ? `
      <div class="insight-table-wrap">
        <table class="insight-table">
          <thead>
            <tr>
              <th>${escapeHtml(homeLabel)}</th>
              <th class="metric-head">Metric</th>
              <th>${escapeHtml(awayLabel)}</th>
            </tr>
          </thead>
          <tbody>
            ${insightPairs.map(p => `
              <tr>
                <td class="val-home">${escapeHtml(p.homeDisplay)}</td>
                <td class="val-metric">${escapeHtml(p.label)}</td>
                <td class="val-away">${escapeHtml(p.awayDisplay)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    : `<div class="message-box">Live match data pending...</div>`;

  return `
    <aside class="match-insight">
      <div class="insight-head">
        <span class="insight-badge">${escapeHtml(sportLabel)}</span>
        ${statusBadge(match)}
      </div>
      <div class="insight-body">
        ${tableHtml}
      </div>
      <div class="insight-foot">
        <button class="btn insight-btn ${isFavorite ? "active" : ""}" data-favorite-match="${escapeHtml(favoriteKey)}">
          ${isFavorite ? "Saved to Favorites" : "Add to Favorites"}
        </button>
      </div>
    </aside>
  `;
}

export function wireMatchTabs(match) {
  const root = qs("#main");
  if (!root) return;
  const buttons = qsa(".match-tab-btn", root);
  const panels = qsa(".match-tab-panel", root);
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-match-tab");
      buttons.forEach(b => b.classList.toggle("active", b.getAttribute("data-match-tab") === tabId));
      panels.forEach(p => p.classList.toggle("active", p.getAttribute("data-tab-panel") === tabId));
      state.matchTabBySlug[`${match.sportGroup}:${match.slug}`] = tabId;
    });
  });
}
