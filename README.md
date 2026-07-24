# Lead Generation Sales

Fondation technique de la plateforme multitenant privée opérée par une agence B2B et décrite dans le cahier des
charges. Le dépôt contient actuellement le socle Next.js et ses outils de qualité,
sans fonctionnalité métier, migration Supabase ni tâche Trigger.dev.

Le produit n'est pas un SaaS public en libre-service. Les espaces clients seront créés
manuellement par des administrateurs autorisés ; aucun paiement en ligne, abonnement
SaaS, plan tarifaire, checkout, billing ou Stripe ne fait partie de l'architecture.

## Prérequis

- Node.js 22.12 ou plus récent (la version de référence est dans `.nvmrc`) ;
- npm 10 ou plus récent (fourni avec Node.js) ;
- Git ;
- Docker Desktop sera nécessaire lors de l’initialisation future de Supabase local.

Supabase, Trigger.dev et les fournisseurs externes ne sont pas nécessaires pour
afficher ou compiler la fondation actuelle.

## Installation

Depuis la racine du dépôt :

```powershell
npm install
Copy-Item .env.example apps/web/.env.local
npm run dev
```

L’application est alors disponible sur `http://localhost:3000`.

## Commandes

| Commande               | Rôle                                                          |
| ---------------------- | ------------------------------------------------------------- |
| `npm run dev`          | Démarre Next.js en développement                              |
| `npm run build`        | Produit le build de production                                |
| `npm run start`        | Démarre le build de production                                |
| `npm run lint`         | Exécute ESLint sans accepter d’avertissement                  |
| `npm run lint:fix`     | Corrige les problèmes ESLint sûrs                             |
| `npm run typecheck`    | Vérifie TypeScript sans générer de fichier                    |
| `npm test`             | Exécute les tests Vitest une fois                             |
| `npm run test:watch`   | Exécute Vitest en mode interactif                             |
| `npm run trigger:dev`  | Connecte les futures tâches au projet Trigger.dev Development |
| `npm run format`       | Formate les fichiers avec Prettier                            |
| `npm run format:check` | Vérifie le formatage sans modifier les fichiers               |

Les scripts npm racine ciblent explicitement le workspace `@lead-generation/web`. Aucun
orchestrateur de build supplémentaire n’est nécessaire tant qu’il n’existe qu’une
seule application exécutable.

## Variables d’environnement

Copier `.env.example` vers `apps/web/.env.local`. Next.js charge les fichiers
d’environnement depuis la racine de l’application, ici `apps/web`.

| Variable                               | Portée             | Utilisation prévue                             |
| -------------------------------------- | ------------------ | ---------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Navigateur         | URL du projet Supabase                         |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Navigateur         | Clé publique Supabase                          |
| `SUPABASE_SERVICE_ROLE_KEY`            | Serveur uniquement | Opérations privilégiées strictement contrôlées |
| `TRIGGER_SECRET_KEY`                   | Serveur uniquement | Exécution des tâches durables                  |
| `SENTRY_DSN`                           | Serveur            | Observabilité                                  |
| `GROQ_API_KEY`                         | Serveur uniquement | Fournisseur IA                                 |
| `APOLLO_API_KEY`                       | Serveur uniquement | Enrichissement                                 |
| `FIRECRAWL_API_KEY`                    | Serveur uniquement | Extraction de contenu                          |
| `ZEROBOUNCE_API_KEY`                   | Serveur uniquement | Vérification d’adresses email                  |
| `RESEND_API_KEY`                       | Serveur uniquement | Envoi transactionnel                           |
| `GOOGLE_CLIENT_ID`                     | Serveur uniquement | OAuth Google                                   |
| `GOOGLE_CLIENT_SECRET`                 | Serveur uniquement | OAuth Google                                   |

Toutes ces variables restent optionnelles pendant cette phase. Elles deviendront
obligatoires module par module, au moment où l’intégration correspondante sera
implémentée. Les valeurs `NEXT_PUBLIC_*` sont exposées au navigateur et figées au
moment du build. La clé `SUPABASE_SERVICE_ROLE_KEY` et les autres secrets ne doivent
jamais être importés dans du code client, journalisés ou commités.

## Organisation du dépôt

```text
apps/web/          Application Next.js App Router
  src/app/         Routes, layouts et transport Next.js
  src/components/  Primitives UI partagées
  src/features/    Présentation et orchestration par domaine
  src/domain/      Invariants et règles métier pures
  src/services/    Cas d’usage applicatifs
  src/repositories/Contrats et futurs adaptateurs de persistance
  src/lib/         Primitives techniques transversales
  src/validations/ Schémas runtime aux frontières de confiance
  src/types/       Types transversaux stables
  src/config/      Configuration publique et serveur validée
packages/          Futurs packages partagés ayant plusieurs consommateurs
trigger/           Frontière des futures tâches Trigger.dev
supabase/          Futures migrations, configuration locale et tests RLS
tests/             Futurs tests d’intégration et end-to-end transversaux
docs/              Analyse, architecture et plans du projet
.codex/            Ressources locales d’assistance au développement
```

La structure utilise les workspaces npm natifs. Elle prépare les frontières demandées sans
introduire Turborepo, des packages artificiels ou une infrastructure prématurée.
Les règles détaillées de dépendance et de séparation sont définies dans
`docs/CODE_ARCHITECTURE.md`.

## Fonctionnement et services

L’application actuelle sert uniquement une page de contrôle du socle technique. La
validation d’environnement sépare les variables publiques des secrets serveur. Les
modules métier devront ensuite respecter l’isolation :

```text
Plateforme → Agence → Client → Ressource métier
```

Supabase et le projet Trigger.dev Development disposent maintenant de leur fondation.
Les tâches Trigger.dev et les fonctionnalités métier ne sont pas encore implémentées.
Les fournisseurs IA, d’enrichissement, de vérification, d’envoi, Google OAuth/Calendar
et l’observabilité devront être activés selon les phases documentées dans
`docs/IMPLEMENTATION_PLAN.md`.

## Règles de contribution

Lire `AGENTS.md`, `CODEX.md` et les documents d’architecture avant toute modification.
Une contribution doit rester limitée à son périmètre, préserver TypeScript strict,
valider les entrées externes et exécuter au minimum les vérifications pertinentes :

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```
