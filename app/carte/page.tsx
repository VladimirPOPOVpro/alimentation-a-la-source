import type { Metadata } from "next";
import CarteExplorer from "@/components/Map/CarteExplorer";
import { nearestList } from "@/lib/spatialIndex";
import { HOSPITAL } from "@/lib/geo";

export const metadata: Metadata = {
  title: "Carte des marchands · L'Alimentation à la Source",
};

export default function CartePage() {
  // Ce que le serveur envoie dans la page : de quoi afficher immédiatement le
  // rayon par défaut autour de l'hôpital, et rien de plus. Le reste arrive par
  // l'API au fil des déplacements — c'est ce qui permet à la page de garder la
  // même taille quand la base passera de 40 marchands à des milliers.
  const initial = nearestList(HOSPITAL, { radiusKm: 30, limit: 80 }).resultats;

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
      <CarteExplorer initial={initial} />
    </div>
  );
}
