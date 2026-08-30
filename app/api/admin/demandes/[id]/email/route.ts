import { NextResponse } from "next/server";
import { ensureSchema, getPool, isDbConfigured } from "@/lib/db";
import { isAuthorized, unauthorized } from "@/lib/adminAuth";
import {
  EMAIL_DECISIONS,
  NOTE_MAX,
  isEmailEnabled,
  sendDecisionEmail,
  type EmailDecision,
} from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Plafond par adresse et par semaine : même en cas d'erreur de l'agent, une
 *  personne ne peut pas être noyée depuis l'adresse de l'initiative. */
const MAX_PAR_ADRESSE_7J = 3;

/**
 * Répond à l'auteur d'une demande.
 *
 * POST /api/admin/demandes/<id>/email
 *   { "decision": "integree" | "refusee" | "complement",
 *     "note": "explication courte, facultative",
 *     "simulation": true }
 *
 * Le corps du message est un gabarit fixe (voir lib/email.ts) : l'appelant
 * choisit une décision et peut ajouter une note bornée, mais ne rédige pas
 * le message.
 */
export async function POST(
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

  const decision = body.decision as EmailDecision;
  if (!EMAIL_DECISIONS.includes(decision)) {
    return NextResponse.json(
      { erreur: `Décision attendue parmi : ${EMAIL_DECISIONS.join(", ")}.` },
      { status: 400 }
    );
  }
  const note = typeof body.note === "string" ? body.note.slice(0, NOTE_MAX) : null;
  // Simulation par défaut : il faut demander explicitement l'envoi réel.
  const simulation = body.simulation !== false;

  try {
    await ensureSchema();
    const pool = getPool();

    const { rows } = await pool.query<{
      id: string;
      nom: string;
      contact_email: string | null;
      email_envoye_at: string | null;
    }>(
      `select id::text, nom, contact_email, email_envoye_at
         from demandes where id = $1`,
      [Number(id)]
    );
    const demande = rows[0];
    if (!demande) {
      return NextResponse.json({ erreur: "Demande introuvable." }, { status: 404 });
    }
    if (!demande.contact_email) {
      return NextResponse.json(
        { erreur: "Cette demande n'a pas d'adresse de contact.", envoye: false },
        { status: 409 }
      );
    }
    if (demande.email_envoye_at) {
      return NextResponse.json(
        {
          erreur: "Une réponse a déjà été envoyée pour cette demande.",
          envoye: false,
          email_envoye_at: demande.email_envoye_at,
        },
        { status: 409 }
      );
    }

    const { rows: recent } = await pool.query<{ n: string }>(
      `select count(*)::text as n from demandes
        where contact_email = $1
          and email_envoye_at is not null
          and email_envoye_at > now() - interval '7 days'`,
      [demande.contact_email]
    );
    if (Number(recent[0]?.n ?? 0) >= MAX_PAR_ADRESSE_7J) {
      return NextResponse.json(
        {
          erreur: `Plafond atteint : ${MAX_PAR_ADRESSE_7J} messages en 7 jours vers cette adresse.`,
          envoye: false,
        },
        { status: 429 }
      );
    }

    const result = await sendDecisionEmail({
      destinataire: demande.contact_email,
      decision,
      nomCommerce: demande.nom,
      note,
      simulation,
    });

    if (result.envoye) {
      await pool.query(
        `update demandes
            set email_envoye_at = now(), email_decision = $1, email_erreur = null
          where id = $2`,
        [decision, Number(id)]
      );
    }

    return NextResponse.json({
      ...result,
      simulation,
      email_actif: isEmailEnabled(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "erreur inconnue";
    console.error("POST /api/admin/demandes/[id]/email", err);
    try {
      await getPool().query(
        `update demandes set email_erreur = $1 where id = $2`,
        [message.slice(0, 500), Number(id)]
      );
    } catch {
      // La trace de l'erreur est un confort : ne pas masquer l'erreur d'origine.
    }
    return NextResponse.json(
      { erreur: "Envoi impossible.", detail: message.slice(0, 300), envoye: false },
      { status: 500 }
    );
  }
}
