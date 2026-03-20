import { 
  cachedJson 
} from "./api.js";
import { 
  escapeHtml, 
  slugify 
} from "./utils.js";

export async function fetchSportsNews() {
  try {
    // Reduced TTL from 30m to 5m for Kinetic livescorefree.online updates
    const data = await cachedJson("https://site.api.espn.com/apis/site/v2/sports/news", 1000 * 60 * 5);
    return data?.articles || [];
  } catch (_error) {
    return [];
  }
}

export function renderHighlightsNewsCard(article) {
  const img = article.images?.[0]?.url || "";
  return `
    <div class="mhl-news-card-v2">
      ${img ? `<img src="${escapeHtml(img)}" alt="" class="mhl-news-img" loading="lazy" />` : ""}
      <div class="mhl-news-body">
        <h4 class="mhl-news-title">${escapeHtml(article.headline)}</h4>
        <p class="mhl-news-desc">${escapeHtml(article.description || article.caption || "")}</p>
        <a href="${escapeHtml(article.links?.web?.href || "#")}" target="_blank" rel="noopener noreferrer" class="mhl-news-link">Read More</a>
      </div>
    </div>
  `;
}
