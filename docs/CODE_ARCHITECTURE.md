# Architecture interne du code

## 1. Objet et périmètre

Ce document définit les frontières internes de l’application Next.js. Il traduit le
cahier des charges et les principes d’architecture en règles de code applicables dès
les prochains vertical slices.

Cette étape ne crée ni écran métier, ni accès Supabase, ni migration, ni tâche
Trigger.dev, ni intégration fournisseur. Les dossiers de domaines constituent des
frontières réservées ; ils seront remplis uniquement lorsqu’une fonctionnalité est
autorisée.

### 1.1 Correction définitive du périmètre commercial

Le produit est une plateforme privée opérée par une agence. Les contrats et paiements
entre l'agence et ses clients restent intégralement hors plateforme. Les workspaces
clients sont créés manuellement par un administrateur autorisé.

Il est interdit d'introduire Stripe, checkout, billing, paiement, plan tarifaire,
abonnement SaaS, essai gratuit, facture client automatique, `PaymentProvider`,
`BillingProvider` ou table de paiement. Les futurs contrats d'infrastructure couvrent
uniquement les fournisseurs opérationnels et le suivi de leur consommation technique.

Le chemin `src/` mentionné dans les spécifications correspond à :

```text
apps/web/src/
```

Le projet reste un monolithe modulaire. L’existence des dossiers `packages/`,
`trigger/` et `supabase/` ne transforme pas les domaines en microservices.

## 2. Structure retenue

```text
apps/web/src/
├── app/             Routes, layouts, Route Handlers et composition Next.js
├── components/      Primitives UI partagées sans règle métier
├── features/        Adaptation des capacités métier à la présentation
├── domain/          Entités, invariants, policies et erreurs métier pures
├── services/        Cas d’usage et orchestration applicative synchrone
├── repositories/    Contrats de persistance et adaptateurs serveur
├── lib/             Primitives techniques réellement transversales
├── validations/     Schémas runtime aux frontières de confiance
├── types/           Types transversaux stables
└── config/          Configuration publique et configuration serveur validées
```

Les anciens dossiers génériques `modules`, `shared` et `server` sont remplacés par
ces frontières plus précises. La configuration sensible est déplacée vers
`config/server-env.ts` et protégée par `server-only`.

## 3. Direction des dépendances

La direction normale est :

```text
app / components
        ↓
features
        ↓
services
        ↓
domain + repository contracts
        ↓
repository adapters / provider adapters
```

Les validations se placent aux frontières et transforment une donnée `unknown` en
entrée sûre. `types` contient seulement les contrats transversaux stables. `lib`
fournit des primitives techniques sans porter de décision métier.

### 3.1 Matrice d’importation

| Couche | Peut importer | Ne doit pas importer |
| --- | --- | --- |
| `app` | `features`, `components`, `services`, `validations`, configuration publique | `domain` et `repositories` directement |
| `components` | autres composants, types UI, primitives sûres de `lib` | domaine, services, repositories, secrets |
| `features` | composants, validations, services, types et view models du même domaine | adaptateurs Supabase et configuration secrète |
| `services` | domaine, contrats de repositories, types, logger | React, Next.js, UI, adaptateurs concrets |
| `domain` | son propre domaine et types fondamentaux | React, Next.js, Zod, Supabase, Trigger.dev, services et repositories |
| `repositories/contracts` | domaine, types et contexte repository | SDK Supabase ou fournisseur |
| `repositories/supabase` | contrats, domaine, types DB générés et client serveur | composants et code client |
| `validations` | Zod, domaine et types | services, repositories et présentation |
| `config` | Zod et variables d’environnement explicitement listées | domaine et UI métier |

Règles supplémentaires :

- utiliser l’alias `@/` pour traverser une frontière de dossier ;
- réserver les imports relatifs aux fichiers du même dossier ;
- interdire les imports relatifs remontants (`../`) ;
- ne pas importer un module `features/<autre-domaine>` ; passer par un service ou un
  contrat public du domaine propriétaire ;
- éviter les fichiers barrel `index.ts` globaux, qui masquent les cycles et élargissent
  involontairement les APIs ;
- utiliser `import type` lorsqu’un import n’existe qu’au niveau TypeScript ;
- ne jamais importer `config/server-env.ts`, un client privilégié ou un adaptateur
  serveur depuis le graphe d’un Client Component.

ESLint applique les interdictions principales. La revue doit encore vérifier les
relations sémantiques que l’analyse statique ne peut pas reconnaître.

## 4. Séparation présentation, domaine et infrastructure

### 4.1 Présentation et transport

`app/`, `components/` et la partie présentation de `features/` sont responsables de :

- recevoir une requête ou une interaction utilisateur ;
- lire la session via une capacité serveur approuvée ;
- valider les paramètres, formulaires et payloads ;
- appeler un service applicatif ;
- mapper le résultat vers une vue, une redirection ou une réponse API ;
- présenter un message sûr sans exposer une exception interne.

Les pages et layouts restent des Server Components par défaut. `use client` est placé
au plus près de l’interaction qui exige état, événement ou API navigateur. Un Route
Handler ou une Server Action doit rester mince et ne contient ni requête métier
directe, ni transition critique, ni SDK fournisseur.

### 4.2 Domaine

`domain/` contient uniquement du code déterministe :

- entités et value objects ;
- invariants agence/client ;
- policies métier ;
- calculs et décisions reproductibles ;
- machines d’état et transitions ;
- événements métier ;
- erreurs métier attendues.

Le domaine ne connaît ni HTTP, ni React, ni ligne PostgreSQL, ni réponse fournisseur.
Une règle critique ne doit pas être cachée dans un prompt, un composant ou une policy
RLS uniquement.

### 4.3 Application

`services/` porte les cas d’usage synchrones. Un service :

1. reçoit une commande déjà validée et un `ServiceContext` ;
2. contrôle identité, membership, portée et permission via les capacités prévues ;
3. recharge la ressource faisant autorité ;
4. vérifie la cohérence agence/client des ressources associées ;
5. invoque les règles du domaine ;
6. appelle des contrats de repositories ou de fournisseurs injectés ;
7. journalise le résultat utile avec un identifiant de corrélation ;
8. retourne un `Result` typé ou une erreur métier attendue.

### 4.4 Infrastructure

`repositories/`, les futurs adaptateurs fournisseurs et `trigger/` constituent
l’infrastructure. Ils traduisent un contrat interne vers Supabase ou un fournisseur,
normalisent les erreurs et empêchent les objets SDK de remonter vers le domaine.

## 5. Organisation par domaine

Chaque domaine possède une frontière sous `domain/<domain>` et une frontière de
présentation sous `features/<domain>` :

| Domaine | Responsabilité initiale | Portée principale |
| --- | --- | --- |
| `agency` | Tenant racine, paramètres et statut d’agence | agence |
| `clients` | Sous-tenants gérés par une agence | agence/client |
| `members` | Memberships, invitations, rôles et affectations | agence/client |
| `offers` | Offres, preuves, objections et promesses autorisées | client |
| `positioning` | Positionnement versionné et proposition de valeur | client |
| `icp` | Critères, exclusions et pondérations ICP | client |
| `personas` | Personas et rôles d’achat | client |
| `companies` | Entreprises canoniques et provenance | client |
| `contacts` | Contacts, rôles et sources | client |
| `leads` | Qualification exploitable d’un contact/compte | client |
| `segments` | Règles et memberships de segmentation | client |
| `campaigns` | Campagnes, audience et états | client |
| `sequences` | Versions, étapes et règles d’arrêt | client |
| `messages` | Templates, générations, versions et approbations | client |
| `replies` | Réponses, classification et actions proposées | client |
| `meetings` | Disponibilités, rendez-vous et synchronisation | client |
| `pipeline` | Pipelines, étapes et opportunités | client |
| `analytics` | KPI, coûts, marge et rapports | agence/client |
| `integrations` | Métadonnées, capacités et santé des connexions | agence/client |
| `compliance` | Finalités, opposition, rétention et gates | plateforme/agence/client |
| `audit` | Preuve métier append-only et traçabilité | plateforme/agence/client |

Les domaines `compliance` et `audit` sont transversaux, mais ils restent propriétaires
de leurs règles. Ils ne deviennent pas des dossiers de fonctions génériques.

### 5.1 Structure future d’un domaine

Les sous-dossiers ne sont créés que lorsqu’ils ont un premier consommateur :

```text
domain/campaigns/
├── campaign.ts
├── campaign-status.ts
├── campaign.policy.ts
├── campaign.errors.ts
└── campaign.test.ts

features/campaigns/
├── actions/
├── components/
├── queries/
└── view-models/
```

## 6. Conventions des services

- un fichier de service utilise le suffixe `.service.ts` ;
- une opération publique commence par un verbe métier explicite ;
- les entrées utilisent `Input`, `Command` ou `Query` selon leur intention ;
- les dépendances sont injectées et typées, jamais récupérées depuis un singleton
  mutable ;
- `ServiceContext` est obligatoire et contient `TenantContext`, `correlationId` et
  `Logger` ;
- le service ne fait jamais confiance à un identifiant tenant provenant du transport ;
- il recharge la ressource principale avant une mutation ou un effet ;
- il ne retourne pas une ligne Supabase, une `Response`, un composant ou un objet SDK ;
- les erreurs attendues sont des `DomainError` ou des `Result` typés ;
- une erreur inattendue est journalisée puis transformée à la frontière API ;
- un travail long, planifié ou réessayable devient une intention durable pour
  Trigger.dev, et non une promesse longue dans le service Next.js.

Exemple de signature future :

```ts
export type ApproveMessageCommand = Readonly<{
  messageId: string;
  expectedVersion: number;
}>;

export async function approveMessage(
  command: ApproveMessageCommand,
  context: ServiceContext,
  dependencies: ApproveMessageDependencies,
): Promise<Result<ApprovedMessage, DomainError>>;
```

Cet exemple documente une forme ; il n’autorise pas encore l’implémentation de la
fonctionnalité.

## 7. Conventions des repositories

Les repositories sont séparés en deux catégories futures :

```text
repositories/
├── contracts/       Interfaces consommées par les services
├── supabase/        Adaptateurs concrets exclusivement serveur
└── mappers/         Conversion explicite ligne DB ↔ modèle canonique
```

Règles :

- un contrat porte le nom du domaine, par exemple `campaign.repository.ts` ;
- chaque méthode exprime une intention métier (`findCampaignById`,
  `saveApprovedMessage`) plutôt qu’un CRUD générique ;
- chaque méthode reçoit un `RepositoryContext` vérifié ;
- les lectures et écritures sont explicitement tenant-aware ;
- un filtre `agencyId` ou `clientId` n’est jamais l’unique contrôle d’accès ;
- l’adaptateur recharge et vérifie le tenant réel de la ressource ;
- les relations entre ressources doivent conserver le même couple agence/client ;
- les lignes Supabase sont mappées vers le modèle canonique avant de quitter
  l’adaptateur ;
- les erreurs techniques deviennent des `RepositoryError` stables ;
- un repository ne journalise jamais de secret, contenu d’email ou PII complète ;
- aucun « base repository » générique ne doit permettre d’oublier le tenant ;
- un adaptateur utilisant une clé privilégiée refait tous les contrôles applicatifs et
  reste `server-only`.

RLS et les droits Data API restent une défense distincte. Une requête correcte dans
le repository ne remplace pas une policy RLS, et une policy RLS ne remplace pas
l’autorisation métier du service.

## 8. Validation runtime

Les schémas Zod vivent sous `validations/<domain>/` ou à côté d’une frontière lorsque
le schéma n’a qu’un seul consommateur. Le suffixe est `.schema.ts`.

Doivent être validés :

- paramètres de route et query strings ;
- formulaires et Server Actions ;
- corps JSON et fichiers importés ;
- webhooks après vérification cryptographique ;
- variables d’environnement ;
- réponses de fournisseurs ;
- sorties structurées des agents IA ;
- payloads Trigger.dev avant rechargement de la ressource.

Règles :

- l’entrée brute est `unknown` ;
- utiliser `safeParse` lorsqu’une erreur doit être mappée vers une réponse ;
- utiliser `parse` pour une configuration qui doit échouer immédiatement ;
- normaliser explicitement chaînes vides, dates, domaines, emails et numéros ;
- limiter tailles, longueurs, collections et formats ;
- ne pas utiliser silencieusement `.passthrough()` pour une entrée externe ;
- transformer le résultat de transport vers une commande de service ;
- ne pas réutiliser une ligne DB ou un schéma fournisseur comme contrat API public.

Le premier schéma transversal est `tenantContextSchema`. Il distingue explicitement
les scopes `agency` et `client` ainsi que les acteurs utilisateur et service. Il
valide une forme ; il ne prouve pas que le membership ou la permission existe.

## 9. Erreurs métier

`DomainError` représente une erreur attendue et sûre à communiquer. Ses codes initiaux
sont :

```text
validation_failed
authentication_required
permission_denied
resource_not_found
conflict
invalid_state
tenant_mismatch
rate_limited
external_dependency_failed
```

Une erreur métier possède :

- un code stable pour les consommateurs ;
- un message public sans secret ni détail technique ;
- des détails internes optionnels, jamais sérialisés automatiquement ;
- éventuellement une cause interne conservée pour l’observabilité.

Ne pas utiliser le texte d’une exception pour décider du statut HTTP. Ne pas exposer
une erreur PostgreSQL, Supabase, fournisseur ou stack trace au navigateur.

`RepositoryError` normalise les échecs de persistance. Le service décide ensuite si
l’échec devient conflit métier, indisponibilité ou erreur inattendue.

## 10. Réponses API

Toutes les APIs JSON applicatives utilisent une union discriminée :

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "requestId": "...",
    "correlationId": "..."
  }
}
```

ou :

```json
{
  "ok": false,
  "error": {
    "code": "permission_denied",
    "message": "You are not allowed to perform this action."
  },
  "meta": {
    "requestId": "...",
    "correlationId": "..."
  }
}
```

Conventions :

- `camelCase` pour le JSON ;
- pas de ligne PostgreSQL brute ;
- pas de stack, cause, SQL, secret ou identifiant fournisseur sensible ;
- erreurs de champ uniquement pour `validation_failed` ;
- pagination dans une propriété `meta.pagination` lorsque nécessaire ;
- codes HTTP cohérents : 400 validation, 401 authentification, 403 permission/tenant,
  404 absence, 409 conflit/état, 429 limite, 502 dépendance et 500 inattendu ;
- un `requestId` identifie la requête et un `correlationId` suit le workflow complet.

Les helpers initiaux se trouvent dans `lib/api/api-response.ts`. Les Route Handlers
restent responsables de créer la vraie `Response` Next.js.

## 11. Journalisation

Les logs techniques sont structurés et produits via le contrat `Logger`. Chaque
événement utile contient au minimum :

```text
level
message
operation
correlationId
agencyId si autorisé
clientId si autorisé
actor ou identité technique
resourceType et resourceId si pertinents
```

Règles obligatoires :

- journaliser des événements et résultats, pas des dumps d’objets ;
- ne jamais enregistrer token, cookie, clé, credential, authorization header,
  contenu complet d’email, prompt brut sensible ou PII complète ;
- utiliser des attributs à faible cardinalité pour les métriques ;
- convertir une exception vers une forme sûre (`name`, code normalisé, message
  nettoyé) ;
- conserver le `correlationId` entre Next.js, Supabase, Trigger.dev et fournisseur ;
- inclure le tenant uniquement après résolution vérifiée ;
- ne pas considérer un log technique comme une preuve d’audit ;
- envoyer les actions privilégiées, approbations, changements d’état critiques et
  effets externes au domaine `audit` avec une politique de rétention séparée.

Niveaux :

- `debug` : diagnostic local sans donnée sensible ;
- `info` : étape normale importante et bornée ;
- `warn` : refus attendu, état dégradé ou action opérateur prochaine ;
- `error` : échec inattendu ou terminal exigeant investigation.

Ne pas utiliser `console.log` directement dans les futurs services et repositories.

## 12. Multitenancy dans le code

`TenantContext` est une union discriminée :

- `scope: "agency"` contient `agencyId` et aucun `clientId` implicite ;
- `scope: "client"` contient obligatoirement `agencyId` et `clientId` ;
- `actor` distingue utilisateur authentifié et identité technique.

Ce contexte est dérivé côté serveur depuis une identité vérifiée. Un payload peut
contenir des identifiants pour localiser une intention, mais il ne crée jamais un
`TenantContext` autorisé à lui seul.

Avant tout accès sensible :

1. vérifier l’identité ;
2. résoudre le membership actif ;
3. résoudre l’affectation client ;
4. vérifier la permission ;
5. charger la ressource ;
6. comparer sa portée réelle ;
7. vérifier les ressources associées.

## 13. Supabase et repositories futurs

Aucun client Supabase ni migration n’est créé dans cette étape. Lors de leur
implémentation :

- la clé publishable peut être utilisée dans un contexte navigateur uniquement avec
  RLS et privilèges minimaux correctement testés ;
- une clé `service_role` ou secrète reste serveur et contourne RLS ;
- les tables exposées exigent à la fois des `GRANT` explicites adaptés et des policies
  RLS tenant-aware ;
- `TO authenticated` seul n’est jamais une autorisation suffisante ;
- les vues exposées doivent préserver les droits de l’appelant ;
- les tests négatifs agence A/B et client A/B sont obligatoires.

Le changement Supabase annoncé en 2026 rend l’exposition des nouvelles tables
explicite via `GRANT`. Le workflow de migrations déclaratif ou impératif reste un gate
à décider avant toute création de schéma.

## 14. Tests d’architecture

À chaque vertical slice :

- tests unitaires des règles et erreurs du domaine ;
- tests des schémas sur cas valide, invalide et limites ;
- tests de services avec repositories fake ;
- tests de contrat entre repository et adaptateur ;
- tests de mapping API sans fuite de détails ;
- tests négatifs inter-tenant ;
- tests RLS locaux lorsqu’une table existe ;
- tests d’idempotence pour tout effet réessayable ;
- tests de redaction pour logs et erreurs.

La chaîne minimale du dépôt reste :

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

## 15. Références vérifiées

- [Next.js — Project structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next.js — Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Supabase — Securing your data](https://supabase.com/docs/guides/database/secure-data)
- [Supabase — Tables not exposed automatically](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
