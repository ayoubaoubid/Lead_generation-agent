# Audit final du MVP

Date : 26 juillet 2026
Périmètre : cahier des charges consolidé et prompts d’implémentation 1 à 35
Conclusion : **Internal testing ready**

## Légende

- **Implemented** : comportement présent et couvert par une preuve adaptée.
- **Partially implemented** : fondation exploitable, mais une dépendance ou un
  parcours important manque.
- **Missing** : exigence non implémentée.
- **Blocked** : dépend d’une décision ou d’un service externe absent.
- **Out of scope** : explicitement exclu du produit.

## Synthèse

Le dépôt constitue un MVP technique multi-tenant cohérent pour une agence :
Agency Owner crée l’agence et les clients, affecte les Recruiters, puis les
Recruiters opèrent le workflow sur leurs clients autorisés. Les domaines,
services, repositories, migrations, RLS, RBAC, skills versionnés et ledgers
d’idempotence sont présents.

Le produit n’est pas prêt pour une bêta : les adaptateurs réels
d’enrichissement, vérification, envoi et calendrier ne sont pas sélectionnés ni
validés ; le grand scénario E2E authentifié n’est donc pas exécutable de bout en
bout. Les tâches concernées échouent volontairement avec
`MODULE_ADAPTER_NOT_CONFIGURED` au lieu de simuler un succès.

## Matrice fonctionnelle

| Exigence | Statut | Preuves principales | Tests / risques / priorité |
|---|---|---|---|
| Fondation Next.js, React, TS strict | Implemented | `apps/web`, `package.json`, configurations | lint/typecheck/build ; P1 maintenir versions |
| Design system et shell responsive | Implemented | `components/ui`, `workspace.css`, `UX_REVIEW.md` | Playwright + axe ; revue lecteur d’écran P2 |
| Auth Supabase contrôlée | Implemented | `features/auth`, `proxy.ts`, `AUTHENTICATION.md` | tests unitaires ; SMTP production P0 |
| Hiérarchie Platform → Agency → Client | Implemented | migrations multitenant, services tenancy | pgTAP inter-tenant ; P0 |
| Deux rôles opérateurs Owner/Recruiter | Implemented | migration `simplify_operator_roles`, RBAC | tests RLS/RBAC ; P0 |
| Création agence et clients | Implemented | pages/actions agency et clients | tests services/SQL ; E2E authentifié P1 |
| Affectation Recruiters aux clients | Implemented | member actions et policies | tests permissions ; invitation réelle P1 |
| Onboarding progressif | Implemented | module onboarding, migrations, historique | tests unitaires/SQL ; UX volumétrie P2 |
| Positioning / Obviously Awesome | Implemented | services, versions, skill | tests de schéma ; qualité IA à évaluer P1 |
| Offers / 100M Offers | Implemented | services, versions, preuves | tests de schéma ; aucune preuve inventée P0 |
| ICP et Personas | Implemented | modules targeting, RLS, versions | tests services/SQL ; proposition IA P1 |
| Companies et Contacts | Implemented | domaines, repositories, écrans | tests validation/RLS ; P1 |
| Import CSV, mapping, déduplication | Implemented | module imports et `import.processCsv` | tests parser/SQL/Trigger ; gros volumes P1 |
| Enrichissement abstrait | Partially implemented | interfaces, mock, ledgers provider | fournisseur réel Blocked P0 |
| Vérification email/domaine | Partially implemented | statuts, service, opérations | fournisseur réel Blocked P0 |
| Scoring explicable/versionné | Implemented | moteur déterministe et migrations | tests reproductibilité/SQL ; P1 |
| Segmentation dynamique | Implemented | services et définition versionnée | tests règles ; rafraîchissement planifié P2 |
| Campagnes et séquences | Implemented | tables, services, UI brouillon/revue | pgTAP ; test vertical complet P0 |
| Génération/revue des messages | Implemented | versions, skills, workflow de revue | tests IA structurés ; évaluation qualité P1 |
| Validation humaine avant lancement | Implemented | statuts, permission `campaign.launch` | tests permissions ; P0 |
| Trigger.dev et ledger durable | Partially implemented | `trigger/`, `async_task_runs` | payload/idempotence testés ; adaptateurs P0 |
| Comptes d’envoi/délivrabilité | Partially implemented | tables, preflight, UI integrations | aucun secret en clair ; connexion réelle P0 |
| Envoi, relances, arrêt, retries | Partially implemented | outbound ledger et RPC atomiques | double envoi SQL testé ; provider réel P0 |
| Inbox et webhook inbound | Partially implemented | endpoint HMAC, stockage, arrêt | signature/replay testés ; classification task P0 |
| Classification/réponse IA | Partially implemented | skills reply/objection, schémas, drafts | adapter IA non câblé au task P0 |
| Meetings et SPIN | Partially implemented | modèle, UI, skill SPIN | calendrier réel Blocked P0 |
| Pipeline CRM | Implemented | pipeline configurable, Kanban, historique | tests SQL ; interactions UI avancées P2 |
| Analytics réels | Implemented | métriques quotidiennes, UI | données dépendantes du workflow ; P1 |
| Coûts techniques | Implemented | `technical_cost_entries` | idempotence fournisseur ; P1 |
| Marge et ROI financiers | Out of scope | contrats/paiements hors plateforme | aucune donnée de revenu fiable |
| Diagnose | Partially implemented | modèle de runs et skill | génération périodique non câblée P2 |
| Conformité et suppression | Implemented | ledger hashé, preflight, UI | pgTAP et blocage DB ; revue juridique P0 |
| Audit des actions sensibles | Implemented | `audit_logs`, historiques métier | couverture à maintenir P1 |
| Sécurité HTTP/API | Implemented | headers, CSRF same-origin, rate limit | E2E + pgTAP ; CSP à renforcer avec nonce P2 |
| Logs/observabilité/health | Partially implemented | logger, centre ops, `/api/health` | Sentry non activé P0 avant bêta |
| Tests unitaires et intégration | Implemented | Vitest et pgTAP | suite complète requise à chaque release P0 |
| Tests E2E publics/accessibilité | Implemented | `tests/e2e` | 5/5 ; P1 |
| Grand parcours E2E métier | Missing | scénario décrit dans `TEST_STRATEGY.md` | bloqué par providers/fixtures, P0 |
| Déploiement et runbooks | Implemented | docs production et rollback | aucun déploiement exécuté ; P0 |
| Paiement, abonnement, billing | Out of scope | interdit par `AGENTS.md` | ne pas introduire |

## Sécurité

### Points prouvés

- RLS et permissions négatives entre agences et clients ;
- résolution serveur des tenants, sans confiance dans les identifiants navigateur ;
- service role isolée côté serveur ;
- payloads Trigger validés puis ressources rechargées ;
- ledger d’idempotence concurrent ;
- webhook HMAC, fenêtre anti-replay, déduplication, limite 256 KiB et rate limit ;
- uploads CSV limités à 6 MiB et 250 000 lignes déclarées ;
- blocage en base des destinataires invalides, désabonnés ou supprimés ;
- logs structurés avec masquage des attributs sensibles ;
- sorties IA structurées et validation humaine obligatoire.

### Risques résiduels

1. La CSP protège `base-uri`, `form-action`, `frame-ancestors` et `object-src`,
   mais une CSP stricte à nonce pour scripts/styles reste à concevoir avec Next.js.
2. Sentry n’est que préparé ; aucune alerte externe n’est active.
3. Les webhooks utilisent un format générique qui doit être remplacé par la
   signature officielle du fournisseur retenu.
4. La configuration juridique dépend des pays, sources et canaux du pilote.
5. Le rate limit conserve les compteurs expirés jusqu’à une purge planifiée ;
   l’index d’expiration existe, mais le cron de purge n’est pas configuré.
6. `npm audit --omit=dev` signale encore 22 vulnérabilités transitives, dont
   7 élevées, dans les arbres Next.js/Sharp/PostCSS et
   Trigger.dev/OpenTelemetry/Socket.IO. Next.js a été corrigé vers 16.2.12 et
   Vitest vers 3.2.7 ; les corrections restantes proposées par npm imposent des
   downgrades ou overrides risqués et bloquent la production jusqu’à une version
   amont compatible.

## Agents IA et skills

Les skills sont versionnés, documentés, validés par Zod et associés à des agents
autorisés. Les skills commerciaux comprennent notamment Diagnose, Mom Test,
Four Steps, Obviously Awesome, 100M Offers, 100M Leads, StoryBrand,
Made to Stick, SPIN Selling, personnalisation cold email, revue conformité,
classification de réponse et traitement des objections.

Dette prioritaire :

- brancher `reply.processInbound` au classifieur avec validation humaine ;
- brancher les tâches d’enrichissement et de vérification aux adaptateurs retenus ;
- stocker et afficher les évaluations de qualité réelles par skill ;
- définir budgets modèles, limites par tenant et politique de fallback ;
- effectuer des tests d’injection sur corpus externe représentatif.

## Preuves de test

Suites disponibles :

- Vitest : domaine, validations, services, repositories, sécurité, agents ;
- pgTAP : fondation, multitenancy, RBAC, clients, onboarding, stratégie, ciblage,
  imports, enrichissement, scoring, campagnes, messages et opérations ;
- Playwright/axe : routes publiques, clavier, responsive, WCAG, headers ;
- typecheck séparé Web et Trigger.dev.

Le rapport final de commandes exécutées doit être lu avec le dernier résultat CI
ou local. Une commande non exécutée n’est pas considérée réussie.

Dernière vérification locale de cet audit :

- Prettier : tous les fichiers conformes ;
- ESLint : aucune erreur ni warning ;
- TypeScript : Web et Trigger.dev réussis ;
- Vitest : 48 fichiers, 154 tests réussis ;
- pgTAP : 15 fichiers, 230 tests réussis ;
- Playwright/axe : 5 tests réussis ;
- Supabase `db lint --level warning` : aucune anomalie ;
- Next.js production build : compilation, types et 12 pages statiques réussis.
- audit dépendances production : non conforme pour la production, risque
  transitif documenté ci-dessus.

## Conditions pour passer à Beta ready

Priorité P0 :

1. choisir et implémenter les fournisseurs email, inbound, vérification,
   enrichissement et calendrier ;
2. configurer un staging séparé avec SMTP, domaines et webhooks ;
3. rendre fonctionnelles les tâches Trigger actuellement bloquées ;
4. exécuter le grand parcours E2E avec deux agences et des comptes de test ;
5. activer Sentry/alertes et tester un incident ;
6. réaliser une restauration Supabase ;
7. obtenir la validation juridique/délivrabilité du périmètre pilote ;
8. exécuter la checklist production sans exception P0.

## Recommandation finale

**Internal testing ready**

Le socle est suffisamment structuré pour des tests internes et pour connecter
les fournisseurs. Il ne faut pas lancer de campagne réelle, inviter des clients
pilotes externes ni déclarer le produit Beta/Production ready avant la levée des
conditions P0 ci-dessus.
