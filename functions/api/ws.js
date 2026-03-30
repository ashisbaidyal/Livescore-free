import { normalizeSportParam, normalizeLeagueParam } from "./_shared.js";

function buildInternalApiUrl(request, path, params = {}) {
  const url = new URL(path, request.url);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function fetchSubscriptionJson(request, path, params = {}) {
  const response = await fetch(buildInternalApiUrl(request, path, params), {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`Subscription request failed: ${response.status} for ${path}`);
  }
  return response.json();
}

const CHANNEL_CONFIG = {
  live:      { path: "/api/live",      intervalMs: 5000  },
  match:     { path: "/api/match",     intervalMs: 5000  },
  results:   { path: "/api/results",   intervalMs: 60000 },
  upcoming:  { path: "/api/upcoming",  intervalMs: 90000 },
  standings: { path: "/api/standings", intervalMs: 300000 },
  teams:     { path: "/api/teams",     intervalMs: 300000 },
  players:   { path: "/api/players",   intervalMs: 600000 },
  news:      { path: "/api/news",      intervalMs: 600000 },
  blog:      { path: "/api/blog",      intervalMs: 600000 }
};

export async function onRequest(context) {
  const { request } = context;

  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected Upgrade: websocket", { status: 426 });
  }

  const [client, server] = new WebSocketPair();
  server.accept();

  const channels = new Map();

  function buildParams(channel) {
    const params = {};
    if (channel.sport) params.sport = channel.sport;
    if (channel.league) params.league = channel.league;
    if (channel.id) params.id = channel.id;
    if (channel.days) params.days = channel.days;
    if (channel.limit) params.limit = channel.limit;
    return params;
  }

  async function pushChannelData(channelKey) {
    const channel = channels.get(channelKey);
    if (!channel) return;
    try {
      const config = CHANNEL_CONFIG[channel.type] || CHANNEL_CONFIG.live;
      const results = await fetchSubscriptionJson(request, config.path, buildParams(channel));
      server.send(JSON.stringify({
        type: channel.type,
        channel: channelKey,
        timestamp: Date.now(),
        data: results
      }));
    } catch (err) {
      console.error(`WS Push Error [${channelKey}]:`, err.message);
    }
  }

  function subscribeChannel(message) {
    const type = message.target || message.type || "live";
    const config = CHANNEL_CONFIG[type];
    if (!config) {
      server.send(JSON.stringify({ type: "error", message: `Unknown channel: ${type}` }));
      return;
    }

    const channelKey = `${type}:${message.sport || "all"}:${message.league || ""}:${message.id || ""}`;

    if (channels.has(channelKey)) {
      server.send(JSON.stringify({ type: "already_subscribed", channel: channelKey }));
      return;
    }

    const channel = {
      type,
      sport: normalizeSportParam(message.sport || "all"),
      league: normalizeLeagueParam(message.league || ""),
      id: message.id || "",
      days: message.days || "",
      limit: message.limit || "",
      timer: null
    };

    const intervalMs = message.isLive ? Math.min(config.intervalMs, 5000) : config.intervalMs;

    channels.set(channelKey, channel);

    pushChannelData(channelKey);

    channel.timer = setInterval(() => pushChannelData(channelKey), intervalMs);

    server.send(JSON.stringify({
      type: "subscribed",
      channel: channelKey,
      target: type,
      intervalMs
    }));
  }

  function unsubscribeChannel(message) {
    const type = message.target || message.type || "live";
    const channelKey = `${type}:${message.sport || "all"}:${message.league || ""}:${message.id || ""}`;
    const channel = channels.get(channelKey);
    if (channel) {
      if (channel.timer) clearInterval(channel.timer);
      channels.delete(channelKey);
      server.send(JSON.stringify({ type: "unsubscribed", channel: channelKey }));
    }
  }

  function cleanupAll() {
    channels.forEach((channel) => {
      if (channel.timer) clearInterval(channel.timer);
    });
    channels.clear();
  }

  server.addEventListener("message", async (event) => {
    try {
      const message = JSON.parse(event.data);

      if (message.type === "subscribe") {
        if (Array.isArray(message.channels)) {
          message.channels.forEach((ch) => subscribeChannel({ ...ch, sport: ch.sport || message.sport, league: ch.league || message.league }));
        } else {
          subscribeChannel(message);
        }
        return;
      }

      if (message.type === "unsubscribe") {
        unsubscribeChannel(message);
        return;
      }

      if (message.type === "unsubscribe_all") {
        cleanupAll();
        server.send(JSON.stringify({ type: "unsubscribed_all" }));
        return;
      }

      if (message.type === "ping") {
        server.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        return;
      }
    } catch (err) {
      server.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  });

  server.addEventListener("close", cleanupAll);
  server.addEventListener("error", cleanupAll);

  return new Response(null, { status: 101, webSocket: client });
}
