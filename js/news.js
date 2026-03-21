import { 
  cachedJson 
} from "./api.js";
import { 
  escapeHtml, 
  slugify 
} from "./utils.js";

export async function fetchSportsNews() {
  try {
    // Reduced TTL from 30m to 5m for Kinetic livescoreFree.online updates
    const data = await cachedJson("https://site.api.espn.com/apis/site/v2/sports/news", 1000 * 60 * 5);
    return data?.articles || [];
  } catch (_error) {
    return [];
  }
}

export function renderLivescoreFreeNewsCard(article) {
  const img = article.images?.[0]?.url || "/bg-stadium-night-1.svg";
  const category = article.categories?.[0]?.description || (article.type === "Analysis" ? "Analysis" : "Sports News");
  
  return `
    <article class="group cursor-pointer">
      <div class="relative aspect-[16/10] rounded-lg overflow-hidden mb-6 shadow-2xl border border-white/5">
        <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1s]" src="${escapeHtml(img)}" loading="lazy">
        <div class="absolute top-5 left-5 bg-primary text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm">${escapeHtml(category)}</div>
      </div>
      <h5 class="text-2xl font-black uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors mb-3 italic font-headline">${escapeHtml(article.headline)}</h5>
      <p class="text-on-surface-variant text-sm font-medium leading-relaxed opacity-60 font-body line-clamp-2">${escapeHtml(article.description || article.caption || "")}</p>
      <a href="${escapeHtml(article.links?.web?.href || "#")}" target="_blank" rel="noopener noreferrer" class="inline-block mt-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-primary/20 hover:border-primary text-primary pb-1 transition-all no-underline">Read Full Report</a>
    </article>
  `;
}

export function renderHighlightsNewsCard(article) {
  return renderLivescoreFreeNewsCard(article);
}





