import { timingSafeEqual } from "crypto";

/**
 * Contrôle du jeton d'administration (lecture / mise à jour du backlog).
 *
 * La comparaison est à temps constant : une comparaison `===` sur une chaîne
 * s'arrête au premier caractère différent, ce qui laisse deviner le jeton
 * caractère par caractère en mesurant le temps de réponse.
 */
export function isAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_TOKEN;
  // Sans jeton configuré, l'API d'administration reste fermée : mieux vaut
  // qu'elle soit inutilisable qu'ouverte à tous.
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function unauthorized(): Response {
  return new Response(JSON.stringify({ erreur: "Non autorisé." }), {
    status: 401,
    headers: {
      "content-type": "application/json",
      "www-authenticate": "Bearer",
    },
  });
}
