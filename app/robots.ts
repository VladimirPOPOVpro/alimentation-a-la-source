import type { MetadataRoute } from "next";
import { PROTOTYPE } from "@/lib/prototype";

/**
 * Deux verrous valent mieux qu'un : la balise `robots` du layout dit aux
 * moteurs de ne pas indexer une page qu'ils ont chargée, ce fichier leur
 * demande de ne pas la charger du tout. Les robots sérieux respectent les deux.
 *
 * Le jour où le comité valide, `PROTOTYPE` passe à `false` dans
 * lib/prototype.ts et le site s'ouvre — ici comme ailleurs.
 */
export default function robots(): MetadataRoute.Robots {
  return PROTOTYPE
    ? { rules: [{ userAgent: "*", disallow: "/" }] }
    : { rules: [{ userAgent: "*", allow: "/" }] };
}
