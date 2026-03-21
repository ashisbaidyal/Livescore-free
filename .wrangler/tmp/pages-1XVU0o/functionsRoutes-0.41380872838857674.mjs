import { onRequest as __api_cricket_live_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\cricket-live.js"
import { onRequest as __api_health_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\health.js"
import { onRequest as __api_live_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\live.js"
import { onRequest as __api_mlb_live_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\mlb-live.js"
import { onRequest as __api_nhl_live_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\nhl-live.js"
import { onRequest as __api_proxy_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\proxy.js"
import { onRequest as __api_standings_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\standings.js"
import { onRequest as __api_timeline_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\timeline.js"
import { onRequest as ___middleware_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\_middleware.js"

export const routes = [
    {
      routePath: "/api/cricket-live",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_cricket_live_js_onRequest],
    },
  {
      routePath: "/api/health",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_health_js_onRequest],
    },
  {
      routePath: "/api/live",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_live_js_onRequest],
    },
  {
      routePath: "/api/mlb-live",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_mlb_live_js_onRequest],
    },
  {
      routePath: "/api/nhl-live",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_nhl_live_js_onRequest],
    },
  {
      routePath: "/api/proxy",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_proxy_js_onRequest],
    },
  {
      routePath: "/api/standings",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_standings_js_onRequest],
    },
  {
      routePath: "/api/timeline",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_timeline_js_onRequest],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]