"use client";

import { motion } from "framer-motion";
import { Apple, Leaf, Truck, Coins, Users, type LucideIcon } from "lucide-react";
import type { Pillar } from "@/lib/piliers";

const ICONS: Record<Pillar["icon"], LucideIcon> = {
  apple: Apple,
  leaf: Leaf,
  truck: Truck,
  coins: Coins,
  users: Users,
};

export default function PillarCard({
  pillar,
  index,
}: {
  pillar: Pillar;
  index: number;
}) {
  const Icon = ICONS[pillar.icon];

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: pillar.colorBg }}
      >
        <Icon className="h-6 w-6" style={{ color: pillar.color }} aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold" style={{ color: pillar.color }}>
        {pillar.titre}
      </h2>
      <p className="mt-1 text-sm font-medium text-foreground/60">
        {pillar.accroche}
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {pillar.bullets.map((b) => (
          <li key={b} className="flex gap-2 text-sm text-foreground/75">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: pillar.color }}
            />
            {b}
          </li>
        ))}
      </ul>
    </motion.article>
  );
}
