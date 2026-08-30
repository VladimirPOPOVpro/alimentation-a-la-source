import type { MerchantCategory } from "./types";

export const CATEGORY_LABELS: Record<MerchantCategory, string> = {
  ferme: "Ferme",
  marche: "Marché",
  "magasin-bio": "Magasin bio",
  amap: "AMAP",
  producteur: "Producteur",
};

export const CATEGORY_COLORS: Record<MerchantCategory, string> = {
  ferme: "#4c8c4a",
  marche: "#fb9a2f",
  "magasin-bio": "#2e7d32",
  amap: "#ba68c8",
  producteur: "#29b6f6",
};
