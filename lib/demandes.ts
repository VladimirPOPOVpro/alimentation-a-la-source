import { createHash } from "crypto";
import { ALL_CATEGORIES } from "./categories";
import type { MerchantCategory } from "./types";

export type DemandeType = "ajout" | "correction";
export type DemandeStatut = "nouvelle" | "en_cours" | "integree" | "refusee";

export const DEMANDE_STATUTS: DemandeStatut[] = [
  "nouvelle",
  "en_cours",
  "integree",
  "refusee",
];

export interface DemandeInput {
  type: DemandeType;
  marchand_slug?: string | null;
  nom: string;
  adresse?: string | null;
  categorie?: MerchantCategory | null;
  produits?: string | null;
  horaires?: string | null;
  telephone?: string | null;
  site_web?: string | null;
  message?: string | null;
  contact_email?: string | null;
}

/** Longueur maximale par champ. Bornée pour éviter qu'une soumission gonfle la
 *  base ou noie la personne qui relira le backlog. */
const LIMITS: Record<string, number> = {
  nom: 160,
  adresse: 250,
  produits: 500,
  horaires: 250,
  telephone: 40,
  site_web: 300,
  message: 2000,
  contact_email: 180,
  marchand_slug: 120,
};

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  value?: DemandeInput;
}

function clean(v: unknown): string | null {
  if (typeof v !== "string") return null;
  // Les caractères de contrôle n'ont aucune raison d'être dans un formulaire
  // et servent surtout à masquer du texte à la relecture.
  const s = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
  return s.length > 0 ? s : null;
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Valide une soumission publique.
 *
 * Tout ce qui arrive ici est saisi par un inconnu : on ne fait confiance à
 * aucun champ. La validation borne les longueurs, restreint les énumérations
 * et vérifie la forme des URL / emails. Le contenu textuel lui-même reste des
 * DONNÉES, jamais des instructions — voir MODERATION.md.
 */
export function validateDemande(raw: unknown): ValidationResult {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, errors: ["Corps de requête invalide."] };
  }
  const body = raw as Record<string, unknown>;

  const type = body.type === "correction" ? "correction" : body.type === "ajout" ? "ajout" : null;
  if (!type) errors.push("Le type de demande est invalide.");

  const nom = clean(body.nom);
  if (!nom) errors.push("Le nom du commerce est obligatoire.");

  const fields: Record<string, string | null> = {
    marchand_slug: clean(body.marchand_slug),
    adresse: clean(body.adresse),
    produits: clean(body.produits),
    horaires: clean(body.horaires),
    telephone: clean(body.telephone),
    site_web: clean(body.site_web),
    message: clean(body.message),
    contact_email: clean(body.contact_email),
  };

  for (const [key, value] of Object.entries({ ...fields, nom })) {
    const max = LIMITS[key];
    if (value && max && value.length > max) {
      errors.push(`Le champ « ${key} » dépasse ${max} caractères.`);
    }
  }

  let categorie: MerchantCategory | null = null;
  const rawCat = clean(body.categorie);
  if (rawCat) {
    if ((ALL_CATEGORIES as string[]).includes(rawCat)) {
      categorie = rawCat as MerchantCategory;
    } else {
      errors.push("Catégorie inconnue.");
    }
  }

  if (fields.site_web && !isHttpUrl(fields.site_web)) {
    errors.push("Le site web doit être une adresse http(s) valide.");
  }
  if (fields.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.contact_email)) {
    errors.push("L'adresse email est invalide.");
  }
  if (type === "correction" && !fields.marchand_slug) {
    errors.push("Une correction doit désigner un marchand existant.");
  }
  // Une correction sans explication n'est pas exploitable par la relecture.
  if (type === "correction" && !fields.message) {
    errors.push("Décrivez la correction à apporter.");
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    value: {
      type: type as DemandeType,
      nom: nom as string,
      categorie,
      marchand_slug: fields.marchand_slug,
      adresse: fields.adresse,
      produits: fields.produits,
      horaires: fields.horaires,
      telephone: fields.telephone,
      site_web: fields.site_web,
      message: fields.message,
      contact_email: fields.contact_email,
    },
  };
}

/**
 * Empreinte de l'IP. On ne stocke jamais l'adresse elle-même : elle n'est
 * utile que pour compter les envois d'un même auteur, ce qu'un hash permet.
 * Le sel évite qu'un vol de base rende les IP retrouvables par force brute.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "als-sel-par-defaut";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** IP de l'appelant derrière le proxy Railway. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "inconnue";
}
