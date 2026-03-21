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
} from "./utils.js";
import {
  state
} from "./state.js";
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
} from "./constants.js";
import {
  normalizeLanguageCode
} from "./utils.js";
import {
  routeForLeague,
  routeForTeam,
  routeForPlayer,
  routeForMatch,
  findMatch
} from "./routing.js";
import {
  getSportImagePath,
  statusBadge,
  renderPmTeamLogo,
  buildAutoBackgroundAttrs
} from "./ui-matches.js";

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

export function renderProviderStatusBar() {
  const espnOk = state.providerStatus?.espn?.ok !== false;
  const sportsdbOk = state.providerStatus?.sportsdb?.ok !== false;

  if (espnOk && sportsdbOk) {
    const existing = qs("#provider-status-bar");
    if (existing) existing.remove();
    return "";
  }

  const warnings = [];
  if (!espnOk && state.providerStatus?.espn?.lastError) {
    warnings.push(`ESPN: ${state.providerStatus.espn.lastError}`);
  }
  if (!sportsdbOk && state.providerStatus?.sportsdb?.lastError) {
    warnings.push(`SportsDB: ${state.providerStatus.sportsdb.lastError}`);
  }

  if (warnings.length === 0) return "";

  const statusHtml = `
    <div id="provider-status-bar" style="background: #ff6b35; color: white; padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #ff5522; text-align: center;">
      <strong>Warning: Data loading issues:</strong> ${escapeHtml(warnings.join(" | "))}
      <small style="display: block; margin-top: 4px; opacity: 0.9;">Some live data may be unavailable. We're working on it.</small>
    </div>
  `;

  const existing = qs("#provider-status-bar");
  if (existing) existing.remove();

  const header = qs(".site-header");
  if (header) {
    const div = document.createElement("div");
    div.innerHTML = statusHtml;
    header.parentNode.insertBefore(div.firstElementChild, header.nextSibling);
  }

  return statusHtml;
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
    <div class="support-popup-card gs-depth-shadow" style="background: white; border: 4px solid var(--gs-primary); padding: 40px; position: relative;">
      <button class="popup-close" type="button" data-popup-close style="position: absolute; top: 10px; right: 10px; border: none; background: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
      <span class="premium-kicker" style="color: var(--gs-primary);">Fuel The Broadcast</span>
      <h3 style="margin: 10px 0 20px; font-size: 1.8rem;">Keep livescoreFree.online Kinetic</h3>
      <p style="margin-bottom: 30px; font-size: 1.1rem; opacity: 0.8;">Your support helps us scale our real-time sports data feeds across the global streaming universe.</p>
      <div class="popup-actions" style="display: flex; gap: 16px;">
        <a class="btn btn-primary" data-link href="/donate" style="flex: 1; padding: 14px; text-align: center;">Support via Ko-fi</a>
        <button class="btn" data-popup-close style="flex: 1; border: 2px solid var(--gs-on-surface); background: transparent; padding: 14px;">Dismiss</button>
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
    <div class="hero-actions-row" style="display: flex; gap: 12px; margin-top: 24px;">
      <button class="btn btn-primary" data-share-generic style="padding: 10px 20px;">Share Arena</button>
      <button class="btn" data-theme-cycle style="padding: 10px 20px; border: 2px solid white; background: transparent; color: white;">Toggle Night</button>
    </div>
  `;
}

export function renderSeoHeroPanel(config) {
  return `
    <div class="hero-inner-content" style="padding: 60px 0;">
      <div class="hero-text">
        <span class="hero-eyebrow" style="color: var(--gs-primary); font-family: var(--soccer-font-head); text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 16px; display: block;">${escapeHtml(config.eyebrow)}</span>
        <h1 class="hero-title" style="font-size: 3.5rem; line-height: 0.95; margin-bottom: 24px;">${escapeHtml(config.title)}</h1>
        <p class="hero-lead" style="font-size: 1.2rem; opacity: 0.8; max-width: 700px; margin-bottom: 32px;">${escapeHtml(config.lead)}</p>
        <div class="hero-actions">${config.actionsHtml}</div>
      </div>
    </div>
  `;
}

export function renderMatchInfoGrid(items) {
  return `
    <div class="match-info-grid">
      ${items.map((item) => `
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
      ${form.map((result) => `<span class="form-chip form-${result.toLowerCase()}">${result}</span>`).join("")}
    </div>
  `;
}

export function selectMatchInsightPairs(match, statPairs) {
  const result = [];
  const labels = ["possession", "shots on target", "total shots", "corners", "yellow cards", "red cards"];
  for (const label of labels) {
    const pair = (statPairs || []).find((p) => p.label.toLowerCase().includes(label));
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
            ${insightPairs.map((p) => `
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
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-match-tab");
      buttons.forEach((b) => b.classList.toggle("active", b.getAttribute("data-match-tab") === tabId));
      panels.forEach((p) => p.classList.toggle("active", p.getAttribute("data-tab-panel") === tabId));
      state.matchTabBySlug[`${match.sportGroup}:${match.slug}`] = tabId;
    });
  });
}

// HERO CAROUSEL LOGIC
let heroTimer = null;
let currentHeroSlide = 0;
const HERO_SLIDE_DURATION = 5000;

window.setHeroSlide = function(index) {
  const slides = document.querySelectorAll('.hero-slide');
  const navBtns = document.querySelectorAll('.hero-nav-btn');
  const navBars = document.querySelectorAll('.hero-nav-bar');
  const navTexts = document.querySelectorAll('.hero-nav-text');
  
  if (!slides.length) return;
  
  currentHeroSlide = index;
  
  slides.forEach((slide, i) => {
    slide.style.opacity = i === index ? '1' : '0';
    slide.style.pointerEvents = i === index ? 'auto' : 'none';
    slide.style.zIndex = i === index ? '20' : '10';
  });
  
  navBtns.forEach((btn, i) => {
    btn.classList.toggle('opacity-100', i === index);
    btn.classList.toggle('opacity-40', i !== index);
  });
  
  navBars.forEach((bar, i) => {
    bar.classList.toggle('bg-primary', i === index);
    bar.classList.toggle('bg-white/10', i !== index);
    // Reset progress bar
    const progress = bar.querySelector('.hero-progress');
    if (progress) progress.style.width = '0%';
  });
  
  navTexts.forEach((text, i) => {
    text.classList.toggle('text-primary', i === index);
  });
  
  // Restart timer
  window.initHeroCarousel();
};

window.initHeroCarousel = function() {
  if (heroTimer) clearInterval(heroTimer);
  
  const slides = document.querySelectorAll('.hero-slide');
  if (!slides.length) return;
  
  // Progress animation
  const activeBar = document.querySelectorAll('.hero-nav-bar')[currentHeroSlide];
  if (activeBar) {
    let progress = activeBar.querySelector('.hero-progress');
    if (!progress) {
      progress = document.createElement('div');
      progress.className = 'absolute inset-0 bg-white/30 hero-progress';
      activeBar.appendChild(progress);
    }
    progress.style.transition = 'none';
    progress.style.width = '0%';
    setTimeout(() => {
      progress.style.transition = `width ${HERO_SLIDE_DURATION}ms linear`;
      progress.style.width = '100%';
    }, 50);
  }

  heroTimer = setInterval(() => {
    const next = (currentHeroSlide + 1) % slides.length;
    window.setHeroSlide(next);
  }, HERO_SLIDE_DURATION);
};





