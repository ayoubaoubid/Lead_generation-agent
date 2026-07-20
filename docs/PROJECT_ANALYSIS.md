# Analyse architecturale du projet

> Source analysée intégralement : `CAHIER DES CHARGES CONSOLIDÉ lead_generation.txt` (2 371 lignes, 28 sections).
>
> Statut : document d'analyse préalable. Il ne constitue ni une spécification technique détaillée, ni une autorisation de développement.

## 1. Résumé du produit

Le produit visé est une plateforme multitenant privée de Lead Operations, Sales Operations et Revenue Operations, opérée par des agences B2B de génération de leads ou d'automatisation commerciale. Il ne s'agit pas d'un SaaS public en libre-service.

Une agence doit pouvoir exploiter un espace unique pour gérer plusieurs clients, leurs équipes, offres, ICP, personas, sources de prospects, campagnes, comptes d'envoi, réponses, rendez-vous, pipelines, coûts et rapports. Chaque client peut disposer d'un portail limité à ses propres données et aux fonctions autorisées.

Le contrat commercial est négocié et signé hors plateforme. Un administrateur d'agence autorisé crée manuellement le client et son workspace, ajoute les utilisateurs, attribue les rôles, configure les intégrations et quotas, puis active le client. Aucun paiement en ligne, plan tarifaire, abonnement SaaS, facturation automatique ou Stripe ne fait partie du produit.

La plateforme couvre la chaîne commerciale complète :

```text
Onboarding agence et client
→ validation du marché et du problème
→ positionnement et construction de l'offre
→ ICP et personas
→ acquisition et collecte des prospects
→ enrichissement, vérification et déduplication
→ scoring et segmentation
→ campagnes et messages personnalisés
→ validation humaine
→ envoi, relances et délivrabilité
→ analyse des réponses
→ rendez-vous et discovery
→ pipeline et closing
→ analytics, coûts, marge et optimisation
```

L'intelligence artificielle est une couche d'analyse, d'extraction, de classification, de recommandation et de génération. Elle ne doit pas porter seule les décisions critiques. Le code déterministe reste responsable des permissions, validations, limites, transitions d'état et effets externes.

## 2. Problème résolu

Les agences B2B utilisent généralement plusieurs outils séparés pour la stratégie commerciale, la recherche de prospects, l'enrichissement, l'emailing, le calendrier, le CRM et le reporting. Cette fragmentation entraîne :

- des données dupliquées et difficiles à tracer ;
- une mauvaise séparation entre les clients de l'agence ;
- des processus manuels et des relances oubliées ;
- des campagnes difficiles à reproduire et comparer ;
- une personnalisation superficielle ou non vérifiable ;
- des risques de non-conformité et de dégradation de la réputation email ;
- une visibilité insuffisante sur les coûts, la marge et le retour sur investissement ;
- une dépendance forte à plusieurs fournisseurs sans abstraction commune.

La solution centralise ces opérations dans un système isolé par tenant, auditable, orchestré de manière durable et doté de validations humaines pour les actions sensibles.

## 3. Utilisateurs et rôles

### 3.1 Acteurs principaux

1. **Opérateur de la plateforme** : acteur implicitement nécessaire pour administrer les agences, les incidents, les quotas techniques et les abus, mais non défini dans le cahier des charges.
2. **Agence** : tenant commercial principal, propriétaire de la relation avec ses clients.
3. **Membres internes de l'agence** : opèrent les campagnes et les processus commerciaux.
4. **Client de l'agence** : sous-tenant métier dont les données doivent être strictement isolées.
5. **Utilisateurs du client** : accèdent à un portail et à un périmètre limité.
6. **Identités techniques** : tâches Trigger.dev, webhooks, intégrations et services backend.

### 3.2 Rôles d'agence prévus

- Agency Owner
- Agency Admin
- Campaign Manager
- Lead Researcher
- Data Enrichment Specialist
- SDR
- Sales Manager
- Sales Representative
- Message Reviewer
- Compliance Reviewer
- Analyst
- Technical Administrator

### 3.3 Rôles client prévus

- Client Admin
- Client Sales Manager
- Client Reviewer
- Client Sales Representative
- Client Viewer

### 3.4 Modèle d'autorisation attendu

Le contrôle d'accès doit combiner quatre dimensions :

```text
Identité authentifiée
× appartenance à l'agence
× affectation éventuelle au client
× permission sur l'action et la ressource
```

Un simple rôle `authenticated`, un `agency_id` fourni par le navigateur ou un `client_id` présent dans un payload ne constitue jamais une autorisation suffisante.

Le modèle détaillé reste à définir : rôles fixes ou personnalisables, cumul de rôles, portée agence/client, permissions par ressource, affectation partielle d'un membre d'agence à certains clients, délégation temporaire et comportement des utilisateurs désactivés.

## 4. Architecture métier

### 4.1 Hiérarchie multitenant

```text
Plateforme
└── Agence
    ├── Membres, paramètres, quotas et intégrations partagées
    └── Clients
        ├── Membres client
        ├── Stratégie : offres, positionnement, ICP, personas
        ├── Données : entreprises, contacts, leads, sources
        ├── Exécution : campagnes, séquences, messages, envois
        ├── Conversation : réponses, rendez-vous, tâches
        ├── Vente : pipelines et opportunités
        └── Pilotage : coûts, audit, analytics et rapports
```

L'agence est le tenant racine métier. Le client est un sous-tenant obligatoire pour la majorité des données commerciales. Certaines ressources, comme les membres internes, budgets techniques, quotas ou templates partagés, peuvent être limitées au niveau agence.

### 4.2 Domaines métier

L'architecture métier se décompose en domaines cohérents :

- **Identity & Tenant Management** : agences, clients, membres, rôles, permissions et invitations.
- **Client Strategy** : onboarding, validation, offre, positionnement, ICP et personas.
- **Lead Data Operations** : import, recherche, sources, normalisation, déduplication, enrichissement et vérification.
- **Qualification** : scoring versionné, segmentation et recommandations.
- **Campaign Operations** : campagnes, audiences, séquences, templates, génération et validation.
- **Outreach & Deliverability** : domaines, comptes expéditeurs, quotas, files, envois, relances, rebonds et suppressions.
- **Conversation & Scheduling** : réponses, classification, tâches, disponibilités et rendez-vous.
- **CRM & Revenue** : pipelines, opportunités, notes, closing et synchronisations externes.
- **Governance** : conformité, audit, rétention, coûts, observabilité et rapports.

### 4.3 Principes métier structurants

- toute donnée externe conserve sa provenance et son niveau de confiance ;
- toute décision IA importante reste traçable et validable ;
- tout effet externe critique est idempotent ;
- tout fournisseur est remplaçable derrière une interface métier ;
- la conformité et la délivrabilité peuvent bloquer une campagne ;
- les skills conseillent les services métier, mais ne les remplacent pas ;
- le changement d'état d'une campagne, d'un message ou d'un lead doit être déterministe et audité.

## 5. Architecture technique

### 5.1 Répartition des responsabilités

```text
Next.js / TypeScript
├── interface React
├── couche Backend-for-Frontend
├── Server Actions et Route Handlers
├── authentification et autorisation applicative
├── opérations synchrones courtes
└── réception de webhooks légers

Supabase
├── PostgreSQL
├── Auth
├── Row Level Security
├── Storage
├── Realtime
├── migrations et fonctions SQL
└── sauvegardes

Trigger.dev
├── tâches longues
├── planification et files
├── retries contrôlés
├── orchestration asynchrone
├── reprise après incident
└── intégrations externes
```

### 5.2 Frontière Next.js/Supabase à retenir

Le navigateur ne doit pas construire lui-même son contexte tenant. Next.js doit dériver l'identité depuis la session, résoudre les memberships autorisés et encadrer les mutations sensibles. L'accès direct à Supabase depuis le navigateur peut être conservé pour des lectures ou opérations simples uniquement si les policies RLS constituent une barrière complète et testée.

Les clés privilégiées Supabase ne doivent jamais être exposées au client. Les opérations utilisant une clé de service doivent refaire les contrôles de tenant, de rôle et de ressource dans le code, car cette clé peut contourner RLS.

Les tables exposées par la Data API doivent avoir RLS activé et des droits SQL explicites adaptés. RLS contrôle les lignes accessibles, mais ne remplace ni les `GRANT`, ni l'autorisation métier. Les vues accessibles doivent respecter RLS, notamment via des vues `security_invoker` lorsque la version PostgreSQL le permet.

Les données d'autorisation ne doivent pas dépendre de métadonnées utilisateur modifiables. Les rôles et memberships doivent avoir une source serveur fiable. La révocation immédiate exigée par le document nécessite une stratégie explicite, car un JWT déjà émis peut rester valide jusqu'à son expiration.

### 5.3 Frontière Next.js/Trigger.dev

Next.js crée une intention de travail autorisée ; Trigger.dev exécute le travail durable. Un payload contenant `agencyId` et `clientId` ne doit pas être considéré comme une preuve. Chaque tâche doit recharger la ressource principale depuis la base, vérifier son tenant réel et vérifier que l'action est encore autorisée.

Les tâches critiques doivent utiliser :

- une clé d'idempotence stable fondée sur l'opération métier ;
- un enregistrement persistant de l'exécution ;
- une machine d'état explicite ;
- des limites par plateforme, agence, client, campagne, compte et fournisseur ;
- une stratégie de retry par classe d'erreur ;
- une dead-letter queue ou un état terminal exploitable ;
- un mécanisme d'annulation et de pause ;
- une corrélation entre audit, coût, message et exécution Trigger.dev.

Un mécanisme de type transactional outbox est fortement recommandé pour éviter qu'une transaction en base soit validée sans que la tâche soit créée, ou inversement.

### 5.4 Déploiement

Le cahier des charges laisse ouverts l'hébergement Next.js, le choix Cloud/self-hosted de Supabase et celui de Trigger.dev. Cette décision influence les coûts, la résidence des données, les opérations, les sauvegardes, les limites serverless et la conformité. Elle doit être prise avant la conception détaillée de l'infrastructure.

## 6. Modules principaux

| Module | Responsabilité principale |
|---|---|
| Authentification et tenants | Sessions, MFA, agences, clients, invitations et memberships |
| RBAC et autorisation | Rôles, permissions, portées et contrôles d'accès |
| Onboarding client | Collecte structurée des informations commerciales |
| Offre et positionnement | Offres, preuves, objections, promesses et proposition de valeur |
| ICP et personas | Critères, exclusions, pondérations et rôles d'achat |
| Import et recherche | Imports CSV et découverte autorisée d'entreprises/contacts |
| Data quality | Sources, normalisation, déduplication, enrichissement et vérification |
| Scoring et segmentation | Fit, intent, qualité, engagement, versions et explications |
| Campagnes | Audience, séquences, étapes, règles d'arrêt et tests A/B |
| Personnalisation IA | Génération fondée uniquement sur les faits autorisés |
| Validation humaine | Approbation, modification, rejet, régénération et historique |
| Outreach | Planification, envoi, quotas, relances et arrêts |
| Délivrabilité | DNS, réputation, rebonds, plaintes, suppressions et pauses |
| Inbox et réponses | Ingestion, classification, extraction et actions recommandées |
| Calendrier | Disponibilités, réservation, rappel et synchronisation |
| CRM et pipeline | Opportunités, tâches, notes, étapes et synchronisation |
| Analytics et coûts | KPI, coût unitaire, marge, ROI et diagnostic |
| Conformité | Finalités, bases juridiques, opposition, rétention et demandes |
| Administration et audit | Intégrations, secrets, quotas, incidents et piste d'audit |

## 7. Workflow complet

1. L'agence crée son espace, configure sa sécurité, ses quotas et ses paramètres.
2. Elle invite ses membres et crée un client.
3. Le client ou l'agence complète l'onboarding commercial.
4. Mom Test, Four Steps et Diagnose évaluent le problème, le marché et les preuves disponibles.
5. Obviously Awesome construit le positionnement.
6. 100M Offers structure l'offre et ses preuves autorisées.
7. L'ICP Agent et le Persona Builder définissent les cibles, exclusions et pondérations.
8. 100M Leads propose le plan d'acquisition, sans exécuter la collecte ou l'envoi.
9. Les entreprises et contacts sont importés ou recherchés par les services opérationnels.
10. Les données sont normalisées, dédupliquées, enrichies, vérifiées et classées par provenance.
11. Le moteur déterministe calcule et versionne les scores ; l'IA peut expliquer ou recommander.
12. Les leads sont segmentés et inscrits dans une campagne.
13. La campagne définit audience, séquence, comptes, horaires, quotas et règles d'arrêt.
14. Le Personalization Agent génère des messages fondés sur l'offre, le positionnement et les faits du prospect.
15. Le Message Quality Agent évalue clarté, crédibilité, longueur, CTA et risque d'invention.
16. Compliance et Deliverability exécutent des contrôles bloquants.
17. Un humain approuve les messages selon le mode d'automatisation choisi.
18. Trigger.dev planifie et exécute les envois idempotents.
19. Les événements de livraison, rebonds, plaintes, désabonnements et réponses mettent à jour la séquence.
20. Toute réponse ou réservation arrête les relances concernées selon les règles.
21. Le Reply Agent classifie la réponse et propose une prochaine action.
22. Le calendrier propose ou réserve un rendez-vous.
23. Le Sales Assistant prépare la discovery avec SPIN Selling.
24. Une opportunité est créée et progresse dans le pipeline.
25. Les dashboards calculent qualité, performance, coûts, marge et ROI.
26. Diagnose identifie les causes probables des contre-performances.
27. Lean Startup propose une expérience mesurable et une décision possible.

## 8. Entités principales de la base de données

### 8.1 Entités prévues par le cahier des charges

| Domaine | Entités principales |
|---|---|
| Tenancy | `agencies`, `agency_members`, `clients`, `client_members`, `roles`, `permissions` |
| Stratégie | `offers`, `offer_proofs`, `offer_objections`, `positioning_profiles`, `icps`, `icp_criteria`, `personas` |
| Prospection | `companies`, `company_sources`, `contacts`, `contact_sources`, `leads`, `lead_scores`, `segments`, `segment_members` |
| Campagnes | `campaigns`, `campaign_segments`, `sequences`, `sequence_steps`, `message_templates`, `generated_messages` |
| Envoi | `sender_domains`, `sender_accounts`, `outbound_messages`, `delivery_events`, `bounces`, `suppression_entries` |
| Réponses | `replies`, `reply_classifications` |
| Vente | `calendars`, `meetings`, `pipelines`, `pipeline_stages`, `opportunities`, `tasks`, `notes` |
| Intégrations | `integrations`, `integration_credentials`, `webhooks` |
| Pilotage | `trigger_runs`, `ai_executions`, `usage_records`, `cost_records`, `audit_logs`, `notifications`, `reports` |

### 8.2 Entités ou concepts manquants à confirmer

Le modèle actuel est une bonne carte fonctionnelle, mais il n'est pas suffisant pour implémenter le workflow sans décisions supplémentaires. Les éléments suivants semblent nécessaires :

- `invitations` et statuts de memberships ;
- matrice rôle/permission et scopes agence/client ;
- `imports`, `import_files`, `import_rows` et erreurs d'import ;
- modèles et versions de scoring, pas seulement les scores produits ;
- versions d'ICP, personas, positionnement, prompts et skills ;
- inscription d'un lead dans une campagne (`campaign_enrollments`) ;
- état d'avancement d'une séquence par lead/contact ;
- historique d'approbation et versions des messages ;
- événements de campagne génériques ou journal métier ;
- clés d'idempotence et outbox persistante ;
- configuration de réputation, contrôles DNS et quotas par domaine/compte ;
- préférences de communication, bases juridiques, consentements et finalités ;
- politiques de rétention et demandes d'exercice de droits ;
- identifiants externes par fournisseur et historique de synchronisation ;
- disponibilité calendrier et liens de réservation ;
- définitions de KPI et snapshots de rapports ;
- budgets, quotas, limites et allocations de coûts techniques par agence ou client ; ces concepts ne doivent pas devenir des plans commerciaux ou abonnements.

### 8.3 Invariants de données

- le couple agence/client d'une ressource doit être cohérent et non simplement dupliqué ;
- les ressources agence-only doivent avoir une règle explicite concernant `client_id` nul ;
- les clés étrangères doivent empêcher les associations inter-tenant ;
- les statuts doivent être contrôlés par des machines d'état ;
- les données externes doivent conserver source, date, fournisseur, confiance et vérification ;
- les suppressions liées à la conformité ne doivent pas supprimer les preuves minimales nécessaires à la liste d'opposition ;
- les secrets d'intégration doivent être séparés des métadonnées lisibles par l'application.

## 9. Agents IA et responsabilités

| Agent | Responsabilité |
|---|---|
| Orchestrator Agent | Sélectionne workflow et skills, vérifie préconditions, permissions et validations |
| Onboarding Agent | Structure les données du client et identifie les informations manquantes |
| Positioning Agent | Produit et versionne le positionnement approuvé |
| ICP Agent | Construit ICP, exclusions, personas et critères de scoring |
| Acquisition Strategy Agent | Définit canaux, tests et métriques sans exécuter l'outreach |
| Research Agent | Recherche, source, normalise et déduplique les entreprises |
| Contact Finder Agent | Identifie et classe les décideurs avec un niveau de confiance |
| Enrichment Agent | Complète les données et sépare faits, estimations et hypothèses |
| Verification Agent | Vérifie domaines/emails et bloque les données invalides |
| Qualification Agent | Calcule ou explique les scores et recommande la prochaine action |
| Segmentation Agent | Regroupe les leads et associe offre, message et canal |
| Personalization Agent | Génère des messages uniquement à partir de faits autorisés |
| Message Quality Agent | Note et rejette les messages vagues, longs ou non crédibles |
| Compliance Agent | Contrôle finalité, pays, canal, exclusions et rétention |
| Deliverability Agent | Surveille réputation, rebonds, plaintes, volumes et pauses |
| Outreach Agent | Prépare les envois et applique les règles d'arrêt |
| Reply Agent | Classifie les réponses, arrête les séquences et crée des tâches |
| Sales Assistant Agent | Prépare les appels SPIN et la prochaine étape commerciale |
| Analytics Agent | Mesure les résultats, diagnostique et propose des expériences |

Ces agents ne doivent pas être conçus comme des services autonomes possédant chacun un accès large. Ils sont des capacités orchestrées, utilisant des outils à permissions minimales et produisant des sorties structurées validées par les services métier.

## 10. Skills et responsabilités

### 10.1 Dix skills commerciaux adaptés

| Skill | Responsabilité dans la plateforme |
|---|---|
| Diagnose | Distinguer problèmes de ciblage, offre, message, canal, prix, données, infrastructure et délivrabilité |
| Mom Test | Produire des guides d'entretien non biaisés et extraire signaux de douleur, budget et urgence |
| Four Steps | Identifier l'étape de Customer Development, les preuves manquantes et le prochain test |
| Lean Startup | Définir hypothèse, MVP, métriques, durée, critère de succès et décision |
| Obviously Awesome | Structurer alternatives, capacités uniques, valeur, segments, catégorie et preuves |
| 100M Offers | Structurer l'offre en séparant promesses confirmées, conditions, preuves et garanties autorisées |
| 100M Leads | Définir un plan d'acquisition testable sans exécuter scraping, enrichissement ou envoi |
| SPIN Selling | Préparer discovery, objections, preuves et prochaine action dans le pipeline |
| StoryBrand | Structurer les messages courts autour d'un problème réel et d'un CTA unique |
| Made to Stick | Agir comme reviewer de clarté, concrétude, crédibilité, longueur et exagération |

### 10.2 Skills métier opérationnels

Les skills supplémentaires couvrent ICP/personas, recherche, découverte d'entreprises, recherche de contacts, enrichissement, vérification, normalisation, déduplication, scoring, segmentation, campagnes, séquences, personnalisation, réponses, réunions, CRM, délivrabilité, conformité, analytics et reporting.

Leur contrat doit préciser au minimum : entrées, sorties structurées, permissions, outils autorisés, sources exigées, erreurs, limites, contrôles, tests et critères d'acceptation.

### 10.3 Skills techniques

Les skills techniques encadrent Next.js, Supabase, RLS, multitenancy, RBAC, Trigger.dev, idempotence, sécurité des webhooks, abstraction fournisseur, structured outputs, sécurité des prompts, logs, monitoring, tests, migrations et déploiement.

Ils servent au développement et à la revue de la plateforme. Ils ne doivent pas être invoqués comme logique métier en production.

## 11. Risques techniques

| Risque | Impact | Réduction recommandée |
|---|---|---|
| Fuite inter-tenant | Critique | RLS, clés étrangères tenant-aware, tests négatifs systématiques et contrôles serveur |
| Utilisation large de la clé service | Critique | Services étroits, contrôles explicites, secrets backend uniquement et audit |
| Modèle RBAC incomplet | Élevé | Matrice permissions/ressources/actions avant le schéma final |
| Révocation non immédiate des sessions | Élevé | Sessions révocables, JWT courts et contrôle de membership actif sur actions sensibles |
| Double envoi après retry | Critique | Idempotence métier, verrou atomique, contrainte unique et journal d'envoi |
| Désynchronisation DB/Trigger.dev | Élevé | Transactional outbox et réconciliation périodique |
| Événements email en désordre ou dupliqués | Élevé | Dédoublonnage fournisseur, horodatage source et transitions idempotentes |
| Prompt injection via contenu crawlé | Élevé | Séparation données/instructions, outils limités, validation et tests adversariaux |
| Hallucinations dans les messages | Élevé | Provenance obligatoire, génération contrainte et reviewer bloquant |
| Coûts externes incontrôlés | Élevé | Budgets, quotas, prévision, circuit breaker et coût par exécution |
| Saturation par un gros client | Élevé | Fair queues, limites tenant/provider et priorités |
| Couplage aux fournisseurs | Moyen/élevé | Interfaces communes, modèles canoniques et adaptateurs |
| Limites d'exécution Next.js | Moyen | Déplacer les tâches longues vers Trigger.dev et choisir l'hébergement tôt |
| RLS complexe et lente | Élevé | Modèle d'accès simple, fonctions soigneusement revues, index adaptés et tests de charge |
| Exposition Realtime/Storage | Élevé | Policies spécifiques, chemins tenant-aware et tests d'accès croisé |
| Schéma trop large avant validation | Moyen | Migrations par vertical slice et modèles minimaux versionnés |
| Observabilité insuffisante | Élevé | Correlation IDs, audit, métriques de queue, traces et alertes actionnables |
| Perte ou corruption de données | Critique | RPO/RTO définis, sauvegardes et restaurations régulièrement testées |

## 12. Risques métier

- détérioration de la réputation d'envoi d'un client ou de l'agence ;
- blocage de comptes ou domaines par les fournisseurs de messagerie ;
- utilisation de données dont la source ou la licence ne permet pas la prospection ;
- différences réglementaires importantes selon pays, canal et contexte B2B/B2C ;
- promesses commerciales ou personnalisation fondées sur des informations non vérifiées ;
- confusion entre automatisation et garantie de résultats commerciaux ;
- qualité insuffisante des fournisseurs d'enrichissement et de vérification ;
- coût unitaire supérieur au revenu facturé au client ;
- charge de validation humaine trop importante pour l'agence ;
- scope MVP trop large, retardant la validation avec de vrais utilisateurs ;
- dépendance à des changements de conditions d'utilisation des plateformes externes ;
- attribution contestable des ventes ou du ROI à une campagne ;
- responsabilité contractuelle en cas d'envoi non conforme ou de données erronées.

## 13. Dépendances externes

| Catégorie | Options citées | Décision MVP nécessaire |
|---|---|---|
| Base/Auth/Storage | Supabase Cloud ou self-hosted | Mode d'hébergement, région, sauvegardes et limites |
| Workflows | Trigger.dev Cloud ou self-hosted | Mode d'hébergement, quotas et reprise |
| Hébergement Next.js | Vercel, Railway, Render, Docker ou VPS | Plateforme cible et contraintes serverless |
| IA | OpenAI ou couche multi-provider | Premier modèle, politique de fallback et budget |
| Crawling | Firecrawl, Playwright ou autre | Source autorisée, coût et limites |
| Email | Gmail API, Microsoft Graph, Resend ou SMTP | Premier canal, OAuth, réception et webhooks |
| Calendrier | Google Calendar ou Microsoft Graph | Premier fournisseur et mécanisme de réservation |
| CRM | Fournisseur non arrêté | CRM MVP ou pipeline interne seulement |
| Monitoring | Sentry, Supabase Logs, Trigger.dev Dashboard | Rétention, alertes et corrélation |
| DNS/réputation | Services DNS et éventuellement réputation | Méthode de vérification SPF/DKIM/DMARC |
| Sources de leads | CSV, annuaires, APIs, web public | Sources autorisées pour le pilote |

Chaque dépendance doit avoir un propriétaire, un contrat de données, une politique de secret, des quotas, une stratégie d'erreur, un adaptateur et un plan de remplacement.

## 14. Incohérences ou ambiguïtés détectées

1. **Opérateur de plateforme absent** : le modèle commence à la plateforme, mais aucun rôle de super-administration, support ou réponse aux incidents n'est défini.
2. **Visibilité des membres d'agence** : la règle RLS indique qu'un membre d'agence voit les ressources de son agence, alors que les rôles et affectations peuvent exiger qu'il ne voie que certains clients.
3. **Rôles sans matrice de permissions** : les noms existent, mais pas les actions précises autorisées par rôle.
4. **`agency_id` et `client_id` dupliqués** : leur présence sur presque toutes les tables simplifie les filtres mais peut créer des couples incohérents sans contraintes composées.
5. **Intégrations partagées contre isolation client** : l'agence peut avoir des intégrations partagées, tandis que les comptes d'envoi doivent être séparés par client. Les règles de partage ne sont pas définies.
6. **Frontière d'accès aux données non arrêtée** : le document ne précise pas quelles opérations peuvent accéder directement à Supabase depuis le navigateur et lesquelles doivent passer par Next.js.
7. **Révocation immédiate** : l'exigence qu'un utilisateur désactivé perde immédiatement l'accès nécessite un mécanisme supplémentaire au simple JWT.
8. **Catalogue d'agents incohérent** : plusieurs agents cités dans les sections skills ne figurent pas dans les 19 agents officiels, notamment Customer Research Agent, Strategy Agent, Product Validation Agent, Product Agent, Experiment Agent, Offer Agent, Campaign Agent, Meeting Preparation Agent, Opportunity Agent et Campaign Optimization Agent.
9. **Skills ICP/persona absents du pipeline principal** : ils sont listés comme skills supplémentaires, mais leur invocation exacte n'apparaît pas dans le pipeline des dix skills.
10. **Audience de campagne incomplète** : aucune entité explicite ne représente l'inscription d'un lead dans une campagne et sa progression dans une séquence.
11. **Validation humaine insuffisamment modélisée** : les statuts, versions, commentaires et preuves d'approbation ne sont pas détaillés.
12. **Roadmap Trigger.dev tardive** : Trigger.dev est introduit après les étapes données et campagnes, alors que la recherche, l'enrichissement et la vérification en dépendent déjà.
13. **MVP très large** : le périmètre inclus correspond presque à un produit commercial complet, pas à une première validation minimale.
14. **Recherche ou import dans l'acceptation** : le niveau d'automatisation de la recherche nécessaire au MVP n'est pas défini.
15. **Seuils de délivrabilité non définis** : rebonds, plaintes, adresses risquées, volumes et règles de pause n'ont pas de valeurs ni de méthode de configuration.
16. **Automatisation contrôlée non définie** : les conditions permettant de passer du mode manuel au mode automatique restent inconnues.
17. **Conformité non opérationnalisée** : les pays initiaux, bases juridiques, durées de rétention et processus de droits ne sont pas fixés.
18. **Réception des réponses non arrêtée** : le fournisseur, le protocole d'ingestion, la corrélation avec les messages et la gestion des threads ne sont pas précisés.
19. **CRM MVP ambigu** : le document prévoit un pipeline interne et des synchronisations externes sans choisir ce qui est réellement inclus au départ.
20. **Définition de la marge** : les coûts suivis sont décrits, mais pas le revenu facturé par client ni les règles d'allocation des coûts partagés.

## 15. Questions potentiellement bloquantes

### Produit et marché

1. Quels pays, langues et secteurs seront couverts par le pilote ?
2. L'agence utilisatrice est-elle unique au lancement ou la plateforme doit-elle supporter plusieurs agences dès le premier déploiement ?
3. Les clients auront-ils un portail dès le MVP ou uniquement des rapports partagés ?
4. Quel niveau de résultat doit valider le MVP : génération de message, email test ou campagne réelle limitée ?

### Autorisation et multitenancy

5. Un membre d'agence accède-t-il à tous les clients ou seulement à ceux qui lui sont affectés ?
6. Les rôles sont-ils fixes, personnalisables ou les deux ?
7. Un utilisateur peut-il appartenir à plusieurs agences et plusieurs clients ?
8. Comment doit fonctionner la révocation immédiate d'un utilisateur ou d'une intégration ?
9. Existe-t-il un rôle opérateur de plateforme autorisé à intervenir sur les tenants ?

### Architecture

10. Supabase, Trigger.dev et Next.js seront-ils cloud ou self-hosted ? Dans quelle région ?
11. Quelles opérations sont autorisées directement depuis le client Supabase ?
12. Quel workflow de migrations sera adopté : schémas déclaratifs ou migrations impératives ?
13. Quels RPO, RTO, volumes, latences et objectifs de disponibilité sont attendus ?

### Fournisseurs

14. Quel fournisseur email sera le premier : Gmail, Microsoft 365, SMTP ou autre ?
15. Comment les réponses entrantes seront-elles récupérées et corrélées ?
16. Quel fournisseur calendrier sera supporté en premier ?
17. Quel fournisseur IA et quels modèles seront autorisés ?
18. Quelles sources de leads et quels fournisseurs d'enrichissement sont légalement et contractuellement autorisés ?
19. Le MVP utilise-t-il uniquement le pipeline interne ou une intégration CRM externe ?

### Campagnes, conformité et délivrabilité

20. Quels seuils bloquent ou mettent automatiquement en pause une campagne ?
21. Quels volumes initiaux sont autorisés par domaine et compte ?
22. Quels pays, canaux et bases juridiques doivent être codifiés en premier ?
23. Quelles durées de rétention s'appliquent par catégorie de données ?
24. Quelles actions exigent toujours une validation humaine ?
25. Quelles conditions permettent un mode semi-automatique ou automatique contrôlé ?
26. Qui est responsable de la configuration DNS et de la réputation des domaines ?

### Économie et exploitation

27. Comment calculer le revenu, la marge client et la répartition des coûts partagés ?
28. Quels budgets et quotas doivent arrêter automatiquement les traitements ?
29. Qui traite les tâches en échec, campagnes en pause et réponses urgentes ?
30. Quelles preuves d'audit doivent être conservées et pendant combien de temps ?

## 16. Proposition de découpage du MVP

Le MVP décrit dans le cahier des charges doit être découpé en vertical slices utilisables et testables. La cible recommandée est un pilote avec une agence, quelques clients, un fournisseur par catégorie et des limites d'envoi très faibles.

### Lot 0 — Décisions et architecture exécutable

- choisir hébergement, régions et fournisseurs MVP ;
- figer la hiérarchie tenant et la matrice de permissions ;
- définir RPO/RTO, quotas et seuils de délivrabilité ;
- valider le périmètre juridique initial ;
- produire le modèle de données minimal et les machines d'état ;
- décider la frontière navigateur/Next.js/Supabase/Trigger.dev.

**Critère de sortie :** aucune question bloquante concernant tenant, fournisseur principal, envoi ou conformité.

### Lot 1 — Fondation multitenant sécurisée

- Next.js, Supabase, Auth et MFA selon le besoin ;
- agences, clients, invitations et memberships ;
- RBAC et RLS avec tests négatifs ;
- audit minimal ;
- secrets, logs, CI/CD et environnements ;
- squelette Trigger.dev, idempotence et outbox dès cette étape.

**Critère de sortie :** deux agences et deux clients de test ne peuvent jamais accéder aux données les uns des autres, y compris via tâches et Storage.

### Lot 2 — Stratégie client et base de leads

- onboarding ;
- offres, preuves et objections ;
- positionnement, ICP et personas ;
- import CSV uniquement ;
- entreprises, contacts, sources, normalisation et déduplication ;
- intégration initiale des skills commerciaux avec sorties structurées.

**Critère de sortie :** une agence peut transformer un onboarding en ICP validé puis importer une liste propre et traçable.

### Lot 3 — Qualité et qualification

- un enrichissement simple avec un seul fournisseur ou analyse de site ;
- un fournisseur de vérification email ;
- scoring déterministe versionné ;
- segmentation ;
- coûts par opération et contrôles de quota.

**Critère de sortie :** chaque lead possède provenance, statut de vérification, score explicable et segment.

### Lot 4 — Campagne assistée sans envoi de masse

- campagnes, audiences et enrollments ;
- séquences et templates ;
- génération IA ;
- contrôle StoryBrand/Made to Stick ;
- validation humaine et historique ;
- conformité et délivrabilité préflight ;
- envoi de test uniquement.

**Critère de sortie :** un message fondé sur des faits peut être généré, revu, approuvé et envoyé à une adresse de test avec audit complet.

### Lot 5 — Campagne réelle contrôlée

- un fournisseur email ;
- domaines et comptes séparés ;
- petits quotas configurables ;
- planification Trigger.dev, retries et idempotence ;
- événements de livraison, rebonds, suppressions et pauses ;
- relances et règles d'arrêt ;
- ingestion et classification des réponses.

**Critère de sortie :** une campagne pilote limitée fonctionne sans double envoi et s'arrête après réponse, rebond ou désabonnement.

### Lot 6 — Rendez-vous, pipeline et pilotage

- un fournisseur calendrier ;
- préparation SPIN ;
- pipeline interne simple ;
- opportunités et tâches ;
- dashboard agence/client minimal ;
- coûts, marge, rapports et Diagnose.

**Critère de sortie :** une réponse positive peut produire un rendez-vous, une opportunité et un rapport de performance de bout en bout.

### Hors pilote initial recommandé

- recherche web large et crawling multi-source ;
- portail client complet si des rapports suffisent au pilote ;
- plusieurs fournisseurs email/calendrier/CRM ;
- synchronisation CRM bidirectionnelle ;
- mode automatique sans validation humaine ;
- Realtime non indispensable ;
- analytics avancés, prédiction et optimisation automatique ;
- multicanal hors email.

## Décisions requises avant développement

Les décisions suivantes conditionnent directement le schéma, les policies RLS, les contrats de tâches et la roadmap :

1. modèle exact des tenants et des permissions ;
2. périmètre géographique et juridique du pilote ;
3. fournisseurs MVP pour email, réponses, calendrier, IA, enrichissement et vérification ;
4. hébergement et région de Next.js, Supabase et Trigger.dev ;
5. frontière d'accès entre navigateur, Next.js et Supabase ;
6. workflow de migrations et stratégie de sauvegarde/restauration ;
7. machines d'état des campagnes, enrollments, messages et opportunités ;
8. seuils de conformité, délivrabilité, quotas et budgets ;
9. actions nécessitant une validation humaine ;
10. définition réaliste du pilote et de son critère de succès.
