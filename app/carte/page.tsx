import type { Metadata } from "next";
import CarteExplorer from "@/components/Map/CarteExplorer";
import { getAllMerchants } from "@/lib/merchants";
import type { Merchant } from "@/lib/types";

export const metadata: Metadata = {
  title: "Carte des marchands · L'Alimentation à la Source",
};

export default function CartePage() {
  // Les distances sont calculées côté client, depuis le point de référence
  // choisi par le visiteur : le serveur n'envoie que les données brutes.
  const merchants: Merchant[] = getAllMerchants();

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-brand-green-light bg-brand-green-light/30 px-4 py-3 sm:py-6 sm:px-6">
        <h1 className="font-script text-2xl font-semibold text-brand-green-dark sm:text-4xl">
          La carte des marchands
        </h1>
        <p className="mt-0.5 hidden text-sm text-foreground/60 sm:block">
          Cherchez autour de l&apos;Hôpital Bonnet, de votre adresse ou de
          votre position.
        </p>
      </div>
      <CarteExplorer allMerchants={merchants} />
    </div>
  );
}
