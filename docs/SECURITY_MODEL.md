# Modèle de sécurité

## Principes

La hiérarchie est `Platform → Agency → Client → Resource`. Toute décision
d’autorisation combine identité Supabase vérifiée, membership actif, affectation
client ou héritage Agency Owner, permission atomique et tenant réel de la
ressource.

Les identifiants reçus du navigateur, d’un webhook ou de Trigger.dev sont des
locators non fiables. Les services et tâches rechargent la ressource puis comparent
les tenants et relations associés.

## Frontières

### Navigateur

- clé Supabase publishable uniquement ;
- cookies de session gérés par SSR ;
- Server Actions et routes valident Zod et permissions ;
- mutations same-origin lorsque la session navigateur est utilisée ;
- aucun module admin ou secret importé dans un composant client.

### Supabase

- RLS activée sur les tables exposées ;
- `GRANT` minimal, distinct des policies ;
- utilisateurs généralement en lecture directe ;
- mutations sensibles via RPC autorisées et auditables ;
- fonctions service-role-only pour tâches, webhooks et effets externes ;
- clés étrangères composites empêchant les associations cross-tenant.

### Trigger.dev

- payload strict et minimal ;
- ressource rechargée avec vérification tenant et acteur ;
- idempotence globale Trigger plus registre durable Supabase ;
- erreurs classées et redacted ;
- files et concurrence bornées ;
- aucun succès simulé lorsque l’adaptateur fournisseur manque.

### IA

- contenu externe traité comme donnée non fiable ;
- prompts et skills versionnés ;
- entrées/sorties structurées et validées ;
- faits distingués des hypothèses ;
- modèle, tokens, coût et traces conservés ;
- aucun envoi, rendez-vous, suppression ou permission exécuté par une sortie IA.

## Secrets

Les secrets sont server-only et ne commencent jamais par `NEXT_PUBLIC_`.
Les tables `sending_accounts` et `calendar_connections` contiennent une référence
opaque vers un secret manager, pas le secret. Les logs redigent les attributs
dont les clés indiquent email, payload, token, cookie, secret ou contenu.

## Webhooks

L’adaptateur générique entrant utilise HMAC SHA-256 de `timestamp.body`, comparaison
constant-time, fenêtre anti-replay de cinq minutes, hash du payload et identifiant
fournisseur unique. Le tenant est résolu depuis `outbound_messages`. Le corps est
limité à 256 KiB et un compteur Postgres atomique limite le débit par fournisseur
et origine sans conserver l’adresse en clair.

Un fournisseur concret peut imposer une autre signature. Son adaptateur devra
être implémenté et testé contre sa documentation officielle avant production.

## Contrôles critiques

- campagne approuvée par `campaign.launch` ;
- message approuvé humainement ;
- délivrabilité passée ;
- compte connecté et sous quota ;
- email vérifié et non supprimé ;
- arrêt de séquence revalidé juste avant envoi ;
- idempotence fournisseur et base.

## Risques résiduels connus

- aucun gestionnaire de secrets externe n’est encore branché ;
- la purge planifiée des fenêtres de rate limiting expirées n’est pas configurée ;
- l’adaptateur webhook est générique et pas validé contre un fournisseur choisi ;
- les tâches fournisseurs autres que l’import refusent l’exécution tant que les
  adaptateurs ne sont pas configurés ;
- Sentry est préparé par variable, mais le SDK et les alertes ne sont pas activés ;
- la CSP protège les directives structurelles ; une stratégie stricte à nonce
  pour scripts/styles reste à concevoir et à vérifier sur l’hébergement final ;
- l’audit npm conserve des alertes transitives élevées dans les arbres Next.js
  et Trigger.dev ; aucun `--force` ou downgrade incompatible n’a été appliqué ;
- les scénarios E2E avec services réels ne sont pas exécutables sans sandbox.
