import { FileDown } from "lucide-react";

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
      <p>
        Initiative du comité Développement Durable – Responsabilité Sociétale
        et Environnementale, CHI Fréjus Saint-Raphaël (site Hôpital Bonnet)
      </p>
    </footer>
  );
}
