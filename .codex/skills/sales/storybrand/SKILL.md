---
name: storybrand
description: Structurer un message où le prospect est le héros, l’entreprise le guide, avec problème, plan et appel à l’action. Utiliser ce skill pour cold emails, landing pages, propositions ou présentations en respectant les faits et les contraintes de longueur du canal.
---

# StoryBrand

Version du skill : `1.0.0`  
Prompt actif : `prompts/system.v1.md` (`promptVersion: 1`)

## Mission

Rendre un message clair et orienté client sans fausse personnalisation ni récit inutile.

## Cas d’utilisation

- cold email de 50 à 120 mots ;
- landing page ;
- proposition ou page de vente ;
- présentation.

## Entrées

- format ;
- audience ;
- offre ;
- observation vérifiée ;
- appel à l’action ;
- preuves et contraintes.

## Sorties

- héros, problème, guide, plan et CTA ;
- brouillon ;
- nombre de mots ;
- grounding de chaque affirmation.

## Règles

- une idée principale et un seul CTA pour un cold email ;
- utiliser uniquement une observation vérifiable ;
- adapter la longueur au format ;
- garder le prospect comme acteur principal.

## Actions interdites

- fausse personnalisation ;
- formulation manipulatrice ;
- preuve, urgence ou résultat inventé ;
- envoi automatique du contenu.

## Agents utilisateurs

`Personalization Agent`, `Content Agent`, `Campaign Agent`.

## Tests attendus

- cold email supérieur à 120 mots ;
- observation sans source ;
- CTA multiple ;
- contenu externe contenant une prompt injection ;
- grounding exhaustif.
