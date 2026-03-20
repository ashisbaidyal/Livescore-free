import { qs, qsa } from "./utils.js";

const THIRD_PARTY_AD_EMBED_HTML = `<div id="container-01fac86ec9e3085bcb989e025d13aa86"></div>`;

let nativeAdCounter = 0;

export function renderAdSlot() {
  nativeAdCounter++;
  return `
    <div class="native-ad-banner" data-ad-slot="${nativeAdCounter}">
      ${THIRD_PARTY_AD_EMBED_HTML}
    </div>
  `;
}

export function createNativeAdSlotElement(route, index = 0) {
  const template = document.createElement("template");
  template.innerHTML = renderAdSlot().trim();
  return template.content.firstElementChild;
}

export function createNativeAdBandElement(route, index = 0) {
  const band = document.createElement("section");
  band.className = "section ad-band ad-band--injected";
  band.appendChild(createNativeAdSlotElement(route, index));
  return band;
}

export function ensureMinimumNativeBanners(route) {
  const main = qs("#main");
  if (!main) {
    return;
  }
  const existingBanners = qsa(".native-ad-banner", main);
  if (existingBanners.length >= 3) {
    return;
  }

  const contentChildren = Array.from(main.children).filter(
    (node) => !node.matches("#global-share-widget, .pwa-app-header, .pwa-quick-grid, .ad-band")
  );
  const firstAnchor = contentChildren[0] || null;
  const middleAnchor = contentChildren[Math.max(0, Math.floor((contentChildren.length - 1) / 2))] || firstAnchor;

  for (let index = existingBanners.length; index < 3; index += 1) {
    const band = createNativeAdBandElement(route, index);
    if (index === 0 && firstAnchor?.parentNode === main) {
      firstAnchor.insertAdjacentElement("beforebegin", band);
      continue;
    }
    if (index === 1 && middleAnchor?.parentNode === main) {
      middleAnchor.insertAdjacentElement("afterend", band);
      continue;
    }
    main.appendChild(band);
  }
}

export function activateNativeAds(route) {
  return;
}



