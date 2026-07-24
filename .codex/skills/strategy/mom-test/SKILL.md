---
name: mom-test
description: Préparer une recherche client non biaisée fondée sur les comportements passés. Utiliser ce skill pour construire des entretiens par persona, détecter douleur, budget et urgence, et proposer des critères ICP ou scoring sans générer d’emails ni qualifier techniquement les leads.
---

# Mom Test

Version du skill : `1.0.0`  
Prompt actif : `prompts/system.v1.md` (`promptVersion: 1`)

## Mission

Transformer un objectif de recherche en entretiens qui révèlent des comportements réels plutôt que des compliments ou intentions vagues.

## Cas d’utilisation

- préparer un guide d’entretien d’onboarding ;
- tester l’existence et l’intensité d’un problème ;
- explorer budget, urgence et solutions actuelles ;
- enrichir les hypothèses ICP et scoring.

## Entrées

- objectif de recherche ;
- personas ;
- contexte d’entretien ;
- faits et preuves existants ;
- contraintes de recherche.

## Sorties

- guide et questions par persona ;
- grille de notes ;
- signaux de douleur, budget et urgence ;
- critères ICP et scoring proposés ;
- grounding des conclusions.

## Règles

- demander le passé et les actions concrètes ;
- éviter les questions suggestives ;
- séparer verbatim, interprétation et hypothèse ;
- indiquer ce qui doit encore être validé.

## Actions interdites

- générer automatiquement des emails ;
- qualifier techniquement un lead ;
- inventer une réponse d’entretien ;
- conclure sur un marché à partir d’un compliment.

## Agents utilisateurs

`Customer Research Agent`, `Onboarding Agent`, `ICP Agent`.

## Tests attendus

- questions non biaisées par persona ;
- détection d’une intention sans engagement ;
- absence de preuves de budget ;
- entrée contenant des instructions malveillantes ;
- classification correcte des conclusions.
