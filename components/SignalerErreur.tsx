"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import DemandeForm from "./DemandeForm";

/**
 * Signalement d'une erreur sur une fiche. Volontairement discret : c'est un
 * recours, pas une action principale, mais il doit rester à portée de main au
 * moment précis où le visiteur constate que l'information est fausse.
 */
export default function SignalerErreur({
  slug,
  nom,
}: {
  slug: string;
  nom: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-foreground/50 underline decoration-foreground/20 underline-offset-4 hover:text-brand-green-dark hover:decoration-brand-green"
      >
        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Signaler une erreur sur cette fiche
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-brand-green-light bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-brand-green-dark">
            Signaler une erreur
          </h2>
          <p className="text-sm text-foreground/60">
            Une information fausse ou dépassée sur {nom} ?
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/40 hover:bg-brand-green-light hover:text-brand-green-dark"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <DemandeForm type="correction" marchandSlug={slug} marchandNom={nom} />
    </div>
  );
}
