"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Loader2, Search, X } from "lucide-react";
import type { MerchantCategory } from "@/lib/types";
import { ALL_CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/categories";
import { distanceKm, formatDistance } from "@/lib/geo";
import { useCenter, hydrateCenter } from "@/lib/centerStore";
import {
  useViewportMerchants,
  useRechercheNationale,
  type Viewport,
} from "@/lib/useViewportMerchants";
import CategoryFilter from "./CategoryFilter";
import LocationPicker from "../LocationPicker";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-brand-green-light/40">
      <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
    </div>
  ),
});

const QUICK_SEARCHES = ["Huile d'olive", "Miel", "Poisson", "Vin", "Légumes"];

/**
 * La carte et son panneau latéral.
 *
 * Un seul mode : on explore librement. La carte charge ce qui est à l'écran,
 * regroupe ce qui est trop dense, et la liste décrit ce que la vue contient.
 * Le point de référence (hôpital, adresse ou position) ne borne plus rien :
 * il sert à mesurer les distances et à recentrer la carte quand on le change.
 */
export default function CarteExplorer() {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lon: number; n: number }>();
  const [activeCategories, setActiveCategories] = useState<
    Set<MerchantCategory>
  >(new Set(ALL_CATEGORIES));
  const listeRef = useRef<HTMLDivElement>(null);
  const rechercheRef = useRef<HTMLInputElement>(null);

  const center = useCenter();
  useEffect(hydrateCenter, []);

  const toggleCategory = (category: MerchantCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      // Never allow an empty selection: an empty filter reads as "show
      // nothing", which is confusing next to a map that's supposed to
      // help you find something. Re-select everything instead.
      return next.size === 0 ? new Set(ALL_CATEGORIES) : next;
    });
  };

  const vue = useViewportMerchants(viewport, {
    categories: activeCategories,
    query,
  });

  // Classés par distance au point de référence : c'est l'ordre qu'on attend
  // d'une liste de commerces.
  const vuePoints = useMemo(
    () =>
      vue.points
        .map((p) => ({
          ...p,
          d: distanceKm(center.lat, center.lon, p.y, p.x),
        }))
        .sort((a, b) => a.d - b.d),
    [vue.points, center.lat, center.lon]
  );

  const groupes = vue.clusters.reduce((n, c) => n + c.count, 0);

  // Rattrapage : un mot-clé sans résultat dans la vue en a peut-être ailleurs.
  const ailleurs = useRechercheNationale(
    query,
    center,
    !vue.chargement && vue.total === 0
  );

  const allerVers = (lat: number, lon: number) =>
    setFocus((f) => ({ lat, lon, n: (f?.n ?? 0) + 1 }));

  // Sur téléphone, la liste est sous le clavier : valider la recherche ferme
  // le clavier et amène les résultats à l'écran. Sur grand écran la liste est
  // déjà visible, on ne bouge rien.
  const validerRecherche = (e: React.FormEvent) => {
    e.preventDefault();
    rechercheRef.current?.blur();
    if (window.innerWidth < 1024) {
      listeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 lg:flex-row lg:gap-6 lg:p-6">
      <div className="order-1 h-[62dvh] min-h-[360px] w-full overflow-hidden rounded-xl border border-brand-green-light shadow-sm lg:order-2 lg:h-auto lg:flex-1">
        <MapView
          points={vue.points}
          clusters={vue.clusters}
          onViewport={setViewport}
          focus={focus}
          center={center}
          selectedSlug={hoveredSlug ?? undefined}
        />
      </div>

      <aside className="order-2 flex w-full flex-col gap-3 lg:order-1 lg:w-[380px] lg:shrink-0">
        {/* Deux champs qui se ressemblaient trop : sur téléphone, le premier
            sous la carte était celui de l'adresse, et les visiteurs y tapaient
            un produit sans rien obtenir. Chacun porte désormais sa question. */}
        <form role="search" onSubmit={validerRecherche}>
          <label
            htmlFor="recherche-marchands"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/50"
          >
            Que cherchez-vous ?
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
              aria-hidden="true"
            />
            <input
              id="recherche-marchands"
              ref={rechercheRef}
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Un produit ou un marchand : miel, huile d'olive…"
              className="w-full rounded-xl border border-brand-green-light bg-white py-2.5 pl-9 pr-9 text-sm outline-none placeholder:text-foreground/40 focus:border-brand-green"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-foreground/40 hover:bg-brand-green-light hover:text-brand-green-dark"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
            {QUICK_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(query === term ? "" : term)}
                aria-pressed={query === term}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
                  query === term
                    ? "border-brand-green bg-brand-green text-white"
                    : "border-brand-green-light bg-white text-foreground/70 hover:border-brand-green"
                }`}
              >
                {term}
              </button>
            ))}
          </div>
        </form>

        <LocationPicker />

        <CategoryFilter active={activeCategories} onToggle={toggleCategory} />

        <div ref={listeRef} className="flex scroll-mt-3 flex-col gap-3">
          <ExplorationListe
            points={vuePoints}
            groupes={groupes}
            total={vue.total}
            tronque={vue.tronque}
            chargement={vue.chargement}
            erreur={vue.erreur}
            query={query}
            centerLabel={center.label}
            ailleurs={ailleurs.resultats}
            ailleursChargement={ailleurs.chargement}
            onAller={allerVers}
            hoveredSlug={hoveredSlug}
            onHover={setHoveredSlug}
          />
        </div>
      </aside>
    </div>
  );
}

/**
 * La liste de ce que la carte montre.
 *
 * Elle ne décrit que ce qui est à l'écran, et doit le dire : « 12 ici » n'a de
 * sens que si le visiteur comprend que déplacer la carte change le chiffre.
 * Quand des marchands sont regroupés, on l'annonce plutôt que de les taire.
 */
function ExplorationListe({
  points,
  groupes,
  total,
  tronque,
  chargement,
  erreur,
  query,
  centerLabel,
  ailleurs,
  ailleursChargement,
  onAller,
  hoveredSlug,
  onHover,
}: {
  points: Array<{
    s: string;
    n: string;
    y: number;
    x: number;
    c: MerchantCategory;
    i: string;
    d: number;
  }>;
  groupes: number;
  total: number;
  tronque: boolean;
  chargement: boolean;
  erreur: string | null;
  query: string;
  centerLabel: string;
  ailleurs: Array<{
    s: string;
    n: string;
    y: number;
    x: number;
    c: MerchantCategory;
    d: number;
  }>;
  ailleursChargement: boolean;
  onAller: (lat: number, lon: number) => void;
  hoveredSlug: string | null;
  onHover: (slug: string | null) => void;
}) {
  return (
    <>
      <p className="flex items-center gap-1.5 text-xs text-foreground/60 lg:text-sm">
        {chargement && (
          <Loader2
            className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-green"
            aria-hidden="true"
          />
        )}
        <span>
          {/* « zone » et non « vue » : on charge un peu plus large que l'écran
              pour qu'un petit déplacement ne relance rien, donc le compte
              couvre aussi les abords immédiats. */}
          {total}{" "}
          {query.trim()
            ? `résultat${total > 1 ? "s" : ""}`
            : `marchand${total > 1 ? "s" : ""}`}{" "}
          dans cette zone
          {groupes > 0 && (
            <>
              , dont {groupes} regroupé{groupes > 1 ? "s" : ""} — zoomez ou
              cliquez sur un cercle vert
            </>
          )}
          . Déplacez la carte pour en voir d&apos;autres.
        </span>
      </p>

      {tronque && (
        <p className="rounded-lg bg-brand-green-light/50 px-3 py-2 text-xs text-brand-green-dark">
          Cette vue en contient trop pour tous les afficher. Zoomez pour les
          voir un par un.
        </p>
      )}

      {erreur && (
        <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Zone non chargée ({erreur}). Déplacez la carte pour réessayer.
        </p>
      )}

      <ul className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto pr-1 lg:max-h-[calc(100vh-320px)]">
        {points.map((p) => (
          <li
            key={p.s}
            onMouseEnter={() => onHover(p.s)}
            onMouseLeave={() => onHover(null)}
            className={`rounded-xl border p-3 transition-colors ${
              hoveredSlug === p.s
                ? "border-brand-green bg-brand-green-light/60"
                : "border-transparent bg-white hover:border-brand-green-light"
            }`}
          >
            <Link
              href={`/marchand/${p.s}`}
              className="flex items-center gap-3"
            >
              <span
                className="h-11 w-11 shrink-0 rounded-lg bg-brand-green-light bg-cover bg-center"
                style={{ backgroundImage: `url('${p.i}')` }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span
                  className="mb-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                  style={{ backgroundColor: CATEGORY_COLORS[p.c] }}
                >
                  {CATEGORY_LABELS[p.c]}
                </span>
                <span className="block truncate font-semibold text-foreground">
                  {p.n}
                </span>
              </span>
              <span className="shrink-0 text-xs font-medium text-brand-green-dark">
                {formatDistance(p.d)}
              </span>
            </Link>
          </li>
        ))}

        {total === 0 && !chargement && !erreur && (
          <li className="rounded-xl border border-dashed border-brand-green-light p-4 text-center text-sm text-foreground/50">
            {query.trim() ? (
              ailleursChargement ? (
                <>Recherche dans toute la France…</>
              ) : ailleurs.length > 0 ? (
                <>
                  Rien pour « {query.trim()} » dans cette vue. Ailleurs, le plus
                  proche de <span className="font-medium">{centerLabel}</span> :
                  <span className="mt-2 flex flex-col gap-1 text-left">
                    {ailleurs.slice(0, 5).map((r) => (
                      <button
                        key={r.s}
                        type="button"
                        onClick={() => onAller(r.y, r.x)}
                        className="flex items-baseline justify-between gap-2 rounded-lg px-2 py-1 text-left hover:bg-brand-green-light/60"
                      >
                        <span className="truncate font-medium text-foreground/80">
                          {r.n}
                        </span>
                        <span className="shrink-0 text-xs text-brand-green-dark">
                          {formatDistance(r.d)}
                        </span>
                      </button>
                    ))}
                  </span>
                </>
              ) : (
                <>
                  Aucun marchand ne correspond à « {query.trim()} », ni ici ni
                  ailleurs sur la carte.{" "}
                  <Link
                    href="/proposer"
                    className="font-medium text-brand-green-dark underline underline-offset-2"
                  >
                    Proposez-en un
                  </Link>
                  .
                </>
              )
            ) : (
              <>
                Aucun marchand référencé dans cette zone. Déplacez la carte, ou{" "}
                <Link
                  href="/proposer"
                  className="font-medium text-brand-green-dark underline underline-offset-2"
                >
                  proposez-en un
                </Link>{" "}
                pour lancer la zone.
              </>
            )}
          </li>
        )}
      </ul>
    </>
  );
}
