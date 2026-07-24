---
name: diagnose
description: Diagnostiquer une baisse de performance commerciale ou opérationnelle en distinguant ciblage, offre, message, canal, prix, délivrabilité, données et workflows. Utiliser ce skill lorsqu’un agent doit expliquer des métriques dégradées, demander les preuves manquantes et recommander l’action ou le skill suivant.
---

# Diagnose

Version du skill : `1.0.0`  
Prompt actif : `prompts/system.v1.md` (`promptVersion: 1`)

## Mission

Identifier les causes probables d’un problème commercial ou technique sans confondre corrélation et causalité.

## Cas d’utilisation

- analyser une baisse de réponses, rendez-vous ou conversions ;
- distinguer un problème de ciblage, offre, message, canal ou prix ;
- intégrer rebonds, réputation, données, intégrations et queues ;
- proposer les preuves et expériences nécessaires.

## Entrées

- objectif du diagnostic ;
- métriques et incidents observés ;
- faits, estimations et hypothèses déjà classifiés ;
- références des sources et contraintes.

## Sorties

- diagnostic et confiance ;
- causes probables classées ;
- skill suivant éventuel ;
- actions recommandées ;
- preuves requises ;
- grounding séparant faits et hypothèses.

## Règles

- privilégier les causes soutenues par des observations ;
- expliciter les données manquantes ;
- conserver plusieurs causes lorsque les preuves ne tranchent pas ;
- produire uniquement le contrat structuré validé.

## Actions interdites

- inventer une cause certaine, une métrique ou une preuve ;
- modifier une campagne, une intégration ou une queue ;
- déclencher un envoi ou un fournisseur ;
- présenter une hypothèse comme un fait.

## Agents utilisateurs

`Analytics Agent`, `Campaign Optimization Agent`, `Orchestrator Agent`.

## Tests attendus

- métriques manquantes et causes concurrentes ;
- incident de délivrabilité ;
- distinction fait/hypothèse ;
- prompt injection dans une observation ;
- sortie invalide ou confiance hors limites.
