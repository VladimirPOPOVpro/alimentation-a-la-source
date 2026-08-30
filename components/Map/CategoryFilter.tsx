"use client";

import { Home, ShoppingBasket, Leaf, Users, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MerchantCategory } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/categories";

const CATEGORY_ICONS: Record<MerchantCategory, LucideIcon> = {
  ferme: Home,
  marche: ShoppingBasket,
  "magasin-bio": Leaf,
  amap: Users,
  producteur: Sun,
};

const ALL_CATEGORIES: MerchantCategory[] = [
  "ferme",
  "marche",
  "magasin-bio",
  "amap",
  "producteur",
];

export default function CategoryFilter({
  active,
  onToggle,
}: {
  active: Set<MerchantCategory>;
  onToggle: (category: MerchantCategory) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
      {ALL_CATEGORIES.map((category) => {
        const Icon = CATEGORY_ICONS[category];
        const isActive = active.has(category);
        const color = CATEGORY_COLORS[category];
        return (
          <button
            key={category}
            type="button"
            onClick={() => onToggle(category)}
            aria-pressed={isActive}
            className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm"
            style={
              isActive
                ? {
                    backgroundColor: color,
                    borderColor: color,
                    color: "white",
                  }
                : {
                    backgroundColor: "white",
                    borderColor: "var(--color-brand-green-light)",
                    color: "var(--foreground)",
                    opacity: 0.7,
                  }
            }
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {CATEGORY_LABELS[category]}
          </button>
        );
      })}
    </div>
  );
}
