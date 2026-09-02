/**
 * Le statut du site, et tous les textes qui en découlent.
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * Le site n'est pas une publication officielle du CHI Fréjus Saint-Raphaël :
 * c'est une maquette réalisée pour être proposée au CSE Bonnet. Laisser croire
 * l'inverse exposerait la présentation à une critique légitime — un
 * établissement public ne communique pas au nom d'une initiative qu'il n'a pas
 * validée. Tant que la validation n'a pas eu lieu, chaque endroit qui pourrait
 * se lire comme une signature institutionnelle affiche la mention ci-dessous.
 *
 * QUAND LE PROJET SERA VALIDÉ
 *
 * Il n'y a qu'un seul fichier à modifier : celui-ci.
 *   1. passer `PROTOTYPE` à `false` : le bandeau et la pastille disparaissent,
 *      et le site redevient indexable par les moteurs de recherche ;
 *   2. remplacer `SIGNATURE` par la vraie mention validée par le comité.
 * Aucun autre fichier n'a besoin d'être touché.
 */

/** Faux le jour où le comité valide : bandeau retiré, site indexable. */
export const PROTOTYPE = true;

/**
 * Ce qui remplace toute mention pouvant se lire comme « ce site émane de
 * l'hôpital ». Court, parce qu'elle apparaît dans le pied de page, l'onglet du
 * navigateur et l'en-tête de la page d'accueil.
 */
export const SIGNATURE = "Prototype pour CSE Bonnet";

/** Une phrase, celle du bandeau. Doit se comprendre sans cliquer. */
export const BANDEAU =
  "Site prototype, présenté pour proposition au CSE Bonnet — aucune validation institutionnelle à ce jour.";

/** Le détail, affiché quand on ouvre la pastille. Une idée par paragraphe. */
export const DETAILS: string[] = [
  "Ce site est une maquette de travail. Il a été réalisé pour illustrer une proposition faite au CSE Bonnet, et n'a pas encore été examiné ni validé par le Centre Hospitalier Intercommunal Fréjus Saint-Raphaël.",
  "Il ne constitue donc ni une communication officielle de l'établissement, ni un engagement de sa part. Aucun logo, aucune signature et aucune identité visuelle de l'hôpital n'y sont utilisés.",
  "Les marchands présentés sont réels et leurs informations ont été recoupées avec des sources publiques (registre des entreprises, offices de tourisme, sites officiels). Elles peuvent malgré tout être incomplètes ou avoir changé : vérifiez horaires et disponibilité avant de vous déplacer.",
  "L'Hôpital Bonnet n'apparaît sur la carte que comme point de repère géographique, parce que la proposition s'adresse d'abord à ses équipes. Chacun peut choisir une autre adresse comme point de départ.",
];

/** Titre du panneau de détail. */
export const DETAILS_TITRE = "À propos de ce site";
