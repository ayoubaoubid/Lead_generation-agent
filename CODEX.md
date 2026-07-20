# Mode opératoire permanent de Codex

Ce document définit comment Codex doit travailler dans ce dépôt. Les règles de sécurité et d'architecture non négociables se trouvent dans `AGENTS.md`.

## 1. Posture de travail

Codex agit comme un collaborateur technique responsable : il comprend avant de modifier, limite son périmètre, rend ses hypothèses visibles et vérifie concrètement le résultat.

Codex doit :

- privilégier les faits observés dans le dépôt aux suppositions ;
- distinguer demande explicite, exigence documentaire et recommandation ;
- faire progresser la tâche sans prendre de décision produit structurante à la place de l'utilisateur ;
- conserver les changements existants et travailler autour d'un worktree potentiellement sale ;
- communiquer les risques proportionnellement à leur impact ;
- terminer avec un état clair : réalisé, vérifié, partiellement vérifié ou bloqué.

## 2. Analyse initiale d'une tâche

Pour chaque demande :

1. reformuler mentalement le résultat attendu ;
2. identifier si la tâche demande une analyse, un diagnostic, une modification ou une action externe ;
3. lire les instructions applicables selon `AGENTS.md` ;
4. inspecter l'état réel du dépôt et les fichiers concernés ;
5. identifier les tenants, données, rôles et effets externes touchés ;
6. relever les ambiguïtés susceptibles de changer le résultat ;
7. évaluer le risque : faible, moyen, élevé ou critique ;
8. définir comment le résultat sera vérifié avant de commencer.

Une ambiguïté n'est bloquante que si des choix raisonnables produisent des architectures ou comportements significativement différents. Dans ce cas, Codex demande une décision. Sinon, il avance avec une hypothèse minimale et la signale.

## 3. Planification d'une modification

Créer un plan lorsque la tâche :

- touche plusieurs modules ou couches ;
- modifie Auth, multitenancy, RLS, migrations ou permissions ;
- introduit un workflow Trigger.dev ou un effet externe ;
- nécessite plusieurs étapes de vérification ;
- contient des décisions ou dépendances encore ouvertes.

Un bon plan :

- décrit des résultats vérifiables, pas des intentions vagues ;
- place au plus tôt la découverte des contraintes ;
- limite chaque étape à un changement cohérent ;
- prévoit les tests et la documentation ;
- n'inclut pas de fonctionnalités non demandées ;
- reste révisable lorsque l'inspection révèle une meilleure approche.

Une seule étape doit être marquée en cours à la fois. Mettre le plan à jour lorsque les faits changent.

## 4. Limitation du périmètre

Avant d'éditer, établir trois listes :

```text
Dans le périmètre
Nécessaire pour vérifier
Hors périmètre
```

Règles :

- résoudre le besoin avec le plus petit changement cohérent ;
- ne pas réécrire un module parce qu'une amélioration serait souhaitable ;
- ne pas introduire un nouveau fournisseur, framework ou package sans besoin direct ;
- ne pas corriger les problèmes voisins sauf s'ils empêchent la tâche ou créent un risque immédiat ;
- documenter les problèmes découverts mais laissés hors périmètre ;
- éviter les changements mécaniques massifs qui rendent la revue difficile ;
- séparer une migration, un refactor et une fonctionnalité lorsqu'ils peuvent être examinés indépendamment.
- considérer tout paiement en ligne, abonnement SaaS, plan tarifaire, checkout, billing ou intégration Stripe comme définitivement hors périmètre ; ne pas conserver d'abstraction anticipée ;
- préserver uniquement le suivi des coûts, crédits, quotas et limites des fournisseurs externes, sans les transformer en facturation client.

## 5. Méthode d'implémentation

Lorsqu'une modification est autorisée :

1. localiser le point d'entrée et les contrats existants ;
2. rechercher les usages avant de modifier une interface ;
3. identifier les invariants métier et de tenant ;
4. écrire ou adapter le test qui démontre le comportement ;
5. appliquer un changement ciblé ;
6. exécuter la vérification la plus proche ;
7. élargir les tests proportionnellement au risque ;
8. relire le diff comme un reviewer ;
9. mettre à jour la documentation durable si nécessaire.

Pour les modifications de sécurité, commencer par les cas de refus. Pour les tâches asynchrones, commencer par l'idempotence et les transitions d'état. Pour les intégrations, commencer par le contrat canonique et l'adaptateur, pas par la propagation du format fournisseur dans le domaine.

## 6. Décisions et hypothèses

### 6.1 Ce qui doit être documenté

Documenter une décision lorsqu'elle :

- change une frontière entre Next.js, Supabase et Trigger.dev ;
- change le modèle de tenant, RBAC ou RLS ;
- introduit une dépendance structurante ;
- définit une machine d'état ou un contrat public ;
- choisit un fournisseur ou une stratégie de fallback ;
- affecte conformité, rétention, délivrabilité ou audit ;
- crée une convention destinée à plusieurs modules.

Une décision durable doit indiquer : contexte, options considérées, décision, raisons, conséquences et stratégie de retour arrière. Utiliser un ADR dans un futur dossier `docs/decisions/` lorsqu'une telle décision est explicitement approuvée. Ne pas créer un ADR pour un détail local évident.

### 6.2 Hypothèses

- Une hypothèse temporaire doit être nommée comme telle.
- Ne pas transformer une hypothèse en règle permanente sans validation.
- Une hypothèse qui influence le schéma, l'autorisation, les coûts ou une action externe doit être confirmée avant implémentation.
- Les valeurs de seuil, quotas, délais de rétention et règles juridiques ne doivent jamais être inventées.

## 7. Prévention des modifications non demandées

Avant chaque édition, Codex doit pouvoir répondre :

- quel besoin précis ce fichier permet-il de satisfaire ?
- quel test ou quelle preuve confirmera le changement ?
- ce changement est-il nécessaire maintenant ?
- affecte-t-il un consommateur non inclus dans la tâche ?

Ne pas :

- reformater un fichier entier pour quelques lignes ;
- renommer une API sans inventorier les consommateurs ;
- mettre à jour toutes les dépendances pour en ajouter une ;
- convertir une architecture existante vers une préférence personnelle ;
- supprimer un code apparemment inutilisé sans confirmer son absence d'usage ;
- écraser des modifications préexistantes ;
- modifier automatiquement la production ou des services distants.

## 8. Vérification du résultat

La vérification doit correspondre au risque :

| Changement | Vérification minimale |
|---|---|
| Documentation | structure, liens, cohérence et exigences couvertes |
| TypeScript local | test ciblé, type checking et lint concernés |
| Contrat/API | tests de validation, erreurs, autorisation et consommateurs |
| Supabase/RLS | tests d'intégration et refus inter-tenant |
| Migration | génération/revue, test local, advisors et état des migrations |
| Trigger.dev | succès, retry, idempotence, erreur terminale et limites |
| Webhook | signature, replay, duplication et ordre des événements |
| IA | schéma, grounding, cas adversariaux, coût et fallback |
| Effet externe | mode test/sandbox et preuve d'absence de duplication |

Codex doit utiliser les scripts existants du dépôt plutôt que d'inventer des commandes. Découvrir les commandes via les manifests, la documentation ou `--help`.

Ne jamais affirmer :

- qu'une commande a réussi sans l'avoir exécutée ;
- qu'un changement est sécurisé sans avoir vérifié les contrôles concernés ;
- qu'une migration est valide sans l'avoir testée dans l'environnement approprié ;
- qu'un comportement distant fonctionne si seul un mock a été testé.

## 9. Gestion des erreurs

Lorsqu'une commande échoue :

1. lire l'erreur complète ;
2. vérifier les préconditions et l'environnement ;
3. distinguer erreur de code, configuration, permission, sandbox ou fournisseur ;
4. corriger la cause la plus probable ;
5. ne pas répéter plus de deux ou trois fois la même approche ;
6. choisir une autre méthode ou signaler le blocage avec les éléments utiles.

Ne pas masquer l'erreur par :

- désactivation d'un test ;
- élargissement d'une permission ;
- suppression d'une validation ;
- utilisation de la clé service ;
- `any`, `@ts-ignore` ou capture silencieuse ;
- retry illimité ;
- valeur par défaut trompeuse.

## 10. Communication des incertitudes

Signaler séparément :

- **fait vérifié** : observé dans le code, les tests ou la documentation ;
- **inférence** : conclusion raisonnable tirée des faits ;
- **hypothèse** : choix provisoire nécessaire pour avancer ;
- **inconnu** : information absente ou inaccessible ;
- **blocage** : décision ou autorisation requise.

Une question à l'utilisateur doit être courte, concrète et expliquer l'impact du choix. Ne pas demander une préférence si le dépôt ou une documentation officielle permet de la découvrir.

## 11. Compte rendu final

À la fin de chaque tâche, présenter :

1. le résultat obtenu ;
2. les fichiers modifiés ;
3. les vérifications réellement exécutées ;
4. les décisions ou hypothèses importantes ;
5. les risques résiduels, tests non exécutés ou points bloquants ;
6. la prochaine étape uniquement si elle est utile et dans la continuité du travail.

La réponse finale doit être autonome et ne pas dépendre des messages d'avancement intermédiaires.
