# L'Alimentation à la Source

Site web de découverte des marchands locaux et points de vente à la ferme autour de l'Hôpital Bonnet, à Saint-Raphaël. Initiative du comité environnement de l'hôpital.

Le site affiche une carte interactive (OpenStreetMap) centrée sur l'hôpital, avec une liste de marchands triée par distance et une fiche détaillée pour chacun.

## ⚠ Point à vérifier avant publication

L'adresse **"1 Avenue Antoine Béart, 83700 Saint-Raphaël"** transmise pour l'Hôpital Bonnet n'a été retrouvée dans aucune source (annuaires, sites officiels). Toutes les sources consultées indiquent que l'Hôpital Bonnet (Centre Hospitalier Intercommunal Fréjus Saint-Raphaël) se trouve à **240 Avenue de Saint-Lambert, 83600 Fréjus** (aussi mentionné comme Avenue André Léotard pour l'entrée maternité), bien qu'il soit répertorié dans l'annuaire des équipements de la ville de Saint-Raphaël.

La carte est actuellement centrée sur les coordonnées réelles de l'arrêt de bus et de l'héliport "Hôpital Bonnet" dans OpenStreetMap (43.439, 6.7513), ce qui correspond au site physique de l'hôpital. **Merci de confirmer avec Vladimir si l'adresse "Avenue Antoine Béart" correspond à une entrée différente, avant la mise en ligne finale.**

## Marchands à confirmer

6 fiches sur 12 sont marquées "à confirmer" dans `data/marchands.json` (champ `a_confirmer: true`), car certaines informations (horaires exacts, adresse précise, téléphone) n'ont pas pu être vérifiées avec certitude via recherche web :

- **Marché provençal de Fréjus** (horaires à préciser)
- **Marché des producteurs de la Vallée Rose** (horaires à préciser)
- **Domaine de la Bouverie** (horaires à préciser)
- **Les Fermes Jourdan** (horaires et téléphone à trouver)
- **Le Rucher des Myrtes** (adresse précise à trouver, nom du producteur à confirmer)
- **AMAP Fréjus** (plusieurs AMAP existent sur le secteur, point de distribution à confirmer)

Toutes les photos sont des placeholders Unsplash, à remplacer par de vraies photos des marchands (voir ci-dessous).

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

Le plus simple : trouvez une photo libre de droits ou prenez une photo vous-même, uploadez-la sur un service gratuit comme [imgur.com](https://imgur.com) (pas de compte requis), copiez le lien direct de l'image (clic droit → "Copier l'adresse de l'image"), et collez ce lien dans le champ `image_url` du marchand concerné.

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

Initiative du comité environnement, Hôpital Bonnet, Saint-Raphaël.
