import { 
  HISTORY_KEY, 
  FEEDBACK_KEY, 
  FAVORITES_KEY, 
  NOTIFICATION_PREFS_KEY, 
  NOTIFICATION_LOG_KEY 
} from "./constants.js?v=20260319c";
import { state } from "./state.js?v=20260319c";
import { slugify } from "./utils.js?v=20260319c";

export function upsertHistory(match) {
  const key = `${match.leagueKey}:${match.id}`;
  const existingIndex = state.history.findIndex((item) => item.key === key);

  const item = {
    key,
    id: match.id,
    source: match.source || "espn",
    sourceId: match.sourceId || String(match.id || ""),
    leagueKey: match.leagueKey,
    leagueLabel: match.leagueLabel,
    feedPath: match.feedPath,
    sportGroup: match.sportGroup,
    sportLabel: match.sportLabel,
    slug: match.slug,
    date: match.date,
    homeName: match.homeName,
    awayName: match.awayName,
    homeTeamId: match.homeTeamId || "",
    awayTeamId: match.awayTeamId || "",
    homeLogo: match.homeLogo,
    awayLogo: match.awayLogo,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    venue: match.venue,
    note: match.note,
    savedAt: Date.now()
  };

  if (existingIndex >= 0) {
    state.history[existingIndex] = item;
  } else {
    state.history.unshift(item);
  }

  state.history.sort((a, b) => b.savedAt - a.savedAt);
  state.history = state.history.slice(0, 1200);
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      state.history = parsed;
    }
  } catch (_error) {
    state.history = [];
  }
}

export function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
  } catch (_error) {
    // ignore storage errors
  }
}

export function loadFeedbackNotes() {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      state.feedbackNotes = parsed;
    }
  } catch (_error) {
    state.feedbackNotes = [];
  }
}

export function saveFeedbackNotes() {
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(state.feedbackNotes));
  } catch (_error) {
    // ignore storage errors
  }
}

export function loadFavoriteMatches() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      state.favoriteMatches = parsed.map((item) => String(item)).slice(0, 400);
    }
  } catch (_error) {
    state.favoriteMatches = [];
  }
}

export function saveFavoriteMatches() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.favoriteMatches));
  } catch (_error) {
    // ignore storage errors
  }
}

export function isFavoriteKey(key) {
  return state.favoriteMatches.includes(String(key));
}

export function toggleFavoriteKey(key) {
  const normalized = String(key || "");
  if (!normalized) {
    return false;
  }
  if (isFavoriteKey(normalized)) {
    state.favoriteMatches = state.favoriteMatches.filter((item) => item !== normalized);
    saveFavoriteMatches();
    return false;
  }
  state.favoriteMatches.unshift(normalized);
  state.favoriteMatches = Array.from(new Set(state.favoriteMatches)).slice(0, 400);
  saveFavoriteMatches();
  return true;
}

export function normalizeNotificationPrefs(raw = {}) {
  const leadOptions = [5, 10, 15, 30, 60];
  const lead = Number(raw.leadMinutes);
  return {
    enabled: Boolean(raw.enabled),
    upcomingEnabled: false,
    favoriteTeamEnabled: false,
    leadMinutes: leadOptions.includes(lead) ? lead : 15,
    favoriteTeams: Array.isArray(raw.favoriteTeams) ? raw.favoriteTeams.map((item) => String(item)).slice(0, 120) : [],
    matchReminders: Array.isArray(raw.matchReminders) ? raw.matchReminders.map((item) => String(item)).slice(0, 240) : []
  };
}

export function loadNotificationPrefs() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    state.notificationPrefs = normalizeNotificationPrefs(parsed);
  } catch (_error) {
    state.notificationPrefs = normalizeNotificationPrefs({});
  }
}

export function saveNotificationPrefs() {
  try {
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(state.notificationPrefs));
  } catch (_error) {
    // ignore storage errors
  }
}

export function loadNotificationLog() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      state.notificationLog = parsed;
      return;
    }
  } catch (_error) {
    // ignore parse failures
  }
  state.notificationLog = {};
}

export function saveNotificationLog() {
  try {
    localStorage.setItem(NOTIFICATION_LOG_KEY, JSON.stringify(state.notificationLog));
  } catch (_error) {
    // ignore storage errors
  }
}

export function pruneNotificationLog() {
  const now = Date.now();
  const keepMs = 1000 * 60 * 60 * 24 * 7;
  for (const [key, value] of Object.entries(state.notificationLog)) {
    const ts = Number(value);
    if (!Number.isFinite(ts) || now - ts > keepMs) {
      delete state.notificationLog[key];
    }
  }
}
export function loadLanguagePreference() {
  try {
    const raw = localStorage.getItem("lsf_language_preference");
    if (raw) state.languagePreference = raw;
  } catch (_error) { /* ignore */ }
}

export function saveLanguagePreference(value) {
  try {
    localStorage.setItem("lsf_language_preference", value);
    state.languagePreference = value;
  } catch (_error) { /* ignore */ }
}

export function loadBackgroundPreferences() {
  try {
    const mode = localStorage.getItem("lsf_background_mode");
    if (mode) state.backgroundMode = mode;
    const custom = localStorage.getItem("lsf_custom_background");
    if (custom) state.customBackground = custom;
  } catch (_error) { /* ignore */ }
}

export function saveBackgroundPreferences({ mode, custom }) {
  try {
    if (mode) localStorage.setItem("lsf_background_mode", mode);
    if (custom) localStorage.setItem("lsf_custom_background", custom);
  } catch (_error) { /* ignore */ }
}
