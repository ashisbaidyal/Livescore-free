import { 
  SPORT_GROUPS, 
  REFRESH_INTERVAL_MS 
} from "./constants.js";
import { state } from "./state.js";
import { 
  qs, 
  qsa, 
  escapeHtml, 
  formatTime, 
  slugify 
} from "./utils.js";
import { 
  saveNotificationPrefs, 
  saveNotificationLog, 
  pruneNotificationLog,
  loadNotificationPrefs
} from "./storage.js";
// renderRoute will be imported later in the entry point, or we use a global if necessary
// But for now, let's assume it's available or we pass it in.

export function canUseBrowserNotifications() {
  return "Notification" in window;
}

export function notificationPermissionState() {
  if (!canUseBrowserNotifications()) {
    return "unsupported";
  }
  return Notification.permission;
}

export function reminderMatchKey(match) {
  if (!match) {
    return "";
  }
  const sport = String(match.sportGroup || "sport");
  const idOrSlug = String(match.id || match.slug || "");
  return `${sport}:${idOrSlug}`;
}

export function isReminderActive(reminderKey) {
  const normalized = String(reminderKey || "");
  if (!normalized) {
    return false;
  }
  return (state.notificationPrefs.matchReminders || []).includes(normalized);
}

export function toggleReminderByKey(reminderKey) {
  const normalized = String(reminderKey || "");
  if (!normalized) {
    return false;
  }
  const set = new Set(state.notificationPrefs.matchReminders || []);
  if (set.has(normalized)) {
    set.delete(normalized);
    state.notificationPrefs.matchReminders = [...set].slice(0, 240);
    saveNotificationPrefs();
    return false;
  }
  set.add(normalized);
  state.notificationPrefs.matchReminders = [...set].slice(0, 240);
  saveNotificationPrefs();
  return true;
}

export function updateReminderButtonState(button, enabled) {
  if (!button) {
    return;
  }
  const on = Boolean(enabled);
  button.classList.toggle("active", on);
  button.setAttribute("aria-pressed", on ? "true" : "false");
  const text = button.querySelector("[data-reminder-label]");
  if (text) {
    text.textContent = on ? "Reminder On" : "Notify";
  }
}

export function teamNotificationKey(match, side) {
  const prefix = side === "away" ? "away" : "home";
  const id = prefix === "home" ? String(match.homeTeamId || "") : String(match.awayTeamId || "");
  const name = prefix === "home" ? match.homeName : match.awayName;
  if (id) {
    return `id:${id}`;
  }
  return `name:${match.sportGroup}:${slugify(name)}`;
}

export function matchHasFavoriteTeam(match) {
  const set = new Set(state.notificationPrefs.favoriteTeams || []);
  if (!set.size) {
    return false;
  }
  return set.has(teamNotificationKey(match, "home")) || set.has(teamNotificationKey(match, "away"));
}

export function buildNotificationTeams() {
  const map = new Map();
  const source = [...state.upcomingMatches, ...state.liveMatches].slice(0, 220);
  for (const match of source) {
    const pushTeam = (side) => {
      const isHome = side === "home";
      const key = teamNotificationKey(match, side);
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: isHome ? match.homeName : match.awayName,
          abbr: isHome ? match.homeAbbr : match.awayAbbr,
          logo: isHome ? match.homeLogo : match.awayLogo,
          sportGroup: match.sportGroup,
          count: 0
        });
      }
      map.get(key).count += 1;
    };
    pushTeam("home");
    pushTeam("away");
  }

  return [...map.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 48);
}

export function sendMatchNotification(title, body, tag = "") {
  if (!canUseBrowserNotifications() || Notification.permission !== "granted") {
    return;
  }
  try {
    const options = {
      body,
      icon: "/logo-mark-192.png",
      badge: "/logo-mark-32.png",
      tag: tag || undefined
    };
    if (navigator.serviceWorker?.controller && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((registration) => registration.showNotification(title, options)).catch(() => {
        new Notification(title, options);
      });
      return;
    }
    new Notification(title, options);
  } catch (_error) {
    // ignore notification errors
  }
}

export function triggerMatchNotifications() {
  if (!state.notificationPrefs.enabled) {
    return;
  }
  if (!canUseBrowserNotifications() || Notification.permission !== "granted") {
    return;
  }

  pruneNotificationLog();

  const reminderKeys = new Set((state.notificationPrefs.matchReminders || []).map((item) => String(item)));
  if (!reminderKeys.size) {
    return;
  }

  const statusByReminderKey = new Map();
  for (const match of state.matches) {
    statusByReminderKey.set(reminderMatchKey(match), match.status);
  }

  const cleanedReminders = [...reminderKeys].filter((key) => {
    const status = statusByReminderKey.get(key);
    return !status || status === "upcoming";
  });
  if (cleanedReminders.length !== reminderKeys.size) {
    state.notificationPrefs.matchReminders = cleanedReminders.slice(0, 240);
    saveNotificationPrefs();
    reminderKeys.clear();
    cleanedReminders.forEach((key) => reminderKeys.add(key));
  }

  const now = Date.now();
  const leadMs = Math.max(1, Number(state.notificationPrefs.leadMinutes || 15)) * 60 * 1000;
  const dueWindowMs = Math.max(REFRESH_INTERVAL_MS + 15000, 45000);

  for (const match of state.matches) {
    if (match.status !== "upcoming") {
      continue;
    }
    const reminderKey = reminderMatchKey(match);
    if (!reminderKeys.has(reminderKey)) {
      continue;
    }

    const startMs = new Date(match.date || 0).getTime();
    if (!Number.isFinite(startMs)) {
      continue;
    }

    const msUntil = startMs - now;
    const nearKickoff = msUntil <= leadMs && msUntil >= -dueWindowMs;
    if (!nearKickoff) {
      continue;
    }

    const key = `upcoming:${reminderKey}:${state.notificationPrefs.leadMinutes}`;
    if (!state.notificationLog[key]) {
      const startsText = formatTime(match.date);
      sendMatchNotification(
        `${match.homeName} vs ${match.awayName}`,
        `Reminder: starts at ${startsText} | ${match.leagueLabel}`,
        key
      );
      state.notificationLog[key] = Date.now();
    }
  }

  saveNotificationLog();
}

export async function requestNotificationAccess() {
  if (!canUseBrowserNotifications()) {
    return false;
  }

  if (Notification.permission === "granted") {
    state.notificationPrefs.enabled = true;
    saveNotificationPrefs();
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  try {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      state.notificationPrefs.enabled = true;
      saveNotificationPrefs();
      return true;
    }
  } catch (_error) {
    // ignore
  }
  return false;
}



