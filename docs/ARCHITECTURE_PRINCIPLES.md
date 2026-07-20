# Principes d'architecture

Ce document définit les principes durables qui doivent guider la conception. Il complète `PROJECT_ANALYSIS.md` sans répéter le périmètre fonctionnel du cahier des charges.

## 1. Architecture cible

La plateforme suit une architecture de **monolithe modulaire** avec traitements asynchrones durables :

```text
Navigateur
   │
   ▼
Next.js — UI et Backend-for-Frontend
   │
   ├── Supabase — Auth, données, RLS, Storage, Realtime
   │
   └── Trigger.dev — orchestration et effets asynchrones
                         │
                         └── fournisseurs externes
```

Les modules sont séparés par domaine métier et peuvent évoluer indépendamment, mais ils restent déployables comme un ensemble tant qu'une séparation en services n'est pas justifiée par la charge, la sécurité ou l'organisation.

### 1.1 Modèle commercial et création des espaces

La plateforme n'est pas un SaaS public en libre-service. L'agence négocie et signe ses contrats directement avec ses clients en dehors du produit. Un administrateur d'agence autorisé crée ensuite manuellement le client, son workspace, ses utilisateurs, ses rôles, ses intégrations et ses quotas avant activation.

L'architecture exclut définitivement Stripe, checkout, paiement en ligne, facturation automatique, plans tarifaires, abonnements SaaS, essais gratuits, coupons, taxes, cartes bancaires, factures client automatiques et portails de billing. Aucun port `PaymentProvider` ou `BillingProvider`, aucune table de paiement et aucune extension future de paiement ne doivent être préparés.

Les coûts, crédits et quotas conservés mesurent uniquement la consommation technique des fournisseurs externes et permettent de limiter les dépenses et de les attribuer à une agence ou un client. Ils ne représentent pas un moyen de paiement ni un solde commercial du client.

## 2. Responsabilité de chaque couche

### Next.js

Next.js est responsable de :

- l'expérience utilisateur ;
- l'établissement du contexte authentifié ;
- l'autorisation applicative des opérations synchrones ;
- la validation des entrées ;
- l'orchestration courte des services métier ;
- la création d'intentions de travail asynchrones ;
- la réception et vérification des webhooks légers.

Next.js ne doit pas exécuter de crawling long, campagne, relance, traitement IA massif ou synchronisation durable dans le cycle d'une requête.

### Supabase

Supabase est responsable de :

- l'identité et les sessions ;
- l'état métier durable ;
- les contraintes relationnelles ;
- la défense en profondeur via RLS ;
- le stockage de documents ;
- les migrations versionnées ;
- les événements Realtime uniquement lorsqu'ils apportent une valeur identifiée.

Supabase ne doit pas devenir un ensemble de fonctions privilégiées contournant l'autorisation. La base doit protéger ses invariants même lorsqu'un appel applicatif est incorrect.

### Trigger.dev

Trigger.dev est responsable de :

- l'exécution longue ou planifiée ;
- les retries contrôlés ;
- les files et limites de concurrence ;
- les appels aux fournisseurs externes ;
- les reprises après erreur ;
- la corrélation opérationnelle des exécutions.

Trigger.dev ne constitue ni la source de vérité métier, ni une frontière d'autorisation. Les tâches utilisent la base comme état durable et revalident toute ressource avant action.

## 3. Modularité par domaine

Les dépendances doivent suivre les domaines, pas les écrans :

```text
Identity & Tenancy
Client Strategy
Lead Data Operations
Qualification
Campaign Operations
Outreach & Deliverability
Conversation & Scheduling
CRM & Revenue
Governance & Analytics
```

Chaque domaine expose des contrats explicites. Un composant UI, une Route Handler ou une tâche Trigger.dev appelle ces contrats ; il ne réimplémente pas les règles.

Les dépendances autorisées suivent cette direction :

```text
UI / Transport / Tasks
        ↓
Application services
        ↓
Domain rules
        ↓
Ports
        ↓
Supabase et adaptateurs fournisseurs
```

La logique de domaine ne doit pas dépendre de React, d'une requête HTTP, du SDK d'un fournisseur ou du runtime Trigger.dev.

## 4. Tenancy comme invariant de sécurité

L'isolation n'est pas un filtre d'interface ; c'est un invariant sur toute la chaîne.

- L'agence est le tenant racine.
- Le client est le sous-tenant de la majorité des ressources métier.
- Le contexte tenant est dérivé de l'identité et des memberships, jamais accepté comme preuve depuis le client.
- Les associations inter-tables doivent préserver le même couple agence/client.
- Les ressources agence-only ont une règle explicite et ne sont pas traitées comme des ressources client avec une valeur implicite.
- Les tâches, webhooks, Storage, Realtime, exports et analytics sont soumis aux mêmes règles que les pages.
- Toute nouvelle table ou bucket doit recevoir une classification de portée : plateforme, agence, client ou technique.

La défense comporte plusieurs couches : autorisation applicative, contraintes relationnelles, RLS, permissions du fournisseur et tests négatifs.

## 5. Authentification, autorisation et moindre privilège

L'autorisation résulte de l'identité, du membership actif, de la portée et de la permission. Les rôles sont un moyen d'agréger des permissions, pas une condition suffisante.

Les identités techniques doivent avoir :

- un périmètre minimal ;
- une finalité documentée ;
- des secrets séparés ;
- une rotation possible ;
- une piste d'audit ;
- une révocation opérationnelle.

Une clé privilégiée peut faciliter une opération serveur, mais elle ne remplace jamais la vérification du tenant.

## 6. Code déterministe et intelligence artificielle

Principe central :

```text
L'IA analyse, extrait, classe, recommande et génère.
Le code authentifie, autorise, valide, décide les transitions et exécute.
```

Les agents IA :

- reçoivent un contexte minimal et autorisé ;
- utilisent des outils limités ;
- produisent une sortie structurée ;
- associent toute affirmation externe à une source ;
- séparent fait confirmé, fait extrait, estimation et hypothèse ;
- ne réalisent pas directement un effet critique ;
- sont observables, versionnés et évaluables.

Une recommandation IA ne devient une décision métier qu'après validation déterministe et, lorsque requis, approbation humaine.

## 7. États métier explicites

Les workflows importants utilisent des machines d'état documentées, notamment :

- memberships et invitations ;
- imports et enrichissements ;
- campagnes et enrollments ;
- messages et approbations ;
- envois et livraisons ;
- réponses et tâches ;
- opportunités ;
- intégrations et comptes expéditeurs ;
- runs asynchrones.

Une transition doit préciser : état source, préconditions, permission, état cible, effets, audit et comportement en cas de retry. Il est interdit de déduire un état critique uniquement de l'absence ou de la présence de plusieurs champs indépendants.

## 8. Asynchronisme durable et transactional outbox

Toute opération qui combine une mutation de base avec le lancement d'une tâche doit éviter la fenêtre suivante : base validée mais tâche absente, ou tâche lancée sans intention persistée.

Le pattern recommandé est :

1. autoriser et valider l'intention ;
2. écrire état métier et événement outbox dans une même transaction ;
3. publier la tâche de manière idempotente ;
4. marquer l'événement publié ;
5. réconcilier périodiquement les événements non publiés ou runs orphelins.

La forme finale du mécanisme doit être décidée avant les workflows critiques.

## 9. Idempotence de bout en bout

L'idempotence doit être définie au niveau métier, pas uniquement au niveau du moteur de tâches.

- Un même lead ne reçoit pas deux fois la même étape de séquence.
- Un même événement fournisseur ne produit pas deux transitions.
- Une même demande ne facture pas deux enrichissements.
- Une même réponse positive ne crée pas deux opportunités.
- Une même réservation ne crée pas deux rendez-vous.

La clé d'idempotence est stable, persistée et protégée par une contrainte ou une opération atomique. Les retries doivent retourner ou reconstruire le résultat existant plutôt que répéter l'effet.

## 10. Abstraction des fournisseurs

Chaque famille de fournisseurs possède :

- un modèle canonique interne ;
- une interface limitée aux capacités réellement utilisées ;
- un adaptateur par fournisseur ;
- un mapping explicite des statuts et erreurs ;
- des capacités détectables ;
- une stratégie de timeout, retry et circuit breaker ;
- un mode fake ou sandbox pour les tests ;
- une politique de coût et de quotas.

Les objets SDK d'un fournisseur ne doivent pas circuler dans les domaines ni être stockés comme seul modèle de données.

## 11. Provenance, audit et explicabilité

Toute donnée externe significative doit conserver : source, URL ou identifiant fournisseur, date de collecte, date de vérification, classification, confiance et version de traitement.

Toute action importante doit permettre de répondre :

```text
Qui ou quel service a agi ?
Pour quelle agence et quel client ?
Sur quelle ressource ?
Avec quelle autorisation ?
À partir de quelles données ?
Avec quel workflow, modèle ou prompt ?
Quel effet externe a été produit ?
Quel en a été le coût et le résultat ?
```

Les logs techniques ne remplacent pas un audit métier. L'audit doit être protégé contre les modifications ordinaires et respecter la rétention définie.

## 12. Conformité et délivrabilité comme portes de contrôle

Conformité et délivrabilité sont des modules bloquants, pas de simples dashboards.

Avant un envoi, le système revalide au minimum :

- finalité, pays, canal et base juridique applicables ;
- source et fraîcheur de la donnée ;
- listes d'opposition et suppressions ;
- statut du domaine et du compte ;
- SPF, DKIM et DMARC selon la politique ;
- seuils de rebond, plainte, risque et volume ;
- approbation du message ;
- état actif de la campagne et de l'intégration.

Un contrôle réussi lors de la planification ne suffit pas : il doit être renouvelé juste avant l'effet externe lorsqu'un délai existe.

## 13. Protection des données et cycle de vie

- Collecter uniquement les données nécessaires à une finalité documentée.
- Séparer données brutes, données dérivées et hypothèses IA.
- Définir les durées de rétention par catégorie et juridiction.
- Prévoir export, opposition, suppression, anonymisation et preuve minimale de suppression.
- Ne pas copier librement des données réelles vers les environnements de test.
- Chiffrer en transit et au repos selon le service utilisé.
- Masquer les données sensibles dans logs, traces et outils d'observabilité.

## 14. Observabilité et coûts intégrés

Chaque parcours asynchrone possède un identifiant de corrélation traversant Next.js, Supabase, Trigger.dev et le fournisseur.

Les métriques minimales couvrent :

- latence et taux d'erreur ;
- profondeur et âge des files ;
- retries, tâches bloquées et dead letters ;
- appels, tokens et coûts IA ;
- coût d'enrichissement, vérification et envoi ;
- délivrabilité, rebonds et plaintes ;
- résultats métier par agence et client.

Les budgets et quotas doivent pouvoir interrompre un traitement avant un dépassement important.

## 15. Évolution par vertical slices

Le produit est livré par parcours utilisables de bout en bout. Chaque slice inclut données, autorisation, service, UI minimale si demandée, workflow, audit et tests.

Ordre recommandé :

1. fondation multitenant ;
2. stratégie client et import ;
3. qualité et qualification ;
4. campagne assistée avec envoi test ;
5. campagne réelle limitée ;
6. réponses, rendez-vous, pipeline et reporting.

Ne pas construire simultanément tous les fournisseurs, tous les agents ou tous les canaux. Commencer avec un fournisseur par catégorie et un volume pilote contrôlé.

## 16. Critères d'une décision d'architecture

Une décision est acceptable si elle :

- maintient ou renforce l'isolation des tenants ;
- garde les effets critiques déterministes et idempotents ;
- réduit le couplage aux fournisseurs ;
- est observable et testable ;
- possède une stratégie d'échec et de récupération ;
- respecte conformité, délivrabilité et budgets ;
- peut évoluer sans réécriture prématurée ;
- est documentée lorsqu'elle modifie durablement le système.
