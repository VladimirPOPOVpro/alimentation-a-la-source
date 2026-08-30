export type PillarKey =
  | "alimentation"
  | "environnement"
  | "transport"
  | "economie"
  | "social";

export type MerchantCategory =
  | "ferme"
  | "marche"
  | "magasin-bio"
  | "amap"
  | "producteur"
  | "poissonnerie";

export interface Merchant {
  slug: string;
  nom: string;
  categorie: MerchantCategory;
  piliers: PillarKey[];
  lat: number;
  lon: number;
  adresse: string;
  horaires: string;
  produits: string[];
  description: string;
  telephone?: string;
  site_web?: string;
  google_maps_url?: string;
  image_url: string;
  images?: string[];
  a_confirmer?: boolean;
}
