"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { MerchantWithDistance } from "@/lib/merchants";
import MerchantListItem from "../MerchantListItem";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-brand-green-light/40">
      <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
    </div>
  ),
});

export default function CarteExplorer({
  allMerchants,
}: {
  allMerchants: MerchantWithDistance[];
}) {
  const [radiusKm, setRadiusKm] = useState(15);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const visibleMerchants = useMemo(
    () => allMerchants.filter((m) => m.distanceKm <= radiusKm),
    [allMerchants, radiusKm]
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row lg:gap-6 lg:p-6">
      <aside className="order-2 flex w-full flex-col gap-3 lg:order-1 lg:w-[380px] lg:shrink-0">
        <div className="rounded-xl border border-brand-green-light bg-white p-4">
          <label
            htmlFor="radius"
            className="mb-2 flex items-center justify-between text-sm font-medium text-foreground/80"
          >
            <span>Rayon de recherche</span>
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

        <p className="text-sm text-foreground/60">
          {visibleMerchants.length} marchand
          {visibleMerchants.length > 1 ? "s" : ""} dans ce rayon, trié
          {visibleMerchants.length > 1 ? "s" : ""} par distance.
        </p>

        <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1 lg:max-h-[calc(100vh-260px)]">
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
              Aucun marchand dans ce rayon. Essayez de l&apos;élargir.
            </li>
          )}
        </ul>
      </aside>

      <div className="order-1 h-[50vh] w-full overflow-hidden rounded-xl border border-brand-green-light shadow-sm lg:order-2 lg:h-auto lg:flex-1">
        <MapView
          merchants={visibleMerchants}
          radiusKm={radiusKm}
          selectedSlug={hoveredSlug ?? undefined}
        />
      </div>
    </div>
  );
}
