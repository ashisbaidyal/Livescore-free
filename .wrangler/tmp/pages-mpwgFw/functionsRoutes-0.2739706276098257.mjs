import { onRequest as __api_blog_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\blog.js"
import { onRequest as __api_info_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\info.js"
import { onRequest as __api_live_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\live.js"
import { onRequest as __api_match_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\match.js"
import { onRequest as __api_news_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\news.js"
import { onRequest as __api_players_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\players.js"
import { onRequest as __api_results_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\results.js"
import { onRequest as __api_standings_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\standings.js"
import { onRequest as __api_teams_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\teams.js"
import { onRequest as __api_upcoming_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\upcoming.js"
import { onRequest as __api_ws_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\api\\ws.js"
import { onRequest as __match_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\match.js"
import { onRequest as __sitemap_xml_js_onRequest } from "D:\\YTB\\livescorefree-v2-production\\lsf\\functions\\sitemap.xml.js"

export const routes = [
    {
      routePath: "/api/blog",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_blog_js_onRequest],
    },
  {
      routePath: "/api/info",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_info_js_onRequest],
    },
  {
      routePath: "/api/live",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_live_js_onRequest],
    },
  {
      routePath: "/api/match",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_match_js_onRequest],
    },
  {
      routePath: "/api/news",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_news_js_onRequest],
    },
  {
      routePath: "/api/players",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_players_js_onRequest],
    },
  {
      routePath: "/api/results",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_results_js_onRequest],
    },
  {
      routePath: "/api/standings",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_standings_js_onRequest],
    },
  {
      routePath: "/api/teams",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_teams_js_onRequest],
    },
  {
      routePath: "/api/upcoming",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_upcoming_js_onRequest],
    },
  {
      routePath: "/api/ws",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_ws_js_onRequest],
    },
  {
      routePath: "/match",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__match_js_onRequest],
    },
  {
      routePath: "/sitemap.xml",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__sitemap_xml_js_onRequest],
    },
  ]