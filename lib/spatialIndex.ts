import Supercluster from "supercluster";
import { merchants } from "./merchants";
import type { Merchant, MerchantCategory } from "./types";
import { normalize } from "./search";
import { CATEGORY_LABELS } from "./categories";

/**
 * Index géographique des marchands, côté serveur.
 *
 * Pourquoi ici plutôt qu'en base : `data/marchands.json` reste la source de
 * vérité (versionnée, relisible en diff, éditée par l'agent de modération).
 * L'index est reconstruit au démarrage du process, donc à chaque déploiement,
 * ce qui suffit puisque les données ne changent qu'au déploiement.
 *
 * Ce que ça garantit : la réponse envoyée au navigateur est bornée par la
 * TAILLE DE L'ÉCRAN, jamais par la taille de la base. 40 marchands ou 40 000,
 * une vue de carte renvoie au plus quelques centaines d'objets.
 */

/** Ce que la carte a besoin de connaître pour dessiner un point et sa bulle.
 *  Noms courts : à quelques milliers de points, les clés JSON pèsent autant
 *  que les valeurs. */
export interface MapPoint {
  s: string; // slug
  n: string; // nom
  y: number; // lat
  x: number; // lon
  c: MerchantCategory;
  i: string; // image_url
}

export interface MapCluster {
  id: number;
  y: number;
  x: number;
  count: number;
  /** Zoom à partir duquel ce groupe se sépare : permet un clic « zoomer ici ». */
  expansionZoom: number;
}

function toPoint(m: Merchant): MapPoint {
  return {
    s: m.slug,
    n: m.nom,
    // 5 décimales ≈ 1 m de précision : au-delà on transporte du bruit.
    y: Math.round(m.lat * 1e5) / 1e5,
    x: Math.round(m.lon * 1e5) / 1e5,
    c: m.categorie,
    i: m.image_url,
  };
}

type Feature = GeoJSON.Feature<GeoJSON.Point, MapPoint>;

function toFeature(m: Merchant): Feature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [m.lon, m.lat] },
    properties: toPoint(m),
  };
}

/** Texte indexé pour la recherche : mêmes champs que la recherche client. */
function haystack(m: Merchant): string {
  return normalize(
    [
      m.nom,
      CATEGORY_LABELS[m.categorie],
      m.produits.join(" "),
      m.description,
      m.adresse,
    ].join(" ")
  );
}

const haystacks = new Map<string, string>(
  merchants.map((m) => [m.slug, haystack(m)])
);

export function matchesText(slug: string, query: string): boolean {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const text = haystacks.get(slug) ?? "";
  return terms.every((t) => text.includes(t));
}

function buildIndex(subset: Merchant[]): Supercluster<MapPoint> {
  const index = new Supercluster<MapPoint>({
    radius: 70,
    maxZoom: 15, // au-delà, on montre les points individuels
    minPoints: 3,
  });
  index.load(subset.map(toFeature));
  return index;
}

/**
 * Un index par combinaison de filtres, construit à la demande et gardé en
 * cache. Construire un index sur l'ensemble coûte quelques millisecondes ; le
 * refaire à chaque requête serait du gaspillage, mais en garder un par
 * combinaison possible (2^6 pour les catégories) serait absurde. Un petit LRU
 * couvre les combinaisons réellement utilisées.
 */
const MAX_INDEXES = 12;
const indexes = new Map<string, Supercluster<MapPoint>>();

function getIndex(categories: Set<MerchantCategory> | null): Supercluster<MapPoint> {
  const key = categories ? [...categories].sort().join(",") : "*";
  const cached = indexes.get(key);
  if (cached) {
    // Rafraîchit la position LRU.
    indexes.delete(key);
    indexes.set(key, cached);
    return cached;
  }
  const subset = categories
    ? merchants.filter((m) => categories.has(m.categorie))
    : merchants;
  const index = buildIndex(subset);
  indexes.set(key, index);
  if (indexes.size > MAX_INDEXES) {
    const oldest = indexes.keys().next().value;
    if (oldest !== undefined) indexes.delete(oldest);
  }
  return index;
}

export interface ViewportResult {
  points: MapPoint[];
  clusters: MapCluster[];
  /** Nombre total de marchands dans la vue, groupés ou non. */
  total: number;
  /** Vrai si la vue contenait plus de points que la limite et a été écrêtée. */
  tronque: boolean;
}

export type Bbox = [number, number, number, number]; // ouest, sud, est, nord

/**
 * Ce que contient la vue courante.
 *
 * `limit` borne le nombre de points individuels renvoyés : au-delà, mieux vaut
 * dézoomer ou laisser le clustering faire son travail. Le navigateur crée
 * 6 nœuds DOM et une requête image par marqueur, donc quelques centaines est
 * déjà le plafond confortable.
 */
export function queryViewport(
  bbox: Bbox,
  zoom: number,
  options: {
    categories?: Set<MerchantCategory> | null;
    query?: string | null;
    limit?: number;
  } = {}
): ViewportResult {
  const { categories = null, query = null, limit = 400 } = options;
  const z = Math.max(0, Math.min(20, Math.round(zoom)));

  // Une recherche ne se groupe pas.
  //
  // Si on groupait d'abord et filtrait ensuite, un marchand correspondant au
  // mot-clé pourrait se retrouver avalé dans une bulle « 12 » qui, elle, n'est
  // pas filtrée : le visiteur verrait un gros cercle et aucun résultat, alors
  // que ce qu'il cherche est dessous. Et le compte annoncé (12) ne dirait rien
  // de sa recherche. Un ensemble filtré est petit par nature : on le renvoie
  // point par point, et les nombres affichés décrivent alors la recherche.
  if (query && query.trim()) {
    const [w, s, e, n] = bbox;
    const trouves: MapPoint[] = [];
    for (const m of merchants) {
      if (categories && !categories.has(m.categorie)) continue;
      if (m.lon < w || m.lon > e || m.lat < s || m.lat > n) continue;
      if (!matchesText(m.slug, query)) continue;
      trouves.push(toPoint(m));
    }
    const coupe = trouves.length > limit;
    return {
      points: coupe ? trouves.slice(0, limit) : trouves,
      clusters: [],
      total: trouves.length,
      tronque: coupe,
    };
  }

  const raw = getIndex(categories).getClusters(bbox, z);

  const points: MapPoint[] = [];
  const clusters: MapCluster[] = [];
  let total = 0;

  for (const f of raw) {
    const props = f.properties as
      | (MapPoint & { cluster?: false })
      | { cluster: true; cluster_id: number; point_count: number };
    const [x, y] = f.geometry.coordinates as [number, number];

    if ("cluster" in props && props.cluster) {
      total += props.point_count;
      clusters.push({
        id: props.cluster_id,
        y,
        x,
        count: props.point_count,
        expansionZoom: Math.min(
          getIndex(categories).getClusterExpansionZoom(props.cluster_id),
          18
        ),
      });
    } else {
      total += 1;
      points.push(props as MapPoint);
    }
  }

  const tronque = points.length > limit;
  return {
    points: tronque ? points.slice(0, limit) : points,
    clusters,
    total,
    tronque,
  };
}

/**
 * Recherche sur l'ensemble du pays, indépendamment de la vue.
 *
 * Sans ça, chercher « huile d'olive » ne trouverait que ce qui est déjà à
 * l'écran, ce qui serait une régression par rapport à la version où tout était
 * chargé d'avance. Les résultats sont classés par distance au point de
 * référence et bornés.
 */
export function searchEverywhere(
  query: string,
  near: { lat: number; lon: number },
  limit = 50
): Array<MapPoint & { d: number }> {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const out: Array<MapPoint & { d: number }> = [];
  for (const m of merchants) {
    if (!matchesText(m.slug, query)) continue;
    const dLat = (m.lat - near.lat) * 111;
    const dLon = (m.lon - near.lon) * 111 * Math.cos((near.lat * Math.PI) / 180);
    out.push({ ...toPoint(m), d: Math.round(Math.hypot(dLat, dLon) * 10) / 10 });
  }
  out.sort((a, b) => a.d - b.d);
  return out.slice(0, limit);
}

/** Les N marchands les plus proches d'un point, quel que soit le zoom.
 *  Sert au mode « autour de moi » et à la liste latérale. */
export function nearest(
  near: { lat: number; lon: number },
  options: {
    radiusKm?: number;
    categories?: Set<MerchantCategory> | null;
    query?: string | null;
    limit?: number;
  } = {}
): Array<MapPoint & { d: number }> {
  const { radiusKm = Infinity, categories = null, query = null, limit = 200 } = options;
  const out: Array<MapPoint & { d: number }> = [];

  for (const m of merchants) {
    if (categories && !categories.has(m.categorie)) continue;
    if (query && !matchesText(m.slug, query)) continue;
    const dLat = (m.lat - near.lat) * 111;
    const dLon = (m.lon - near.lon) * 111 * Math.cos((near.lat * Math.PI) / 180);
    const d = Math.hypot(dLat, dLon);
    if (d <= radiusKm) {
      out.push({ ...toPoint(m), d: Math.round(d * 10) / 10 });
    }
  }
  out.sort((a, b) => a.d - b.d);
  return out.slice(0, limit);
}

export function totalMerchants(): number {
  return merchants.length;
}

/**
 * Ce dont la liste latérale a besoin, et rien de plus.
 *
 * Le fichier complet pèse environ 900 octets par marchand ; à l'échelle de la
 * France entière, l'envoyer en entier au navigateur reviendrait à des dizaines
 * de mégaoctets. Téléphone, site, adresse, produits et liens ne servent que sur
 * la fiche, qui est rendue par le serveur : ils n'ont pas à voyager ici.
 */
export interface MerchantListEntry {
  slug: string;
  nom: string;
  categorie: MerchantCategory;
  piliers: Merchant["piliers"];
  lat: number;
  lon: number;
  image_url: string;
  description: string;
  horaires: string;
  /** Indexés par la recherche : « huile d'olive » doit trouver le moulin même
   *  si ces mots ne sont pas dans son nom. */
  produits: string[];
  adresse: string;
  distanceKm: number;
}

/** La description est déjà coupée à deux lignes à l'écran : la transporter en
 *  entier ne changerait rien de visible. */
const DESCRIPTION_MAX = 170;

function toListEntry(m: Merchant, d: number): MerchantListEntry {
  return {
    slug: m.slug,
    nom: m.nom,
    categorie: m.categorie,
    piliers: m.piliers,
    lat: m.lat,
    lon: m.lon,
    image_url: m.image_url,
    description:
      m.description.length > DESCRIPTION_MAX
        ? m.description.slice(0, DESCRIPTION_MAX - 1).trimEnd() + "…"
        : m.description,
    horaires: m.horaires,
    produits: m.produits,
    adresse: m.adresse,
    distanceKm: Math.round(d * 10) / 10,
  };
}

/**
 * Les marchands d'un rayon, du plus proche au plus lointain, avec de quoi
 * remplir la liste.
 *
 * Écrêté à `limit` : au-delà, ce sont les plus proches qui sont gardés, ce qui
 * est le bon comportement pour une liste triée par distance. L'appelant sait
 * que la coupe a eu lieu et peut le dire.
 */
export function nearestList(
  near: { lat: number; lon: number },
  options: { radiusKm: number; limit?: number } = { radiusKm: 25 }
): { resultats: MerchantListEntry[]; tronque: boolean } {
  const { radiusKm, limit = 400 } = options;
  const out: Array<{ m: Merchant; d: number }> = [];

  for (const m of merchants) {
    const dLat = (m.lat - near.lat) * 111;
    const dLon = (m.lon - near.lon) * 111 * Math.cos((near.lat * Math.PI) / 180);
    const d = Math.hypot(dLat, dLon);
    if (d <= radiusKm) out.push({ m, d });
  }
  out.sort((a, b) => a.d - b.d);

  const tronque = out.length > limit;
  return {
    resultats: (tronque ? out.slice(0, limit) : out).map(({ m, d }) =>
      toListEntry(m, d)
    ),
    tronque,
  };
}
