import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PillarCard from "@/components/PillarCard";
import { PILLARS } from "@/lib/piliers";

export const metadata: Metadata = {
  title: "Pourquoi consommer local ? · L'Alimentation à la Source",
};

export default function PourquoiPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-brand-green-light bg-brand-green-light/30 px-4 py-12 text-center sm:px-6">
        <h1 className="font-script text-4xl font-semibold text-brand-green-dark sm:text-5xl">
          Pourquoi consommer local ?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-foreground/70">
          Consommer local, c&apos;est préserver sa santé, sa région et sa
          planète. Cinq bonnes raisons d&apos;aller à la source.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
        {PILLARS.map((pillar, i) => (
          <PillarCard key={pillar.key} pillar={pillar} index={i} />
        ))}
      </div>

      <div className="mx-auto mb-14 px-4 text-center sm:px-6">
        <Link
          href="/carte"
          className="inline-flex items-center gap-2 rounded-full bg-brand-green px-6 py-3 text-base font-semibold text-white hover:bg-brand-green-dark"
        >
          Trouver un marchand près de chez moi
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
