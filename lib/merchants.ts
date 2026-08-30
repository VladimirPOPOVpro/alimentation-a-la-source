import marchandsData from "@/data/marchands.json";
import type { Merchant } from "./types";
import { HOSPITAL, distanceKm } from "./geo";

const merchants = marchandsData as Merchant[];

export interface MerchantWithDistance extends Merchant {
  distanceKm: number;
}

export function getAllMerchants(): MerchantWithDistance[] {
  return merchants
    .map((m) => ({
      ...m,
      distanceKm: distanceKm(HOSPITAL.lat, HOSPITAL.lon, m.lat, m.lon),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function getMerchantsWithinRadius(
  radiusKm: number
): MerchantWithDistance[] {
  return getAllMerchants().filter((m) => m.distanceKm <= radiusKm);
}

export function getMerchantBySlug(slug: string): MerchantWithDistance | undefined {
  return getAllMerchants().find((m) => m.slug === slug);
}
