import nodemailer, { type Transporter } from "nodemailer";

/**
 * Envoi des réponses aux personnes qui ont soumis une demande.
 *
 * MODÈLE DE MENACE — à lire avant de modifier ce fichier.
 *
 * L'adresse de destination et tous les champs texte d'une demande sont fournis
 * par un inconnu. Un envoi automatique vers cette adresse est donc, par
 * construction, un relais que quelqu'un peut essayer de détourner :
 *
 *   1. soumettre des demandes avec l'adresse d'une victime pour la faire
 *      spammer depuis l'adresse de l'initiative ;
 *   2. faire ressortir un texte de son choix dans un message signé par
 *      l'initiative ;
 *   3. pousser l'agent de modération à écrire autre chose que prévu.
 *
 * D'où les règles appliquées ICI, dans le code, et non laissées au jugement de
 * l'agent :
 *
 *   - le corps du message vient d'un GABARIT FIXE. Aucun texte soumis par le
 *     visiteur n'y est réinjecté, à la seule exception du nom du commerce
 *     (échappé et tronqué), sans quoi le message serait incompréhensible ;
 *   - l'agent peut ajouter une note, mais elle est bornée et échappée ;
 *   - une demande ne peut donner lieu qu'à UN envoi (colonne email_envoye_at) ;
 *   - plafond par adresse et par exécution ;
 *   - rien ne part tant que EMAIL_ENABLED n'est pas explicitement à "true".
 */

export type EmailDecision = "integree" | "refusee" | "complement";

export const EMAIL_DECISIONS: EmailDecision[] = [
  "integree",
  "refusee",
  "complement",
];

/** Longueur maximale de la note rédigée par l'agent. */
export const NOTE_MAX = 600;
/** Longueur maximale du nom de commerce réinjecté dans le message. */
const NOM_MAX = 120;

export function isEmailEnabled(): boolean {
  return process.env.EMAIL_ENABLED === "true";
}

export function emailConfigError(): string | null {
  const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"].filter(
    (k) => !process.env[k]
  );
  return missing.length ? `Variables manquantes : ${missing.join(", ")}.` : null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Texte libre ramené à quelque chose d'inoffensif : pas de retours chariot
 *  parasites, pas de caractères de contrôle, longueur bornée. */
function sanitize(input: string | null | undefined, max: number): string {
  if (!input) return "";
  return input
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

const SIGNATURE =
  "L'Alimentation à la Source\n" +
  "Comité Développement Durable – Responsabilité Sociétale et Environnementale\n" +
  "CHI Fréjus Saint-Raphaël, site Hôpital Bonnet";

interface Gabarit {
  objet: (nom: string) => string;
  corps: (nom: string) => string;
}

const GABARITS: Record<EmailDecision, Gabarit> = {
  integree: {
    objet: (nom) => `Votre proposition a été ajoutée : ${nom}`,
    corps: (nom) =>
      `Bonjour,\n\n` +
      `Merci d'avoir proposé « ${nom} » sur la carte de L'Alimentation à la Source.\n\n` +
      `Nous avons vérifié les informations et la fiche est maintenant en ligne. ` +
      `Votre contribution aide les habitants du secteur et le personnel de l'hôpital ` +
      `à trouver des producteurs près de chez eux.\n\n` +
      `Si vous constatez une erreur sur la fiche, le bouton « Signaler une erreur » ` +
      `en bas de celle-ci nous la fera remonter.\n\n` +
      `Merci encore,`,
  },
  refusee: {
    objet: (nom) => `Votre proposition : ${nom}`,
    corps: (nom) =>
      `Bonjour,\n\n` +
      `Merci d'avoir pris le temps de nous proposer « ${nom} ».\n\n` +
      `Après vérification, nous ne pouvons pas l'ajouter à la carte pour le moment. ` +
      `Vous trouverez ci-dessous la raison précise.\n\n` +
      `Ce n'est pas définitif : si la situation change, ou si vous avez des ` +
      `informations qui nous auraient échappé, n'hésitez pas à nous réécrire ou à ` +
      `refaire une proposition.\n\n` +
      `Merci de votre compréhension,`,
  },
  complement: {
    objet: (nom) => `Une précision sur votre proposition : ${nom}`,
    corps: (nom) =>
      `Bonjour,\n\n` +
      `Merci pour votre proposition concernant « ${nom} ».\n\n` +
      `Nous aimerions la publier, mais il nous manque une information pour la ` +
      `vérifier. Vous la trouverez précisée ci-dessous.\n\n` +
      `Vous pouvez simplement répondre à ce message.\n\n` +
      `Merci d'avance,`,
  },
};

export interface EmailResult {
  envoye: boolean;
  destinataire: string;
  objet: string;
  apercu: string;
  raison?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 465 = TLS implicite ; 587 = STARTTLS négocié après connexion.
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Construit le message. Séparé de l'envoi pour pouvoir être inspecté à blanc
 * (mode simulation) sans rien expédier.
 */
export function buildEmail(
  decision: EmailDecision,
  nomCommerce: string,
  note?: string | null
) {
  const nom = sanitize(nomCommerce, NOM_MAX) || "votre proposition";
  const noteClean = sanitize(note, NOTE_MAX);
  const gabarit = GABARITS[decision];

  const objet = gabarit.objet(nom);
  const texte =
    gabarit.corps(nom) +
    (noteClean ? `\n\n---\n${noteClean}\n---\n` : "\n") +
    `\n${SIGNATURE}\n`;

  const html =
    `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;` +
    `font-size:15px;line-height:1.6;color:#1f2a1c;max-width:560px">` +
    escapeHtml(gabarit.corps(nom)).replace(/\n/g, "<br>") +
    (noteClean
      ? `<blockquote style="margin:18px 0;padding:12px 16px;border-left:3px solid #4c8c4a;` +
        `background:#f1f8e9;border-radius:6px">${escapeHtml(noteClean).replace(/\n/g, "<br>")}</blockquote>`
      : "<br>") +
    `<p style="margin-top:20px;color:#4b5a47;font-size:13px">` +
    escapeHtml(SIGNATURE).replace(/\n/g, "<br>") +
    `</p></div>`;

  return { objet, texte, html };
}

/**
 * Envoie effectivement. `simulation` construit le message et s'arrête là :
 * c'est le comportement par défaut tant que EMAIL_ENABLED n'est pas activé.
 */
export async function sendDecisionEmail(opts: {
  destinataire: string;
  decision: EmailDecision;
  nomCommerce: string;
  note?: string | null;
  simulation?: boolean;
}): Promise<EmailResult> {
  const { objet, texte, html } = buildEmail(
    opts.decision,
    opts.nomCommerce,
    opts.note
  );
  const base = {
    destinataire: opts.destinataire,
    objet,
    apercu: texte.slice(0, 400),
  };

  if (opts.simulation || !isEmailEnabled()) {
    return { ...base, envoye: false, raison: "simulation" };
  }
  const configErr = emailConfigError();
  if (configErr) return { ...base, envoye: false, raison: configErr };

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to: opts.destinataire,
    // Les réponses arrivent dans la boîte de Vladimir : le portail sert à
    // envoyer, pas à recevoir.
    replyTo: process.env.EMAIL_REPLY_TO ?? process.env.EMAIL_FROM,
    subject: objet,
    text: texte,
    html,
  });

  return { ...base, envoye: true };
}
