import { getPillar } from "@/lib/piliers";
import type { PillarKey } from "@/lib/types";

export default function PillarBadges({
  piliers,
  size = "sm",
}: {
  piliers: PillarKey[];
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {piliers.map((key) => {
        const pillar = getPillar(key);
        return (
          <span
            key={key}
            className={`inline-flex items-center rounded-full font-medium ${
              size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
            }`}
            style={{
              backgroundColor: pillar.colorBg,
              color: pillar.color,
            }}
          >
            {pillar.titre}
          </span>
        );
      })}
    </div>
  );
}
