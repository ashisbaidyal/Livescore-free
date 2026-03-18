import { qsa } from "./utils.js";

const preloadedVisualAssets = new Set();

export function preloadVisualAsset(url) {
  if (!url || preloadedVisualAssets.has(url)) {
    return;
  }
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    preloadedVisualAssets.add(url);
  } catch (_error) {
    // ignore preload errors
  }
}

export function hydrateVisualMedia(scope = document) {
  qsa("img", scope).forEach((img, index) => {
    img.classList.add("media-smooth");
    img.setAttribute("loading", "eager");
    if (!img.getAttribute("decoding")) {
      img.setAttribute("decoding", "async");
    }
    if (
      (index < 6 || img.matches(".brand-logo, .nav-header-logo, .pwa-prompt-icon, .pwa-app-logo")) &&
      !img.getAttribute("fetchpriority")
    ) {
      img.setAttribute("fetchpriority", "high");
    }
    const markLoaded = () => img.classList.add("is-loaded");
    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener("load", markLoaded, { once: true });
      img.addEventListener("error", markLoaded, { once: true });
    }
  });
}

export function preloadCriticalVisualAssets() {
  const theme = document.documentElement.getAttribute("data-theme") === "day" ? "day" : "night";
  preloadVisualAsset(theme === "day" ? "/logo-day.png" : "/logo-night.png");
  preloadVisualAsset("/logo-mark-192.png");

  const scene = document.body?.getAttribute("data-bg-scene") || "";
  const sceneMatch = scene.match(/^arena-(\d)$/);
  if (sceneMatch) {
    preloadVisualAsset(theme === "day" ? `/bg-stadium-day-${sceneMatch[1]}.svg` : `/bg-stadium-night-${sceneMatch[1]}.svg`);
  }

  qsa("img").forEach((img) => {
    preloadVisualAsset(img.currentSrc || img.getAttribute("src") || "");
  });
}
