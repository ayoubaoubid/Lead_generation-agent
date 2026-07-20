# Workflow permanent de développement

Ce document décrit le cycle standard d'une modification. Il s'applique après les règles de `AGENTS.md` et la méthode de `CODEX.md`.

## 1. Cycle d'une tâche

```text
Comprendre
→ inspecter
→ qualifier le risque
→ planifier
→ modifier avec un petit diff
→ tester localement
→ vérifier sécurité et tenancy
→ relire
→ documenter
→ rendre compte
```

## 2. Étape 1 — Comprendre le résultat attendu

Avant toute édition :

- identifier le comportement attendu et le critère d'acceptation ;
- distinguer ce qui est explicitement demandé de ce qui est seulement suggéré ;
- lister les utilisateurs et rôles concernés ;
- identifier l'agence, le client et les ressources impliqués ;
- relever les effets externes possibles ;
- confirmer si la tâche autorise code, migration, dépendance, appel distant ou données réelles.

Si la demande est un diagnostic ou une revue, ne pas implémenter de correction sans autorisation.

## 3. Étape 2 — Inspecter avant de concevoir

Inspecter :

- instructions applicables ;
- état du dépôt et changements existants ;
- point d'entrée de la fonctionnalité ;
- services, types, tests et consommateurs ;
- tables, policies et migrations liées ;
- tâches Trigger.dev et webhooks concernés ;
- documentation et décisions existantes ;
- scripts disponibles pour vérifier le changement.

Rechercher avant de créer. Réutiliser les contrats, helpers, composants et conventions existants lorsqu'ils correspondent réellement au besoin.

## 4. Étape 3 — Qualifier le risque

### Faible

- documentation ;
- texte sans effet métier ;
- test isolé ;
- refactor interne sans changement de contrat.

### Moyen

- logique TypeScript locale ;
- nouvelle validation ;
- composant ou endpoint sans effet externe ;
- adaptation d'un fournisseur derrière un contrat existant.

### Élevé

- Auth, membership, RBAC ou RLS ;
- schéma et migration ;
- tâche Trigger.dev réessayable ;
- webhook ;
- Storage ou Realtime ;
- données personnelles ;
- changement de contrat partagé ;
- coût fournisseur.

### Critique

- envoi réel ;
- suppression ou modification massive ;
- changement d'isolation des tenants ;
- clé privilégiée ;
- conformité ou suppression globale ;
- modification des budgets, quotas ou limites de consommation fournisseur ;
- production ou migration distante.

Plus le risque est élevé, plus le plan, les tests négatifs, la revue et la validation utilisateur doivent être explicites.

Le paiement en ligne, Stripe, checkout, billing, abonnements SaaS et facturation client automatique ne sont pas des tâches critiques à planifier : ils sont définitivement hors périmètre et doivent être refusés sans créer d'abstraction préparatoire.

## 5. Étape 4 — Planifier

Le plan doit indiquer :

1. fichiers ou modules probablement touchés ;
2. invariants à préserver ;
3. changements de contrats ;
4. stratégie de données ou migration, si autorisée ;
5. stratégie d'idempotence pour les effets externes ;
6. tests à créer ou adapter ;
7. documentation à mettre à jour ;
8. condition de blocage éventuelle.

Pour une tâche risquée, inclure les cas d'échec et le retour arrière avant l'implémentation.

## 6. Étape 5 — Développer par tranche cohérente

Une tranche cohérente contient uniquement ce qui est nécessaire pour démontrer un comportement.

Ordre recommandé :

1. contrat et types ;
2. règle de domaine ;
3. adaptateur ou persistance ;
4. autorisation ;
5. orchestration ;
6. interface ou transport si demandé ;
7. observabilité ;
8. tests.

Éviter les commits conceptuels mélangeant migration, changement global de noms, mise à jour de dépendances et fonctionnalité métier.

## 7. Workflow TypeScript et Next.js

Pour une modification TypeScript :

1. identifier la frontière de confiance ;
2. définir ou réutiliser un schéma de validation ;
3. transformer l'entrée en type de domaine ;
4. appeler un service portant la règle métier ;
5. mapper le résultat vers une réponse sûre ;
6. couvrir succès, refus et erreur ;
7. exécuter test ciblé, type checking et lint applicables.

Pour Next.js :

- utiliser Server Component par défaut ;
- ajouter `use client` seulement pour interaction ou API navigateur ;
- vérifier la session et les permissions côté serveur pour toute mutation ;
- ne pas importer de module serveur ou secret dans le graphe client ;
- garder Route Handlers et Server Actions minces ;
- utiliser Trigger.dev pour les travaux longs ou réessayables.

## 8. Workflow Supabase

### 8.1 Avant une modification

- vérifier la documentation et le changelog Supabase actuels ;
- vérifier la version CLI avec la commande appropriée ;
- découvrir les commandes avec `--help` ;
- identifier le mode de schéma du dépôt : déclaratif ou impératif ;
- inventorier tables, contraintes, indexes, fonctions, vues, Storage et policies concernés ;
- définir les cas autorisés et refusés avant d'écrire RLS.

### 8.2 Schéma déclaratif

Si `supabase/schemas/` ou `schema_paths` est utilisé :

1. modifier l'état désiré dans le schéma déclaratif ;
2. générer la migration avec l'outil prévu ;
3. relire le diff généré ;
4. tester localement ;
5. exécuter les advisors disponibles ;
6. vérifier la liste des migrations.

Ne pas commencer par écrire manuellement une migration concurrente.

### 8.3 Migrations impératives

Si le dépôt utilise des migrations impératives :

1. utiliser le workflow CLI officiel du dépôt ;
2. itérer localement sans polluer l'historique distant ;
3. créer une migration descriptive uniquement quand le changement est prêt ;
4. relire SQL, contraintes, index, RLS et droits ;
5. tester montée et stratégie de récupération ;
6. exécuter advisors et tests RLS.

Ne jamais inventer un nom ou format de migration si la CLI peut le produire.

### 8.4 Checklist RLS

Pour chaque table exposée :

- RLS activé ;
- droits Data API explicites ;
- policy par opération nécessaire ;
- appartenance agence vérifiée ;
- affectation client vérifiée si applicable ;
- permission métier vérifiée ;
- `USING` et `WITH CHECK` corrects pour les mises à jour ;
- aucun accès fondé uniquement sur `TO authenticated` ;
- tests pour owner/admin/reviewer/viewer et utilisateur désactivé ;
- tests agence A/B et client A/B ;
- index adaptés aux prédicats de policies.

### 8.5 Vérification Supabase

- exécuter les tests locaux ;
- vérifier les cas refusés ;
- vérifier Storage et Realtime si touchés ;
- vérifier qu'aucun secret n'atteint le client ;
- vérifier advisors et état des migrations lorsque disponibles ;
- ne pas appliquer à distance sans demande explicite.

## 9. Workflow Trigger.dev

Pour toute nouvelle tâche ou modification :

1. définir l'opération métier et sa ressource source ;
2. définir une clé d'idempotence stable ;
3. enregistrer l'intention durable ;
4. définir le payload minimal ;
5. recharger la ressource dans la tâche ;
6. revalider tenant, état, autorisation et préflight ;
7. appliquer quotas et concurrence ;
8. appeler l'adaptateur fournisseur ;
9. persister résultat, coût et audit ;
10. gérer retry, erreur terminale, pause et annulation.

Tests requis selon le cas :

- exécution normale ;
- deuxième exécution avec la même clé ;
- timeout fournisseur ;
- erreur réessayable ;
- erreur définitive ;
- ressource supprimée ou passée dans un état incompatible ;
- payload falsifié avec un autre tenant ;
- quota dépassé ;
- campagne ou intégration mise en pause avant l'effet.

## 10. Workflow fournisseur et webhook

### Adaptateur fournisseur

- garder un contrat canonique interne ;
- valider la configuration au démarrage ou à la connexion ;
- définir timeouts et erreurs typées ;
- mapper explicitement les statuts ;
- instrumenter coût et latence ;
- fournir un fake ou sandbox ;
- ne pas exposer la réponse brute au reste du domaine.

### Webhook

1. lire le corps brut si la signature l'exige ;
2. vérifier signature, timestamp et replay ;
3. identifier l'intégration sans faire confiance au payload seul ;
4. persister ou dédupliquer l'identifiant fournisseur ;
5. répondre rapidement ;
6. déléguer le traitement long à Trigger.dev ;
7. traiter les événements dans un ordre robuste ;
8. auditer les événements rejetés sans divulguer les secrets.

## 11. Workflow IA

Pour une capacité IA :

1. définir la décision ou sortie attendue ;
2. limiter le contexte aux données autorisées ;
3. séparer faits, contenu externe et instructions ;
4. définir un schéma de sortie ;
5. valider et normaliser la sortie ;
6. appliquer les règles déterministes ;
7. demander une validation humaine si nécessaire ;
8. enregistrer version, coût, latence et sources ;
9. tester cas nominal, données manquantes, injection et hallucination.

Ne pas enfouir une règle métier critique uniquement dans un prompt.

## 12. Workflow de revue

Relire le changement sous quatre angles :

### Fonctionnel

- répond-il exactement au besoin ?
- les états et erreurs sont-ils cohérents ?
- les critères d'acceptation sont-ils démontrés ?

### Tenancy et sécurité

- peut-on substituer un identifiant d'un autre tenant ?
- le navigateur ou le payload contrôle-t-il une décision d'autorisation ?
- un rôle trop faible peut-il atteindre l'action ?
- une clé ou donnée sensible fuit-elle ?

### Fiabilité

- que se passe-t-il après timeout, retry ou événement dupliqué ?
- l'état partiel peut-il être réparé ?
- les quotas et pauses sont-ils appliqués au dernier moment utile ?

### Maintenabilité

- le contrat est-il clair et nommé selon les conventions ?
- les dépendances vont-elles dans la bonne direction ?
- la documentation durable doit-elle évoluer ?

## 13. Matrice de tests attendue

| Surface modifiée | Tests obligatoires |
|---|---|
| Règle de domaine | unitaires, limites et états invalides |
| Handler/Action | validation, auth, autorisation et erreurs |
| Table/Policy | intégration, RLS positif et RLS négatif |
| Storage/Realtime | accès croisé et droits par opération |
| Tâche Trigger.dev | retry, idempotence, tenant falsifié et erreur terminale |
| Webhook | signature, replay, duplication et ordre |
| Agent IA | schéma, grounding, injection, fallback et coût |
| Fournisseur | mapping, timeout, quota et fake/sandbox |
| Parcours critique | end-to-end du vertical slice |

## 14. Definition of Done

Une tâche est terminée seulement si :

- le comportement demandé est présent ;
- le périmètre n'a pas dérivé ;
- le type checking et le lint applicables passent ;
- les tests ciblés passent ;
- les tests négatifs nécessaires passent ;
- tenancy, autorisation et secrets ont été revus ;
- idempotence et erreurs sont couvertes lorsqu'applicables ;
- logs, coûts et audit sont suffisants ;
- la documentation durable est cohérente ;
- aucun changement distant ou destructif non autorisé n'a eu lieu ;
- les limites et tests non exécutés sont explicitement signalés.

## 15. Compte rendu

Le compte rendu final indique :

- résultat ;
- fichiers modifiés ;
- tests et commandes exécutés ;
- hypothèses et décisions ;
- risques résiduels ;
- migrations ou actions externes, en précisant explicitement lorsqu'il n'y en a eu aucune.
