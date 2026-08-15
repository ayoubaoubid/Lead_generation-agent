# Lead Generation Sales

Plateforme privée de prospection B2B opérée par une agence. Un **Agency Owner**
crée l’agence et ses clients, affecte les **Recruiters**, puis ceux-ci opèrent le
workflow de recherche, qualification, campagnes et suivi pour les clients
autorisés.

La hiérarchie de sécurité est :

```text
Platform → Agency → Clients → Resources
```

Le produit n’est pas un SaaS public en libre-service. Contrats et règlements
restent hors plateforme ; aucun paiement, abonnement, checkout, billing ou
Stripe ne fait partie du dépôt.

## État du MVP

Les modules métier, migrations locales, RLS/RBAC, skills IA, tâches Trigger.dev,
design system et interfaces opérationnelles sont présents. Le statut réel est
**Internal testing ready** : les adaptateurs réels d’enrichissement, vérification,
email et calendrier doivent encore être choisis, implémentés et testés avant une
bêta. Voir `docs/MVP_AUDIT.md`.

## Prérequis

- Node.js 22.12 ou plus récent (`.nvmrc`) ;
- npm 10 ou plus récent ;
- Git ;
- Docker Desktop pour Supabase local ;
- Supabase CLI fournie par les dépendances du dépôt ;
- un projet Trigger.dev pour tester les tâches durables.

## Installation locale

Depuis la racine :

```powershell
npm install
Copy-Item .env.example .env.local
npm run supabase:start
npm run dev
```

Next.js est disponible sur `http://localhost:3000`. Supabase Studio et Mailpit
utilisent les URLs affichées par `npm run supabase:start`.

Compléter au minimum dans `.env.local` :

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
APP_URL
SUPABASE_SERVICE_ROLE_KEY
```

Les commandes racine `dev`, `build` et `start` chargent `.env`, puis
`.env.local` en priorité, avant de lancer l’application `apps/web`. Il n’est
donc pas nécessaire de dupliquer les secrets dans `apps/web/.env.local`.

Ne jamais placer la service role key dans une variable `NEXT_PUBLIC_*`.

### Persistance de Supabase local

Les données locales sont stockées dans des volumes Docker nommés et survivent
à un arrêt normal de Supabase, de Docker Desktop ou du PC. Avant d’éteindre la
machine, arrêter d’abord Next.js avec `Ctrl+C`, puis exécuter :

```powershell
npm run supabase:stop
```

Après redémarrage, lancer Docker Desktop puis :

```powershell
npm run supabase:start
npm run supabase:status
npm run dev
```

Ne jamais utiliser `supabase stop --no-backup`, `docker volume rm`,
`docker system prune --volumes` ou `npm run db:reset` pour un simple arrêt :
ces commandes peuvent supprimer ou reconstruire les données locales.

## Commandes

| Commande                  | Rôle                                  |
| ------------------------- | ------------------------------------- |
| `npm run dev`             | démarre Next.js                       |
| `npm run build`           | produit le build de production        |
| `npm run start`           | démarre le build                      |
| `npm run lint`            | exécute ESLint sans warning           |
| `npm run typecheck`       | vérifie Web et Trigger.dev            |
| `npm test`                | exécute Vitest                        |
| `npm run test:e2e`        | exécute Playwright et axe             |
| `npm run db:test`         | exécute les tests pgTAP locaux        |
| `npm run db:types`        | régénère les types Supabase locaux    |
| `npm run supabase:start`  | démarre Supabase local                |
| `npm run supabase:status` | affiche les URLs des services locaux  |
| `npm run supabase:stop`   | arrête Supabase local                 |
| `npm run db:reset`        | détruit et reconstruit la base locale |
| `npm run trigger:dev`     | démarre Trigger.dev Development       |
| `npm run format:check`    | vérifie Prettier                      |

Les tests E2E locaux utilisent Microsoft Edge installé. En CI, installer
Chromium avec `npx playwright install --with-deps chromium`.

## Variables d’environnement

`.env.example` contient toutes les clés attendues, sans valeur réelle. La
classification complète, le caractère obligatoire et les règles de rotation
sont documentés dans `docs/ENVIRONMENT_VARIABLES.md`.

Principales catégories :

- Supabase public et service role ;
- Trigger.dev ;
- observabilité ;
- fournisseur IA ;
- enrichissement et vérification ;
- email applicatif et webhook inbound ;
- Google OAuth/Calendar ;
- accès CLI réservé à la CI.

## Organisation

```text
apps/web/          application Next.js App Router
  src/app/         routes, layouts et transports
  src/components/  design system et composants partagés
  src/features/    présentation et orchestration par domaine
  src/domain/      invariants métier purs
  src/services/    cas d’usage
  src/repositories/contrats et adaptateurs Supabase
  src/lib/         primitives techniques
  src/validations/ schémas Zod
  src/types/       types générés et transversaux
  src/config/      configuration validée
trigger/           tâches durables et contrôles tenant
supabase/          migrations, seed et tests pgTAP
tests/e2e/         Playwright et axe
docs/              architecture, sécurité et runbooks
.codex/skills/     skills IA versionnés
.codex/agents/     catalogue des agents
```

## Services et sécurité

Le navigateur ne choisit jamais son tenant de confiance. Le serveur vérifie la
session, le membership agence, l’affectation client, la permission et le tenant
réel de chaque ressource. Les tâches Trigger.dev refont ces contrôles et
utilisent un ledger d’idempotence durable.

Les traitements fournisseurs non configurés refusent explicitement
l’exécution. Aucun email réel ne doit être envoyé pendant les tests locaux.

## Documentation essentielle

- `AGENTS.md` et `CODEX.md` : règles permanentes ;
- `docs/CODE_ARCHITECTURE.md` : frontières du code ;
- `docs/MULTITENANCY.md` et `docs/RBAC.md` : isolation et permissions ;
- `docs/TRIGGER_TASKS.md` : orchestration durable ;
- `docs/SECURITY_MODEL.md` et `docs/THREAT_MODEL.md` : sécurité ;
- `docs/TEST_STRATEGY.md` : stratégie de preuve ;
- `docs/DEPLOYMENT.md` et `docs/PRODUCTION_CHECKLIST.md` : production ;
- `docs/MVP_AUDIT.md` : état réel et blocages.

## Vérification avant contribution

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run db:test
npm run build
```

Une commande non exécutée ou échouée doit être signalée. Une migration distante,
un déploiement ou un envoi réel exige une instruction explicite.
