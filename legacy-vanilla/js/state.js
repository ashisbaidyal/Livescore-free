
import { REFRESH_INTERVAL_MS } from "./constants.js";

export const state = {
  eventsByLeague: {},
  externalEvents: [],
  matches: [],
  liveMatches: [],
  finalMatches: [],
  upcomingMatches: [],
  matchIndex: new Map(),
  history: [],
  feedbackNotes: [],
  favoriteMatches: [],
  notificationPrefs: {
    enabled: false,
    upcomingEnabled: false,
    favoriteTeamEnabled: false,
    leadMinutes: 15,
    favoriteTeams: [],
    matchReminders: []
  },
  notificationLog: {},
  historyFilter: "all",
  liveSportFilter: "all",
  activePath: "/live",
  loading: true,
  languagePreference: "auto",
  backgroundMode: "auto",
  customBackground: "",
  backgroundSceneGroup: "default",
  backgroundSceneIndex: 0,
  matchTabBySlug: {},
  refreshPromise: null,
  lastUpdatedAt: 0,
  nextRefreshAt: Date.now() + REFRESH_INTERVAL_MS,
  themeMode: "auto",
  providerStatus: {
    espn: { ok: false, matches: 0, lastFetch: 0, lastError: "" },
    sportsdb: { ok: false, matches: 0, lastFetch: 0, lastError: "" }
  },
  leagueVisuals: {}
};



