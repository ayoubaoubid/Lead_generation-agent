# Modèle de coûts des fournisseurs

## 1. Objectif

Ce document définit comment mesurer, attribuer, limiter et prévoir les coûts externes. Il ne crée aucun schéma et ne constitue pas un modèle de paiement ou de facturation client. Les contrats et règlements entre l'agence et ses clients restent hors plateforme.

Le modèle doit répondre à cinq questions :

1. quelle opération a consommé une ressource fournisseur ;
2. pour quel tenant et quelle ressource métier ;
3. quelle unité et quelle quantité ont été utilisées ;
4. quel coût était estimé avant l’appel et constaté après ;
5. quelle limite ou alerte doit empêcher une consommation excessive.

## 2. Principes

- aucune opération payante sans attribution tenant et corrélation ;
- estimation avant réservation, mesure après exécution, réconciliation si ambiguë ;
- prix et quotas sont configurés et versionnés, jamais dispersés dans le code métier ;
- les crédits fournisseur et la monnaie sont deux dimensions distinctes ;
- `0 crédit` ne signifie pas `0 coût` : calcul, stockage, egress et temps opérateur existent ;
- un timeout ne prouve pas qu’aucune consommation n’a eu lieu ;
- les environnements non-production ont des budgets et clés séparés ;
- les tests standards utilisent des fakes et ne consomment rien ;
- une limite de tenant ne peut pas être contournée par un payload Trigger.dev forgé ;
- les prix réels sont validés sur le plan souscrit et la facture, pas seulement sur une page publique.

## 3. Concepts de données

Les noms suivants sont des concepts fonctionnels, pas l’autorisation de créer des tables.

### 3.1 `provider_usage`

Journal append-only d’une consommation ou correction :

```text
id
environment
provider
operation
unit
quantity
agencyId
clientId
resourceType
resourceId
correlationId
idempotencyKeyHash
providerRequestId
status
estimatedCostAmount
actualCostAmount
currency
priceBookVersion
occurredAt
recordedAt
errorCode éventuel
metadata sûre
```

Statuts proposés :

```text
reserved | reported | estimated | reconciled | released | disputed
```

Une correction ajoute une écriture compensatrice ou une nouvelle version ; elle ne réécrit pas silencieusement l’historique.

### 3.2 `provider_limits`

Politique de consommation :

```text
scopeType: platform | agency | client | campaign | account | provider
scopeId
provider
operation éventuelle
unit ou currency
period
softLimit
hardLimit
burstLimit éventuel
action
effectiveFrom / effectiveTo
```

Actions possibles : alerter, ralentir, nécessiter une approbation, mettre en pause ou bloquer. Une limite hard échoue fermée avant l’appel, sauf procédure d’urgence explicitement auditée.

### 3.3 `provider_costs`

Catalogue tarifaire versionné :

```text
provider
operation
unit
pricingMode
unitPrice
currency
minimum éventuel
tiers éventuels
effectiveFrom / effectiveTo
sourceReference
planName
confidence
```

`pricingMode` décrit uniquement le coût du fournisseur : unité fixe, tokens différenciés, crédit, palier, forfait fournisseur alloué, variable ou coût constaté sur relevé. Les valeurs publiques servent d’estimation ; le relevé et le contrat fournisseur permettent la réconciliation.

### 3.4 `integration_health`

État opérationnel utile aux décisions de coût :

```text
provider
integrationId
agencyId
clientId éventuel
status
quotaRemaining éventuel
quotaResetAt éventuel
lastSuccessAt
lastFailureAt
lastErrorCode
circuitState
checkedAt
```

Ce concept ne doit pas contenir de secret ni devenir une source d’autorisation.

## 4. Unités par fournisseur

| Fournisseur | Opérations MVP | Unités à mesurer | Coûts indirects/notes |
|---|---|---|---|
| Groq | génération structurée, classification | requête, tokens entrée, tokens sortie, modèle | retries, prompts longs, fallback et sorties invalides |
| Apollo | recherche entreprises/personnes, enrichissements | requête, page, résultat, crédit, personne/entreprise enrichie | coût dépend du plan et des données retournées |
| Firecrawl | crawl, scrape/extraction structurée | requête, page, crédit, token/exécution si applicable | endpoint et complexité changent fortement le coût |
| ZeroBounce | vérification unitaire/batch | adresse soumise, résultat, crédit | résultat `unknown`, région et politique de crédit à réconcilier |
| Resend | email transactionnel | requête, message accepté, message livré si disponible | quota journalier/mensuel, domaine et stockage d’événements |
| Gmail API | envoi, lecture, historique, thread | requête, unités de quota Google, message | pas seulement un prix direct : quotas, Pub/Sub et opérations support |
| Google Pub/Sub | notification, livraison, stockage éventuel | message publié/livré, octets, retries | coût Google Cloud et amplification par doublons |
| Google Calendar | disponibilité, événement, watch | requête, unité de quota, canal actif | réconciliation et renouvellements périodiques |
| Trigger.dev | exécution de tâche | run, durée, compute, retry | attente, concurrence, logs et environnement selon plan |
| Supabase | base/Auth/Storage/egress | compute, stockage, MAU, egress, requête selon métriques | sauvegardes, PITR, logs et croissance des données |
| Sentry | erreurs, transactions, spans, logs/replays si activés | événement, span, volume | sampling et rétention pilotent le coût |
| Vercel | fonctions, build, bande passante | invocation, durée/compute, build minute, transfert | previews et observabilité peuvent amplifier l’usage |

## 5. Particularités par fournisseur

### 5.1 Groq

Avant l’appel : estimer les tokens à partir du cas d’usage, du contenu borné et du modèle choisi. Après l’appel : enregistrer les compteurs retournés, le modèle effectif, un éventuel cache, le nombre de tentatives et le statut du schéma.

Garde-fous :

- limite de tokens par tâche et par tenant ;
- contenu web/email tronqué ou résumé de façon déterministe avant appel ;
- pas de retry d’une sortie valide pour rechercher une formulation « meilleure » sans budget explicite ;
- suivi du coût des sorties invalides et refusées ;
- alerte si le ratio tokens utiles/tokens envoyés se dégrade.

### 5.2 Apollo

La documentation officielle actuelle indique notamment que la recherche de personnes ne consomme pas de crédits et ne renvoie pas les emails/téléphones, tandis que recherche d’organisations et enrichissements peuvent consommer des crédits selon l’opération et le plan. Ces règles sont des valeurs initiales du catalogue, pas des constantes de domaine.

Garde-fous :

- estimation distincte Discovery/Enrichment ;
- approbation ou budget réservé avant enrichissement massif ;
- cache/fraîcheur et déduplication sur identité fournisseur ;
- pagination plafonnée même si le fournisseur permet davantage ;
- pas d’enrichissement automatique de tous les résultats de recherche ;
- rapprochement mensuel crédits enregistrés/console/facture Apollo.

### 5.3 Firecrawl

Le prix dépend de la méthode. La documentation actuelle distingue notamment scrape JSON par page, extraction historique basée sur tokens et agent à coût dynamique. Comme l’offre évolue, l’adaptateur remonte les crédits réellement annoncés et le catalogue conserve l’endpoint/version.

Garde-fous :

- domaine et nombre maximal de pages ;
- budget de crédits maximum par job ;
- réutilisation d’une recherche suffisamment fraîche ;
- arrêt du crawl à seuil ;
- pas d’agent autonome web-wide pour un simple site connu sans décision de coût ;
- suivi du rendement : preuves exploitables par page/crédit.

### 5.4 ZeroBounce

La documentation tarifaire actuelle annonce typiquement un crédit par validation, mais le plan réel, les résultats inconnus et les modalités batch doivent être vérifiés. Le journal conserve adresse soumise, statut normalisé, crédit rapporté et coût.

Garde-fous :

- dédupliquer les adresses normalisées ;
- définir une durée de fraîcheur par statut ;
- ne pas revérifier à chaque tentative d’envoi ;
- bloquer les lots au-delà du budget ;
- mesurer `unknown` et erreurs techniques séparément ;
- ne jamais économiser une vérification en assimilant une donnée Apollo à une validation.

### 5.5 Resend

Mesurer requête et message accepté, puis compléter avec les événements de livraison disponibles. Les limites de requêtes et quotas email sont lues depuis les en-têtes/console et configurées par plan.

Garde-fous : clé d’idempotence, séparation transactionnelle, quota par environnement, alertes de rebond et aucun test live depuis la CI standard.

### 5.6 Gmail, Pub/Sub et Calendar

Même sans tarif unitaire comparable à un enrichissement, ces intégrations consomment des quotas et peuvent générer une facture Google Cloud, de l’exécution Trigger.dev et du support.

Mesurer :

- appels Gmail par méthode et unités de quota si exposées ;
- messages envoyés et synchronisés ;
- appels `history.list`, full sync et 404 de curseur ;
- notifications Pub/Sub, doublons, retries et octets ;
- renouvellements de watches ;
- appels Calendar et canaux actifs ;
- coût Trigger.dev associé à chaque synchronisation.

Une boucle de notification ou un full sync répétitif est une anomalie de coût et de fiabilité devant ouvrir une alerte/circuit.

### 5.7 Infrastructure partagée

Supabase, Vercel, Trigger.dev et Sentry ont une part fixe ou partagée. Deux vues sont nécessaires :

- coût marginal directement attribuable à une agence/client/ressource ;
- allocation du coût partagé pour le pilotage interne.

La méthode d’allocation commerciale — égalitaire, proportionnelle aux usages, par plan ou non répercutée — reste une décision finance/produit. Elle ne doit pas altérer le journal technique brut.

## 6. Cycle réservation–exécution–réconciliation

### 6.1 Avant l’appel

1. établir le tenant et la ressource ;
2. vérifier l’éligibilité métier et la conformité ;
3. calculer l’unité et la quantité maximale prévues ;
4. charger le prix versionné ;
5. vérifier limites plateforme, agence, client, campagne et compte ;
6. réserver atomiquement l’usage estimé avec la clé d’idempotence ;
7. refuser ou mettre en pause si la limite hard serait dépassée.

### 6.2 Après l’appel

1. collecter usage et identifiant de requête ;
2. finaliser quantité et coût réels ;
3. libérer la différence de réservation ;
4. enregistrer les erreurs et tentatives ;
5. mettre à jour la santé et les compteurs ;
6. émettre une alerte si le seuil soft est franchi.

### 6.3 État ambigu

Après timeout ou réponse incomplète :

- conserver la réservation ;
- marquer `estimated` ou `disputed` ;
- interroger une API de statut si disponible ;
- rapprocher avec identifiant fournisseur, console ou facture ;
- ne pas répéter un effet externe non idempotent avant réconciliation.

## 7. Limites et budgets

### 7.1 Hiérarchie

```text
budget plateforme
  └─ budget agence
       └─ budget client
            └─ budget campagne
                 └─ limite opération/compte/domaine
```

Toutes les limites applicables doivent être satisfaites. Un budget enfant non consommé n’autorise pas à dépasser le parent.

### 7.2 Périodes

Prévoir : run, minute/heure pour le burst, jour, cycle comptable du fournisseur et durée de campagne. Les resets fournisseur et les fuseaux horaires doivent être explicites.

### 7.3 Soft et hard limits

- **soft** : alerte, bannière, ralentissement ou approbation ;
- **hard** : aucune nouvelle réservation ; tâches en attente mises en pause de façon explicable ;
- les opérations de sécurité comme traiter un désabonnement ou révoquer un token ne doivent pas être bloquées par un budget technique ordinaire ;
- la synchronisation minimale nécessaire pour stopper des envois peut être classée coût de protection prioritaire.

## 8. Prévision du coût d’un workflow

Une estimation de campagne doit montrer séparément :

```text
nombre de résultats de découverte
pages de recherche entreprises
personnes sélectionnées à enrichir
sites/pages à analyser
adresses à vérifier
appels IA et tokens prévus
emails autorisés
synchronisations/réponses prévues
coût d’orchestration et infrastructure marginal
marge d’erreur
```

Formule conceptuelle :

```text
coût estimé campagne =
  Σ(quantité opération × tarif versionné)
  + infrastructure marginale estimée
  + marge de retries/unknown
```

Le nombre de leads découverts ne doit pas être multiplié automatiquement par tous les coûts aval. Les filtres et validations réduisent le funnel avant chaque étape payante.

## 9. KPI de coût et qualité

- coût par entreprise découverte ;
- coût par personne enrichie ;
- coût par email vérifié valide ;
- coût de recherche web par preuve utilisable ;
- coût IA par sortie structurée valide ;
- coût par email autorisé puis envoyé ;
- coût par réponse qualifiée ;
- coût par rendez-vous accepté ;
- taux de cache/réutilisation ;
- dépenses perdues par doublon, timeout, sortie invalide ou `unknown` ;
- écart estimation/réel ;
- consommation par tenant, campagne, compte et fournisseur ;
- part fixe vs marginale.

Ces KPI servent au pilotage. Ils ne doivent pas encourager une baisse des contrôles de conformité, sécurité ou délivrabilité.

## 10. Alertes et anomalies

Alertes minimales :

- hausse soudaine du coût par opération ;
- taux de retry, timeout ou sortie invalide au-dessus du seuil ;
- quota restant faible ou inconnu ;
- nombre inhabituel d’enrichissements par résultat utile ;
- crawl d’un nombre de pages supérieur à la politique ;
- full sync Gmail répété ;
- notifications Pub/Sub en boucle ;
- appels d’un tenant avec le credential d’un autre ;
- usage en production sans `resourceId` ou `correlationId` ;
- divergence persistante entre journal, console et facture ;
- consommation live depuis un environnement de test.

## 11. Tests

Les fakes exposent des compteurs synthétiques déterministes. Tests attendus :

- réservation acceptée/refusée aux seuils exacts ;
- deux runs de même clé ne doublent ni usage ni effet ;
- release après échec définitif sans consommation ;
- maintien/réconciliation après timeout ambigu ;
- prix versionné choisi selon date et plan ;
- attribution agence/client correcte ;
- refus inter-tenant ;
- lots/pagination comptabilisés exactement ;
- retry inclus sans double comptabilisation du coût technique ;
- secret et PII absents des événements d’usage ;
- limite d’un tenant sans blocage global injustifié.

Les tests live sont ponctuels, opt-in, plafonnés et associés à un centre de coût de test. Ils ne valident pas une facture complète.

## 12. Réconciliation financière

À une fréquence à décider :

1. exporter ou consulter l’usage fournisseur ;
2. rapprocher période, plan, opération et identifiants disponibles ;
3. expliquer les écarts de devise, arrondi, minimum, crédits gratuits ou forfait ;
4. ajouter les corrections sans supprimer l’historique ;
5. mettre à jour le catalogue pour la période suivante ;
6. alerter sur tout usage sans tenant ou tout coût fournisseur sans événement connu.

Le coût réel peut n’être connu qu’à la réception du relevé fournisseur. `estimatedCost` et `actualCost` ne doivent donc pas être confondus.

## 13. Séparation définitive entre coûts techniques et relation commerciale

Le journal d’usage sert exclusivement au pilotage opérationnel des fournisseurs externes. Il mesure les appels, unités, crédits consommés, coûts estimés et coûts constatés afin de :

1. attribuer une consommation à une agence, un client, une opération et une ressource ;
2. appliquer des budgets, alertes, quotas et limites techniques ;
3. prévenir les dépenses fournisseurs inattendues ;
4. comparer estimation et coût réellement constaté ;
5. expliquer les écarts et ajuster les limites futures.

Ce journal ne produit aucune ligne facturable pour le client, aucun solde prépayé, aucun abonnement, aucune facture et aucun paiement. Les crédits fournisseur restent des unités techniques propres à Apollo, Firecrawl, ZeroBounce, Groq, Trigger.dev, Gmail, Resend ou un autre opérateur autorisé.

Règles définitives :

- les contrats, tarifs négociés et règlements entre l'agence et ses clients restent hors plateforme ;
- aucun coût fournisseur n'est automatiquement transformé en prix client ;
- aucune table, page, route, webhook, tâche ou abstraction de paiement n'est autorisée ;
- Stripe, `PaymentProvider`, `BillingProvider`, checkout, billing, plans tarifaires, abonnements SaaS et factures client automatiques sont exclus ;
- une correction fournisseur reste un ajustement de coût technique traçable ;
- les opérations de conformité et de sécurité ne sont jamais bloquées par une limite de consommation ordinaire.

## 14. Décisions avant développement

- devise de référence et taux de change ;
- source de vérité des tarifs et responsable de mise à jour ;
- périodes et fuseaux de budgets ;
- montants soft/hard par environnement et tenant ;
- politique d’allocation des coûts fixes ;
- marge prévue pour retries et états inconnus ;
- fraîcheur/caching par type de donnée ;
- personnes autorisées à augmenter une limite ;
- traitement des tâches déjà réservées lors d’une baisse de budget ;
- données visibles par l’agence et le client ;
- mécanisme de réconciliation avec chaque console ou relevé fournisseur.

## 15. Références tarifaires à revérifier

- [Apollo — API Pricing and Credits](https://docs.apollo.io/docs/api-pricing)
- [Firecrawl — Choosing the Data Extractor](https://docs.firecrawl.dev/developer-guides/usage-guides/choosing-the-data-extractor)
- [Groq — Rate Limits](https://console.groq.com/docs/rate-limits)
- [ZeroBounce — Pricing](https://www.zerobounce.net/pricing)
- [Resend — Usage Limits](https://resend.com/docs/api-reference/rate-limit)
- [Google Cloud Pub/Sub — Pricing](https://cloud.google.com/pubsub/pricing)
- [Trigger.dev — Pricing](https://trigger.dev/pricing)
- [Supabase — Pricing](https://supabase.com/pricing)
- [Sentry — Pricing](https://sentry.io/pricing/)
- [Vercel — Pricing](https://vercel.com/pricing)

Les valeurs publiques peuvent changer sans modification du code. Avant toute estimation de coût technique, vérifier le contrat fournisseur, la région, les taxes appliquées par le fournisseur, la devise, les paliers et les quotas effectifs.
