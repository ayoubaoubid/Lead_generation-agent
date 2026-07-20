# Plan d’implémentation

## 1. Statut et finalité

Ce document transforme le cahier des charges consolidé et les décisions d’architecture existantes en plan d’exécution. Il ne constitue pas une autorisation de développer, d’installer des dépendances, de créer ou d’appliquer une migration, de configurer un fournisseur ou d’envoyer des données réelles.

Le produit est livré comme un **monolithe modulaire** par vertical slices. Chaque slice comprend, lorsque pertinent : contrat, modèle de données, migration locale, RLS, service applicatif, UI minimale, orchestration, audit, coûts et tests. La durée indicative d’un sprint est de deux semaines ; elle doit être recalibrée selon la taille et la disponibilité réelles de l’équipe.

## 2. Sources et priorité

Le plan respecte, dans cet ordre :

1. `AGENTS.md` et `CODEX.md` ;
2. `CAHIER DES CHARGES CONSOLIDÉ lead_generation.txt` ;
3. `docs/PROJECT_ANALYSIS.md` ;
4. `docs/ARCHITECTURE_PRINCIPLES.md` ;
5. `docs/DEVELOPMENT_WORKFLOW.md` et `docs/NAMING_CONVENTIONS.md` ;
6. les documents outils, fournisseurs, secrets et coûts ;
7. l’ancien cahier et `founder-playbook` comme références secondaires.

En cas de contradiction, le cahier consolidé et les décisions d’architecture approuvées priment sur l’ancien cahier. Les frameworks commerciaux assistent les services métier ; ils ne définissent ni autorisations, ni transitions, ni effets externes.

## 3. Hypothèses de planification

- MVP piloté avec un fournisseur actif par capacité : Groq, Apollo, Firecrawl, ZeroBounce, Resend, Gmail et Google Calendar.
- Supabase Cloud, Trigger.dev Cloud et Vercel sont les cibles prévues, sous réserve de validation des régions, contrats et comptes.
- L’email est le seul canal de prospection automatisé du MVP.
- Le CRM du MVP est interne ; aucune synchronisation CRM externe n’est requise pour l’acceptation initiale.
- Le produit est opéré par une agence et ne propose aucun achat ou abonnement en libre-service.
- Les contrats et règlements sont conclus hors plateforme ; un administrateur d'agence crée manuellement chaque client et son workspace.
- Stripe, paiement en ligne, checkout, billing, plans tarifaires, abonnements SaaS et toute abstraction de paiement sont définitivement exclus, y compris après le MVP actuel.
- Les crédits, budgets, coûts et quotas du plan concernent uniquement la consommation technique des fournisseurs externes.
- La validation humaine reste obligatoire pour les messages et le démarrage des campagnes pilotes.
- Les tests utilisent des fakes ; les tests live sont séparés, opt-in, plafonnés et protégés.
- Turborepo n’est ajouté que si la structure réellement retenue contient plusieurs workspaces justifiés.
- Les chemins proposés dans ce document sont des cibles de conception. Leur création attend la phase concernée.

## 4. Gates bloquants avant développement

Le Sprint 0 doit obtenir des décisions explicites sur :

1. pays, langues, segments et contexte B2B du pilote ;
2. plateforme mono-agence au pilote ou multi-agence dès le premier déploiement ;
3. accès d’un membre d’agence à tous les clients ou seulement aux clients affectés ;
4. rôles fixes ou personnalisables, cumul et portée des rôles ;
5. rôle opérateur plateforme et procédure d’accès support ;
6. matrice complète ressource × action × rôle × scope ;
7. régions et environnements Vercel, Supabase, Trigger.dev et fournisseurs ;
8. workflow Supabase déclaratif ou impératif ;
9. frontière des accès directs navigateur/Supabase ;
10. stratégie de révocation immédiate des memberships et sessions ;
11. machines d’état des imports, campagnes, enrollments, messages, envois, replies, meetings et opportunités ;
12. seuils de conformité, délivrabilité, quotas et budgets ;
13. bases juridiques, information, opposition et rétention applicables ;
14. coffre/KMS pour les credentials tenant ;
15. scopes Google et processus de validation OAuth ;
16. RPO, RTO, sauvegardes et procédure de restauration ;
17. critère de réussite chiffré du pilote et volumes maximaux autorisés.

Un sujet non tranché peut être remplacé par un fake ou rester hors scope, mais il ne doit pas être implémenté sur la base d’une règle inventée.

## 5. Roadmap synthétique

| Phase | Sprints | Résultat principal |
|---|---:|---|
| 0. Cadrage exécutable | 0 | décisions, backlog, modèles d’état et critères du pilote |
| 1. Fondation du dépôt et design system | 1–2 | dépôt reproductible, CI et primitives UI accessibles |
| 2. Supabase local et authentification | 3–4 | workflow de migrations local et sessions sécurisées |
| 3. Multitenancy, RBAC, agences et clients | 5–6 | isolation complète et administration des tenants |
| 4. Stratégie client | 7–9 | onboarding, positionnement, offres, ICP et personas versionnés |
| 5. Socle de données leads | 10–11 | entreprises, contacts et import CSV traçable |
| 6. Orchestration et gouvernance fournisseurs | 12 | Trigger.dev, outbox, runs, ports, audit et coûts minimaux |
| 7. Qualité et qualification | 13–14 | enrichissement, vérification, scoring et segmentation |
| 8. Campagnes assistées | 15–16 | campagnes, séquences, IA et validation humaine |
| 9. Comptes d’envoi et préflight | 17 | OAuth Gmail et gates délivrabilité/conformité |
| 10. Envoi, relances et réponses | 18–19 | campagne limitée idempotente et inbox synchronisée |
| 11. Rendez-vous et CRM interne | 20 | rendez-vous, tâches et pipeline d’opportunités |
| 12. Analytics, coûts et audit | 21 | pilotage explicable par agence et client |
| 13. Industrialisation et déploiement | 22–23 | sécurité, conformité, monitoring et release contrôlée |

## 6. Couverture des exigences

| # | Domaine demandé | Phase / sprint |
|---:|---|---|
| 1 | Fondation du dépôt | Phase 1 / S1 |
| 2 | Design system | Phase 1 / S2 |
| 3 | Supabase local et migrations | Phase 2 / S3 |
| 4 | Authentification | Phase 2 / S4 |
| 5 | Multitenancy | Phase 3 / S5 |
| 6 | RBAC | Phase 3 / S6 |
| 7 | Agences | Phase 3 / S5–S6 |
| 8 | Clients | Phase 3 / S6 |
| 9 | Onboarding | Phase 4 / S7 |
| 10 | Positionnement | Phase 4 / S8 |
| 11 | Offres | Phase 4 / S8 |
| 12 | ICP | Phase 4 / S9 |
| 13 | Personas | Phase 4 / S9 |
| 14 | Entreprises | Phase 5 / S10 |
| 15 | Contacts | Phase 5 / S10 |
| 16 | Import de données | Phase 5 / S11 |
| 17 | Enrichissement | Phase 7 / S13 |
| 18 | Vérification | Phase 7 / S13 |
| 19 | Scoring | Phase 7 / S14 |
| 20 | Segmentation | Phase 7 / S14 |
| 21 | Campagnes | Phase 8 / S15 |
| 22 | Séquences | Phase 8 / S15 |
| 23 | Messages IA | Phase 8 / S16 |
| 24 | Validation humaine | Phase 8 / S16 |
| 25 | Trigger.dev | Phase 6 / S12 puis toutes les phases asynchrones |
| 26 | Comptes d’envoi | Phase 9 / S17 |
| 27 | Envoi et relances | Phase 10 / S18 |
| 28 | Réponses | Phase 10 / S19 |
| 29 | Rendez-vous | Phase 11 / S20 |
| 30 | Pipeline CRM | Phase 11 / S20 |
| 31 | Analytics | Phase 12 / S21 |
| 32 | Coûts | Phase 6 / S12 et Phase 12 / S21 |
| 33 | Audit | Phase 3 / S5, Phase 6 / S12 et Phase 12 / S21 |
| 34 | Conformité | transversal, gates S0/S17/S22 |
| 35 | Tests | chaque sprint et campagne S22 |
| 36 | Monitoring | socle S1/S12, finalisation S22 |
| 37 | Déploiement | previews dès S1, staging/prod S23 |

## 7. Definition of Ready commune

Une tâche entre en développement seulement si :

- son résultat observable et ses critères d’acceptation sont écrits ;
- les rôles, tenants et ressources concernés sont identifiés ;
- les décisions produit/juridiques nécessaires sont approuvées ;
- le contrat ou schéma impacté est connu ;
- les cas de refus et d’échec sont listés ;
- les effets externes, coûts et secrets sont identifiés ;
- la stratégie de test et, si nécessaire, de migration/récupération est définie ;
- aucun prérequis de phase antérieure n’est encore ouvert.

## 8. Definition of Done commune

Une tâche est terminée seulement si :

- le comportement demandé et aucun comportement voisin non demandé sont livrés ;
- TypeScript strict, lint et formatage applicables passent ;
- tests unitaires, intégration, RLS et E2E proportionnels au risque passent ;
- les refus inter-tenant sont testés pour toute nouvelle surface ;
- entrées, sorties, erreurs, statuts et transitions sont validés ;
- secrets et PII sont absents des logs et bundles clients ;
- les effets externes sont idempotents et simulables ;
- audit, corrélation, usage et coût sont enregistrés lorsqu’applicables ;
- documentation et ADR durable sont à jour ;
- le diff a été relu et aucune migration distante/action réelle non autorisée n’a eu lieu.

---

# Phase 0 — Cadrage exécutable

## Objectif

Transformer les décisions ouvertes en contrats exécutables avant de figer le dépôt ou la base.

## Dépendances

Aucune dépendance technique. Décisions produit, sécurité, juridique, finance et opérations requises.

## Sprint 0 — Décisions, modèles et backlog

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P0-S0-T01 | Figer le périmètre du pilote | fiche pays/langues/segments/volumes/canal |
| P0-S0-T02 | Approuver la matrice RBAC | matrice ressource/action/scope/rôle |
| P0-S0-T03 | Approuver la hiérarchie tenant | règles plateforme/agence/client et partage |
| P0-S0-T04 | Dessiner les machines d’état | diagrammes et transitions avec refus |
| P0-S0-T05 | Choisir le workflow Supabase | ADR déclaratif ou impératif |
| P0-S0-T06 | Choisir régions et environnements | ADR hébergement et résidence |
| P0-S0-T07 | Définir conformité et rétention initiales | politique validée par responsable compétent |
| P0-S0-T08 | Définir quotas et gates de délivrabilité | configuration initiale approuvée |
| P0-S0-T09 | Définir coffre, scopes OAuth et owners | décision secrets/comptes/rotation |
| P0-S0-T10 | Définir SLO, RPO, RTO et runbooks requis | objectifs d’exploitation mesurables |
| P0-S0-T11 | Prioriser le backlog vertical | stories dépendancées et estimées |

## Modules ou fichiers concernés

`docs/decisions/`, modèles d’état, matrice RBAC, registre de traitement, backlog produit. Aucun fichier applicatif.

## Tables concernées

Aucune table créée. Le modèle conceptuel de toutes les tables tenant-aware est validé.

## Risques

Décisions reportées, faux consensus, MVP trop large, règle juridique inventée, architecture guidée par un fournisseur.

## Tests nécessaires

Revue de cohérence par scénarios : agence A/B, client A/B, utilisateur désactivé, retry d’envoi, réponse reçue avant relance, suppression/opposition et dépassement de budget.

## Critères d’acceptation

- Les 17 gates de la section 4 ont un owner et une décision.
- Chaque workflow critique possède une machine d’état et une règle d’idempotence.
- Le pilote a un critère de succès et une limite de volume.

## Terminé lorsque

Les ADR bloquants sont approuvés, le backlog respecte le chemin critique et aucune équipe n’a besoin d’inventer une permission, un seuil ou une règle juridique.

---

# Phase 1 — Fondation du dépôt et design system

## Objectif

Créer un environnement reproductible, une chaîne qualité et une base UI accessible sans introduire de logique métier.

## Dépendances

Phase 0 : structure monolithe/monorepo, environnements, stratégie de déploiement et standards UI.

## Sprint 1 — Fondation du dépôt

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P1-S1-T01 | Initialiser pnpm et épingler sa version | manifeste minimal et lockfile |
| P1-S1-T02 | Créer l’application Next.js App Router en TypeScript strict | build local minimal |
| P1-S1-T03 | Ajouter Turborepo seulement si l’ADR le justifie | graphe workspace ou décision de non-usage |
| P1-S1-T04 | Configurer ESLint et Prettier | commandes reproductibles |
| P1-S1-T05 | Configurer Vitest et Playwright | un test unitaire et un smoke E2E |
| P1-S1-T06 | Définir la validation des variables d’environnement | démarrage en échec sûr sans valeur |
| P1-S1-T07 | Créer Docker local minimal | application démarrable sans secret réel |
| P1-S1-T08 | Créer GitHub Actions | lint, types, tests et build sur PR |
| P1-S1-T09 | Configurer secret scanning et mises à jour contrôlées | checks supply-chain actifs |
| P1-S1-T10 | Préparer previews Vercel sans production | preview sans secrets de production |

## Sprint 2 — Design system

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P1-S2-T01 | Définir tokens couleur, typographie, espace et radius | tokens documentés |
| P1-S2-T02 | Créer primitives Button, Input, Select et Textarea | catalogue de variantes accessible |
| P1-S2-T03 | Créer FormField et messages d’erreur | association labels/erreurs testée |
| P1-S2-T04 | Créer Table, Badge, Alert, Dialog et Toast | états vide/loading/error inclus |
| P1-S2-T05 | Créer shell responsive et navigation placeholder | clavier et mobile vérifiés |
| P1-S2-T06 | Définir i18n et formats date/nombre/fuseau | conventions et helpers testés |
| P1-S2-T07 | Ajouter tests visuels/accessibilité de base | absence d’erreurs critiques sur primitives |

## Modules ou fichiers concernés

`apps/web/` ou `app/`, `components/`, `packages/ui/` si justifié, configurations TypeScript/ESLint/Prettier/Vitest/Playwright, `.github/workflows/`, fichiers Docker et Vercel.

## Tables concernées

Aucune.

## Risques

Monorepo prématuré, dépendances non épinglées, design system surdimensionné, secrets dans les previews, composants non accessibles.

## Tests nécessaires

Build, typecheck, lint, tests unitaires, smoke E2E, navigation clavier, contraste, responsive et vérification du bundle client.

## Critères d’acceptation

- Un clone propre s’installe et exécute les checks documentés.
- Une PR est bloquée si lint, types, tests ou build échouent.
- Les primitives couvrent états nominal, disabled, loading et error.
- Aucun secret serveur n’est disponible dans une preview non protégée.

## Terminé lorsque

La CI et le smoke E2E passent depuis un environnement propre, les versions sont épinglées et le design system est suffisant pour les écrans des deux phases suivantes.

---

# Phase 2 — Supabase local et authentification

## Objectif

Établir un workflow local de schéma versionné puis une authentification serveur sûre, sans encore accorder d’accès métier.

## Dépendances

Phases 0–1 ; décision migration déclarative/impérative ; stratégie de session et révocation.

## Sprint 3 — Supabase local et migrations

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P2-S3-T01 | Épingler et documenter Supabase CLI | version et commandes découvertes via `--help` |
| P2-S3-T02 | Initialiser la configuration locale | stack locale isolée démarrable |
| P2-S3-T03 | Implémenter le workflow de schéma approuvé | premier diff/migration reproductible |
| P2-S3-T04 | Définir extensions et schémas exposés/privés | décision et GRANT minimaux |
| P2-S3-T05 | Créer conventions de migrations et récupération | checklist de revue et rollback/recovery |
| P2-S3-T06 | Configurer génération des types DB | types reproductibles et diff contrôlé |
| P2-S3-T07 | Préparer fixtures synthétiques | seed sans PII réelle |
| P2-S3-T08 | Ajouter tests SQL/RLS locaux et advisors | pipeline local échouant sur policy incorrecte |

## Sprint 4 — Authentification

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P2-S4-T01 | Configurer clients Supabase navigateur/serveur | séparation explicite des clés |
| P2-S4-T02 | Implémenter inscription selon politique pilote | compte créé sans rôle auto-déclaré |
| P2-S4-T03 | Implémenter connexion et déconnexion | cookies/session SSR vérifiés |
| P2-S4-T04 | Implémenter récupération de compte | flow transactionnel sécurisé |
| P2-S4-T05 | Protéger routes et mutations côté serveur | redirection/refus cohérents |
| P2-S4-T06 | Implémenter révocation/désactivation approuvée | action sensible refusée immédiatement |
| P2-S4-T07 | Ajouter MFA si requis par la politique | challenge et récupération testés |
| P2-S4-T08 | Journaliser événements Auth utiles | aucune session/token dans les logs |

## Modules ou fichiers concernés

`supabase/config.toml`, `supabase/schemas/` ou `supabase/migrations/`, `supabase/tests/`, package database, modules `auth/`, middleware/proxy Next.js selon la version retenue, routes publiques et formulaires d’authentification.

## Tables concernées

`auth.users` géré par Supabase ; profils applicatifs minimaux, invitations/sessions seulement si le modèle approuvé les exige. Aucune donnée d’autorisation dans `user_metadata`.

## Risques

Commande CLI devinée, historique de migrations incohérent, table exposée sans RLS, `service_role` côté client, JWT obsolète, enumeration de comptes, boucle de redirect.

## Tests nécessaires

Montée locale depuis zéro, vérification migrations, advisors, inscription/connexion/déconnexion/récupération, cookies SSR, route protégée, utilisateur désactivé, CSRF/rate limit et absence de secret dans le bundle.

## Critères d’acceptation

- Un développeur recrée la base locale depuis Git.
- Les tables exposées ont GRANT et RLS explicitement revus.
- L’authentification n’accorde aucune permission métier implicite.
- Un utilisateur révoqué ne peut plus effectuer une opération sensible selon la stratégie approuvée.

## Terminé lorsque

La CI valide l’état local, les tests Auth passent et aucune migration ni configuration distante n’a été appliquée hors procédure approuvée.

---

# Phase 3 — Multitenancy, RBAC, agences et clients

## Objectif

Construire la frontière de sécurité plateforme → agence → client et prouver l’absence d’accès croisé avant toute donnée commerciale.

## Dépendances

Phase 2 ; matrice RBAC, rôle opérateur, partage agence/client et révocation approuvés.

## Sprint 5 — Tenancy et agences

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P3-S5-T01 | Créer le modèle `agencies` | contrainte et statut d’agence |
| P3-S5-T02 | Créer `agency_members` et invitations | états et unicité membership |
| P3-S5-T03 | Implémenter création d’agence atomique | owner et audit dans une transaction |
| P3-S5-T04 | Implémenter résolution serveur du contexte agence | aucun `agencyId` client accepté comme preuve |
| P3-S5-T05 | Écrire policies RLS agence | CRUD autorisés/refusés séparément |
| P3-S5-T06 | Ajouter contraintes tenant-aware de base | associations inter-agences impossibles |
| P3-S5-T07 | Créer journal d’audit minimal append-only | acteur, tenant, action, ressource, corrélation |
| P3-S5-T08 | Tester agence A contre agence B | suite négative automatisée |

## Sprint 6 — Clients et RBAC

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P3-S6-T01 | Créer `clients` et `client_members` | scope client et statuts opérationnels `draft`, `onboarding`, `active`, `paused`, `archived` |
| P3-S6-T02 | Créer rôles, permissions et associations | matrice approuvée persistée |
| P3-S6-T03 | Implémenter service d’autorisation | décision par identité/membership/scope/action |
| P3-S6-T04 | Implémenter création manuelle, activation, pause et archivage client | administrateur autorisé, transitions opérationnelles et audit |
| P3-S6-T05 | Implémenter affectation des membres | contrôle de délégation et révocation |
| P3-S6-T06 | Écrire policies RLS client | client A/B et agence A/B isolés |
| P3-S6-T07 | Créer UI agence, membres, clients et rôles minimale | opérations autorisées seulement |
| P3-S6-T08 | Tester owner/admin/reviewer/viewer/disabled | matrice positive et négative |

## Modules ou fichiers concernés

Modules `identity-tenancy/`, `permissions/`, pages agence/clients/settings, services d’autorisation, repositories, schémas runtime, migrations/policies/tests Supabase et audit.

## Tables concernées

`agencies`, `agency_members`, `clients`, `client_members`, `invitations`, `roles`, `permissions`, `role_permissions`, associations de rôles/scopes, `audit_logs`.

## Risques

Fuite inter-tenant, couple agence/client incohérent, rôle trop large, policy `TO authenticated` permissive, UPDATE sans `WITH CHECK`, révocation tardive, support plateforme non audité.

## Tests nécessaires

Tests unitaires de permission, tests RLS CRUD par rôle/scope, substitution d’identifiants, association inter-tenant, utilisateur désactivé, invitation expirée/rejouée, concurrence de création et E2E création agence → client → invitation.

## Critères d’acceptation

- Deux agences et au moins deux clients par agence restent isolés sur chaque opération.
- Un reviewer peut approuver les ressources prévues mais ne peut pas administrer.
- Un viewer ne peut effectuer aucune mutation.
- Une identité technique doit suivre le même contrôle de tenant dans le service.
- Aucun client ne peut s'auto-inscrire, choisir un plan ou activer son workspace par un paiement.

## Terminé lorsque

Les tests négatifs inter-tenant et la matrice RBAC complète passent en CI, l’audit permet d’attribuer chaque mutation et aucune ressource client-scoped ne peut être liée à un autre tenant.

---

# Phase 4 — Stratégie client : onboarding, positionnement, offres, ICP et personas

## Objectif

Transformer les informations vérifiées d’un client en stratégie commerciale versionnée et approuvée, sans utiliser l’IA comme source d’autorité.

## Dépendances

Phase 3 ; politique de versionnement, provenance, approbation et rétention documentaire.

## Sprint 7 — Onboarding

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P4-S7-T01 | Définir le schéma d’onboarding versionné | sections, statut et complétude |
| P4-S7-T02 | Créer sessions et réponses d’onboarding | brouillon/reprise/soumission |
| P4-S7-T03 | Ajouter documents et preuves tenant-aware | Storage avec paths et policies testés |
| P4-S7-T04 | Implémenter checklist des informations manquantes | calcul déterministe explicable |
| P4-S7-T05 | Intégrer l’Onboarding Agent en fake | sortie structurée sans effet automatique |
| P4-S7-T06 | Ajouter validation et approbation humaine | historique de versions et commentaires |
| P4-S7-T07 | Construire le parcours UI onboarding | autosave et erreurs récupérables |

## Sprint 8 — Positionnement et offres

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P4-S8-T01 | Créer profils de positionnement versionnés | alternatives, valeur, catégorie, segments |
| P4-S8-T02 | Créer offres et versions | état draft/approved/archived |
| P4-S8-T03 | Créer preuves avec provenance | source et autorisation d’usage |
| P4-S8-T04 | Créer objections et réponses approuvées | lien à une version d’offre |
| P4-S8-T05 | Adapter Obviously Awesome | sortie structurée révisable |
| P4-S8-T06 | Adapter 100M Offers | promesses/preuves/garanties séparées |
| P4-S8-T07 | Ajouter Mom Test/Four Steps en préparation | guides et hypothèses, pas de faits inventés |
| P4-S8-T08 | Créer UI de comparaison et approbation | diff entre versions visible |

## Sprint 9 — ICP et personas

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P4-S9-T01 | Créer ICP et versions | critères, exclusions et statut |
| P4-S9-T02 | Créer critères ICP typés | opérateurs, valeurs et poids validés |
| P4-S9-T03 | Créer personas et rôles d’achat | décision/influence/usage explicites |
| P4-S9-T04 | Implémenter test d’ICP sur exemples | résultat déterministe détaillé |
| P4-S9-T05 | Intégrer ICP/Persona Agents en fake | recommandations structurées |
| P4-S9-T06 | Lier offre, positionnement, ICP et personas | cohérence tenant garantie |
| P4-S9-T07 | Construire UI édition/version/approbation | historique et rollback logique |

## Modules ou fichiers concernés

Modules `client-strategy/`, `onboarding/`, `positioning/`, `offers/`, `icps/`, `personas/`, adaptateurs Storage, ports IA, prompts/skills versionnés, pages correspondantes et tests.

## Tables concernées

`onboarding_sessions`, `onboarding_answers`, `client_documents`, `positioning_profiles`, `positioning_versions`, `offers`, `offer_versions`, `offer_proofs`, `offer_objections`, `icps`, `icp_versions`, `icp_criteria`, `personas`, `persona_versions`, approbations et audit.

## Risques

Schéma trop rigide, IA inventant des preuves, garantie non autorisée, version approuvée modifiée en place, document Storage exposé, confusion hypothèse/fait.

## Tests nécessaires

Validation des schémas, version immuable après approbation, RLS documents et données, Storage inter-tenant, sortie IA invalide/injection, provenance manquante, permissions de reviewer et E2E onboarding → offre → ICP.

## Critères d’acceptation

- Une version approuvée est immuable et remplaçable par une nouvelle version.
- Toute preuve possède une source et un statut d’utilisation.
- Un ICP peut être testé et explique chaque critère satisfait/refusé.
- L’IA ne peut publier ni approuver une stratégie.

## Terminé lorsque

Un client autorisé complète l’onboarding, l’agence approuve positionnement/offre/ICP/personas, et les autres tenants ne peuvent ni lire ni réutiliser ces données.

---

# Phase 5 — Entreprises, contacts et import de données

## Objectif

Créer un socle de leads canonique, traçable et dédupliqué avant tout appel d’enrichissement payant.

## Dépendances

Phases 3–4 ; modèle canonique entreprise/contact, politique de provenance et règles de déduplication.

## Sprint 10 — Entreprises et contacts

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P5-S10-T01 | Créer le modèle canonique `companies` | domaine normalisé et statut |
| P5-S10-T02 | Créer `company_sources` | provenance par champ/observation |
| P5-S10-T03 | Créer le modèle canonique `contacts` | personne liée à une entreprise tenant-safe |
| P5-S10-T04 | Créer `contact_sources` | fait/extrait/estimation/hypothèse |
| P5-S10-T05 | Implémenter normalisation domaine/email/téléphone | fonctions pures testées |
| P5-S10-T06 | Implémenter déduplication entreprises | candidats et décision auditée |
| P5-S10-T07 | Implémenter déduplication contacts | clés normalisées et conflits |
| P5-S10-T08 | Créer listes/fiches entreprises et contacts | filtres tenant-aware et pagination |

## Sprint 11 — Import CSV

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P5-S11-T01 | Définir format et limites d’import | taille, colonnes, encodage et MIME |
| P5-S11-T02 | Créer upload Storage tenant-aware | fichier isolé et scannable |
| P5-S11-T03 | Créer prévisualisation et mapping colonnes | aucune écriture métier |
| P5-S11-T04 | Valider chaque ligne avec schéma runtime | erreurs localisées et exportables |
| P5-S11-T05 | Persister import et lignes staging | reprise sans doublon |
| P5-S11-T06 | Importer par lot idempotent | compteurs created/updated/skipped/failed |
| P5-S11-T07 | Appliquer normalisation/déduplication | conflits explicites, jamais écrasés silencieusement |
| P5-S11-T08 | Ajouter annulation et rapport d’import | état terminal et audit |
| P5-S11-T09 | Tester fichiers malveillants et CSV injection | contenu neutralisé |

## Modules ou fichiers concernés

Modules `lead-data-operations/companies`, `contacts`, `imports`, `normalization`, `deduplication`, pages entreprises/contacts/imports, Storage, repositories, validations et tests.

## Tables concernées

`companies`, `company_sources`, `contacts`, `contact_sources`, `leads` si retenu comme agrégat distinct, `imports`, `import_files`, `import_rows`, `deduplication_candidates`, audit.

## Risques

Écrasement de données plus fiables, faux merge, CSV injection, fichier trop volumineux, import inter-tenant, PII réelle en test, association contact/entreprise incohérente.

## Tests nécessaires

Normalisation locale/internationale, doublons exacts/flous, import partiel, reprise, annulation, fichier invalide, encodage, colonnes inconnues, Storage RLS, conflit inter-tenant et E2E import → listes.

## Critères d’acceptation

- Chaque valeur externe garde source, date et classification.
- Un même fichier rejoué ne duplique pas les ressources.
- Les erreurs de ligne n’annulent pas les lignes valides selon la politique approuvée.
- L’utilisateur voit un rapport complet avant et après import.

## Terminé lorsque

Une liste synthétique peut être importée, normalisée, dédupliquée et consultée avec provenance complète et isolation agence/client prouvée.

---

# Phase 6 — Trigger.dev et gouvernance des fournisseurs

## Objectif

Installer l’infrastructure asynchrone, l’outbox et les contrôles transversaux avant le premier workflow payant.

## Dépendances

Phases 1–5 ; décisions idempotence/outbox, queues, secrets, coûts, fournisseurs et environnements.

## Sprint 12 — Orchestration durable

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P6-S12-T01 | Configurer Trigger.dev par environnement | tâche smoke sans effet externe |
| P6-S12-T02 | Définir schéma commun de payload | tenant, actor, resource, idempotence, corrélation |
| P6-S12-T03 | Créer outbox transactionnelle | intention et état écrits atomiquement |
| P6-S12-T04 | Créer publisher et réconciliateur outbox | événements orphelins repris |
| P6-S12-T05 | Créer journal interne des runs | statut, tentative, erreur, timestamps |
| P6-S12-T06 | Définir queues et fair-concurrency | limites plateforme/tenant/provider |
| P6-S12-T07 | Créer taxonomie d’erreurs/retry | réessayable/définitive/intervention |
| P6-S12-T08 | Créer les sept ports fournisseurs | aucun SDK dans le domaine |
| P6-S12-T09 | Créer les sept mocks contractuels | succès, timeout, quota et erreur |
| P6-S12-T10 | Créer résolution de `credentialRef` fake | aucune valeur secrète en payload/log |
| P6-S12-T11 | Créer réservation d’usage/coût minimale | estimation, finalisation, release |
| P6-S12-T12 | Instrumenter corrélation et Sentry minimal | trace sans PII/secrets |

## Modules ou fichiers concernés

`trigger/`, modules `outbox/`, `task-runs/`, `providers/ports`, `providers/adapters/mock`, `credentials/`, `governance/usage`, `observability/`, configuration Trigger.dev et tests de contrat.

## Tables concernées

`outbox_events`, `trigger_runs`, `idempotency_keys` ou réservations d’effets, `integrations`, métadonnées `integration_credentials`, `provider_usage`, `provider_limits`, `provider_costs`, `integration_health`, `audit_logs`.

## Risques

Double publication, tâche faisant confiance au payload, starvation d’un tenant, secret dans le payload, retry illimité, état uniquement dans Trigger.dev, coût sans attribution.

## Tests nécessaires

Outbox publiée/non publiée, crash entre étapes, même clé deux fois, payload falsifié, ressource supprimée, quota dépassé, concurrence tenant A/B, erreur terminale, annulation, fake contract tests et redaction Sentry.

## Critères d’acceptation

- Toute tâche recharge et revalide sa ressource et son tenant.
- Le rejeu d’une intention ne duplique ni run métier ni réservation.
- Un tenant saturé ne bloque pas une file saine d’un autre tenant.
- Les tests standards fonctionnent sans clé ni crédit réel.

## Terminé lorsque

Le smoke workflow durable traverse intention → outbox → tâche → état terminal → audit/coût, y compris après retry, sans effet externe réel.

---

# Phase 7 — Enrichissement, vérification, scoring et segmentation

## Objectif

Améliorer et qualifier les données avec des opérations budgétées, explicables et remplaçables.

## Dépendances

Phases 5–6 ; contrats Apollo/Firecrawl/ZeroBounce, fraîcheur, mapping de statuts, budgets et règles d’éligibilité approuvés.

## Sprint 13 — Enrichissement et vérification

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P7-S13-T01 | Implémenter adaptateur Apollo derrière le port | tests de contrat sandbox protégés |
| P7-S13-T02 | Implémenter recherche entreprises paginée | curseur durable et budget |
| P7-S13-T03 | Implémenter recherche personnes paginée | aucun email supposé présent |
| P7-S13-T04 | Implémenter enrichissement entreprise/personne | opération séparée et réservée |
| P7-S13-T05 | Implémenter adaptateur Firecrawl | sources, limites de pages et schéma validé |
| P7-S13-T06 | Créer workflow d’analyse de site | faits et hypothèses séparés |
| P7-S13-T07 | Implémenter adaptateur ZeroBounce | statuts internes normalisés |
| P7-S13-T08 | Créer workflows de vérification unité/batch | partition et reprise idempotentes |
| P7-S13-T09 | Appliquer politique de fraîcheur/cache | réutilisation explicable |
| P7-S13-T10 | Créer UI lancer/suivre/revoir | coût estimé avant confirmation |

## Sprint 14 — Scoring et segmentation

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P7-S14-T01 | Créer modèles de scoring versionnés | critères/poids/seuils immuables |
| P7-S14-T02 | Implémenter Fit Score déterministe | détail par critère |
| P7-S14-T03 | Implémenter Intent/Data Quality/Engagement | absence de donnée traitée explicitement |
| P7-S14-T04 | Persister scores et raisons | version, inputs et date |
| P7-S14-T05 | Créer segments statiques | membership tenant-safe |
| P7-S14-T06 | Créer règles de segment dynamiques si approuvées | preview avant matérialisation |
| P7-S14-T07 | Recalculer par tâche idempotente | version ciblée et lots bornés |
| P7-S14-T08 | Construire UI score/explication/segment | filtres et provenance visibles |

## Modules ou fichiers concernés

Modules `research/`, `enrichment/`, `verification/`, `qualification/scoring`, `segmentation/`, adaptateurs Apollo/Firecrawl/ZeroBounce, tâches Trigger.dev, pages lead quality et tests.

## Tables concernées

`provider_external_refs`, données enrichies/sources, `email_verifications`, `scoring_models`, `scoring_model_versions`, `lead_scores`, `segments`, `segment_rules`, `segment_members`, runs/usages/coûts/audit.

## Risques

Crédits consommés deux fois, propagation d’un statut propriétaire, contenu web hostile, score IA non reproductible, poids non versionnés, `unknown` autorisé à l’envoi, segmentation cross-tenant.

## Tests nécessaires

Contrats adaptateurs, pagination, timeout ambigu, quota, cache/fraîcheur, schéma IA, prompt injection, mapping des statuts, scoring aux limites, recalcul versionné, RLS et E2E import → enrichissement → vérification → score → segment.

## Critères d’acceptation

- Discovery, Enrichment et Verification restent trois états/opérations distincts.
- Chaque donnée enrichie possède provenance et classification.
- Chaque email possède un statut normalisé et une décision d’éligibilité séparée.
- Chaque score est reproductible à partir d’une version et de ses entrées.

## Terminé lorsque

Un lead importé peut être enrichi, vérifié, scoré et segmenté avec coût attribué, explication, audit et aucun double appel lors d’un retry.

---

# Phase 8 — Campagnes, séquences, messages IA et validation humaine

## Objectif

Construire une campagne assistée jusqu’à l’envoi de test, avec audience figée, génération fondée sur les faits et approbation traçable.

## Dépendances

Phases 4 et 7 ; machines d’état campagne/enrollment/message, modes d’automatisation et actions exigeant une approbation.

## Sprint 15 — Campagnes et séquences

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P8-S15-T01 | Créer campagnes et machine d’état | transitions autorisées testées |
| P8-S15-T02 | Créer audiences/enrollments | snapshot de segment et unicité prospect |
| P8-S15-T03 | Créer séquences versionnées | draft/approved/archived |
| P8-S15-T04 | Créer étapes de séquence | ordre, délai, canal et règles d’arrêt |
| P8-S15-T05 | Créer templates versionnés | variables autorisées validées |
| P8-S15-T06 | Implémenter preview d’audience | exclusions et coût estimé visibles |
| P8-S15-T07 | Implémenter préparation de campagne | contrôles sans planification d’envoi |
| P8-S15-T08 | Construire builder UI minimal | sauvegarde cohérente et accessible |

## Sprint 16 — Messages IA et validation humaine

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P8-S16-T01 | Implémenter `GroqAIAdapter` | Structured Outputs + validation Zod |
| P8-S16-T02 | Versionner prompts et schémas | promptVersion/schemaVersion persistés |
| P8-S16-T03 | Construire contexte de personnalisation | uniquement faits autorisés et sourcés |
| P8-S16-T04 | Générer message par enrollment | sortie brouillon sans effet externe |
| P8-S16-T05 | Exécuter contrôle Message Quality | clarté, longueur, preuve, invention |
| P8-S16-T06 | Créer historique de versions message | original, édition et régénération |
| P8-S16-T07 | Implémenter approve/reject/edit | permission, commentaire et audit |
| P8-S16-T08 | Bloquer modification après approbation | nouvelle version obligatoire |
| P8-S16-T09 | Implémenter envoi de test via fake | destinataire allowlist uniquement |
| P8-S16-T10 | Construire inbox de validation | sources, alertes et séquence visibles |

## Modules ou fichiers concernés

Modules `campaign-operations/`, `campaigns/`, `sequences/`, `messages/`, `approvals/`, `ai/`, prompts/skills StoryBrand, Made to Stick, Obviously Awesome et 100M Offers, tâches de génération et pages campagne/review.

## Tables concernées

`campaigns`, `campaign_segments`, `campaign_enrollments`, `sequences`, `sequence_versions`, `sequence_steps`, `message_templates`, `generated_messages`, `message_versions`, `message_approvals`, `ai_executions`, usage/coûts/audit.

## Risques

Audience changeant après approbation, enrollment dupliqué, variable non échappée, message halluciné, prompt injection via site/email, approbation réutilisée après édition, fuite de données entre clients.

## Tests nécessaires

Machines d’état, snapshot d’audience, unicité enrollment, rendu/escaping, sortie Groq invalide, faits manquants, injection, refus d’approbation, version après édition, permissions reviewer, RLS et E2E segment → campagne → génération → approbation → test fake.

## Critères d’acceptation

- L’audience et la séquence approuvées sont versionnées et explicables.
- Chaque affirmation personnalisée renvoie à une source autorisée.
- Une édition invalide l’approbation précédente.
- Aucun message commercial réel n’est envoyé dans cette phase.

## Terminé lorsque

Une campagne complète peut produire des messages sourcés, être revue puis approuvée, avec historique et audit, et uniquement un envoi fake/allowlist protégé.

---

# Phase 9 — Comptes d’envoi, conformité et délivrabilité préflight

## Objectif

Connecter un compte Gmail tenant-aware et empêcher techniquement toute campagne non conforme ou non délivrable avant le premier envoi réel.

## Dépendances

Phases 3, 6 et 8 ; coffre/KMS, scopes OAuth, validation Google, DNS, seuils, politiques juridiques et comptes de test.

## Sprint 17 — Comptes d’envoi et gates

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P9-S17-T01 | Créer métadonnées d’intégration et compte expéditeur | ownership agence/client explicite |
| P9-S17-T02 | Implémenter OAuth Google serveur | state, offline access, scopes vérifiés |
| P9-S17-T03 | Stocker le credential via référence chiffrée | aucune valeur dans table métier/log |
| P9-S17-T04 | Implémenter santé, refresh et révocation | états active/degraded/revoked |
| P9-S17-T05 | Créer modèle `sender_domains` | domaine, client, statut et limites |
| P9-S17-T06 | Vérifier SPF/DKIM/DMARC selon politique | résultat sourcé et daté |
| P9-S17-T07 | Créer quotas compte/domaine/client | soft/hard et périodes explicites |
| P9-S17-T08 | Créer suppression globale et client | lookup bloquant et audit minimal |
| P9-S17-T09 | Implémenter préflight conformité | finalité, pays, canal, source, opposition |
| P9-S17-T10 | Implémenter préflight délivrabilité | compte, DNS, statut email, seuils, volume |
| P9-S17-T11 | Construire UI intégration et diagnostic | scopes masqués, santé, actions autorisées |

## Modules ou fichiers concernés

Modules `integrations/google`, `credentials/`, `sender-accounts/`, `sender-domains/`, `compliance/`, `deliverability/`, callbacks OAuth, services de préflight, pages settings et tests de sécurité.

## Tables concernées

`integrations`, `integration_credentials` (références/métadonnées uniquement), `sender_domains`, `sender_accounts`, `domain_checks`, `provider_limits`, `suppression_entries`, `processing_purposes`, `legal_basis_records`, audit.

## Risques

Refresh token exposé, compte lié au mauvais client, scope excessif, validation OAuth retardée, DNS mal interprété, seuils arbitraires, suppression contournée, compte révoqué encore planifié.

## Tests nécessaires

State OAuth invalide/replay, scope manquant, token révoqué, credential cross-tenant, redaction, SPF/DKIM/DMARC états, quota aux limites, suppression globale, policy juridique absente, compte désactivé entre planification et préflight.

## Critères d’acceptation

- Aucun token n’atteint le navigateur, les logs ou un payload de tâche.
- Un compte expéditeur ne peut servir un autre client sans règle approuvée.
- Le préflight produit des raisons bloquantes déterministes.
- Une suppression ou révocation bloque immédiatement les nouvelles intentions.

## Terminé lorsque

Un compte Gmail de test est connectable dans un environnement protégé et une campagne ne devient `ready` que si toutes les gates approuvées passent.

---

# Phase 10 — Envoi, relances et réponses

## Objectif

Exécuter une campagne pilote limitée sans double envoi, puis synchroniser et classifier les réponses en arrêtant immédiatement les relances.

## Dépendances

Phase 9 ; compte Google validé, Pub/Sub/IAM, volumes pilote, règles d’arrêt, monitoring et procédure incident.

## Sprint 18 — Envoi et relances

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P10-S18-T01 | Implémenter `GmailOutreachEmailAdapter.sendMessage` | contrat et erreurs normalisées |
| P10-S18-T02 | Créer réservation atomique d’envoi | clé enrollment/step unique |
| P10-S18-T03 | Revalider préflight dans la tâche | contrôle juste avant effet |
| P10-S18-T04 | Persister message sortant avant/après appel | état ambigu réconciliable |
| P10-S18-T05 | Créer scheduler de prochaine étape | fuseau et fenêtres autorisées |
| P10-S18-T06 | Implémenter règles d’arrêt | réponse, bounce, plainte, unsubscribe, meeting |
| P10-S18-T07 | Appliquer fair queues et quotas | compte/domaine/client/campagne |
| P10-S18-T08 | Gérer timeout et résultat inconnu | pas de retry aveugle |
| P10-S18-T09 | Ajouter pause/annulation/reprise campagne | états et audit |
| P10-S18-T10 | Exécuter test live allowlist opt-in | preuve d’un seul envoi |

## Sprint 19 — Réponses entrantes

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P10-S19-T01 | Configurer watch Gmail et Pub/Sub en test | IAM minimal et expiration connue |
| P10-S19-T02 | Créer webhook Pub/Sub sécurisé | audience/projet/subscription vérifiés |
| P10-S19-T03 | Dédupliquer notifications | `messageId` unique et ACK rapide |
| P10-S19-T04 | Synchroniser depuis `historyId` | curseur durable et lots bornés |
| P10-S19-T05 | Ajouter full sync de secours | récupération après 404/trou |
| P10-S19-T06 | Normaliser threads et messages | mapping au compte/campagne/contact |
| P10-S19-T07 | Stocker message original séparément | rétention et accès restreints |
| P10-S19-T08 | Arrêter enrollment avant classification | effet déterministe immédiat |
| P10-S19-T09 | Classifier réponse avec Groq | schéma, confiance et version |
| P10-S19-T10 | Créer tâche ou demande de revue | aucune réponse automatique réelle |
| P10-S19-T11 | Renouveler watches et surveiller silence | tâche planifiée et alerte |
| P10-S19-T12 | Construire inbox de réponses | original, classification et audit séparés |

## Modules ou fichiers concernés

Modules `outreach/`, `delivery/`, `followups/`, `replies/`, adaptateur Gmail, webhooks Pub/Sub, tâches `campaign.*` et `reply.*`, inbox et observabilité.

## Tables concernées

`outbound_messages`, `delivery_events`, `bounces`, `campaign_enrollment_steps`, `external_effect_reservations`, `replies`, `reply_classifications`, `email_threads`, `mailbox_sync_cursors`, `webhook_events`, `tasks`, suppressions, runs/coûts/audit.

## Risques

Double email après timeout, quota dépassé, relance après réponse, notification perdue/dupliquée, boucle Pub/Sub, mauvais rapprochement de thread, classification erronée, contenu sensible dans Sentry.

## Tests nécessaires

Succès/retry/timeout ambigu, même clé deux fois, préflight devenu invalide, fuseaux, chaque règle d’arrêt, webhook audience invalide/replay, ordre inversé, `historyId` périmé, full sync, prompt injection email, classification incertaine et E2E campagne allowlist → réponse simulée → arrêt.

## Critères d’acceptation

- Une étape de séquence ne peut produire qu’un effet d’envoi.
- Toute réponse stoppe les relances avant l’analyse IA.
- Une perte de push est récupérée par synchronisation périodique.
- Une classification incertaine est envoyée en revue, sans action irréversible.

## Terminé lorsque

Une campagne pilote à très faible volume fonctionne de bout en bout, s’arrête sur chaque signal bloquant et peut être réconciliée sans doublon après panne simulée.

---

# Phase 11 — Rendez-vous et pipeline CRM interne

## Objectif

Transformer une réponse qualifiée en rendez-vous puis en opportunité suivie dans un pipeline interne simple.

## Dépendances

Phase 10 ; scopes Calendar, calendriers propriétaires, fuseaux, états meeting/opportunity et pipeline MVP approuvés.

## Sprint 20 — Rendez-vous et pipeline

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P11-S20-T01 | Implémenter `GoogleCalendarAdapter` | contrat disponibilité/CRUD meeting |
| P11-S20-T02 | Connecter un calendrier tenant-aware | credential et scope vérifiés |
| P11-S20-T03 | Normaliser disponibilités en UTC | affichage dans fuseau utilisateur |
| P11-S20-T04 | Créer réunion avec réservation unique | aucun double événement après retry |
| P11-S20-T05 | Mettre à jour/annuler et réconcilier | état local aligné à Google |
| P11-S20-T06 | Créer pipeline et étapes ordonnées | pipeline client-scoped |
| P11-S20-T07 | Créer opportunité depuis réponse/meeting | contrainte anti-doublon |
| P11-S20-T08 | Implémenter transitions d’opportunité | raisons won/lost/disqualified |
| P11-S20-T09 | Créer tâches et notes | auteur, visibilité et audit |
| P11-S20-T10 | Préparer discovery SPIN en fake IA | questions sourcées et révisables |
| P11-S20-T11 | Construire calendrier et kanban minimal | permissions et accessibilité |

## Modules ou fichiers concernés

Modules `conversation-scheduling/`, `calendar/`, `meetings/`, `crm-revenue/`, `pipelines/`, `opportunities/`, `tasks/`, `notes/`, adaptateur Google Calendar, tâches meeting/CRM et pages calendrier/pipeline.

## Tables concernées

`calendars`, `calendar_sync_cursors`, `meetings`, `pipelines`, `pipeline_stages`, `opportunities`, `opportunity_stage_history`, `tasks`, `notes`, runs/coûts/audit.

## Risques

Double rendez-vous, conflit de fuseau, calendrier d’un autre tenant, notification Calendar perdue, opportunité dupliquée, étape modifiée après usage, note exposée au mauvais rôle.

## Tests nécessaires

DST/fuseaux, conflit de créneau, retry create, update/cancel idempotent, scope révoqué, notification perdue, contraintes tenant, transitions valides/invalides, permissions notes et E2E réponse positive → meeting → opportunité.

## Critères d’acceptation

- Une réservation ne crée qu’un événement et conserve sa référence externe.
- Les disponibilités sont cohérentes dans au moins deux fuseaux de test.
- Une opportunité garde l’historique de ses étapes et ses raisons terminales.
- Le pipeline externe reste hors MVP.

## Terminé lorsque

Une réponse positive peut produire un rendez-vous puis une opportunité et une tâche, avec audit, isolation et reprise après erreur.

---

# Phase 12 — Analytics, coûts et audit

## Objectif

Rendre le workflow mesurable, explicable et économiquement pilotable par agence et client sans mélanger analytics et autorisation.

## Dépendances

Toutes les phases métier ; définitions KPI, devise, revenus, allocation des coûts et visibilité agence/client.

## Sprint 21 — Pilotage

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P12-S21-T01 | Définir dictionnaire KPI versionné | formule, grain, timezone et exclusions |
| P12-S21-T02 | Créer agrégats campagne | envoyés, délivrés, réponses, meetings |
| P12-S21-T03 | Créer agrégats qualité données | enrichissement, validité, doublons, fraîcheur |
| P12-S21-T04 | Finaliser journal `provider_usage` | usage brut append-only |
| P12-S21-T05 | Finaliser catalogues coûts/limites | prix versionnés et budgets hiérarchiques |
| P12-S21-T06 | Implémenter réservation/réconciliation | estimated/actual/disputed/released |
| P12-S21-T07 | Calculer coût par résultat | lead, réponse, meeting, opportunité |
| P12-S21-T08 | Calculer marge si revenu approuvé | coûts partagés séparés du brut |
| P12-S21-T09 | Créer vue audit recherchable | filtres tenant/acteur/ressource/corrélation |
| P12-S21-T10 | Protéger immutabilité et rétention audit | modifications ordinaires refusées |
| P12-S21-T11 | Construire dashboards agence/client | visibilité conforme aux permissions |
| P12-S21-T12 | Générer rapport snapshot | chiffres reproductibles et date de calcul |
| P12-S21-T13 | Ajouter Diagnose sur métriques validées | recommandation sans auto-optimisation |

## Modules ou fichiers concernés

Modules `governance-analytics/`, `analytics/`, `costs/`, `reports/`, `audit/`, définitions SQL/views `security_invoker` si utilisées, tâches reporting, dashboards et exports.

## Tables concernées

`provider_usage`, `provider_limits`, `provider_costs`, `integration_health`, `usage_records` si conservé comme alias canonique, `cost_records`, `audit_logs`, `reports`, `report_snapshots`, définitions KPI et éventuellement vues matérialisées approuvées.

## Risques

KPI ambigu, double comptage retry, coût estimé présenté comme réel, vue contournant RLS, coût partagé mal attribué, audit modifiable, export contenant trop de PII.

## Tests nécessaires

Fixtures KPI connues, périodes/fuseaux, retries, corrections de coût, limites soft/hard, attribution agence/client, vue RLS, immutabilité audit, export permissions, snapshot reproductible et charge des agrégations.

## Critères d’acceptation

- Chaque chiffre possède définition, période et source.
- Le coût estimé et le coût réel sont distingués.
- Une limite client ne peut être contournée ni bloquer injustement un autre tenant.
- L’audit répond qui/tenant/ressource/action/workflow/résultat/coût.

## Terminé lorsque

Agence et client voient uniquement leurs KPI autorisés, les usages sont réconciliables avec les fournisseurs et un rapport historique reste reproductible.

---

# Phase 13 — Conformité, tests, monitoring et déploiement

## Objectif

Prouver que le MVP est exploitable, récupérable et conforme au périmètre pilote avant toute production commerciale.

## Dépendances

Toutes les phases ; décisions légales finales, comptes cloud, DPA, SLO/RPO/RTO, runbooks et validation métier.

## Sprint 22 — Hardening, conformité et monitoring

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P13-S22-T01 | Implémenter demandes export/suppression/opposition | workflow autorisé et audit complet |
| P13-S22-T02 | Implémenter politiques de rétention | dry-run, purge/anonymisation contrôlée |
| P13-S22-T03 | Tester suppression globale | aucun nouvel outreach possible |
| P13-S22-T04 | Exécuter revue RLS/GRANT complète | matrice de tables et policies |
| P13-S22-T05 | Exécuter advisors et revue index | findings traités ou acceptés |
| P13-S22-T06 | Exécuter tests sécurité webhooks/OAuth/CSRF/XSS | rapport sans critique ouverte |
| P13-S22-T07 | Exécuter tests IA adversariaux | injection, invention, schéma, fallback |
| P13-S22-T08 | Exécuter tests de charge/fairness | limites et SLO mesurés |
| P13-S22-T09 | Configurer alertes Sentry et opérationnelles | owner et seuil pour chaque alerte |
| P13-S22-T10 | Créer dashboards santé queues/intégrations | action opérateur documentée |
| P13-S22-T11 | Écrire runbooks incidents principaux | envoi doublon, fuite, panne, quota, OAuth |
| P13-S22-T12 | Tester sauvegarde et restauration | preuve RPO/RTO en environnement sûr |

## Sprint 23 — Staging et production contrôlée

| ID | Tâche atomique | Livrable vérifiable |
|---|---|---|
| P13-S23-T01 | Créer environnements cloud séparés | dev/staging/prod et owners |
| P13-S23-T02 | Configurer secrets et rotations | inventaire sans valeur sensible |
| P13-S23-T03 | Configurer domaines et callbacks | DNS/redirect URIs/webhooks validés |
| P13-S23-T04 | Déployer migrations en staging | revue, backup et preuve de succès |
| P13-S23-T05 | Déployer application/tasks en staging | versions corrélées |
| P13-S23-T06 | Exécuter smoke et E2E staging | parcours vertical complet avec allowlist |
| P13-S23-T07 | Réaliser revue sécurité/conformité finale | sign-off des responsables |
| P13-S23-T08 | Préparer rollback application/migration/config | procédure répétée en staging |
| P13-S23-T09 | Déployer production avec approbation | release progressive et surveillée |
| P13-S23-T10 | Exécuter vérifications post-déploiement | Auth, RLS, queues, logs, coûts, alertes |
| P13-S23-T11 | Activer pilote à faible volume | tenant et comptes explicitement allowlistés |
| P13-S23-T12 | Tenir revue go/no-go après observation | décision et actions documentées |

## Modules ou fichiers concernés

Modules `compliance/`, `data-lifecycle/`, `monitoring/`, `security/`, tests globaux, configurations GitHub/Vercel/Supabase/Trigger.dev/Sentry, manifests de déploiement, runbooks et documentation opérateur.

## Tables concernées

Toutes les tables tenant-aware et techniques ; particulièrement `suppression_entries`, politiques de rétention, demandes de droits, `audit_logs`, `trigger_runs`, intégrations, usages/coûts et rapports.

## Risques

Validation juridique incomplète, migration irréversible, secrets mal séparés, alertes sans owner, sauvegarde non restaurable, test de charge avec effets réels, données de production en staging, activation trop large.

## Tests nécessaires

Suite complète unit/intégration/RLS/E2E, sécurité, charge, reprise, sauvegarde/restauration, migration from-zero et upgrade, rollback, smoke staging/prod, alertes synthétiques, chaos fournisseur contrôlé et vérification manuelle go-live.

## Critères d’acceptation

- Aucun finding critique sécurité, tenant, conformité ou délivrabilité n’est ouvert.
- Les RPO/RTO et SLO sont mesurés et compatibles avec les décisions.
- Les alertes ont seuil, owner et runbook.
- Le rollback et la restauration ont été réellement testés en environnement sûr.
- Le pilote est limité par allowlist, quotas et kill switch.

## Terminé lorsque

Les sign-offs produit, sécurité, juridique et opérations sont obtenus, le pilote peut être arrêté rapidement, et le workflow complet est observable et récupérable.

---

## 9. Jalons de démonstration

| Jalon | Fin de sprint | Démonstration |
|---|---:|---|
| M1 — Fondation sécurisée | S6 | deux agences/deux clients isolés, RBAC et audit |
| M2 — Stratégie et données | S11 | onboarding approuvé puis import propre et sourcé |
| M3 — Lead qualifié | S14 | enrichissement, vérification, score et segment |
| M4 — Campagne assistée | S16 | message IA sourcé, revue humaine, envoi fake |
| M5 — Outreach pilote | S19 | envoi allowlist, réponse, arrêt et classification |
| M6 — Revenue workflow | S21 | rendez-vous, opportunité, dashboard, coûts et rapport |
| M7 — Production pilote | S23 | déploiement contrôlé, monitoring et runbooks actifs |

## 10. Stratégie de tests par niveau

| Niveau | Portée | Exécution |
|---|---|---|
| Unitaires | règles, normalisation, scoring, transitions, permissions | chaque PR |
| Intégration applicative | services, repositories, adaptateurs fakes | chaque PR |
| Supabase local | migrations, contraintes, GRANT, RLS, vues, Storage | chaque PR touchant la donnée |
| Contrats fournisseurs | même suite sur fake et adaptateur | fake en CI ; live opt-in |
| Trigger.dev | retry, idempotence, concurrence, annulation | chaque tâche modifiée |
| Webhooks/OAuth | signature/audience, replay, ordre, révocation | chaque intégration entrante |
| IA | schéma, grounding, injection, coût, fallback | chaque prompt/version |
| E2E | vertical slices et rôles critiques | PR ciblée puis staging |
| Non fonctionnels | charge, fairness, sécurité, restauration | avant pilote et releases à risque |

La suite RLS minimale crée `agencyA`, `agencyB`, `clientA1`, `clientA2` et `clientB1`, puis vérifie séparément SELECT, INSERT, UPDATE et DELETE pour chaque rôle pertinent.

## 11. Règles de migration

Pour chaque changement de données autorisé :

1. vérifier changelog et documentation Supabase actuels ;
2. vérifier la CLI et découvrir les commandes par `--help` ;
3. utiliser le workflow déclaratif ou impératif approuvé, sans les mélanger ;
4. concevoir contraintes tenant, index, GRANT et RLS avec les cas négatifs ;
5. générer/revoir la migration selon le workflow officiel ;
6. reconstruire localement depuis zéro ;
7. tester upgrade et stratégie de récupération ;
8. exécuter advisors disponibles ;
9. vérifier l’état des migrations ;
10. appliquer à distance uniquement dans la procédure de release approuvée.

Une migration destructive exige une tâche séparée, sauvegarde vérifiée, plan de compatibilité, fenêtre de rollback/récupération et autorisation explicite.

## 12. Gestion du backlog et des changements

- Une tâche atomique produit un comportement ou artefact vérifiable et un petit diff cohérent.
- Migration, service, UI et workflow peuvent être des tâches distinctes mais restent liées à la même vertical slice.
- Une phase ne commence pas si son gate de dépendance est ouvert.
- Une nouvelle dépendance, table, permission, fournisseur ou effet externe passe par revue d’architecture.
- Les fonctionnalités reportées restent hors backlog MVP : LinkedIn automatisé, SMS, WhatsApp, Microsoft Graph, CRM externe, PostHog et multi-provider actif.
- Le paiement n'est pas une fonctionnalité reportée : Stripe, checkout, billing, plans, abonnements et facturation client automatique sont supprimés définitivement de l'architecture et de toute roadmap future du projet.
- Tout changement de scope met à jour la matrice de couverture, les risques et les jalons.

## 13. Risques programme et réponses

| Risque | Signal précoce | Réponse |
|---|---|---|
| MVP trop large | sprints sans démonstration verticale | protéger les jalons M1–M5 et différer le confort |
| Décision bloquante tardive | tâche Ready sans règle approuvée | arrêter la story, résoudre le gate |
| RLS complexe/lente | policies dupliquées et scans | simplifier le modèle, indexer, profiler localement |
| Outbox/idempotence reportées | effets appelés depuis handlers | bloquer les intégrations payantes avant S12 |
| Charge de validation humaine | backlog de messages en attente | mesurer, améliorer UX, ne pas automatiser sans décision |
| Fournisseur non disponible | sandbox/compte absent au sprint | livrer contrat + fake, replanifier le live |
| OAuth Google retardé | écran de consentement non validé | lancer le chantier administratif avant S17 |
| Coût unitaire excessif | estimation > budget campagne | réduire funnel, cache et volume ; pause hard |
| Délivrabilité dégradée | rebonds/plaintes en hausse | kill switch, pause compte/domaine/campagne |
| Conformité incertaine | pays/base/rétention non validés | interdire production sur le segment concerné |

## 14. Décisions qui restent obligatoires

Ce plan donne un ordre d’exécution, mais ne résout pas les décisions métier absentes : matrice RBAC, seuils, règles juridiques, périodes de rétention, budgets, scopes OAuth, régions, SLO/RPO/RTO, définition de la marge et conditions d’automatisation. Elles doivent être approuvées au Sprint 0 ou avant la phase qui les consomme.
