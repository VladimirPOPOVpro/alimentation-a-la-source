import { NextResponse } from "next/server";
import { ensureSchema, getPool, isDbConfigured } from "@/lib/db";
import { clientIp, hashIp, validateDemande } from "@/lib/demandes";

export const runtime = "nodejs";
// Rien à mettre en cache ici, et surtout rien à pré-rendre.
export const dynamic = "force-dynamic";

/** Plafond par auteur et par heure : laisse largement la place à une personne
 *  qui signale plusieurs commerces, mais coupe court à un envoi automatisé. */
const MAX_PAR_HEURE = 10;

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { erreur: "Le formulaire est momentanément indisponible." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erreur: "JSON invalide." }, { status: 400 });
  }

  // Piège à robots : un champ caché qu'aucun humain ne remplit. On répond OK
  // pour ne pas apprendre au robot ce qui l'a trahi, mais on n'enregistre rien.
  if (typeof (body as Record<string, unknown>)?.website === "string" &&
      (body as Record<string, unknown>).website !== "") {
    return NextResponse.json({ ok: true, id: null });
  }

  const result = validateDemande(body);
  if (!result.ok || !result.value) {
    return NextResponse.json(
      { erreur: "Demande incomplète.", details: result.errors },
      { status: 400 }
    );
  }
  const d = result.value;

  try {
    await ensureSchema();
    const pool = getPool();
    const ip = hashIp(clientIp(request.headers));

    const { rows: countRows } = await pool.query<{ n: string }>(
      `select count(*)::text as n from demandes
        where ip_hash = $1 and created_at > now() - interval '1 hour'`,
      [ip]
    );
    if (Number(countRows[0]?.n ?? 0) >= MAX_PAR_HEURE) {
      return NextResponse.json(
        {
          erreur:
            "Vous avez envoyé plusieurs demandes récemment. Réessayez dans une heure.",
        },
        { status: 429 }
      );
    }

    const { rows } = await pool.query<{ id: string }>(
      `insert into demandes
         (type, marchand_slug, nom, adresse, categorie, produits, horaires,
          telephone, site_web, message, contact_email, ip_hash)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       returning id::text`,
      [
        d.type,
        d.marchand_slug ?? null,
        d.nom,
        d.adresse ?? null,
        d.categorie ?? null,
        d.produits ?? null,
        d.horaires ?? null,
        d.telephone ?? null,
        d.site_web ?? null,
        d.message ?? null,
        d.contact_email ?? null,
        ip,
      ]
    );

    return NextResponse.json({ ok: true, id: rows[0]?.id ?? null }, { status: 201 });
  } catch (err) {
    console.error("POST /api/demandes", err);
    return NextResponse.json(
      { erreur: "Enregistrement impossible pour le moment." },
      { status: 500 }
    );
  }
}
