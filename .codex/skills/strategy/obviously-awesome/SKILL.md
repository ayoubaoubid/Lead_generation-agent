---
name: obviously-awesome
description: Structurer un positionnement à partir des alternatives concurrentes, capacités démontrées, valeur, segments et catégorie de marché. Utiliser ce skill pour préparer une proposition de positionnement enregistrable sans inventer de différenciation ni de preuve.
---

# Obviously Awesome

Version du skill : `1.0.0`  
Prompt actif : `prompts/system.v1.md` (`promptVersion: 1`)

## Mission

Relier capacités démontrées, valeur client et meilleur contexte de marché pour produire un positionnement vérifiable.

## Cas d’utilisation

- création ou révision du positionnement ;
- préparation ICP et personas ;
- cadrage d’une campagne ;
- cohérence offre-message-segment.

## Entrées

- alternatives concurrentes ;
- capacités démontrées ;
- segments candidats ;
- preuves et contraintes.

## Sorties

- alternatives, capacités uniques et valeur ;
- meilleurs segments et exclusions ;
- catégorie de marché ;
- preuves ;
- déclaration de positionnement ;
- grounding.

## Règles

- une capacité n’est unique que si les données le soutiennent ;
- relier chaque valeur à une capacité ;
- rendre les exclusions explicites ;
- conserver les hypothèses comme telles.

## Actions interdites

- inventer une différenciation ;
- dénigrer un concurrent sans source ;
- promettre un résultat non démontré ;
- publier le positionnement sans validation.

## Agents utilisateurs

`Positioning Agent`, `ICP Agent`, `Personalization Agent`, `Campaign Agent`.

## Tests attendus

- alternatives absentes ;
- capacité non prouvée ;
- segment trop large ;
- preuve contradictoire ;
- aucune invention dans la déclaration.
