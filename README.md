# L'Alimentation à la Source

Site web de découverte des marchands locaux et points de vente à la ferme autour de l'Hôpital Bonnet, à Saint-Raphaël. Initiative du comité Développement Durable – Responsabilité Sociétale et Environnementale du Centre Hospitalier Intercommunal Fréjus Saint-Raphaël (CHI Fréjus Saint-Raphaël).

Le site affiche une carte interactive (OpenStreetMap) centrée sur l'hôpital, avec une liste de marchands triée par distance et une fiche détaillée pour chacun.

## ⚠ Point à vérifier avant publication

Le nom officiel du comité porteur du projet est confirmé : **comité Développement Durable – Responsabilité Sociétale et Environnementale**, du Centre Hospitalier Intercommunal Fréjus Saint-Raphaël (CHI Fréjus Saint-Raphaël), site Hôpital Bonnet.

Reste à confirmer : l'adresse **"1 Avenue Antoine Béart, 83700 Saint-Raphaël"** transmise initialement pour l'Hôpital Bonnet n'a été retrouvée dans aucune source (annuaires, sites officiels). Toutes les sources consultées indiquent que l'Hôpital Bonnet se trouve à **240 Avenue de Saint-Lambert, 83600 Fréjus** (aussi mentionné comme Avenue André Léotard pour l'entrée maternité), bien qu'il soit répertorié dans l'annuaire des équipements de la ville de Saint-Raphaël.

La carte est actuellement centrée sur les coordonnées réelles de l'arrêt de bus et de l'héliport "Hôpital Bonnet" dans OpenStreetMap (43.439, 6.7513), ce qui correspond au site physique de l'hôpital. **Merci de confirmer avec Vladimir si l'adresse "Avenue Antoine Béart" correspond à une entrée différente.**

## Marchands à confirmer

16 fiches sur 33 sont marquées "à confirmer" dans `data/marchands.json` (champ `a_confirmer: true`), car certaines informations (horaires exacts, adresse précise, téléphone) n'ont pas pu être vérifiées avec certitude via recherche web :

- **Marché provençal de Fréjus** (horaires à préciser)
- **Marché des producteurs de la Vallée Rose** (horaires à préciser)
- **Domaine de la Bouverie** (horaires à préciser)
- **Les Fermes Jourdan** (horaires et téléphone à trouver)
- **Le Rucher des Myrtes** (nom du producteur à confirmer)
- **AMAP Fréjus** (plusieurs AMAP existent sur le secteur, point de distribution à confirmer)
- **Cueillette du Rocher** (horaires à préciser)
- **La Gaudine** (horaires à préciser)
- **Plein Cagnard** (horaires à préciser)
- **Domaine Réal Saint-Jean** (horaires à préciser)
- **Domaine De La Vernède** (horaires à préciser)
- **Les Comptoirs de la Bio - Saint-Raphaël** (horaires à préciser)
- **Diététique Leblanc** (horaires à préciser)
- **La Ruche qui dit Oui ! - Fréjus** (point de retrait et horaires de permanence à confirmer)
- **Marché aux poissons du Vieux Port** (heure d'ouverture variable selon l'arrivage de la pêche)
- **Poissonnerie Santa Lucia** (horaires du mardi et de la fermeture du dimanche divergents selon les sources, à confirmer par téléphone au 04 94 53 84 76)

Les 33 marchands ont chacun une vraie photo (trouvée sur leur site officiel, celui de l'office de tourisme, ou une photo thématique soigneusement choisie), stockée dans `public/images/marchands/`.

Sur la carte, les icônes se transforment en vignettes photo circulaires quand on zoome suffisamment (à partir du niveau de zoom "rue"). Un champ de recherche permet de chercher par produit (« huile d'olive », « miel », « poisson »…) autant que par nom de marchand, et un filtre par catégorie permet d'afficher uniquement fermes, marchés, magasins bio, AMAP, producteurs ou poissonneries.

### Note sur la Poissonnerie Santa Lucia

L'office de tourisme référence encore le site `santaluciapoissonnerie.fr` pour ce commerce. **Ce nom de domaine a expiré et a été racheté : il redirige aujourd'hui vers un site de casino en ligne, sans aucun rapport avec la poissonnerie.** Il a donc volontairement été laissé de côté dans la fiche. Ne pas le rajouter.

### Piste non publiée : la Ferme Philip (Agay)

La Ferme Philip, avenue du Gratadis à Agay, existe bien et est référencée par l'office de tourisme (maraîchage en vente directe, tél. 04 94 82 04 44). Elle **n'a volontairement pas été ajoutée au site** : au registre des entreprises, l'établissement correspondant est indiqué comme fermé depuis novembre 2014, alors que la fiche touristique la donne encore ouverte (dernière mise à jour connue : mai 2023). **Un appel au 04 94 82 04 44 permettrait de trancher** avant de l'ajouter, pour éviter d'envoyer des visiteurs vers un point de vente qui n'existe plus.

## Comment ajouter ou modifier un marchand

Toutes les données sont dans un seul fichier : **`data/marchands.json`**. Pas besoin de toucher au reste du code.

Ouvrez ce fichier avec un éditeur de texte (ou directement sur GitHub, bouton crayon "Edit") et ajoutez un bloc comme celui-ci dans la liste, entre deux `},{` :

```json
{
  "slug": "nom-unique-sans-espaces",
  "nom": "Nom du marchand",
  "categorie": "ferme",
  "piliers": ["alimentation", "economie"],
  "lat": 43.4300,
  "lon": 6.7500,
  "adresse": "Adresse complète",
  "horaires": "Horaires d'ouverture",
  "produits": ["Produit 1", "Produit 2"],
  "description": "Une ou deux phrases de description.",
  "telephone": "04 94 00 00 00",
  "site_web": "https://exemple.fr",
  "google_maps_url": "https://www.google.com/maps/search/?api=1&query=Nom+du+marchand",
  "image_url": "https://exemple.fr/photo.jpg"
}
```

Champs à connaître :

- `categorie` : une valeur parmi `ferme`, `marche`, `magasin-bio`, `amap`, `producteur` (détermine l'icône sur la carte).
- `piliers` : une liste parmi `alimentation`, `environnement`, `transport`, `economie`, `social` (détermine les badges colorés sur la fiche).
- `lat` / `lon` : coordonnées GPS. Pour les trouver, cherchez l'adresse sur [Google Maps](https://www.google.com/maps), clic droit sur le point exact, puis cliquez sur les coordonnées affichées pour les copier.
- `a_confirmer` : ajoutez `"a_confirmer": true` si une information reste incertaine.

Pour supprimer un marchand, supprimez simplement son bloc entier (attention à garder des virgules correctes entre les blocs restants).

## Comment ajouter des photos

Deux options :

1. **Photo hébergée dans le projet (recommandé)** : déposez le fichier dans `public/images/marchands/nom-du-fichier.jpg`, puis référencez-le dans `image_url` avec `/images/marchands/nom-du-fichier.jpg` (sans le domaine).
2. **Photo hébergée ailleurs** : trouvez une photo libre de droits ou prenez une photo vous-même, uploadez-la sur un service gratuit comme [imgur.com](https://imgur.com) (pas de compte requis), copiez le lien direct de l'image (clic droit → "Copier l'adresse de l'image"), et collez ce lien complet dans `image_url`.

Pour plusieurs photos sur une fiche, ajoutez un champ `images` avec une liste de liens :

```json
"images": ["https://lien-photo-1.jpg", "https://lien-photo-2.jpg"]
```

## Développement local

```bash
npm install
npm run dev
```

Le site est disponible sur http://localhost:3000.

## Stack technique

Next.js 15 (App Router) + TypeScript + Tailwind CSS 4, cartographie Leaflet / OpenStreetMap, animations Framer Motion, icônes Lucide.

## Déploiement

Le site est déployé sur Railway. Toute modification poussée sur la branche `main` du dépôt GitHub déclenche un nouveau déploiement automatique.

---

Initiative du comité Développement Durable – Responsabilité Sociétale et Environnementale, CHI Fréjus Saint-Raphaël (site Hôpital Bonnet).
