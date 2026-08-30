import type { Merchant, MerchantCategory, PillarKey } from "./types";
import { ALL_CATEGORIES } from "./categories";

/**
 * Contrôle de `data/marchands.json` au chargement du module, donc à la
 * construction du site.
 *
 * Pourquoi ce fichier existe : `data/marchands.json` est édité par un agent
 * autonome qui pousse sur `main` sans relecture humaine. Son seul garde-fou
 * avant publication est `npm run build`. Or TypeScript ne vérifie pas le
 * contenu d'un JSON importé — `marchandsData as Merchant[]` accepte sans broncher
 * une catégorie inventée ou une latitude et une longitude interverties.
 * Vérifié : une catégorie « boulangerie » passait `tsc` ET `next build`.
 *
 * Les règles ci-dessous transforment ces fautes silencieuses en échec de
 * construction, avec un message qui dit quoi corriger. Une fiche fausse coûte
 * un déplacement inutile à quelqu'un ; un build rouge ne coûte rien.
 */

const PILIERS: PillarKey[] = [
  "alimentation",
  "environnement",
  "transport",
  "economie",
  "social",
];

/**
 * France métropolitaine, Corse comprise, avec une marge confortable.
 *
 * Sert surtout à attraper l'inversion latitude/longitude : la Base Adresse
 * Nationale renvoie `[lon, lat]`, l'inverse de ce qu'attend Leaflet. Une fiche
 * intervertie donne lat 6,7 / lon 43,4 — quelque part au large de la Somalie —
 * et ce cadre l'arrête net.
 */
const FRANCE = { latMin: 41.0, latMax: 51.5, lonMin: -5.5, lonMax: 9.8 };

function estRempli(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function validateMerchants(données: unknown): Merchant[] {
  if (!Array.isArray(données)) {
    throw new Error("data/marchands.json doit contenir une liste.");
  }

  const problèmes: string[] = [];
  const slugsVus = new Map<string, number>();

  données.forEach((brut, i) => {
    const m = brut as Partial<Merchant>;
    const où = estRempli(m.nom) ? `« ${m.nom} »` : `fiche n°${i + 1}`;
    const dire = (quoi: string) => problèmes.push(`${où} : ${quoi}`);

    if (!estRempli(m.slug)) dire("slug manquant");
    else if (!/^[a-z0-9-]+$/.test(m.slug))
      dire(`slug « ${m.slug} » : minuscules, chiffres et tirets uniquement`);
    else if (slugsVus.has(m.slug))
      dire(`slug « ${m.slug} » déjà utilisé par la fiche n°${slugsVus.get(m.slug)}`);
    else slugsVus.set(m.slug, i + 1);

    for (const champ of ["nom", "adresse", "horaires", "description", "image_url"] as const) {
      if (!estRempli(m[champ])) dire(`${champ} vide ou absent`);
    }

    if (!ALL_CATEGORIES.includes(m.categorie as MerchantCategory)) {
      dire(
        `catégorie « ${m.categorie} » inconnue — choisir parmi ${ALL_CATEGORIES.join(", ")}`
      );
    }

    if (!Array.isArray(m.piliers) || m.piliers.length === 0) {
      dire("piliers manquants");
    } else {
      const inconnus = m.piliers.filter((p) => !PILIERS.includes(p));
      if (inconnus.length > 0) {
        dire(
          `pilier(s) « ${inconnus.join(", ")} » inconnu(s) — choisir parmi ${PILIERS.join(", ")}`
        );
      }
    }

    if (!Array.isArray(m.produits) || m.produits.length === 0) {
      dire("aucun produit listé");
    }

    if (typeof m.lat !== "number" || typeof m.lon !== "number" ||
        !Number.isFinite(m.lat) || !Number.isFinite(m.lon)) {
      dire("lat / lon manquantes ou non numériques");
    } else if (
      m.lat < FRANCE.latMin || m.lat > FRANCE.latMax ||
      m.lon < FRANCE.lonMin || m.lon > FRANCE.lonMax
    ) {
      dire(
        `coordonnées hors de France (lat ${m.lat}, lon ${m.lon}) — ` +
          "la Base Adresse Nationale renvoie [lon, lat], vérifier l'ordre"
      );
    }
  });

  if (problèmes.length > 0) {
    throw new Error(
      `data/marchands.json : ${problèmes.length} problème(s) à corriger avant publication.\n` +
        problèmes.map((p) => `  - ${p}`).join("\n")
    );
  }

  return données as Merchant[];
}
