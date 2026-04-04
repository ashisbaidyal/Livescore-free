import { renderMatchPage } from "./_match-page.js";

export async function onRequest(context) {
  return renderMatchPage(context, {
    routeBase: "upcoming-match",
    assetPath: "/upcoming_match_detail.html",
    upcoming: true
  });
}
