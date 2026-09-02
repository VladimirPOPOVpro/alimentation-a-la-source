"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { FlaskConical, Info, X } from "lucide-react";
import {
  PROTOTYPE,
  BANDEAU,
  DETAILS,
  DETAILS_TITRE,
  SIGNATURE,
} from "@/lib/prototype";

/**
 * L'avertissement « prototype », en deux temps.
 *
 * Un bandeau à l'arrivée, qu'on peut refermer — puis une pastille discrète qui,
 * elle, ne disparaît jamais. C'est le point important : un avertissement qu'on
 * peut faire disparaître définitivement ne protège de rien. Quelqu'un qui
 * arrive sur la page par un lien direct, deux semaines après, doit encore
 * pouvoir constater en un coup d'œil que le site n'est pas officiel.
 *
 * Le texte vit dans lib/prototype.ts, et `PROTOTYPE` à `false` retire tout.
 */

const KEY = "als.prototype.bandeau.v1";

let ferme = false;
let relu = false;
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  // Première lecture au moment où un composant s'abonne, donc après hydratation :
  // le rendu serveur et le premier rendu client montrent tous deux le bandeau,
  // et il se referme ensuite si le visiteur l'avait déjà fermé.
  if (!relu) {
    relu = true;
    try {
      if (window.localStorage.getItem(KEY) === "1") {
        ferme = true;
        queueMicrotask(() => listeners.forEach((x) => x()));
      }
    } catch {
      // localStorage indisponible : le bandeau reste affiché, ce qui est le
      // comportement prudent.
    }
  }
  return () => listeners.delete(l);
}

function fermerBandeau() {
  ferme = true;
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // Non mémorisé : le bandeau reviendra au prochain chargement. Sans gravité.
  }
  listeners.forEach((l) => l());
}

const snapshot = () => ferme;
const serverSnapshot = () => false;

export default function PrototypeNotice() {
  const bandeauFerme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [detailsOuverts, setDetailsOuverts] = useState(false);

  // Échap referme le panneau : sans ça, qui n'utilise pas la souris s'y trouve
  // enfermé.
  useEffect(() => {
    if (!detailsOuverts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailsOuverts(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailsOuverts]);

  if (!PROTOTYPE) return null;

  return (
    <>
      {!bandeauFerme && (
        <div
          role="region"
          aria-label="Statut du site"
          className="border-b border-amber-300/70 bg-amber-50 px-4 py-2.5 text-amber-950 sm:px-6"
        >
          <div className="mx-auto flex max-w-6xl items-start gap-3">
            <FlaskConical
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <p className="flex-1 text-sm leading-snug">
              {BANDEAU}{" "}
              <button
                type="button"
                onClick={() => setDetailsOuverts(true)}
                className="font-semibold underline decoration-amber-500 underline-offset-2 hover:text-amber-800"
              >
                En savoir plus
              </button>
            </p>
            <button
              type="button"
              onClick={fermerBandeau}
              aria-label="Masquer ce bandeau"
              className="-m-1 shrink-0 rounded-full p-1 text-amber-700 hover:bg-amber-100"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* La pastille reste, bandeau ouvert ou fermé : c'est elle qui garantit
          que la mention est toujours accessible depuis n'importe quelle page. */}
      <button
        type="button"
        onClick={() => setDetailsOuverts(true)}
        aria-haspopup="dialog"
        className="fixed bottom-4 left-4 z-[1100] inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/95 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-md backdrop-blur transition-colors hover:bg-amber-100"
      >
        <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
        {SIGNATURE}
      </button>

      {detailsOuverts && (
        <div
          className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/40 p-3 sm:items-center"
          onClick={() => setDetailsOuverts(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prototype-titre"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2
                id="prototype-titre"
                className="flex items-center gap-2 text-lg font-semibold text-brand-green-dark"
              >
                <Info className="h-5 w-5 text-amber-600" aria-hidden="true" />
                {DETAILS_TITRE}
              </h2>
              <button
                type="button"
                onClick={() => setDetailsOuverts(false)}
                aria-label="Fermer"
                className="-m-1 rounded-full p-1 text-foreground/40 hover:bg-brand-green-light hover:text-brand-green-dark"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground/75">
              {DETAILS.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDetailsOuverts(false)}
              className="mt-5 w-full rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-dark"
            >
              J&apos;ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
