import type { Metadata } from "next";
import CarteExplorer from "@/components/Map/CarteExplorer";
import { getAllMerchants } from "@/lib/merchants";

export const metadata: Metadata = {
  title: "Carte des marchands · L'Alimentation à la Source",
};

export default function CartePage() {
  const merchants = getAllMerchants();

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-brand-green-light bg-brand-green-light/30 px-4 py-6 sm:px-6">
        <h1 className="font-script text-3xl font-semibold text-brand-green-dark sm:text-4xl">
          La carte des marchands
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Autour de l&apos;Hôpital Bonnet, Saint-Raphaël. Ajustez le rayon
          pour élargir ou resserrer la recherche.
        </p>
      </div>
      <CarteExplorer allMerchants={merchants} />
    </div>
  );
}
