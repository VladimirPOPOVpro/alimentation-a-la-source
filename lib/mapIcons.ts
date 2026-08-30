import L from "leaflet";
import type { MerchantCategory } from "./types";
import { CATEGORY_COLORS } from "./categories";

const CATEGORY_PATHS: Record<MerchantCategory, string> = {
  ferme:
    '<path d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6" stroke="white" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  marche:
    '<path d="M4 8h16l-1.5 12h-13L4 8Zm2-3 2-3m10 3-2-3" stroke="white" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  "magasin-bio":
    '<path d="M17 8c0 4-5 8-5 8s-5-4-5-8a5 5 0 0 1 10 0Z" stroke="white" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
  amap:
    '<circle cx="8" cy="8" r="3" stroke="white" stroke-width="1.6" fill="none"/><circle cx="16" cy="8" r="3" stroke="white" stroke-width="1.6" fill="none"/><path d="M3 20c0-3 2.5-5 5-5s5 2 5 5M11 20c0-3 2.5-5 5-5s5 2 5 5" stroke="white" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  producteur:
    '<circle cx="12" cy="12" r="4" stroke="white" stroke-width="1.6" fill="none"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="white" stroke-width="1.6" stroke-linecap="round"/>',
  poissonnerie:
    '<path d="M3 12c2.5-3.5 6-5.5 9.5-5.5 2.8 0 4.6 1.8 5.5 5.5-.9 3.7-2.7 5.5-5.5 5.5C9 17.5 5.5 15.5 3 12Z" stroke="white" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M18 12l3.5-3v6L18 12Z" stroke="white" stroke-width="1.6" fill="none" stroke-linejoin="round"/><circle cx="8" cy="10.5" r="1" fill="white"/>',
};

export function createCategoryIcon(
  category: MerchantCategory,
  highlighted = false
): L.DivIcon {
  const color = CATEGORY_COLORS[category];
  const size = highlighted ? 40 : 34;
  const html = `
    <div class="marker-pop-wrap marker-pin" style="width:${size}px;height:${size}px;">
      <div class="marker-pin-shape" style="
        width:100%;height:100%;
        background:${color};
        border:2px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
      ">
        <svg width="${size * 0.55}" height="${size * 0.55}" viewBox="0 0 24 24" style="transform:rotate(45deg)">
          ${CATEGORY_PATHS[category]}
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export function createPhotoIcon(
  imageUrl: string,
  category: MerchantCategory,
  highlighted = false,
  label?: string
): L.DivIcon {
  const color = CATEGORY_COLORS[category];
  const size = highlighted ? 76 : 58;
  const badgeSize = Math.round(size * 0.42);
  const ring = `0 0 0 4px white, 0 0 0 7px ${color}, 0 4px 14px rgba(0,0,0,0.35)`;
  const html = `
    <div class="marker-pop-wrap" style="width:${size}px;height:${size}px;">
      <div class="marker-photo-circle" style="
        background-image:url('${imageUrl}');
        box-shadow:${ring};
      "></div>
      <div class="marker-badge" style="
        right:-2px;bottom:-2px;
        width:${badgeSize}px;height:${badgeSize}px;
        background:${color};
      ">
        <svg width="${badgeSize * 0.58}" height="${badgeSize * 0.58}" viewBox="0 0 24 24">
          ${CATEGORY_PATHS[category]}
        </svg>
      </div>
      ${label ? `<span class="marker-photo-label">${label}</span>` : ""}
    </div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 6],
  });
}

export function createHospitalIcon(): L.DivIcon {
  const html = `
    <div class="marker-pop-wrap" style="width:44px;height:44px;">
      <div style="
        width:100%;height:100%;
        background:#e53935;
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
      ">
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path d="M11 4h2v6h6v2h-6v6h-2v-6H5v-2h6V4Z" fill="white"/>
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}
