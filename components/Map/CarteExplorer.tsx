"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Search, X } from "lucide-react";
import type { MerchantWithDistance } from "@/lib/merchants";
import type { MerchantCategory } from "@/lib/types";
import { ALL_CATEGORIES } from "@/lib/categories";
import { matchesQuery } from "@/lib/search";
import MerchantListItem from "../MerchantListItem";
import CategoryFilter from "./CategoryFilter";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-brand-green-light/40">
      <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
    </div>
  ),
});

/**
 * Raccourcis vers les produits les plus recherchés : ils rendent la recherche
 * par produit découvrable, sans quoi personne ne devine qu'on peut taper
 * "huile d'olive" plutôt qu'un nom de marchand.
 */
const QUICK_SEARCHES = ["Huile d'olive", "Miel", "Poisson", "Vin", "Légumes"];

export default function CarteExplorer({
  allMerchants,
}: {
  allMerchants: MerchantWithDistance[];
}) {
  const [radiusKm, setRadiusKm] = useState(15);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<
    Set<MerchantCategory>
  >(new Set(ALL_CATEGORIES));

  const toggleCategory = (category: MerchantCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      // Never allow an empty selection: an empty filter reads as "show
      // nothing", which is confusing next to a map that's supposed to
      // help you find something. Re-select everything instead.
      return next.size === 0 ? new Set(ALL_CATEGORIES) : next;
    });
  };

  const visibleMerchants = useMemo(
    () =>
      allMerchants.filter(
        (m) =>
          m.distanceKm <= radiusKm &&
          activeCategories.has(m.categorie) &&
          matchesQuery(m, query)
      ),
    [allMerchants, radiusKm, activeCategories, query]
  );

  // Une recherche qui ne ramène rien est presque toujours due au rayon ou aux
  // catégories, pas au mot-clé : on le dit plutôt que d'afficher une liste vide.
  const matchesOutsideFilters = useMemo(
    () =>
      query.trim().length > 0
        ? allMerchants.filter((m) => matchesQuery(m, query)).length
        : 0,
    [allMerchants, query]
  );

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 lg:flex-row lg:gap-6 lg:p-6">
      <div className="order-1 h-[62dvh] min-h-[360px] w-full overflow-hidden rounded-xl border border-brand-green-light shadow-sm lg:order-2 lg:h-auto lg:flex-1">
        <MapView
          merchants={visibleMerchants}
          radiusKm={radiusKm}
          selectedSlug={hoveredSlug ?? undefined}
        />
      </div>

      <aside className="order-2 flex w-full flex-col gap-3 lg:order-1 lg:w-[380px] lg:shrink-0">
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
            max={30}
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
              ) : (
                <>
                  Aucun marchand ne correspond. Essayez un autre mot, élargissez
                  le rayon ou activez plus de catégories.
                </>
              )}
            </li>
          )}
        </ul>
      </aside>
    </div>
  );
}
