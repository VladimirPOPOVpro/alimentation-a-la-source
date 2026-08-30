"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  MapPoint,
  MapCluster,
  MerchantListEntry,
} from "./spatialIndex";
import type { MerchantCategory } from "./types";
import { ALL_CATEGORIES } from "./categories";

/**
 * Chargement des marchands selon la vue courante de la carte.
 *
 * C'est la moitié cliente de l'architecture « exploration libre » : le serveur
 * (lib/spatialIndex.ts) borne la réponse à la taille de l'écran, ce hook borne
 * le nombre d'allers-retours. Ensemble, le site reste utilisable que la base
 * contienne 40 marchands ou 40 000.
 *
 * Trois précautions, chacune contre un défaut observé sur une carte comparable
 * (PinDeal) :
 *
 *  1. ZONE ÉLARGIE EN CACHE. On demande une zone 60 % plus large que l'écran et
 *     on retient ses limites. Tant que la vue reste dedans et que le zoom n'a
 *     pas changé de palier, aucune requête n'est émise : faire glisser la carte
 *     de deux centimètres ne déclenche rien.
 *
 *  2. ANNULATION. Un déplacement rapide enchaîne les vues ; sans annulation, la
 *     réponse d'une vue abandonnée peut arriver après celle de la vue actuelle
 *     et repeindre la carte avec des points d'ailleurs. On annule la requête
 *     précédente et on ignore toute réponse qui n'est pas la dernière demandée.
 *
 *  3. LE VIDE EST UNE RÉPONSE. Une zone sans marchand doit effacer les points,
 *     pas laisser ceux d'avant. C'est l'erreur classique du `if (res.length)`
 *     avant de mettre à jour l'état : la carte ment alors sur des régions
 *     entières.
 */

export interface Viewport {
  west: number;
  south: number;
  east: number;
  north: number;
  zoom: number;
}

export interface ViewportData {
  points: MapPoint[];
  clusters: MapCluster[];
  /** Marchands dans la vue, groupés ou non. */
  total: number;
  /** La vue contenait plus de points isolés que la limite serveur. */
  tronque: boolean;
  chargement: boolean;
  erreur: string | null;
}

const VIDE: ViewportData = {
  points: [],
  clusters: [],
  total: 0,
  tronque: false,
  chargement: false,
  erreur: null,
};

/** Marge demandée autour de l'écran, en fraction de sa largeur/hauteur. */
const MARGE = 0.6;
/** Attente après le dernier mouvement avant d'interroger le serveur. */
const REPOS_MS = 220;

type Bounds = { west: number; south: number; east: number; north: number };

function elargir(v: Viewport): Bounds {
  const dx = (v.east - v.west) * MARGE;
  const dy = (v.north - v.south) * MARGE;
  return {
    west: Math.max(-180, v.west - dx),
    east: Math.min(180, v.east + dx),
    south: Math.max(-85, v.south - dy),
    north: Math.min(85, v.north + dy),
  };
}

function contient(zone: Bounds, v: Viewport): boolean {
  return (
    zone.west <= v.west &&
    zone.east >= v.east &&
    zone.south <= v.south &&
    zone.north >= v.north
  );
}

/**
 * Le zoom envoyé au serveur est arrondi : c'est lui qui décide du regroupement,
 * donc deux vues au même palier partagent la même réponse. Sans arrondi, un
 * zoom continu (trackpad) relancerait une requête à chaque image.
 */
function palier(zoom: number): number {
  return Math.round(zoom);
}

function clefCategories(cats: Set<MerchantCategory>): string | null {
  // Tout coché revient à ne pas filtrer : on garde l'index principal côté
  // serveur plutôt que d'en faire construire un identique.
  if (cats.size === 0 || cats.size === ALL_CATEGORIES.length) return null;
  return [...cats].sort().join(",");
}

export function useViewportMerchants(
  viewport: Viewport | null,
  filtres: { categories: Set<MerchantCategory>; query: string }
): ViewportData {
  const [data, setData] = useState<ViewportData>(VIDE);

  const cats = clefCategories(filtres.categories);
  const query = filtres.query.trim();

  // Ce que couvre la réponse actuellement affichée. Remis à zéro dès qu'un
  // filtre change : la même zone ne contient plus la même chose.
  const couverture = useRef<{ zone: Bounds; palier: number } | null>(null);
  const enCours = useRef<AbortController | null>(null);
  const dernier = useRef(0);

  useEffect(() => {
    couverture.current = null;
  }, [cats, query]);

  const charger = useCallback(
    async (v: Viewport) => {
      const zone = elargir(v);
      const z = palier(v.zoom);

      const params = new URLSearchParams({
        bbox: `${zone.west.toFixed(4)},${zone.south.toFixed(4)},${zone.east.toFixed(4)},${zone.north.toFixed(4)}`,
        zoom: String(z),
      });
      if (cats) params.set("cats", cats);
      if (query) params.set("q", query);

      enCours.current?.abort();
      const ctrl = new AbortController();
      enCours.current = ctrl;
      const numero = ++dernier.current;

      setData((prev) => ({ ...prev, chargement: true, erreur: null }));

      try {
        const res = await fetch(`/api/marchands?${params}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`Réponse ${res.status}`);
        const json = await res.json();
        if (numero !== dernier.current) return; // une vue plus récente a gagné

        couverture.current = { zone, palier: z };
        // Y compris quand c'est vide : une zone sans marchand doit vider la
        // carte, sinon elle affiche encore les points de la zone précédente.
        setData({
          points: json.points ?? [],
          clusters: json.clusters ?? [],
          total: json.total ?? 0,
          tronque: Boolean(json.tronque),
          chargement: false,
          erreur: null,
        });
      } catch (e) {
        if (ctrl.signal.aborted || numero !== dernier.current) return;
        // On garde les points affichés : une coupure réseau passagère ne
        // justifie pas de vider la carte sous les yeux du visiteur. Le message
        // dit ce qui se passe, et le prochain mouvement retentera.
        couverture.current = null;
        setData((prev) => ({
          ...prev,
          chargement: false,
          erreur:
            e instanceof Error ? e.message : "Chargement de la zone impossible.",
        }));
      }
    },
    [cats, query]
  );

  useEffect(() => {
    if (!viewport) return;

    const couvert = couverture.current;
    if (
      couvert &&
      couvert.palier === palier(viewport.zoom) &&
      contient(couvert.zone, viewport)
    ) {
      return; // déjà en main : aucun aller-retour
    }

    const t = setTimeout(() => charger(viewport), REPOS_MS);
    return () => clearTimeout(t);
  }, [viewport, charger]);

  useEffect(() => () => enCours.current?.abort(), []);

  return data;
}

/**
 * Recherche sur toute la France, indépendante de la vue.
 *
 * Sert de rattrapage : quand un mot-clé ne donne rien là où on regarde, la
 * bonne réponse n'est pas « aucun résultat » mais « pas ici, mais là ». Sans
 * ça, l'exploration libre serait une régression par rapport à la version où
 * tout le fichier était chargé d'avance.
 */
export function useRechercheNationale(
  query: string,
  near: { lat: number; lon: number },
  actif: boolean
): { resultats: Array<MapPoint & { d: number }>; chargement: boolean } {
  const [etat, setEtat] = useState<{
    pour: string;
    resultats: Array<MapPoint & { d: number }>;
  }>({ pour: "", resultats: [] });
  const q = query.trim();
  const demande = actif && q.length >= 2 ? q : "";

  useEffect(() => {
    if (!demande) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      const params = new URLSearchParams({
        q: demande,
        lat: String(near.lat),
        lon: String(near.lon),
        limit: "8",
      });
      fetch(`/api/marchands?${params}`, { signal: ctrl.signal })
        .then((r) =>
          r.ok ? r.json() : Promise.reject(new Error(String(r.status)))
        )
        .then((json) =>
          setEtat({ pour: demande, resultats: json.resultats ?? [] })
        )
        .catch(() => {
          if (!ctrl.signal.aborted) setEtat({ pour: demande, resultats: [] });
        });
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [demande, near.lat, near.lon]);

  // Ce que l'état contient ne vaut que pour le terme qui l'a produit : le
  // comparer ici évite d'afficher les résultats du mot précédent, et évite
  // surtout de vider l'état depuis l'effet (interdit sous React Compiler).
  const aJour = etat.pour === demande;
  return {
    resultats: demande && aJour ? etat.resultats : [],
    chargement: Boolean(demande) && !aJour,
  };
}

/**
 * Les marchands d'un rayon autour du point de référence (mode « autour de moi »).
 *
 * Même discipline que la vue : on demande un rayon un peu plus large que celui
 * affiché et on garde le résultat. Faire glisser le curseur de 15 à 18 km ne
 * déclenche donc rien — c'est important, un curseur émet des dizaines
 * d'événements par seconde.
 *
 * Ni les catégories ni le mot-clé ne sont envoyés : ils se recalculent
 * instantanément sur la liste déjà en main, alors qu'un aller-retour par touche
 * frappée serait à la fois lent et inutile.
 */
export function useProches(
  center: { lat: number; lon: number },
  radiusKm: number,
  maxRadiusKm: number
): {
  resultats: MerchantListEntry[] | null;
  tronque: boolean;
  chargement: boolean;
  erreur: string | null;
} {
  const [etat, setEtat] = useState<{
    clef: string;
    resultats: MerchantListEntry[];
    tronque: boolean;
  } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  // Point de référence pour lequel on a déjà élargi la recherche au maximum.
  const [elargi, setElargi] = useState<string | null>(null);

  const clef = `${center.lat.toFixed(4)},${center.lon.toFixed(4)}`;

  // Ce que la liste doit au minimum couvrir. Normalement le rayon affiché ;
  // le maximum une fois qu'une réponse vide a montré qu'il n'y a rien près
  // d'ici — c'est ce qui permet de dire « le plus proche est à 42 km » plutôt
  // que « rien ici », et donc de proposer d'élargir.
  const besoin = elargi === clef ? maxRadiusKm : radiusKm;

  // Le rayon demandé au serveur avance par paliers de 10 km : sans ça, chaque
  // pixel du curseur serait une requête.
  const demande = Math.min(
    maxRadiusKm,
    Math.max(besoin, Math.ceil((radiusKm * 1.5) / 10) * 10)
  );

  // Ce qu'on a en main couvre-t-il ce qu'on affiche ?
  const couvre =
    etat !== null &&
    etat.clef.startsWith(`${clef}@`) &&
    Number(etat.clef.split("@")[1]) >= besoin;

  useEffect(() => {
    if (couvre) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      const params = new URLSearchParams({
        lat: String(center.lat),
        lon: String(center.lon),
        radius: String(demande),
        liste: "1",
        limit: "400",
      });
      setChargement(true);
      fetch(`/api/marchands?${params}`, { signal: ctrl.signal })
        .then((r) =>
          r.ok ? r.json() : Promise.reject(new Error(`Réponse ${r.status}`))
        )
        .then((json) => {
          const resultats: MerchantListEntry[] = json.resultats ?? [];
          setEtat({
            clef: `${clef}@${demande}`,
            resultats,
            tronque: Boolean(json.tronque),
          });
          setErreur(null);
          setChargement(false);
          if (resultats.length === 0 && demande < maxRadiusKm) {
            setElargi(clef);
          }
        })
        .catch((e) => {
          if (ctrl.signal.aborted) return;
          setErreur(e instanceof Error ? e.message : "Chargement impossible.");
          setChargement(false);
        });
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [couvre, clef, demande, maxRadiusKm, center.lat, center.lon]);

  return {
    resultats: etat && etat.clef.startsWith(`${clef}@`) ? etat.resultats : null,
    tronque: etat?.tronque ?? false,
    chargement,
    erreur,
  };
}
