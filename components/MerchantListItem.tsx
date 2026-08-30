"use client";

import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/categories";
import { formatDistance } from "@/lib/geo";
import type { MerchantWithDistance } from "@/lib/merchants";
import PillarBadges from "./PillarBadges";

export default function MerchantListItem({
  merchant,
  active,
  onHover,
}: {
  merchant: MerchantWithDistance;
  active?: boolean;
  onHover?: (slug: string | null) => void;
}) {
  return (
    <li
      onMouseEnter={() => onHover?.(merchant.slug)}
      onMouseLeave={() => onHover?.(null)}
      className={`rounded-xl border p-3 transition-colors ${
        active
          ? "border-brand-green bg-brand-green-light/60"
          : "border-transparent bg-white hover:border-brand-green-light"
      }`}
    >
      <Link href={`/marchand/${merchant.slug}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span
              className="mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: CATEGORY_COLORS[merchant.categorie] }}
            >
              {CATEGORY_LABELS[merchant.categorie]}
            </span>
            <h3 className="font-semibold text-foreground">{merchant.nom}</h3>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-brand-green-dark">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDistance(merchant.distanceKm)}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-foreground/60">
          {merchant.description}
        </p>
        <p className="mt-1.5 flex items-start gap-1 text-xs text-foreground/50">
          <Clock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="line-clamp-1">{merchant.horaires}</span>
        </p>
        <div className="mt-2">
          <PillarBadges piliers={merchant.piliers} />
        </div>
      </Link>
    </li>
  );
}
