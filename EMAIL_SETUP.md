# Activer le portail email

Tant que `EMAIL_ENABLED` n'est pas à `true`, **rien ne part** : l'agent voit un
aperçu du message et c'est tout. C'est volontaire, et c'est le bon état pour
observer quelques passes avant d'ouvrir le robinet.

## Variables à définir sur Railway (service `alimentation-a-la-source`)

| Variable | Exemple | Rôle |
| --- | --- | --- |
| `EMAIL_ENABLED` | `true` | Interrupteur général. Absent ou différent de `true` = simulation. |
| `SMTP_HOST` | `smtp.gmail.com` | Serveur d'envoi. |
| `SMTP_PORT` | `587` | `465` pour TLS implicite, `587` pour STARTTLS. |
| `SMTP_USER` | `vladimirpopovv11@gmail.com` | Compte SMTP. |
| `SMTP_PASS` | *(mot de passe d'application)* | **Jamais un mot de passe de compte.** |
| `EMAIL_FROM` | `L'Alimentation à la Source <vladimirpopovv11@gmail.com>` | Expéditeur affiché. |
| `EMAIL_REPLY_TO` | `vladimirpopovv11@gmail.com` | Où arrivent les réponses. |
| `IP_HASH_SALT` | *(chaîne aléatoire)* | Sel du hachage des IP. |

À définir depuis l'interface Railway, ou :

```bash
npx @railway/cli variable set --service alimentation-a-la-source \
  'EMAIL_ENABLED=true' 'SMTP_HOST=smtp.gmail.com' 'SMTP_PORT=587'
```

Ne saisis les identifiants que toi-même : ils n'ont à passer ni par une
conversation, ni par un fichier du dépôt.

## Deux options d'expéditeur

### Gmail — le plus rapide

Nécessite la validation en deux étapes activée, puis un **mot de passe
d'application** (Compte Google → Sécurité → Mots de passe des applications).
C'est un mot de passe dédié, révocable, distinct de celui du compte.

- ✅ marche tout de suite, envoie à n'importe qui
- ⚠️ ton adresse Gmail personnelle apparaît comme expéditeur, donc elle est
  visible par toute personne qui reçoit une réponse
- ⚠️ limite d'environ 500 envois par jour

Pour ne pas exposer l'adresse personnelle, tu peux créer un alias Gmail
(« Envoyer des e-mails en tant que ») et le mettre dans `EMAIL_FROM`.

### Service transactionnel — plus propre à terme

Brevo, Resend, Postmark, Mailgun. Tu obtiens des identifiants SMTP à mettre
dans les mêmes variables.

- ✅ expéditeur au nom de l'initiative, statistiques de délivrabilité
- ⚠️ pour écrire à des adresses quelconques, il faut en général **vérifier un
  domaine**. Sans domaine, la plupart n'autorisent l'envoi que vers ta propre
  adresse — donc inutilisable pour répondre au public.

**Recommandation :** commencer en Gmail avec un alias, et basculer sur un
service transactionnel le jour où l'initiative aura un nom de domaine.

## Vérifier avant d'ouvrir

```bash
# 1. En simulation : le message s'affiche, rien ne part.
node scripts/backlog.mjs repondre <id> integree "Merci pour votre proposition."

# 2. Une fois les variables posées, envoi réel vers TA propre adresse d'abord.
node scripts/backlog.mjs repondre <id> integree "Test." --envoyer
```

## Ce que le code garantit, quoi qu'il arrive

- corps du message issu d'un **gabarit fixe** : aucun texte soumis par un
  visiteur n'est réinjecté, sauf le nom du commerce (échappé et tronqué) ;
- la note de l'agent est bornée à 600 caractères et échappée ;
- **un seul message par demande**, jamais deux ;
- **3 messages maximum par adresse sur 7 jours** ;
- une demande sans adresse de contact ne peut pas déclencher d'envoi.

Ces limites vivent dans `lib/email.ts` et dans la route
`app/api/admin/demandes/[id]/email/route.ts`, pas dans le jugement de l'agent :
même une passe qui déraille ne peut pas transformer le portail en outil de
harcèlement.
