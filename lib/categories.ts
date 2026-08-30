import type { MerchantCategory } from "./types";

/**
 * Source unique de la liste des catégories : la carte, le filtre et tout autre
 * consommateur importent celle-ci plutôt que d'en tenir chacun une copie.
 */
export const ALL_CATEGORIES: MerchantCategory[] = [
  "ferme",
  "marche",
  "magasin-bio",
  "amap",
  "producteur",
  "poissonnerie",
];

export const CATEGORY_LABELS: Record<MerchantCategory, string> = {
  ferme: "Ferme",
  marche: "Marché",
  "magasin-bio": "Magasin bio",
  amap: "AMAP",
  producteur: "Producteur",
  poissonnerie: "Poissonnerie",
};

export const CATEGORY_COLORS: Record<MerchantCategory, string> = {
  ferme: "#4c8c4a",
  marche: "#fb9a2f",
  "magasin-bio": "#2e7d32",
  amap: "#ba68c8",
  producteur: "#29b6f6",
  poissonnerie: "#00838f",
};
