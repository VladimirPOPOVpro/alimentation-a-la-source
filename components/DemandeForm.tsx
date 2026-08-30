"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, MapPin, Send } from "lucide-react";
import { ALL_CATEGORIES, CATEGORY_LABELS } from "@/lib/categories";
import { searchAddresses, type AddressSuggestion } from "@/lib/adresse";
import type { MerchantCategory } from "@/lib/types";

type Status = "idle" | "sending" | "sent" | "error";

export default function DemandeForm({
  type,
  marchandSlug,
  marchandNom,
}: {
  type: "ajout" | "correction";
  marchandSlug?: string;
  marchandNom?: string;
}) {
  const isCorrection = type === "correction";

  const [nom, setNom] = useState(marchandNom ?? "");
  const [adresse, setAdresse] = useState("");
  const [categorie, setCategorie] = useState<MerchantCategory | "">("");
  const [produits, setProduits] = useState("");
  const [horaires, setHoraires] = useState("");
  const [telephone, setTelephone] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // piège à robots

  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<string[]>([]);

  // Autocomplétion d'adresse : une adresse choisie dans la liste est
  // géocodable, donc directement exploitable à la relecture.
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = adresse.trim();
    if (q.length < 4 || !showSuggestions) return;
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const c = new AbortController();
      abortRef.current = c;
      searchAddresses(q, c.signal)
        .then(setSuggestions)
        .catch(() => {
          /* suggestion facultative : l'adresse libre reste acceptée */
        });
    }, 280);
    return () => clearTimeout(timer);
  }, [adresse, showSuggestions]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrors([]);

    try {
      const res = await fetch("/api/demandes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          marchand_slug: marchandSlug ?? null,
          nom,
          adresse,
          categorie: categorie || null,
          produits,
          horaires,
          telephone,
          site_web: siteWeb,
          message,
          contact_email: email,
          website, // honeypot
        }),
      });
      const data = (await res.json()) as { erreur?: string; details?: string[] };
      if (!res.ok) {
        setErrors(data.details?.length ? data.details : [data.erreur ?? "Envoi impossible."]);
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setErrors(["Connexion impossible. Vérifiez votre réseau et réessayez."]);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-success bg-success-bg p-5 text-center">
        <CheckCircle2
          className="mx-auto mb-2 h-8 w-8 text-success"
          aria-hidden="true"
        />
        <p className="font-semibold text-success">Merci, c&apos;est envoyé.</p>
        <p className="mt-1 text-sm text-foreground/70">
          Votre {isCorrection ? "correction" : "proposition"} rejoint la liste
          des demandes à traiter. Elle sera vérifiée avant d&apos;apparaître sur
          le site.
        </p>
      </div>
    );
  }

  const field =
    "w-full rounded-xl border border-brand-green-light bg-white px-3 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:border-brand-green";
  const labelCls = "mb-1 block text-sm font-medium text-foreground/80";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* Piège à robots : invisible et hors du parcours clavier. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Ne pas remplir</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="nom" className={labelCls}>
          Nom du commerce <span className="text-error">*</span>
        </label>
        <input
          id="nom"
          required
          maxLength={160}
          value={nom}
          readOnly={isCorrection}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ferme des Oliviers"
          className={`${field} ${isCorrection ? "bg-brand-green-light/40" : ""}`}
        />
      </div>

      {!isCorrection && (
        <>
          <div className="relative">
            <label htmlFor="adresse" className={labelCls}>
              Adresse
            </label>
            <input
              id="adresse"
              maxLength={250}
              autoComplete="off"
              value={adresse}
              onChange={(e) => {
                setAdresse(e.target.value);
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Commencez à taper, puis choisissez dans la liste"
              className={field}
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-brand-green-light bg-white py-1 shadow-lg">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setAdresse(s.label);
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-brand-green-light/70"
                    >
                      <MapPin
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-green"
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block truncate">{s.label}</span>
                        <span className="block truncate text-xs text-foreground/50">
                          {s.context}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label htmlFor="categorie" className={labelCls}>
              Type de commerce
            </label>
            <select
              id="categorie"
              value={categorie}
              onChange={(e) =>
                setCategorie(e.target.value as MerchantCategory | "")
              }
              className={field}
            >
              <option value="">Je ne sais pas</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="produits" className={labelCls}>
              Produits vendus
            </label>
            <input
              id="produits"
              maxLength={500}
              value={produits}
              onChange={(e) => setProduits(e.target.value)}
              placeholder="Miel, confitures, huile d'olive…"
              className={field}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="horaires" className={labelCls}>
                Horaires
              </label>
              <input
                id="horaires"
                maxLength={250}
                value={horaires}
                onChange={(e) => setHoraires(e.target.value)}
                placeholder="Mardi au samedi, 9h-12h"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="telephone" className={labelCls}>
                Téléphone
              </label>
              <input
                id="telephone"
                maxLength={40}
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="04 94 00 00 00"
                className={field}
              />
            </div>
          </div>

          <div>
            <label htmlFor="site_web" className={labelCls}>
              Site web
            </label>
            <input
              id="site_web"
              type="url"
              maxLength={300}
              value={siteWeb}
              onChange={(e) => setSiteWeb(e.target.value)}
              placeholder="https://…"
              className={field}
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="message" className={labelCls}>
          {isCorrection ? (
            <>
              Que faut-il corriger ? <span className="text-error">*</span>
            </>
          ) : (
            "Autre chose à signaler ?"
          )}
        </label>
        <textarea
          id="message"
          required={isCorrection}
          maxLength={2000}
          rows={isCorrection ? 5 : 3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isCorrection
              ? "Les horaires ont changé, le commerce a fermé, le téléphone n'est plus le bon…"
              : "Ce que vous savez de ce commerce et qui aiderait à le référencer."
          }
          className={field}
        />
      </div>

      <div>
        <label htmlFor="email" className={labelCls}>
          Votre email{" "}
          <span className="font-normal text-foreground/50">(facultatif)</span>
        </label>
        <input
          id="email"
          type="email"
          maxLength={180}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="pour vous recontacter si besoin"
          className={field}
        />
        <p className="mt-1 text-xs text-foreground/50">
          Utilisé uniquement pour vous recontacter si la demande est ambiguë.
          Jamais affiché sur le site, jamais transmis à personne.
        </p>
      </div>

      {status === "error" && errors.length > 0 && (
        <ul
          role="alert"
          className="rounded-xl border border-error bg-error-bg px-3 py-2 text-sm text-error"
        >
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark disabled:opacity-60"
      >
        {status === "sending" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="h-4 w-4" aria-hidden="true" />
        )}
        {isCorrection ? "Envoyer la correction" : "Proposer ce commerce"}
      </button>
    </form>
  );
}
