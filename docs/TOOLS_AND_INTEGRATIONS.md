# Outils et intégrations

## 1. Objet et statut du document

Ce document fixe la cartographie des outils, fournisseurs et intégrations du produit. Il complète le cahier des charges et les principes d’architecture sans autoriser leur implémentation.

Les choix marqués **MVP retenu** sont des choix d’architecture, pas la confirmation qu’un compte, un contrat fournisseur, une clé, un domaine ou une validation OAuth existe déjà. Chaque intégration reste soumise à une validation contractuelle, tarifaire, juridique, de sécurité et de capacité avant développement.

Le catalogue contient uniquement des outils opérationnels. Stripe, paiement, checkout, billing et facturation client automatique sont définitivement exclus ; aucun port ou adaptateur de paiement ne doit être réservé. Les tarifs, crédits et contrats mentionnés ci-dessous concernent uniquement les fournisseurs techniques.

Statuts utilisés :

- **socle retenu** : composant principal de la plateforme ;
- **MVP retenu** : premier adaptateur prévu derrière une interface remplaçable ;
- **outil de développement** : utilisé pour construire ou tester, sans responsabilité métier ;
- **différé** : explicitement hors MVP ;
- **à décider** : choix bloquant ou validation encore nécessaire.

## 2. Principes de sélection

1. Le domaine ne dépend d’aucun SDK fournisseur.
2. Une intégration externe est appelée uniquement via un port applicatif et un adaptateur.
3. Les données externes sont non fiables jusqu’à leur validation et leur normalisation.
4. La recherche, l’enrichissement et la vérification sont trois étapes distinctes.
5. L’email transactionnel et la prospection commerciale sont deux canaux distincts.
6. Une sortie IA conseille ou structure ; le code déterministe autorise et exécute.
7. Une indisponibilité fournisseur ne doit pas rompre l’isolation des tenants ni produire de doublon.
8. Le prix, les quotas et les capacités sont configurables, versionnés et observables.
9. Les tests automatisés utilisent des fakes et ne consomment jamais de crédits réels.
10. Les traitements longs, réessayables, entrants ou planifiés passent par Trigger.dev.

## 3. Vue d’ensemble du workflow outillé

```text
ICP et campagne
    │
    ├─ Apollo : découverte d’entreprises et de personnes
    │      └─ Apollo : enrichissement explicite et budgété
    │
    ├─ Firecrawl : recherche ciblée sur le site public de l’entreprise
    │
    ├─ ZeroBounce : vérification de l’adresse avant éligibilité à l’envoi
    │
    ├─ Groq : extraction/classification/rédaction structurée
    │      └─ validation Zod + règles déterministes + approbation éventuelle
    │
    ├─ Gmail API : prospection et synchronisation des conversations
    │      └─ Pub/Sub → webhook sécurisé → Trigger.dev → historique Gmail
    │
    ├─ Google Calendar : disponibilité et rendez-vous
    │
    └─ Resend : notifications strictement transactionnelles

Supabase conserve l’état durable et applique RLS.
Trigger.dev orchestre les travaux durables et réessayables.
Sentry et les journaux structurés assurent l’observabilité.
```

### 3.1 Responsabilités, agents et données échangées

Le mot « agent » désigne ici le rôle applicatif ou de développement consommateur. Ces agents n’obtiennent jamais une autorité supérieure à celle du service applicatif et des règles déterministes.

| Outil | Agent ou consommateur principal | Données échangées | Raison du choix | Dépendances et risques majeurs |
|---|---|---|---|---|
| GitHub | agents de développement et reviewers | code, documentation, PR, décisions | traçabilité et revue centralisées | gouvernance du dépôt et secrets CI |
| GitHub Actions | agent CI/CD | commit, résultats lint/types/tests/build | contrôles reproductibles avant livraison | supply chain, permissions de workflow, minutes |
| pnpm | agent de développement/CI | manifeste et lockfile de dépendances | installation rapide et déterministe | version à épingler, dépendances compromises |
| Turborepo | agent de build, si justifié | graphe de packages et cache de build | accélérer un vrai monorepo | complexité inutile si un seul workspace |
| Next.js/React/Tailwind | application web | commandes utilisateur et vues autorisées | stack web cohérente avec App Router | frontières serveur/client et exposition de données |
| TypeScript/ESLint/Prettier | développement/CI | sources et diagnostics | contrats stricts et qualité uniforme | ne remplacent pas la validation runtime |
| Vitest | agent de test | fixtures et résultats simulés | boucle rapide pour domaine/services | fakes pouvant diverger des contrats réels |
| Playwright | agent E2E | interactions navigateur et captures de test | vérifier les parcours réels | coût/flakiness ; interdit comme scraper principal |
| Docker | développement/CI | images et services locaux | reproductibilité | images vulnérables et divergence cloud |
| Vercel | runtime Next.js/déploiement | bundles, requêtes web, variables serveur | hébergement naturel de Next.js | régions, quotas, coûts, limites runtime |
| Supabase | services applicatifs et agents métier | identités, état métier, fichiers et audit | PostgreSQL, Auth, RLS et Storage intégrés | RLS, clé privilégiée, région et sauvegardes |
| Trigger.dev | orchestrateur et tous agents de workflow | références tenant/resource, commandes et statuts de run | travail durable, retry et planification | doublons, concurrence, coûts et tâches bloquées |
| Groq | agents IA de recherche, rédaction et classification | prompt versionné, données minimisées, JSON structuré | faible latence et Structured Outputs | modèle compatible, hallucination, prompt injection, coût tokens |
| Apollo | agent de sourcing/enrichissement | critères ICP, pages de candidats, données enrichies, usage | recherche B2B et enrichissement dans un même adaptateur MVP | crédits, plan, provenance et droits d’usage |
| Firecrawl | agent de recherche web | URL publique, contenu/extractions et sources | contenu web structuré sans maintenir un scraper | coût variable, évolution d’API, ToS, injection |
| ZeroBounce | agent de délivrabilité | adresses minimisées et statuts de vérification | service spécialisé avec statuts détaillés | latence, `unknown`, crédits, transfert de PII |
| Resend | service de notification | destinataire, modèle transactionnel, reçu | API transactionnelle simple avec idempotence | DNS, quotas, réputation, séparation outreach |
| Gmail API | agent d’outreach et agent de synchronisation | messages commerciaux, threads, métadonnées et historique | canal MVP directement lié aux boîtes Google | OAuth restreint, quotas, délivrabilité, révocation |
| Google Cloud Pub/Sub | adaptateur entrant Gmail | notification minimale, `messageId`, `historyId` | mécanisme push officiel Gmail | doublons/pertes, IAM, coût, renouvellement des watches |
| Google Calendar API | agent de planification | disponibilités et événements | calendrier cohérent avec le compte Google connecté | scopes, fuseaux, doublons et conflits |
| Sentry | agent d’exploitation | erreurs/traces nettoyées et identifiants de corrélation | diagnostic et alertes centralisés | fuite de PII/secrets, sampling et rétention |

Les raisons ci-dessus justifient le premier adaptateur du MVP, pas un verrouillage fournisseur. La décision finale reste conditionnée par le contrat, le coût réel, la région, les quotas et les validations de conformité.

## 4. Socle de développement et de livraison

| Outil | Statut | Responsabilité | Limites et décisions |
|---|---|---|---|
| GitHub | socle retenu | dépôt, revue, traçabilité | règles de branches et protections à configurer |
| GitHub Actions | socle retenu | lint, types, tests, build et contrôles de sécurité | aucun secret de production dans les workflows non protégés |
| pnpm | socle retenu | gestion déterministe des dépendances | version à épingler ; lockfile obligatoire |
| Turborepo | conditionnel | orchestration d’un monorepo | à introduire seulement si plusieurs applications ou packages le justifient réellement |
| Next.js App Router | socle retenu | interface web et frontières HTTP serveur | ne porte pas les traitements longs |
| React | socle retenu | interface utilisateur | aucune logique métier critique dans les composants |
| TypeScript strict | socle retenu | contrats statiques | toute donnée externe reste validée au runtime |
| Tailwind CSS | socle retenu | présentation | pas de responsabilité métier |
| ESLint et Prettier | socle retenu | qualité et formatage | versions/configurations à stabiliser avant le premier code |
| Vitest | socle retenu | tests unitaires et d’intégration applicatifs | fournisseurs simulés par défaut |
| Playwright | socle retenu | parcours E2E et tests navigateur | ne doit pas devenir le moteur de scraping de production |
| Docker | socle retenu | environnement reproductible et dépendances locales | ne remplace pas les outils locaux officiels Supabase |
| Vercel | cible retenue | hébergement Next.js | régions, limites, logs, secrets et budget à valider |

Le dépôt peut commencer comme monolithe modulaire. Turborepo n’est justifié que si la séparation en applications ou packages apporte une isolation concrète, par exemple `web`, `workers-contracts` et bibliothèques partagées. Il ne doit pas être ajouté par anticipation.

## 5. Données, authentification et orchestration

### 5.1 Supabase Cloud et CLI

**Statut : socle retenu.**

Responsabilités :

- PostgreSQL comme source de vérité durable ;
- Auth pour l’identité utilisateur ;
- RLS et droits SQL pour l’isolation multitenant ;
- Storage pour les fichiers tenant-aware ;
- migrations versionnées via le workflow CLI ;
- logs de base et d’API comme source opérationnelle complémentaire.

Contraintes :

- la clé `service_role` reste exclusivement côté serveur ;
- toute opération privilégiée refait les contrôles d’agence, de client, de rôle et de ressource ;
- RLS et `GRANT` sont deux contrôles distincts ;
- aucune migration distante ou création de projet n’est autorisée par ce document ;
- le choix de stockage chiffré des secrets tenant reste à arrêter dans une revue dédiée.

Compte requis plus tard : organisation et projets Supabase séparés au minimum entre non-production et production, avec propriétaires, suivi des coûts fournisseur et récupération définis.

### 5.2 Trigger.dev Cloud

**Statut : socle retenu.**

Responsabilités : tâches longues, planifiées, réessayables, webhooks entrants, synchronisations et orchestration des appels fournisseurs.

Le périmètre prévu couvre : imports, recherches paginées, enrichissements, recherches de sites, vérifications d’emails, générations Groq, préparation de campagnes, envois, relances, synchronisations, classifications Groq des réponses, rapports et tâches programmées.

Chaque payload interne doit contenir au minimum :

```text
agencyId
clientId
resourceId
idempotencyKey
correlationId
actorId (si une personne ou identité technique est à l’origine de l’action)
```

Une tâche recharge la ressource, revalide le tenant, les autorisations, l’état métier, la conformité, la délivrabilité et le budget juste avant tout effet externe. L’idempotence Trigger.dev complète, mais ne remplace pas :

- une contrainte unique métier ;
- un état persistant ;
- une transaction ou une réservation contrôlée ;
- un journal de runs et d’effets externes.

Les files et limites de concurrence doivent empêcher un tenant volumineux de bloquer les autres. Les seuils exacts restent configurables et seront testés en charge.

Compte requis plus tard : organisation Trigger.dev, environnements séparés, membres, secrets, quotas et politique de rétention.

## 6. Intelligence artificielle — Groq

**Statut : MVP retenu** comme premier adaptateur de `AIProvider`.

Usages autorisés :

- extraction d’informations en sortie structurée ;
- classification des réponses entrantes ;
- proposition de personnalisation et de messages ;
- résumé et assistance à la qualification.

Contrat d’exécution :

- prompt et schéma versionnés ;
- JSON Schema strict lorsque le modèle Groq choisi le supporte ;
- champs requis et `additionalProperties: false` en mode strict ;
- validation Zod systématique après la réponse, même en mode strict ;
- refus ou fallback contrôlé si le schéma, les preuves ou la confiance sont insuffisants ;
- mesure du modèle, de la latence, des tokens d’entrée/sortie, du coût estimé et du résultat ;
- aucune sortie ne déclenche seule un envoi, un rendez-vous, une suppression ou un changement de permission.

Le modèle Groq précis n’est pas fixé ici : la compatibilité avec Structured Outputs strict, la disponibilité régionale, la fenêtre de contexte, le prix et les limites doivent être vérifiés lors de l’intégration. Le contenu web et les emails sont des données non fiables, pas des instructions.

Compte requis plus tard : compte Groq, projet/clé par environnement si disponible, budget, limites et validation des conditions de traitement des données.

## 7. Données de leads — Apollo

**Statut : MVP retenu** comme premier adaptateur de `LeadDataProvider`.

Responsabilités :

- rechercher des entreprises à partir de critères d’ICP ;
- rechercher des personnes à partir de critères professionnels ;
- enrichir explicitement une entreprise ou une personne sélectionnée ;
- exposer l’usage et les crédits consommés.

Décisions importantes :

- la recherche de personnes Apollo ne renvoie pas nécessairement les emails ou téléphones ;
- une donnée visible en recherche n’est pas considérée comme enrichie ou vérifiée ;
- chaque enrichissement est un acte séparé, budgété et journalisé ;
- l’adresse obtenue doit encore passer par le fournisseur de vérification ;
- le système stocke la provenance, la date d’observation et l’identifiant fournisseur ;
- les limites d’affichage, de pagination, de plan et de crédits sont lues depuis la configuration courante, jamais supposées immuables.

Apollo ne fournit pas la conformité finale, le droit de contacter une personne ni la preuve de délivrabilité. Le responsable métier doit valider les finalités, bases légales, zones géographiques et règles de conservation.

Compte requis plus tard : contrat Apollo compatible avec les endpoints choisis, clé API, quotas, droits d’utilisation/export, DPA et conditions applicables à la prospection.

Implémentations futures prévues derrière le même port : autre fournisseur B2B, import CSV validé, saisie manuelle autorisée et fournisseur interne. CSV et saisie manuelle sont des adaptateurs d’entrée sans appel payant, mais restent soumis aux mêmes modèles canoniques, provenance, déduplication et contrôles tenant.

## 8. Recherche sur sites publics — Firecrawl

**Statut : MVP retenu** comme premier adaptateur de `WebsiteResearchProvider`.

Responsabilités :

- parcourir un site d’entreprise public et autorisé ;
- extraire services, positionnement, preuves publiques, cas clients et signaux utiles ;
- produire des données structurées avec URL source et horodatage ;
- alimenter la personnalisation après validation.

Firecrawl n’est pas le fournisseur principal de découverte massive de leads. Les domaines doivent provenir d’une ressource déjà qualifiée ou d’une demande explicite. Le crawl respecte les limites de portée, taille, profondeur, durée, budget et conditions d’utilisation.

La documentation Firecrawl actuelle présente `/agent` comme successeur de `/extract`, et `/scrape` JSON comme option contrôlée pour une page connue. Le port conserve la capacité métier `extractStructuredData<T>` ; l’adaptateur choisira l’endpoint officiel approprié au moment du développement. Il ne faut donc pas coupler le domaine à `/extract` ni figer son économie actuelle.

Compte requis plus tard : compte Firecrawl, plan, clé par environnement, limites de crédits, choix de région/rétention et revue des sources autorisées.

## 9. Vérification d’emails — ZeroBounce

**Statut : MVP retenu** comme premier adaptateur de `EmailVerificationProvider`.

Responsabilités : vérifier une adresse unitaire ou un lot et normaliser le résultat vers :

```text
valid | invalid | risky | catch_all | unknown |
disposable | role_based | suppressed
```

Les statuts fournisseurs détaillés et sous-statuts sont conservés séparément pour l’audit, mais ne se propagent pas dans le domaine. La politique déterministe décide ensuite si l’adresse peut être utilisée. `unknown`, `catch_all` et `risky` ne sont jamais transformés implicitement en `valid`.

La validation unitaire peut être lente et retourner un résultat inconnu ; les timeouts et traitements par lot doivent donc passer par Trigger.dev. Les limites de batch publiées ayant évolué selon les offres du fournisseur, leur valeur exacte sera découverte/configurée lors de l’intégration. Le coût actuel annoncé d’une validation doit aussi être enregistré dans un catalogue de coûts fournisseur versionné.

Compte requis plus tard : compte ZeroBounce crédité, clé API, endpoint/région approprié, DPA, règles de conservation et budget.

## 10. Email transactionnel — Resend

**Statut : MVP retenu** comme premier adaptateur de `TransactionalEmailProvider`.

Responsabilités : invitations, notifications de compte, alertes internes et autres emails strictement transactionnels.

Interdictions :

- ne pas utiliser Resend comme moteur principal de prospection froide ;
- ne pas mélanger domaines, modèles, statistiques ou consentements transactionnels et commerciaux ;
- ne pas compter sur le seul identifiant fournisseur pour empêcher un double envoi.

L’adaptateur utilise une clé d’idempotence stable, respecte les en-têtes de rate limit et remonte statut, identifiant externe et coût. La configuration de domaine impose DNS, SPF, DKIM, DMARC, adresse d’expédition et processus de rebond conformes.

Compte requis plus tard : compte Resend, domaine vérifié, DNS, clé par environnement, quotas, expéditeurs et DPA.

## 11. Prospection et réponses — Gmail API et Pub/Sub

### 11.1 Gmail API

**Statut : MVP retenu** comme premier adaptateur de `OutreachEmailProvider`.

Responsabilités :

- connecter un compte expéditeur via OAuth ;
- envoyer un message de prospection autorisé ;
- lire et synchroniser les messages nécessaires ;
- reconstruire un fil ;
- rapprocher les réponses d’une campagne et d’un prospect.

Le compte expéditeur appartient explicitement à une agence ou un client. Il ne peut pas être réutilisé entre tenants sans règle de partage approuvée. Les scopes OAuth doivent être minimaux ; certains scopes Gmail sont sensibles ou restreints et peuvent imposer une vérification Google ainsi qu’une évaluation de sécurité si les données sont stockées ou transmises par le serveur.

### 11.2 Réponses entrantes

**Statut : MVP retenu** avec Google Cloud Pub/Sub, Trigger.dev et Groq.

Flux cible :

1. Gmail publie une notification minimale vers un topic Pub/Sub autorisé.
2. Le webhook vérifie la requête, le projet, la subscription, l’audience et la protection anti-replay.
3. L’événement est dédupliqué et accusé réception rapidement.
4. Trigger.dev recharge le compte et synchronise les changements depuis le dernier `historyId`.
5. Le message original est stocké selon la politique de minimisation et de rétention.
6. Le rapprochement déterministe identifie fil, campagne et prospect.
7. Groq propose une classification structurée ; Zod et les règles métier la valident.
8. Une réponse, un désabonnement, une plainte ou un signal bloquant arrête immédiatement les envois concernés.

Les watches Gmail expirent et doivent être renouvelées. Les notifications peuvent être retardées ou perdues ; une resynchronisation périodique avec l’historique Gmail est donc obligatoire. Une notification Pub/Sub ne constitue jamais la source de vérité du contenu.

Comptes requis plus tard : projet Google Cloud, suivi des coûts fournisseur si nécessaire, APIs Gmail et Pub/Sub activées, écran de consentement OAuth, client OAuth, domaines/redirect URIs, topic, subscription, IAM, validation Google et comptes de test.

## 12. Calendrier — Google Calendar

**Statut : MVP retenu** comme premier adaptateur de `CalendarProvider`.

Responsabilités : lire les disponibilités nécessaires, créer, mettre à jour et annuler un rendez-vous autorisé.

Le calendrier est connecté par OAuth avec scopes minimaux et appartient à un tenant explicite. Toute création utilise une clé métier empêchant les rendez-vous doublons. Les notifications Calendar éventuelles signalent un changement mais ne contiennent pas l’état complet ; une lecture API et une réconciliation restent nécessaires.

Compte requis plus tard : même projet Google Cloud ou projet dédié selon la séparation décidée, Calendar API activée, écran OAuth/scopes validés et calendriers de test.

## 13. Observabilité — Sentry et journaux

**Statut : socle retenu.**

Sources complémentaires :

- Sentry : erreurs applicatives, traces et alertes ;
- Supabase Logs : base, Auth et Data API ;
- Trigger.dev Dashboard : runs, files, retries et erreurs ;
- logs structurés internes : événements métier et corrélation ;
- journal d’audit durable : actions sensibles et changements d’état.

Champs utiles : environnement, `agencyId`, `clientId`, `resourceId`, `correlationId`, type de tâche, adaptateur, statut normalisé et durée. Les secrets, tokens, corps d’email, prompts contenant des données personnelles, contenu crawlé sensible et PII non indispensable sont exclus ou masqués avant émission.

Le format de logs interopérable utilise lorsque pertinent : `agency_id`, `client_id`, `actor_id`, `resource_id`, `provider`, `operation`, `trigger_run_id` et `correlation_id`. Ces champs servent à la corrélation et ne remplacent jamais un contrôle d’autorisation.

Compte requis plus tard : organisation/projets Sentry par environnement ou stratégie équivalente, DSN, membres, rétention, sampling, alertes et DPA.

## 14. Intégrations différées

Sont hors MVP :

- Microsoft Graph pour Outlook et Calendar ;
- Microsoft Calendar et Calendly comme futurs adaptateurs calendrier ;
- Salesforce et HubSpot ;
- automatisation LinkedIn ;
- SMS et WhatsApp ;
- intégrations Slack ou Teams avancées ;
- plusieurs fournisseurs actifs simultanément pour l’IA, les leads ou la vérification ;
- PostHog.

Les ports préservent leur ajout futur, mais aucun code, table ou écran ne doit être créé aujourd’hui pour ces options sans cas d’usage approuvé.

Stripe et la facturation client ne sont pas des intégrations différées : elles sont supprimées définitivement du périmètre. Aucun port, SDK, secret, adaptateur, webhook, écran, route ou table ne doit être conçu pour les ajouter ultérieurement.

## 15. Décisions et validations avant intégration

| Sujet | Validation requise |
|---|---|
| Pays et segments ciblés | conformité, base légale, listes d’opposition et conditions des sources |
| Apollo | plan, endpoints, quotas, coût réel, droits d’usage et export |
| Firecrawl | endpoints v2 précis, sources autorisées, profondeur, rétention et coût maximal |
| ZeroBounce | région, batch actuel, mapping détaillé des statuts et règles d’éligibilité |
| Groq | modèle strict compatible, région, conservation, coût et fallback |
| Google | ownership du projet, scopes, validation OAuth, security assessment éventuel, Pub/Sub IAM |
| Gmail outreach | volume progressif, limites par compte/domaine, warm-up et politique d’arrêt |
| Resend | domaine transactionnel séparé et configuration DNS |
| Supabase | régions, environnements, sauvegardes, PITR, coffre de secrets tenant |
| Trigger.dev | files, concurrence, rétention, timeouts et budget |
| Sentry | sampling, rétention et politique de données |
| Vercel | région, quotas, fonctions, logs et séparation des environnements |

## 16. Références officielles vérifiées

- [Apollo — People API Search](https://docs.apollo.io/reference/people-api-search)
- [Apollo — API Pricing and Credits](https://docs.apollo.io/docs/api-pricing)
- [Firecrawl — choisir l’extracteur](https://docs.firecrawl.dev/developer-guides/usage-guides/choosing-the-data-extractor)
- [Firecrawl — API v2](https://docs.firecrawl.dev/api-reference/v2-introduction)
- [Groq — Structured Outputs](https://console.groq.com/docs/structured-outputs)
- [Groq — Rate Limits](https://console.groq.com/docs/rate-limits)
- [ZeroBounce — validation v2](https://www.zerobounce.net/docs/email-validation-api-quickstart/v2-validate-emails)
- [Resend — Usage Limits](https://resend.com/docs/api-reference/rate-limit)
- [Gmail — Push Notifications](https://developers.google.com/workspace/gmail/api/guides/push)
- [Gmail — Synchronize Clients](https://developers.google.com/workspace/gmail/api/guides/sync)
- [Google — OAuth 2.0 Web Server](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google — OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)
- [Trigger.dev — Idempotency](https://trigger.dev/docs/idempotency)
- [Trigger.dev — Queues and Concurrency](https://trigger.dev/docs/queue-concurrency)
- [Supabase — Next.js Auth](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Supabase — Local Development and CLI](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Playwright — Best Practices](https://playwright.dev/docs/best-practices)
- [Sentry — Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

Ces liens décrivent un état fournisseur susceptible d’évoluer. Ils doivent être revérifiés, avec les pages de prix, quotas, confidentialité et changelogs, au début de chaque intégration.
