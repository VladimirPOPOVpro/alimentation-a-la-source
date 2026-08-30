import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";
import DemandeForm from "@/components/DemandeForm";

export const metadata: Metadata = {
  title: "Proposer un commerce · L'Alimentation à la Source",
  description:
    "Vous connaissez une ferme, un marché ou un producteur en vente directe qui manque sur la carte ? Proposez-le.",
};

export default function ProposerPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-brand-green-light bg-brand-green-light/30 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/carte"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-green-dark hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour à la carte
          </Link>
          <h1 className="font-script text-3xl font-semibold text-brand-green-dark sm:text-4xl">
            Proposer un commerce
          </h1>
          <p className="mt-2 text-sm text-foreground/70 sm:text-base">
            Une ferme, un marché, un producteur en vente directe qui manque sur
            la carte ? Dites-le nous. Chaque proposition est vérifiée avant
            d&apos;être publiée, donc inutile de tout savoir : le nom et la
            commune suffisent pour commencer.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand-green-light bg-white p-4">
          <Store
            className="mt-0.5 h-5 w-5 shrink-0 text-brand-green"
            aria-hidden="true"
          />
          <p className="text-sm text-foreground/70">
            Le site couvre pour l&apos;instant le secteur de Saint-Raphaël et
            Fréjus, mais il est conçu pour s&apos;étendre. Proposez un commerce
            où qu&apos;il soit en France : il sera ajouté quand la zone sera
            couverte.
          </p>
        </div>

        <DemandeForm type="ajout" />
      </div>
    </div>
  );
}
