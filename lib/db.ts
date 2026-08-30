import { Pool } from "pg";

/**
 * Accès Postgres pour le backlog des demandes.
 *
 * Le pool est mémorisé sur globalThis : en développement Next.js recharge les
 * modules à chaque édition, et sans ça on ouvrirait une nouvelle pile de
 * connexions à chaque sauvegarde jusqu'à saturer la base.
 */

const globalForDb = globalThis as unknown as {
  alsPool?: Pool;
  alsSchemaReady?: Promise<void>;
};

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL absent : le backlog des demandes est indisponible."
    );
  }

  if (!globalForDb.alsPool) {
    // Sur le réseau privé Railway (*.railway.internal) le trafic ne sort pas :
    // TLS y est inutile et le certificat ne correspondrait pas. Ailleurs on
    // l'exige.
    const internal = url.includes(".railway.internal");
    globalForDb.alsPool = new Pool({
      connectionString: url,
      ssl: internal ? undefined : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return globalForDb.alsPool;
}

const SCHEMA = `
create table if not exists demandes (
  id            bigserial primary key,
  type          text not null check (type in ('ajout', 'correction')),
  statut        text not null default 'nouvelle'
                check (statut in ('nouvelle', 'en_cours', 'integree', 'refusee')),
  -- Renseigné pour une correction : le marchand visé dans data/marchands.json.
  marchand_slug text,
  nom           text not null,
  adresse       text,
  categorie     text,
  produits      text,
  horaires      text,
  telephone     text,
  site_web      text,
  message       text,
  -- Facultatif, jamais exposé publiquement : sert seulement à recontacter
  -- l'auteur si sa demande est ambiguë.
  contact_email text,
  -- Empreinte de l'IP (jamais l'IP elle-même) pour limiter les abus.
  ip_hash       text,
  note_interne  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists demandes_statut_idx  on demandes (statut, created_at desc);
create index if not exists demandes_ip_hash_idx on demandes (ip_hash, created_at desc);
`;

/** Crée le schéma si besoin. Idempotent, et tenté une seule fois par process. */
export function ensureSchema(): Promise<void> {
  if (!globalForDb.alsSchemaReady) {
    globalForDb.alsSchemaReady = getPool()
      .query(SCHEMA)
      .then(() => undefined)
      .catch((err) => {
        // Ne pas mémoriser un échec : la tentative suivante doit réessayer,
        // sinon une base momentanément indisponible casse le site jusqu'au
        // prochain déploiement.
        globalForDb.alsSchemaReady = undefined;
        throw err;
      });
  }
  return globalForDb.alsSchemaReady;
}
