import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Phone,
  Globe,
  MapPin,
  Clock,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { getAllMerchants, getMerchantBySlug } from "@/lib/merchants";
import { CATEGORY_LABELS } from "@/lib/categories";
import { formatDistance, HOSPITAL } from "@/lib/geo";
import PillarBadges from "@/components/PillarBadges";

export function generateStaticParams() {
  return getAllMerchants().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/marchand/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const merchant = getMerchantBySlug(slug);
  if (!merchant) return { title: "Marchand introuvable" };
  return {
    title: `${merchant.nom} · L'Alimentation à la Source`,
    description: merchant.description,
  };
}

export default async function MerchantPage({
  params,
}: PageProps<"/marchand/[slug]">) {
  const { slug } = await params;
  const merchant = getMerchantBySlug(slug);

  if (!merchant) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative h-[38vh] min-h-[260px] w-full overflow-hidden bg-brand-green-light">
        <Image
          src={merchant.image_url}
          alt={merchant.nom}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl px-4 pb-6 sm:px-6">
          <Link
            href="/carte"
            className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-brand-green-dark"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour à la carte
          </Link>
          <h1 className="font-script text-4xl font-bold text-white drop-shadow sm:text-5xl">
            {merchant.nom}
          </h1>
          <span className="mt-2 inline-block rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-brand-green-dark">
            {CATEGORY_LABELS[merchant.categorie]}
          </span>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {merchant.a_confirmer && (
            <p className="mb-4 rounded-lg border border-pillar-economie bg-pillar-economie-bg px-3 py-2 text-sm text-foreground/70">
              Certaines informations de cette fiche sont à confirmer avant
              publication finale.
            </p>
          )}

          <PillarBadges piliers={merchant.piliers} size="md" />

          <p className="mt-4 text-base leading-relaxed text-foreground/80">
            {merchant.description}
          </p>

          <h2 className="mt-8 text-lg font-semibold text-brand-green-dark">
            Produits phares
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {merchant.produits.map((p) => (
              <li
                key={p}
                className="rounded-full bg-brand-green-light px-3 py-1 text-sm text-brand-green-dark"
              >
                {p}
              </li>
            ))}
          </ul>

          {merchant.images && merchant.images.length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-semibold text-brand-green-dark">
                Photos
              </h2>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {merchant.images.map((src) => (
                  <div
                    key={src}
                    className="relative aspect-square overflow-hidden rounded-lg"
                  >
                    <Image
                      src={src}
                      alt={merchant.nom}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-brand-green-light bg-white p-4">
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex gap-2">
                <MapPin
                  className="h-4 w-4 shrink-0 text-brand-green"
                  aria-hidden="true"
                />
                <div>
                  <dt className="sr-only">Adresse</dt>
                  <dd>{merchant.adresse}</dd>
                  <dd className="mt-0.5 text-foreground/50">
                    {formatDistance(merchant.distanceKm)} de {HOSPITAL.nom}
                  </dd>
                </div>
              </div>
              <div className="flex gap-2">
                <Clock
                  className="h-4 w-4 shrink-0 text-brand-green"
                  aria-hidden="true"
                />
                <div>
                  <dt className="sr-only">Horaires</dt>
                  <dd>{merchant.horaires}</dd>
                </div>
              </div>
              {merchant.telephone && (
                <div className="flex gap-2">
                  <Phone
                    className="h-4 w-4 shrink-0 text-brand-green"
                    aria-hidden="true"
                  />
                  <dd>
                    <a
                      href={`tel:${merchant.telephone.replace(/\s/g, "")}`}
                      className="hover:underline"
                    >
                      {merchant.telephone}
                    </a>
                  </dd>
                </div>
              )}
              {merchant.site_web && (
                <div className="flex gap-2">
                  <Globe
                    className="h-4 w-4 shrink-0 text-brand-green"
                    aria-hidden="true"
                  />
                  <dd>
                    <a
                      href={merchant.site_web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      Site web
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {merchant.google_maps_url && (
            <a
              href={merchant.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-dark lg:flex"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Ouvrir dans Google Maps
            </a>
          )}
        </aside>
      </div>

      {merchant.google_maps_url && (
        <div
          className="sticky bottom-0 z-40 mt-6 flex items-center gap-2 border-t border-brand-green-light bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.1)] backdrop-blur lg:hidden"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          {merchant.telephone && (
            <a
              href={`tel:${merchant.telephone.replace(/\s/g, "")}`}
              aria-label="Appeler"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-green-light bg-white text-brand-green-dark active:bg-brand-green-light"
            >
              <Phone className="h-5 w-5" aria-hidden="true" />
            </a>
          )}
          <a
            href={merchant.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green text-sm font-semibold text-white shadow-lg shadow-brand-green/25 active:bg-brand-green-dark"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Ouvrir dans Google Maps
          </a>
        </div>
      )}
    </div>
  );
}
