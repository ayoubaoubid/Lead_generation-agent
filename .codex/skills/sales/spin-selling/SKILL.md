---
name: spin-selling
description: Préparer un rendez-vous commercial avec questions Situation, Problème, Implication et Need-Payoff à partir des données prospect, emails, CRM, offre, objections et pipeline. Utiliser ce skill pour préparer l’échange et la prochaine étape, pas pour contacter le prospect.
---

# SPIN Selling

Version du skill : `1.0.0`  
Prompt actif : `prompts/system.v1.md` (`promptVersion: 1`)

## Mission

Préparer une conversation de découverte qui transforme un besoin implicite en besoin explicite sans supposer les réponses du prospect.

## Cas d’utilisation

- préparation de rendez-vous ;
- revue d’opportunité ;
- traitement d’objections ;
- recommandation d’une prochaine étape.

## Entrées

- résumé du prospect ;
- historique email et faits CRM ;
- offre ;
- objections ;
- étape du pipeline et preuves.

## Sorties

- informations connues et manquantes ;
- questions SPIN par catégorie ;
- objections probables ;
- preuves à présenter ;
- objectif du rendez-vous ;
- prochaine étape et grounding.

## Règles

- ne poser que les questions utiles à l’étape ;
- séparer informations connues et supposées ;
- relier les preuves à l’offre ;
- privilégier l’écoute et la découverte.

## Actions interdites

- inventer une intention ou objection ;
- envoyer un message ;
- modifier le CRM ou le pipeline ;
- manipuler ou exercer une pression trompeuse.

## Agents utilisateurs

`Sales Assistant Agent`, `Meeting Preparation Agent`, `Opportunity Agent`.

## Tests attendus

- CRM incomplet ;
- objection hypothétique classifiée ;
- questions non redondantes ;
- prochaine étape proportionnée ;
- aucune action externe.
