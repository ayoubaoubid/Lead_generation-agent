# Variables d’environnement

Le fichier `.env.example` est la référence versionnée. Les valeurs réelles
restent dans le gestionnaire de secrets de l’environnement. Toute variable
`NEXT_PUBLIC_*` est publique.

| Variable | Exposition | Requise | Usage |
|---|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | navigateur | oui | URL du projet Supabase de l’environnement |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | navigateur | oui | clé publique Supabase, jamais `service_role` |
| `APP_URL` | serveur | oui en production | origine canonique et redirects Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | serveur | oui pour invitations/webhooks | opérations techniques après contrôles applicatifs |
| `TRIGGER_SECRET_KEY` | serveur | oui pour les tâches | authentification du SDK Trigger.dev |
| `TRIGGER_API_URL` | serveur | self-hosted seulement | endpoint Trigger.dev personnalisé |
| `TRIGGER_PREVIEW_BRANCH` | serveur | preview seulement | branche Trigger.dev |
| `SENTRY_DSN` | serveur | avant bêta | collecte d’erreurs sans PII |
| `LLM_PROVIDER` | serveur | pour les agents | fournisseur logique, actuellement `groq` |
| `GROQ_API_KEY` | serveur | pour l’IA réelle | appel du modèle |
| `GROQ_MODEL` | serveur | pour l’IA réelle | modèle autorisé |
| `APOLLO_API_KEY` | serveur | selon fournisseur | enrichissement |
| `FIRECRAWL_API_KEY` | serveur | selon fournisseur | extraction web |
| `ZEROBOUNCE_API_KEY` | serveur | selon fournisseur | vérification email |
| `RESEND_API_KEY` | serveur | selon fournisseur | email applicatif, pas Supabase SMTP |
| `RESEND_FROM_EMAIL` | serveur | avec Resend | expéditeur vérifié |
| `INBOUND_WEBHOOK_PROVIDER` | serveur | pour Inbox | identifiant de l’adaptateur inbound |
| `INBOUND_WEBHOOK_SECRET` | serveur | pour Inbox | HMAC du webhook |
| `GOOGLE_CLIENT_ID` | serveur | calendrier Google | OAuth |
| `GOOGLE_CLIENT_SECRET` | serveur | calendrier Google | secret OAuth |
| `SUPABASE_PROJECT_REF` | CI/CLI | CI seulement | lien du projet |
| `SUPABASE_ACCESS_TOKEN` | CI/CLI | CI seulement | accès CLI non interactif |
| `SUPABASE_DB_PASSWORD` | CI/CLI | CI seulement | migration distante contrôlée |

## Règles

- Les projets dev, staging et production utilisent des valeurs distinctes.
- Les secrets ne sont jamais copiés dans une issue, un log ou un rapport.
- Une rotation invalide immédiatement l’ancienne valeur et fait l’objet d’un
  test de connexion.
- Les clés fournisseur sont limitées par droits, quota, origine ou IP lorsque
  le fournisseur le permet.
- `RESEND_FROM_EMAIL` ne peut être activé qu’après vérification du domaine.
- Les identifiants de comptes d’envoi stockés en base sont des références
  opaques ; le secret reste dans un coffre.
