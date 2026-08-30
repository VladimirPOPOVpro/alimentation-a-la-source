export const HOSPITAL = {
  nom: "Hôpital Bonnet",
  adresse: "1 Avenue Antoine Béart, 83700 Saint-Raphaël",
  lat: 43.439,
  lon: 6.7513,
};

/** D'où l'on mesure les distances. Par défaut l'hôpital, mais le visiteur
 *  peut choisir son adresse ou sa position : tout le reste du site en découle. */
export interface Center {
  lat: number;
  lon: number;
  /** Texte affiché à l'utilisateur, ex. « Hôpital Bonnet » ou une adresse. */
  label: string;
  /** Sert à choisir l'icône de la carte et le texte d'accompagnement. */
  kind: "hopital" | "adresse" | "position";
}

export const DEFAULT_CENTER: Center = {
  lat: HOSPITAL.lat,
  lon: HOSPITAL.lon,
  label: HOSPITAL.nom,
  kind: "hopital",
};

export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/** Garde-fou : une position hors de France métropolitaine (ou aberrante)
 *  recentrerait la carte sur l'océan sans rien afficher. */
export function isPlausibleFrance(lat: number, lon: number): boolean {
  return lat >= 41 && lat <= 51.5 && lon >= -5.5 && lon <= 9.8;
}
