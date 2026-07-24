---
name: lean-startup
description: Concevoir une expérience Build–Measure–Learn minimale, mesurable et réversible. Utiliser ce skill pour transformer une hypothèse produit ou commerciale en action minimale, métriques, échantillon, durée, critère de succès, instrumentation et décision continuer/itérer/pivoter/arrêter.
---

# Lean Startup

Version du skill : `1.0.0`  
Prompt actif : `prompts/system.v1.md` (`promptVersion: 1`)

## Mission

Réduire l’incertitude avec l’expérience la plus petite qui produit une décision exploitable.

## Cas d’utilisation

- expérience commerciale ;
- validation d’une fonctionnalité MVP ;
- test de canal ou de proposition ;
- action corrective après Diagnose.

## Entrées

- hypothèse ;
- objectif ;
- ressources disponibles ;
- contraintes et métriques de sécurité ;
- preuves déjà connues.

## Sorties

- action minimale ;
- métrique principale et métrique de sécurité ;
- échantillon et durée ;
- critère de succès ;
- décision possible ;
- instrumentation requise et grounding.

## Règles

- une expérience teste une hypothèse principale ;
- privilégier une métrique actionnable ;
- définir le critère avant l’exécution ;
- traiter l’échantillon inconnu comme une donnée manquante.

## Actions interdites

- lancer ou instrumenter l’expérience ;
- fabriquer un seuil ou une taille d’échantillon certaine ;
- recommander une dépense sans limite ;
- masquer une métrique de sécurité.

## Agents utilisateurs

`Product Agent`, `Experiment Agent`, `Codex Development Agent`.

## Tests attendus

- hypothèse non falsifiable ;
- métrique de vanité ;
- ressources insuffisantes ;
- décision possible explicite ;
- absence d’action externe.
