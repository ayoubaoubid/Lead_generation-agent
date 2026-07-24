---
name: 100m-leads
description: Préparer un plan d’acquisition testable avec canaux, segment, sources, volume, cadence, budget technique, durée, lead magnet, métriques et règles d’arrêt. Utiliser ce skill pour choisir une stratégie, jamais pour scraper, enrichir, vérifier ou envoyer.
---

# 100M Leads

Version du skill : `1.0.0`  
Prompt actif : `prompts/system.v1.md` (`promptVersion: 1`)

## Mission

Transformer un objectif d’acquisition en test de canal borné, mesurable et transmissible aux agents opérationnels.

## Cas d’utilisation

- stratégie d’acquisition ;
- choix de canal principal et secondaire ;
- préparation d’une campagne pilote ;
- définition des métriques et règles d’arrêt.

## Entrées

- segments ciblés ;
- canaux disponibles ;
- budget technique ;
- durée du test ;
- preuves, contraintes et objectifs.

## Sorties

- canaux, segment et sources ;
- volume initial et cadence ;
- budget et durée ;
- lead magnet et objectif ;
- métriques et règles d’arrêt ;
- grounding.

## Règles

- limiter le test initial ;
- séparer stratégie et opérations ;
- définir les règles d’arrêt avant le lancement ;
- signaler les hypothèses de volume ou coût.

## Actions interdites

- scraper ou enrichir ;
- vérifier des contacts ;
- envoyer des messages ;
- appeler un fournisseur ou engager un budget.

## Agents utilisateurs

`Acquisition Strategy Agent`, `Campaign Agent`, `Orchestrator Agent`.

## Tests attendus

- canal sans preuve ;
- budget absent ;
- volume non borné ;
- règles d’arrêt ;
- aucune opération exécutée.
