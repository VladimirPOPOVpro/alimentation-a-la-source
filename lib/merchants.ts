import marchandsData from "@/data/marchands.json";
import type { Merchant } from "./types";
import { HOSPITAL, distanceKm } from "./geo";
import { validateMerchants } from "./validateMerchants";

/**
 * Source unique des marchands, contrôlée une fois pour toutes au chargement.
 * Tout le reste du site part d'ici — y compris l'index géographique — pour que
 * la vérification ne puisse pas être contournée par une importation directe du
 * JSON.
 */
export const merchants: Merchant[] = validateMerchants(marchandsData);

export interface MerchantWithDistance extends Merchant {
  distanceKm: number;
}

export function getAllMerchants(): MerchantWithDistance[] {
  return merchants
    .map((m) => ({
      ...m,
      distanceKm: distanceKm(HOSPITAL.lat, HOSPITAL.lon, m.lat, m.lon),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function getMerchantBySlug(slug: string): MerchantWithDistance | undefined {
  return getAllMerchants().find((m) => m.slug === slug);
}

/**
 * Le périmètre réellement couvert par les fiches.
 *
 * Calculé, jamais écrit en dur : la couverture est étendue à chaque passe de
 * l'agent, et une phrase d'accueil rédigée à la main se périme en quelques
 * jours. C'est déjà arrivé — le site a annoncé « dans le Var » longtemps après
 * que la base eut atteint Brest et Dunkerque.
 *
 * Le département se lit dans le code postal de l'adresse, qui est un champ
 * obligatoire vérifié au build (voir lib/validateMerchants.ts). Les deux
 * premiers chiffres suffisent : la Corse (2A/2B) n'est pas couverte, et le
 * jour où elle le sera, elle comptera simplement comme « 20 ».
 */
export interface Couverture {
  total: number;
  /** Nombre de départements distincts représentés. */
  departements: number;
  /** Fiches situées dans le Var, le département de l'hôpital. */
  var: number;
}

function departement(adresse: string): string | null {
  // Le dernier code postal de la chaîne : certaines adresses citent un lieu-dit
  // ou un bâtiment portant lui-même un numéro à cinq chiffres.
  const trouves = adresse.match(/\b\d{5}\b/g);
  return trouves ? trouves[trouves.length - 1].slice(0, 2) : null;
}

let couvertureCache: Couverture | null = null;

export function getCouverture(): Couverture {
  if (couvertureCache) return couvertureCache;
  const deps = new Set<string>();
  let varois = 0;
  for (const m of merchants) {
    const d = departement(m.adresse);
    if (!d) continue;
    deps.add(d);
    if (d === "83") varois += 1;
  }
  couvertureCache = {
    total: merchants.length,
    departements: deps.size,
    var: varois,
  };
  return couvertureCache;
}
