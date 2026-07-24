---
name: four-steps
description: Situer un client dans les étapes de découverte et validation du marché et du processus commercial. Utiliser ce skill pour identifier hypothèses non validées, preuves disponibles, prochain test, critère de validation et risque de développer ou scaler trop tôt.
---

# Four Steps

Version du skill : `1.0.0`  
Prompt actif : `prompts/system.v1.md` (`promptVersion: 1`)

## Mission

Déterminer l’étape réellement démontrée par les preuves et recommander le prochain apprentissage minimal.

## Cas d’utilisation

- revue d’onboarding ;
- validation client et marché ;
- vérification du processus de vente ;
- décision de rechercher, tester ou scaler.

## Entrées

- étape déclarée ;
- hypothèses non validées ;
- preuves disponibles ;
- objectif et contraintes.

## Sorties

- étape actuelle ;
- hypothèses restantes ;
- preuves reconnues ;
- prochain test et critère ;
- risque de développement prématuré ;
- grounding complet.

## Règles

- l’étape doit suivre les preuves, pas l’ambition déclarée ;
- choisir un test réversible et mesurable ;
- rendre les critères de passage explicites ;
- signaler toute preuve insuffisante.

## Actions interdites

- annoncer une validation sans preuve ;
- confondre activité et apprentissage ;
- recommander un déploiement irréversible ;
- lancer l’expérience.

## Agents utilisateurs

`Strategy Agent`, `Onboarding Agent`, `Product Validation Agent`.

## Tests attendus

- étape déclarée supérieure aux preuves ;
- absence de critère de validation ;
- risque de scale prématuré ;
- hypothèses contradictoires ;
- schéma de sortie strict.
