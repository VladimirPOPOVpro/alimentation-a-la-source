"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Loader2, Search, X } from "lucide-react";
import type { MerchantWithDistance } from "@/lib/merchants";
import type { Merchant, MerchantCategory } from "@/lib/types";
import { ALL_CATEGORIES } from "@/lib/categories";
import { matchesQuery } from "@/lib/search";
import { distanceKm } from "@/lib/geo";
import { useCenter, hydrateCenter } from "@/lib/centerStore";
import MerchantListItem from "../MerchantListItem";
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

const MAX_RADIUS_KM = 100;

const QUICK_SEARCHES = ["Huile d'olive", "Miel", "Poisson", "Vin", "Légumes"];

export default function CarteExplorer({
  allMerchants,
}: {
  allMerchants: Merchant[];
}) {
  const [radiusKm, setRadiusKm] = useState(15);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<
    Set<MerchantCategory>
  >(new Set(ALL_CATEGORIES));

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

  // Les distances sont recalculées côté client : le centre change sans
  // rechargement, donc le serveur ne peut pas les connaître à l'avance.
  const withDistance: MerchantWithDistance[] = useMemo(
    () =>
      allMerchants
        .map((m) => ({
          ...m,
          distanceKm: distanceKm(center.lat, center.lon, m.lat, m.lon),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm),
    [allMerchants, center.lat, center.lon]
  );

  const visibleMerchants = useMemo(
    () =>
      withDistance.filter(
        (m) =>
          m.distanceKm <= radiusKm &&
          activeCategories.has(m.categorie) &&
          matchesQuery(m, query)
      ),
    [withDistance, radiusKm, activeCategories, query]
  );

  // Une liste vide vient presque toujours du rayon ou des catégories, pas du
  // mot-clé : on le dit plutôt que d'afficher un vide sans explication.
  const matchesOutsideFilters = useMemo(
    () =>
      query.trim().length > 0
        ? withDistance.filter((m) => matchesQuery(m, query)).length
        : 0,
    [withDistance, query]
  );

  const nearest = withDistance[0];

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 lg:flex-row lg:gap-6 lg:p-6">
      <div className="order-1 h-[62dvh] min-h-[360px] w-full overflow-hidden rounded-xl border border-brand-green-light shadow-sm lg:order-2 lg:h-auto lg:flex-1">
        <MapView
          merchants={visibleMerchants}
          radiusKm={radiusKm}
          center={center}
          selectedSlug={hoveredSlug ?? undefined}
        />
      </div>

      <aside className="order-2 flex w-full flex-col gap-3 lg:order-1 lg:w-[380px] lg:shrink-0">
        <LocationPicker />

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit ou un marchand"
            aria-label="Rechercher un produit ou un marchand"
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

        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
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

        <div className="flex items-center gap-3 rounded-xl border border-brand-green-light bg-white px-4 py-2.5 lg:flex-col lg:items-stretch lg:gap-2 lg:py-4">
          <label
            htmlFor="radius"
            className="flex shrink-0 items-baseline gap-1.5 text-sm font-medium text-foreground/80 lg:justify-between"
          >
            <span className="hidden lg:inline">Rayon de recherche</span>
            <span className="lg:hidden">Rayon</span>
            <span className="font-semibold text-brand-green-dark">
              {radiusKm} km
            </span>
          </label>
          <input
            id="radius"
            type="range"
            min={2}
            max={MAX_RADIUS_KM}
            step={1}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full accent-[var(--color-brand-green)]"
          />
        </div>

        <CategoryFilter active={activeCategories} onToggle={toggleCategory} />

        <p className="text-xs text-foreground/60 lg:text-sm">
          {visibleMerchants.length} marchand
          {visibleMerchants.length > 1 ? "s" : ""} dans ce rayon, trié
          {visibleMerchants.length > 1 ? "s" : ""} par distance.
        </p>

        <ul className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto pr-1 lg:max-h-[calc(100vh-320px)]">
          {visibleMerchants.map((m) => (
            <MerchantListItem
              key={m.slug}
              merchant={m}
              active={hoveredSlug === m.slug}
              onHover={setHoveredSlug}
            />
          ))}
          {visibleMerchants.length === 0 && (
            <li className="rounded-xl border border-dashed border-brand-green-light p-4 text-center text-sm text-foreground/50">
              {matchesOutsideFilters > 0 ? (
                <>
                  {matchesOutsideFilters} marchand
                  {matchesOutsideFilters > 1 ? "s" : ""} correspond
                  {matchesOutsideFilters > 1 ? "ent" : ""} à cette recherche,
                  mais hors du rayon ou des catégories choisis. Élargissez le
                  rayon ou activez plus de catégories.
                </>
              ) : nearest && nearest.distanceKm <= MAX_RADIUS_KM ? (
                <>
                  Aucun marchand dans ce rayon. Le plus proche de{" "}
                  <span className="font-medium">{center.label}</span> est à{" "}
                  <span className="font-medium">
                    {nearest.distanceKm.toFixed(0)} km
                  </span>{" "}
                  :{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setRadiusKm(Math.ceil(nearest.distanceKm))
                    }
                    className="font-medium text-brand-green-dark underline underline-offset-2"
                  >
                    élargir le rayon
                  </button>
                  .
                </>
              ) : (
                // Élargir le rayon ne servirait à rien : le plus proche est
                // au-delà du maximum. On propose la seule action utile.
                <>
                  Pas encore de marchand référencé autour de{" "}
                  <span className="font-medium">{center.label}</span>. Le site
                  démarre dans le Var et s&apos;étend peu à peu.{" "}
                  <Link
                    href="/proposer"
                    className="font-medium text-brand-green-dark underline underline-offset-2"
                  >
                    Proposez-en un
                  </Link>{" "}
                  pour lancer la zone.
                </>
              )}
            </li>
          )}
        </ul>
      </aside>
    </div>
  );
}
