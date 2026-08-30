"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_CENTER, isPlausibleFrance, type Center } from "./geo";

/**
 * Le point de référence choisi par le visiteur, partagé par toute l'application.
 *
 * Un petit store externe plutôt qu'un contexte React : la carte, la liste et la
 * fiche marchand doivent lire la même valeur sans être imbriquées dans le même
 * arbre, et `useSyncExternalStore` gère proprement le rendu serveur (il rend
 * toujours l'hôpital côté serveur, puis bascule après hydratation si le
 * visiteur avait fait un autre choix — donc pas d'erreur d'hydratation).
 */

const KEY = "als.center.v1";

let current: Center = DEFAULT_CENTER;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function readStored(): Center | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<Center>;
    if (
      typeof p.lat !== "number" ||
      typeof p.lon !== "number" ||
      typeof p.label !== "string" ||
      !isPlausibleFrance(p.lat, p.lon)
    ) {
      return null;
    }
    const kind: Center["kind"] =
      p.kind === "adresse" || p.kind === "position" ? p.kind : "hopital";
    return { lat: p.lat, lon: p.lon, label: p.label, kind };
  } catch {
    // localStorage indisponible (navigation privée, cookies bloqués) : on
    // retombe simplement sur l'hôpital plutôt que de casser la page.
    return null;
  }
}

/** À appeler une fois côté client : relit le choix mémorisé. */
export function hydrateCenter() {
  if (hydrated) return;
  hydrated = true;
  const stored = readStored();
  if (stored) {
    current = stored;
    emit();
  }
}

export function setCenter(next: Center) {
  current = next;
  try {
    if (next.kind === "hopital") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Choix non mémorisé, mais la session courante fonctionne quand même.
  }
  emit();
}

export function resetCenter() {
  setCenter(DEFAULT_CENTER);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => current;
// Le serveur ne connaît pas le choix du visiteur : il rend toujours l'hôpital.
const getServerSnapshot = () => DEFAULT_CENTER;

export function useCenter(): Center {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
