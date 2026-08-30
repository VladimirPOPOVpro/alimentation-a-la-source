import { NextResponse } from "next/server";
import { ensureSchema, getPool, isDbConfigured } from "@/lib/db";
import { DEMANDE_STATUTS } from "@/lib/demandes";
import { isAuthorized, unauthorized } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Marque une demande comme traitée.
 *
 * PATCH /api/admin/demandes/<id>   { "statut": "integree", "note_interne": "..." }
 * Authorization: Bearer <ADMIN_TOKEN>
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) return unauthorized();
  if (!isDbConfigured()) {
    return NextResponse.json({ erreur: "Base non configurée." }, { status: 503 });
  }

  const { id } = await context.params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ erreur: "Identifiant invalide." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ erreur: "JSON invalide." }, { status: 400 });
  }

  const statut = typeof body.statut === "string" ? body.statut : null;
  if (!statut || !DEMANDE_STATUTS.includes(statut as never)) {
    return NextResponse.json(
      { erreur: `Statut attendu parmi : ${DEMANDE_STATUTS.join(", ")}.` },
      { status: 400 }
    );
  }
  const note =
    typeof body.note_interne === "string"
      ? body.note_interne.slice(0, 2000)
      : null;

  try {
    await ensureSchema();
    const { rows } = await getPool().query(
      `update demandes
          set statut = $1,
              note_interne = coalesce($2, note_interne),
              updated_at = now()
        where id = $3
        returning id::text, statut, note_interne, updated_at`,
      [statut, note, Number(id)]
    );
    if (rows.length === 0) {
      return NextResponse.json({ erreur: "Demande introuvable." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, demande: rows[0] });
  } catch (err) {
    console.error("PATCH /api/admin/demandes/[id]", err);
    return NextResponse.json({ erreur: "Mise à jour impossible." }, { status: 500 });
  }
}
