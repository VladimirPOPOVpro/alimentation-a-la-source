import { NextResponse } from "next/server";
import {
  queryViewport,
  searchEverywhere,
  nearest,
  nearestList,
  totalMerchants,
  type Bbox,
} from "@/lib/spatialIndex";
import { ALL_CATEGORIES } from "@/lib/categories";
import type { MerchantCategory } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Points de la carte.
 *
 * Trois modes, choisis d'après les paramètres :
 *
 *   ?bbox=o,s,e,n&zoom=11        vue courante (mode exploration)
 *   ?q=huile&lat=..&lon=..       recherche sur toute la France
 *   ?lat=..&lon=..&radius=15     les plus proches d'un point (mode rayon)
 *
 * Paramètre commun facultatif : &cats=ferme,marche
 *
 * La réponse est bornée par la vue, pas par la taille de la base : c'est ce
 * qui permet au site de tenir quand l'agent aura rempli la France.
 */
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;

  const catsRaw = p.get("cats");
  let categories: Set<MerchantCategory> | null = null;
  if (catsRaw) {
    const wanted = catsRaw
      .split(",")
      .map((c) => c.trim())
      .filter((c): c is MerchantCategory =>
        (ALL_CATEGORIES as string[]).includes(c)
      );
    // Toutes les catégories cochées revient à ne pas filtrer : on garde
    // l'index principal plutôt que d'en construire un identique.
    if (wanted.length > 0 && wanted.length < ALL_CATEGORIES.length) {
      categories = new Set(wanted);
    }
  }

  const query = p.get("q")?.trim() || null;
  const num = (k: string): number | null => {
    const v = p.get(k);
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // On met en cache côté CDN : les données ne changent qu'au déploiement, donc
  // deux visiteurs qui regardent la même zone peuvent partager la réponse.
  const headers = {
    "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
  };

  const bboxRaw = p.get("bbox");
  if (bboxRaw) {
    const parts = bboxRaw.split(",").map(Number);
    if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
      return NextResponse.json({ erreur: "bbox invalide." }, { status: 400 });
    }
    const [w, s, e, n] = parts as Bbox;
    if (w >= e || s >= n) {
      return NextResponse.json(
        { erreur: "bbox incohérente (attendu ouest,sud,est,nord)." },
        { status: 400 }
      );
    }
    const zoom = num("zoom") ?? 11;
    const limit = Math.min(Math.max(num("limit") ?? 400, 1), 800);
    const result = queryViewport([w, s, e, n], zoom, {
      categories,
      query,
      limit,
    });
    return NextResponse.json({ mode: "viewport", ...result }, { headers });
  }

  const lat = num("lat");
  const lon = num("lon");
  if (lat === null || lon === null) {
    return NextResponse.json(
      { erreur: "Paramètres attendus : bbox+zoom, ou lat+lon." },
      { status: 400 }
    );
  }

  if (query) {
    const limit = Math.min(Math.max(num("limit") ?? 50, 1), 200);
    return NextResponse.json(
      {
        mode: "recherche",
        resultats: searchEverywhere(query, { lat, lon }, limit),
        base: totalMerchants(),
      },
      { headers }
    );
  }

  const radius = num("radius");
  const limit = Math.min(Math.max(num("limit") ?? 200, 1), 500);

  // `liste=1` : la barre latérale du mode rayon, qui a besoin de la description
  // et des horaires en plus des coordonnées. Sans ce drapeau, on renvoie la
  // version courte, suffisante pour poser des points sur la carte.
  if (p.get("liste") === "1" && radius !== null) {
    const { resultats, tronque } = nearestList({ lat, lon }, { radiusKm: radius, limit });
    return NextResponse.json(
      { mode: "proches", resultats, tronque, base: totalMerchants() },
      { headers }
    );
  }

  return NextResponse.json(
    {
      mode: "proches",
      resultats: nearest(
        { lat, lon },
        { radiusKm: radius ?? undefined, categories, limit }
      ),
      base: totalMerchants(),
    },
    { headers }
  );
}
