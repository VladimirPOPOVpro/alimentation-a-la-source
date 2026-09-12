import type { Metadata } from "next";
import CarteExplorer from "@/components/Map/CarteExplorer";

export const metadata: Metadata = {
  title: "Carte des marchands · L'Alimentation à la Source",
};

export default function CartePage() {
  // La page ne transporte aucun marchand : la carte demande à l'API ce qui
  // entre dans l'écran, et rien de plus. C'est ce qui permet à la page de
  // garder la même taille quelle que soit la taille de la base.
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-brand-green-light bg-brand-green-light/30 px-4 py-3 sm:py-6 sm:px-6">
        <h1 className="font-script text-2xl font-semibold text-brand-green-dark sm:text-4xl">
          La carte des marchands
        </h1>
        <p className="mt-0.5 hidden text-sm text-foreground/60 sm:block">
          Déplacez la carte, ou saisissez une adresse pour vous y rendre. Les
          distances sont mesurées depuis l&apos;Hôpital Bonnet, ou depuis le
          point que vous choisissez.
        </p>
      </div>
      <CarteExplorer />
    </div>
  );
}
