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
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Subscription request failed: ${response.status} for ${path}`);
  }

  return response.json();
}

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
      let results = null;
      if (subscription.type === "live") {
        results = await fetchSubscriptionJson(request, "/api/live", {
          sport: subscription.sport || "all",
          league: subscription.league || undefined
        });
      } else if (subscription.type === "match" && subscription.id) {
        results = await fetchSubscriptionJson(request, "/api/match", {
          id: subscription.id,
          sport: subscription.sport || "soccer",
          league: subscription.league || undefined
        });
      }

      if (results) {
        server.send(JSON.stringify({
          type: subscription.type,
          timestamp: Date.now(),
          data: results
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
