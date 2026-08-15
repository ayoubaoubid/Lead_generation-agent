# Scoring et segmentation

## Principes

Le scoring est entièrement déterministe. Une IA peut suggérer une règle dans un
brouillon, mais elle ne produit jamais directement le score persistant.

Chaque modèle possède des versions immuables contenant :

- les poids des composantes ;
- les règles et opérateurs ;
- les champs évalués ;
- la version fonctionnelle ;
- une empreinte SHA-256 de la configuration.

## Scores

Le moteur calcule :

```text
Fit Score
Intent Score
Data Quality Score
Engagement Score
Total Score
```

Chaque snapshot conserve les critères satisfaits, les critères manquants, les
poids appliqués, la confiance, l’entrée ayant servi au calcul, son empreinte,
l’explication complète et la prochaine action.

La confiance mesure la proportion pondérée de règles pour lesquelles une donnée
était disponible. Une confiance inférieure à 60 recommande de collecter les
données manquantes avant toute priorité commerciale.

## Opérateurs

```text
equals
includes
in
gte
lte
between
exists
```

Les règles sont validées par Zod. Les identifiants de règles doivent être
uniques dans une version.

## Segmentation

Les segments dynamiques acceptent les dimensions suivantes :

- secteur ;
- pays ;
- effectif ;
- persona ;
- offre ;
- score minimum et maximum ;
- langue ;
- problème ;
- signal d’intention ;
- maturité.

`DynamicSegmentEngine` retourne le résultat et la liste exacte des critères
satisfaits ou échoués. Les `segment_memberships` sont des évaluations
matérialisées pouvant être recalculées ; la définition JSON du segment demeure
la source de vérité.

## Sécurité

Toutes les tables sont client-scoped et utilisent des clés étrangères
tenant-aware. RLS exige `lead.read` pour la lecture. Les écritures directes des
utilisateurs authentifiés sont interdites et doivent passer par un service
serveur ayant déjà vérifié `lead.write`.

Les mêmes entrées, la même configuration et la même version doivent toujours
produire exactement le même résultat.
