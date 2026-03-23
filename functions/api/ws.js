import {
  fetchJson,
  normalizeSportParam,
  normalizeLeagueParam,
  siteApiUrl,
  calculateTTL
} from "./_shared.js";

export async function onRequest(context) {
  const { request } = context;
  
  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected Upgrade: websocket", { status: 426 });
  }

  const [client, server] = new WebSocketPair();

  server.accept();

  // Track the active subscription
  let subscription = {
    type: "live", // default
    sport: "all",
    league: ""
  };

  let pushInterval = null;

  const pushData = async () => {
    try {
      let data = null;
      if (subscription.type === "live") {
        const url = siteApiUrl(subscription.sport, subscription.league || "all", "scoreboard");
        data = await fetchJson(url);
      } else if (subscription.type === "match" && subscription.id) {
        const url = siteApiUrl(subscription.sport, subscription.league, "summary", { event: subscription.id });
        data = await fetchJson(url);
      }

      if (data) {
        server.send(JSON.stringify({
          type: subscription.type,
          timestamp: Date.now(),
          data: data
        }));
      }
    } catch (err) {
      console.error("WS Push Error:", err);
    }
  };

  server.addEventListener("message", async (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === "subscribe") {
        subscription = {
          type: message.target || "live",
          sport: normalizeSportParam(message.sport || "all"),
          league: normalizeLeagueParam(message.league || ""),
          id: message.id
        };

        // Initial push
        await pushData();

        // Setup dynamic interval based on status (simulating calculateTTL logic)
        if (pushInterval) clearInterval(pushInterval);
        
        // Dynamic polling on the edge: 5s for live, 30s for upcoming
        const intervalMs = (subscription.type === "live" || message.isLive) ? 5000 : 30000;
        pushInterval = setInterval(pushData, intervalMs);
        
        server.send(JSON.stringify({ type: "subscribed", target: subscription.type }));
      }
      
      if (message.type === "ping") {
        server.send(JSON.stringify({ type: "pong" }));
      }
    } catch (err) {
      server.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  });

  server.addEventListener("close", () => {
    if (pushInterval) clearInterval(pushInterval);
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}
