import Link from "next/link";
import { ArrowRight, FileDown, Leaf, MapPin } from "lucide-react";
import HeroReveal from "@/components/HeroReveal";
import { getAllMerchants } from "@/lib/merchants";

export default function Home() {
  const merchantCount = getAllMerchants().length;

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative flex flex-1 items-center overflow-hidden bg-gradient-to-b from-brand-green-light via-background to-background px-4 py-20 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
          <HeroReveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-brand-green-dark shadow-sm">
              <Leaf className="h-4 w-4" aria-hidden="true" />
              Comité environnement, Hôpital Bonnet
            </span>
          </HeroReveal>

          <HeroReveal delay={0.1}>
            <h1 className="font-script text-5xl font-bold leading-tight text-brand-green-dark sm:text-7xl">
              L&apos;Alimentation à la Source
            </h1>
          </HeroReveal>

          <HeroReveal delay={0.2}>
            <p className="max-w-2xl text-lg text-foreground/80 sm:text-xl">
              Du champ à votre assiette&hellip; Faites le choix du bon, du
              frais et du sens.
            </p>
          </HeroReveal>

          <HeroReveal delay={0.3}>
            <p className="max-w-xl text-base text-foreground/60">
              Consommer local, c&apos;est préserver sa santé, sa région et sa
              planète. Découvrez {merchantCount} marchands, fermes et marchés
              autour de l&apos;Hôpital Bonnet, à Saint-Raphaël.
            </p>
          </HeroReveal>

          <HeroReveal delay={0.4}>
            <Link
              href="/carte"
              className="group mt-4 inline-flex items-center gap-2 rounded-full bg-brand-green px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-brand-green/20 transition-transform hover:scale-105 hover:bg-brand-green-dark"
            >
              <MapPin className="h-5 w-5" aria-hidden="true" />
              Voir la carte
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </HeroReveal>

          <HeroReveal delay={0.5}>
            <a
              href="/brochure/brochure-a4.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-green-dark underline decoration-brand-green/40 underline-offset-4 hover:text-brand-green"
            >
              <FileDown className="h-4 w-4" aria-hidden="true" />
              Télécharger la brochure A4 (PDF)
            </a>
          </HeroReveal>
        </div>
      </section>

      <section className="border-t border-brand-green-light bg-white px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-base leading-relaxed text-foreground/70">
            Cette initiative est portée par le{" "}
            <strong className="text-brand-green-dark">
              comité environnement de l&apos;Hôpital Bonnet
            </strong>
            , à Saint-Raphaël. Notre objectif est simple : faire connaître
            aux équipes de l&apos;hôpital et aux habitants du secteur les
            marchands locaux, les fermes en vente directe et les marchés de
            producteurs qui font vivre notre région, tout en réduisant notre
            empreinte environnementale au quotidien.
          </p>
          <Link
            href="/pourquoi"
            className="mt-6 inline-block text-sm font-medium text-brand-green-dark underline decoration-brand-green/40 underline-offset-4 hover:text-brand-green"
          >
            Découvrir pourquoi consommer local, en 5 piliers →
          </Link>
        </div>
      </section>
    </div>
  );
}
