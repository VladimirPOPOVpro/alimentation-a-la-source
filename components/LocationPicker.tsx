"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Building2,
  Crosshair,
  Loader2,
  MapPin,
  Search,
  X,
} from "lucide-react";
import {
  searchAddresses,
  reverseGeocode,
  type AddressSuggestion,
} from "@/lib/adresse";
import { isPlausibleFrance } from "@/lib/geo";
import { useCenter, setCenter, resetCenter, hydrateCenter } from "@/lib/centerStore";

const DEBOUNCE_MS = 250;

type GeoState = "idle" | "locating" | "denied" | "unavailable" | "outside";

const GEO_MESSAGES: Record<Exclude<GeoState, "idle" | "locating">, string> = {
  denied:
    "Localisation refusée. Autorisez-la dans votre navigateur, ou saisissez votre adresse.",
  unavailable: "Position introuvable. Saisissez plutôt votre adresse.",
  outside:
    "Votre position semble hors de France. Saisissez une adresse pour continuer.",
};

export default function LocationPicker() {
  const center = useCenter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [geo, setGeo] = useState<GeoState>("idle");

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listId = useId();

  useEffect(hydrateCenter, []);

  // Recherche débouncée. Chaque frappe annule la requête précédente pour que
  // deux réponses ne puissent pas revenir dans le désordre.
  // L'état d'une saisie trop courte est remis à zéro dans onQueryChange, pas
  // ici : appeler setState dans le corps d'un effet déclenche des rendus en
  // cascade (et la règle react-hooks/set-state-in-effect le refuse).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      abortRef.current?.abort();
      return;
    }

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      searchAddresses(q, controller.signal)
        .then((r) => {
          setResults(r);
          setHighlighted(r.length > 0 ? 0 : -1);
        })
        .catch((err) => {
          if ((err as Error).name !== "AbortError") setResults([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  // Fermeture au clic extérieur.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function onQueryChange(value: string) {
    setQuery(value);
    setOpen(true);
    if (value.trim().length < 3) {
      setResults([]);
      setHighlighted(-1);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }

  function choose(s: AddressSuggestion) {
    setCenter({ lat: s.lat, lon: s.lon, label: s.label, kind: "adresse" });
    setQuery("");
    setResults([]);
    setOpen(false);
    setGeo("idle");
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[highlighted] ?? results[0];
      if (pick) choose(pick);
    }
  }

  function useMyPosition() {
    if (!("geolocation" in navigator)) {
      setGeo("unavailable");
      return;
    }
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        if (!isPlausibleFrance(lat, lon)) {
          setGeo("outside");
          return;
        }
        // On nomme le point avant de l'afficher : « Ma position » seul ne dit
        // pas au visiteur si le navigateur l'a bien situé.
        let label = "Ma position";
        try {
          const found = await reverseGeocode(lat, lon);
          if (found) label = found;
        } catch {
          // Le nom est un confort : sans lui les coordonnées restent bonnes.
        }
        setCenter({ lat, lon, label, kind: "position" });
        setQuery("");
        setOpen(false);
        setGeo("idle");
      },
      (err) => {
        setGeo(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  const CenterIcon =
    center.kind === "hopital"
      ? Building2
      : center.kind === "position"
        ? Crosshair
        : MapPin;

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Chercher autour d&apos;une adresse
      </label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          {loading ? (
            <Loader2
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-green"
              aria-hidden="true"
            />
          ) : (
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
              aria-hidden="true"
            />
          )}
          <input
            id={`${listId}-input`}
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open && results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              highlighted >= 0 && results[highlighted]
                ? `${listId}-opt-${highlighted}`
                : undefined
            }
            autoComplete="off"
            value={query}
            placeholder="Votre adresse, votre ville…"
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className="w-full rounded-xl border border-brand-green-light bg-white py-2.5 pl-9 pr-9 text-sm outline-none placeholder:text-foreground/40 focus:border-brand-green"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                inputRef.current?.focus();
              }}
              aria-label="Effacer"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-foreground/40 hover:bg-brand-green-light hover:text-brand-green-dark"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={useMyPosition}
          disabled={geo === "locating"}
          title="Utiliser ma position"
          aria-label="Utiliser ma position"
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-brand-green-light bg-white text-brand-green-dark transition-colors hover:border-brand-green hover:bg-brand-green-light disabled:opacity-60"
        >
          {geo === "locating" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Crosshair className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-[1000] mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-brand-green-light bg-white py-1 shadow-lg"
        >
          {results.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === highlighted}
              onMouseEnter={() => setHighlighted(i)}
              onMouseDown={(e) => e.preventDefault()} // garde le focus input
              onClick={() => choose(s)}
              className={`flex cursor-pointer items-start gap-2 px-3 py-2 text-sm ${
                i === highlighted ? "bg-brand-green-light/70" : ""
              }`}
            >
              <MapPin
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-green"
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground">
                  {s.label}
                </span>
                {s.context && (
                  <span className="block truncate text-xs text-foreground/50">
                    {s.context}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.trim().length >= 3 && results.length === 0 && (
        <div className="absolute z-[1000] mt-1 w-full rounded-xl border border-brand-green-light bg-white px-3 py-2 text-sm text-foreground/50 shadow-lg">
          Aucune adresse trouvée.
        </div>
      )}

      {/* Centre actif : le visiteur doit toujours savoir d'où l'on mesure. */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-foreground/60">
        <CenterIcon
          className="h-3.5 w-3.5 shrink-0 text-brand-green"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate">
          Autour de <span className="font-medium">{center.label}</span>
        </span>
        {center.kind !== "hopital" && (
          <button
            type="button"
            onClick={() => {
              resetCenter();
              setGeo("idle");
            }}
            className="shrink-0 font-medium text-brand-green-dark underline underline-offset-2 hover:text-brand-green"
          >
            Revenir à l&apos;hôpital
          </button>
        )}
      </div>

      {geo !== "idle" && geo !== "locating" && (
        <p role="status" className="mt-1 text-xs text-notice">
          {GEO_MESSAGES[geo]}
        </p>
      )}
    </div>
  );
}
