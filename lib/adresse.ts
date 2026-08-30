/**
 * Client de la Base Adresse Nationale (api-adresse.data.gouv.fr).
 *
 * C'est l'API officielle française : gratuite, sans clé, sans quota bloquant,
 * et elle couvre toute la France — ce qui en fait la bonne base pour un site
 * destiné à sortir du Var. Nominatim est volontairement écarté : il refuse les
 * requêtes depuis certains hébergements et ses conditions d'usage sont plus
 * strictes pour de l'autocomplétion frappe par frappe.
 */

const BAN = "https://api-adresse.data.gouv.fr";

export interface AddressSuggestion {
  id: string;
  /** Libellé complet, ex. « 12 Rue Victor Hugo 83700 Saint-Raphaël ». */
  label: string;
  /** Ce qui distingue deux homonymes : « 83, Var, Provence-Alpes-Côte d'Azur ». */
  context: string;
  lat: number;
  lon: number;
  /** housenumber | street | locality | municipality */
  type: string;
}

interface BanFeature {
  properties?: {
    id?: string;
    label?: string;
    context?: string;
    type?: string;
  };
  geometry?: { coordinates?: [number, number] };
}

function toSuggestion(f: BanFeature): AddressSuggestion | null {
  const p = f.properties;
  const c = f.geometry?.coordinates;
  if (!p?.label || !c || c.length < 2) return null;
  const [lon, lat] = c;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  return {
    id: p.id ?? `${lat},${lon}`,
    label: p.label,
    context: p.context ?? "",
    type: p.type ?? "",
    lat,
    lon,
  };
}

/**
 * Suggestions pour une saisie en cours. `signal` sert à annuler la requête
 * précédente quand l'utilisateur continue de taper : sans ça les réponses
 * peuvent revenir dans le désordre et une frappe ancienne écrase la récente.
 */
export async function searchAddresses(
  query: string,
  signal?: AbortSignal
): Promise<AddressSuggestion[]> {
  const q = query.trim();
  // En dessous de 3 caractères la BAN renvoie du bruit (et refuse < 3).
  if (q.length < 3) return [];

  const url = `${BAN}/search/?q=${encodeURIComponent(q)}&limit=6&autocomplete=1`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`BAN search ${res.status}`);
  const data = (await res.json()) as { features?: BanFeature[] };
  return (data.features ?? [])
    .map(toSuggestion)
    .filter((s): s is AddressSuggestion => s !== null);
}

/** Adresse la plus proche d'un point : sert à nommer la position GPS. */
export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<string | null> {
  const url = `${BAN}/reverse/?lat=${lat}&lon=${lon}&limit=1`;
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as { features?: BanFeature[] };
  const first = (data.features ?? [])[0];
  return first?.properties?.label ?? null;
}
