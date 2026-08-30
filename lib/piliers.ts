import type { PillarKey } from "./types";

export interface Pillar {
  key: PillarKey;
  titre: string;
  accroche: string;
  bullets: string[];
  color: string;
  colorBg: string;
  icon: "apple" | "leaf" | "truck" | "coins" | "users";
}

export const PILLARS: Pillar[] = [
  {
    key: "alimentation",
    titre: "Alimentation saine",
    accroche: "Des produits frais, de saison, sans détour.",
    bullets: [
      "Des fruits et légumes cueillis à maturité, riches en goût et en nutriments.",
      "Moins d'intermédiaires, donc moins de conservateurs et de transformations.",
      "Une alimentation qui respecte les saisons et le rythme naturel des cultures.",
    ],
    color: "var(--color-pillar-alimentation)",
    colorBg: "var(--color-pillar-alimentation-bg)",
    icon: "apple",
  },
  {
    key: "environnement",
    titre: "Environnement",
    accroche: "Préserver les sols, l'eau et la biodiversité locale.",
    bullets: [
      "Des producteurs souvent engagés dans des pratiques agricoles raisonnées ou bio.",
      "Moins d'emballages, moins de déchets liés au transport longue distance.",
      "Un soutien direct à des terres cultivées près de chez nous, donc préservées.",
    ],
    color: "var(--color-pillar-environnement)",
    colorBg: "var(--color-pillar-environnement-bg)",
    icon: "leaf",
  },
  {
    key: "transport",
    titre: "Transport et empreinte carbone",
    accroche: "Du champ à l'assiette, sans traverser le pays.",
    bullets: [
      "Des circuits courts qui réduisent drastiquement les kilomètres parcourus.",
      "Moins de camions, moins de chambres froides, moins d'émissions de CO2.",
      "Une fraîcheur garantie car le trajet entre récolte et assiette est court.",
    ],
    color: "var(--color-pillar-transport)",
    colorBg: "var(--color-pillar-transport-bg)",
    icon: "truck",
  },
  {
    key: "economie",
    titre: "Économie régionale",
    accroche: "Faire vivre les producteurs et commerçants d'ici.",
    bullets: [
      "Chaque achat local reste dans l'économie de notre région varoise.",
      "Un revenu plus juste pour les producteurs, sans marge d'intermédiaires.",
      "Le maintien de fermes, de marchés et de savoir faire près de chez nous.",
    ],
    color: "var(--color-pillar-economie)",
    colorBg: "var(--color-pillar-economie-bg)",
    icon: "coins",
  },
  {
    key: "social",
    titre: "Lien social et convivialité",
    accroche: "Se rencontrer, échanger, retrouver le sens du partage.",
    bullets: [
      "Un contact direct avec celles et ceux qui cultivent ce que l'on mange.",
      "Des marchés et des fermes qui deviennent des lieux de rencontre.",
      "Une consommation qui redonne du sens à un geste simple et quotidien.",
    ],
    color: "var(--color-pillar-social)",
    colorBg: "var(--color-pillar-social-bg)",
    icon: "users",
  },
];

export function getPillar(key: PillarKey): Pillar {
  const pillar = PILLARS.find((p) => p.key === key);
  if (!pillar) throw new Error(`Pilier inconnu: ${key}`);
  return pillar;
}
