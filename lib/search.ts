import { CATEGORY_LABELS } from "./categories";
import type { MerchantCategory } from "./types";

/**
 * Met un texte à plat pour la comparaison : minuscules, sans accents et sans
 * apostrophes typographiques. Sans ça, chercher "huile d'olive" ne trouverait
 * pas "Huile d'olive", et "frejus" ne trouverait pas "Fréjus".
 */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, " ")
    .toLowerCase();
}

/**
 * Le texte dans lequel on cherche pour un marchand donné : son nom, ses
 * produits, sa catégorie, sa description et son adresse. On indexe les
 * produits pour que "huile d'olive", "miel" ou "poisson" ramènent les
 * marchands qui en vendent, même si ce n'est pas dans leur nom.
 */
export interface Searchable {
  nom: string;
  categorie: MerchantCategory;
  produits: string[];
  description: string;
  adresse: string;
}

function haystack(merchant: Searchable): string {
  return normalize(
    [
      merchant.nom,
      CATEGORY_LABELS[merchant.categorie],
      merchant.produits.join(" "),
      merchant.description,
      merchant.adresse,
    ].join(" ")
  );
}

/**
 * Vrai si le marchand correspond à la recherche. Chaque mot de la requête doit
 * apparaître quelque part (ET), pour que "huile frejus" ne ramène que les
 * marchands d'huile situés à Fréjus.
 */
export function matchesQuery(merchant: Searchable, query: string): boolean {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const text = haystack(merchant);
  return terms.every((term) => text.includes(term));
}
