import { 
  state 
} from "./state.js";
import { 
  slugify 
} from "./utils.js";
import { 
  SPORT_GROUPS, 
  LEAGUES 
} from "./constants.js";

export function getCurrentPath() {
  if (window.location.protocol === "file:") {
    return (window.location.hash.slice(1) || "/home").split("?")[0];
  }
  return window.location.pathname;
}

export function parseRoute(path) {
  const segments = path.split("/").filter(Boolean);
  if (path === "/" || path === "/home") return { type: "home" };
  if (path === "/live") return { type: "live" };
  if (path === "/upcoming") return { type: "upcoming" };
  if (path === "/trending") return { type: "trending" };
  if (path === "/results") return { type: "results" };
  if (path === "/history") return { type: "history" };
  if (path === "/top-leagues") return { type: "top-leagues" };
  if (path === "/players") return { type: "players" };
  if (path === "/teams") return { type: "teams" };
  if (path === "/donate") return { type: "donate" };
  if (path === "/feedback") return { type: "feedback" };
  if (path === "/news") return { type: "news" };
  if (path === "/advertise") return { type: "advertise" };
  if (path === "/privacy-policy") return { type: "privacy-policy" };
  if (path === "/terms-of-service") return { type: "terms-of-service" };
  if (path === "/data-sources") return { type: "data-sources" };
  if (path === "/dmca-policy") return { type: "dmca-policy" };
  if (path === "/about") return { type: "about" };
  if (path === "/contact") return { type: "contact" };

  if (segments[0] === "sport" && segments[1]) {
    if (segments[2] === "player" && segments[3]) {
      return { type: "player-profile", sport: segments[1], slug: segments[3] };
    }
    if (segments[2] === "team" && segments[3]) {
      return { type: "team-profile", sport: segments[1], slug: segments[3] };
    }
    return { type: "sport", sport: segments[1] };
  }

  // League: /league/premier-league
  if (segments[0] === "league" && segments[1]) {
    return { type: "league", leagueKey: segments[1], section: segments[2] || "overview" };
  }

  // Match: /football/live/man-utd-vs-liverpool
  if (SPORT_GROUPS[segments[0]] && ["live", "results", "upcoming"].includes(segments[1]) && segments[2]) {
    return { type: "match", sport: segments[0], mode: segments[1], slug: segments[2] };
  }

  return { type: "not-found" };
}

export function navigate(path, replace = false) {
  if (window.location.protocol === "file:") {
    window.location.hash = path;
  } else if (replace) {
    window.history.replaceState(null, "", path);
  } else {
    window.history.pushState(null, "", path);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function routeForMatch(match) {
  const mode = match.status === "final" ? "results" : match.status === "live" ? "live" : "upcoming";
  return `/${match.sportGroup}/${mode}/${match.slug}`;
}

export function routeForLeague(leagueKey) {
  return `/league/${leagueKey}`;
}

export function routeForTeam({ sportGroup, teamId, teamName }) {
  return `/sport/${sportGroup}/team/${slugify(teamName)}`;
}

export function routeForPlayer({ sportGroup, playerId, playerName }) {
  return `/sport/${sportGroup}/player/${slugify(playerName)}`;
}

export function findMatch(sport, slug) {
  return state.matches.find(m => m.sportGroup === sport && m.slug === slug) || 
         state.history.find(m => m.sportGroup === sport && m.slug === slug);
}

export function handleRouteFromQueryFallback() {
  const params = new URLSearchParams(window.location.search);
  const route = params.get("route");
  if (route && route.startsWith("/")) {
    navigate(route, true);
  }
}

export function migrateLegacyHashPath() {
  const hash = window.location.hash;
  if (hash.startsWith("#/")) {
    navigate(hash.slice(1), true);
  }
}
