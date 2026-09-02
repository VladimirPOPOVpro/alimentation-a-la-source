import { FileDown } from "lucide-react";
import { PROTOTYPE, SIGNATURE } from "@/lib/prototype";

export default function Footer() {
  return (
    <footer className="border-t border-brand-green-light bg-brand-green-light/40 py-6 text-center text-sm text-foreground/70">
      <a
        href="/brochure/brochure-a4.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-3 inline-flex items-center gap-1.5 font-medium text-brand-green-dark underline decoration-brand-green/40 underline-offset-4 hover:text-brand-green"
      >
        <FileDown className="h-4 w-4" aria-hidden="true" />
        Télécharger la brochure A4 (PDF)
      </a>
      {/* Ce que signe le site. Tant que le projet est une proposition, il ne
          signe rien d'autre que son propre statut. */}
      <p>
        {PROTOTYPE
          ? `(${SIGNATURE}) — ce site n'émane pas du CHI Fréjus Saint-Raphaël`
          : "Initiative du comité Développement Durable – Responsabilité Sociétale et Environnementale, CHI Fréjus Saint-Raphaël (site Hôpital Bonnet)"}
      </p>
    </footer>
  );
}
