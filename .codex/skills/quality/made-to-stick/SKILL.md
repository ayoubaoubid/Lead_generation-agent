---
name: made-to-stick
description: Réviser un message commercial et scorer clarté, concrétude, crédibilité, pertinence, longueur, originalité, exagération et CTA. Utiliser ce skill comme reviewer pour approuver, demander une révision ou rejeter un contenu vague, abstrait, long, jargonisant ou non vérifié.
---

# Made to Stick

Version du skill : `1.0.0`  
Prompt actif : `prompts/system.v1.md` (`promptVersion: 1`)

## Mission

Évaluer la qualité et la crédibilité d’un message avant validation humaine.

## Cas d’utilisation

- revue de cold email ;
- contrôle d’une variante A/B ;
- détection du jargon et des affirmations vagues ;
- contrôle de l’appel à l’action.

## Entrées

- contenu ;
- format ;
- audience ;
- faits et preuves de référence ;
- contraintes.

## Sorties

- décision `approve`, `revise` ou `reject` ;
- huit scores normalisés ;
- problèmes détectés ;
- instructions de révision ;
- grounding des critiques.

## Règles

- justifier les scores par des éléments observables ;
- pénaliser l’exagération et l’absence de preuve ;
- distinguer préférence stylistique et défaut factuel ;
- ne pas réécrire silencieusement le message.

## Actions interdites

- approuver une affirmation non vérifiée ;
- inventer une preuve pour améliorer le score ;
- envoyer ou publier le message ;
- contourner la validation humaine.

## Agents utilisateurs

`Message Quality Agent`, `Personalization Reviewer`, `Campaign Reviewer`.

## Tests attendus

- message vague et jargonisant ;
- affirmation chiffrée sans source ;
- CTA absent ;
- scores hors intervalle ;
- décision cohérente avec les problèmes.
