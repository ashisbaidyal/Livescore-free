
import { 
  SUPPORTED_LANGUAGES, 
  TRUST_SIGNAL_BASELINE, 
  DONATION_MONTHLY_GOAL_USD, 
  DONATION_BASE_SUPPORT_USD, 
  SPORT_GROUPS, 
  LEAGUES, 
  LEAGUE_REGIONS,
  SEO_BASE
} from "./constants.js";

import { state } from "./state.js";

export const qs = (selector, parent = document) => parent.querySelector(selector);
export const qsa = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function parseNumeric(value) {
  const text = String(value ?? "");
  const match = text.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

export function formatTime(value) {
  try {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (_error) {
    return "TBD";
  }
}

export function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  } catch (_error) {
    return "Unknown date";
  }
}

export function formatDateTime(value) {
  return `${formatDate(value)} ${formatTime(value)}`;
}

export function compactTeamLabel(name, abbr = "") {
  const safeName = String(name || "").trim();
  const safeAbbr = String(abbr || "").trim().toUpperCase();
  if (!safeName) {
    return safeAbbr || "Team";
  }
  if (safeName.length <= 12) {
    return safeName;
  }
  const lastToken = safeName.split(/\s+/).filter(Boolean).pop() || safeName;
  if (lastToken.length <= 12) {
    return lastToken;
  }
  return safeAbbr || safeName.slice(0, 12);
}

export function normalizeLanguageCode(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) {
    return "en";
  }
  if (SUPPORTED_LANGUAGES[value]) {
    return value;
  }

  const lower = value.toLowerCase();
  if (lower.startsWith("zh")) {
    return "zh-CN";
  }

  const base = lower.split("-")[0];
  if (SUPPORTED_LANGUAGES[base]) {
    return base;
  }
  return "en";
}

export function getBrowserLanguage() {
  return normalizeLanguageCode(navigator.language || "en");
}

export function getResolvedTargetLanguage() {
  if (state.languagePreference === "auto") {
    return getBrowserLanguage();
  }
  return normalizeLanguageCode(state.languagePreference);
}

export function getAbsoluteUrlForPath(path = state.activePath) {
  if (window.location.protocol === "file:") {
    return `${SEO_BASE.origin}${normalizePath(path)}`;
  }
  return `${window.location.origin}${normalizePath(path)}`;
}

export function formatSeconds(value) {
  const safe = Math.max(0, Math.floor(value));
  return `${safe}s`;
}

export function formatCompactNumber(value) {
  const safe = Math.max(0, Number(value) || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(safe);
  } catch (_error) {
    return String(Math.round(safe));
  }
}

export function getEstimatedIndexedPages() {
  const dailyMatches = Math.max(50, state.matches.length || 0);
  const yearlyMatchPages = dailyMatches * 365;
  const teamPages = Object.keys(SPORT_GROUPS).length * 120;
  const leaguePages = Object.keys(LEAGUES).length * 32;
  return yearlyMatchPages + teamPages + leaguePages + state.history.length;
}

export function getTrustSignals() {
  const activeRegions = new Set(
    state.matches
      .map((match) => LEAGUE_REGIONS[match.leagueKey] || "")
      .filter(Boolean)
  ).size;

  const monthlyUsers = Math.max(
    TRUST_SIGNAL_BASELINE.monthlyUsers,
    (state.matches.length * 95) + (state.liveMatches.length * 260) + (state.history.length * 8)
  );
  const countries = Math.max(
    TRUST_SIGNAL_BASELINE.countries,
    activeRegions * 10
  );

  return {
    monthlyUsers,
    countries,
    sportsCovered: Object.keys(SPORT_GROUPS).length,
    indexedPages: getEstimatedIndexedPages()
  };
}

export function getDonationSnapshot() {
  const communityBoost = Math.min(26, state.favoriteMatches.length + Math.round(state.feedbackNotes.length / 2));
  const funded = Math.min(DONATION_MONTHLY_GOAL_USD, DONATION_BASE_SUPPORT_USD + communityBoost);
  const percent = Math.max(1, Math.round((funded / DONATION_MONTHLY_GOAL_USD) * 100));
  return {
    goal: DONATION_MONTHLY_GOAL_USD,
    funded,
    percent,
    remaining: Math.max(0, DONATION_MONTHLY_GOAL_USD - funded)
  };
}

export function renderDonationProgress({ compact = false } = {}) {
  const snapshot = getDonationSnapshot();
  return `
    <section class="donation-progress ${compact ? "compact" : ""}">
      <div class="donation-progress-head">
        <strong>Monthly server cost: $${snapshot.goal}</strong>
        <span>$${snapshot.funded} / $${snapshot.goal}</span>
      </div>
      <div class="donation-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${snapshot.goal}" aria-valuenow="${snapshot.funded}" aria-label="Donation progress">
        <span style="width:${snapshot.percent}%"></span>
      </div>
      <p class="subtle">
        Community support: <strong>$${snapshot.funded}</strong> | Remaining: <strong>$${snapshot.remaining}</strong>
      </p>
    </section>
  `;
}

// Internal helper needed by getAbsoluteUrlForPath
function normalizePath(value) {
  const text = String(value || "").trim();
  if (!text || text === "/") {
    return "/";
  }
  return text.startsWith("/") ? text : `/${text}`;
}



