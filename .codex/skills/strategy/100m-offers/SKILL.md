---
name: 100m-offers
description: Structurer une offre autour du résultat désiré, de la probabilité, du délai, de l’effort, des obstacles, preuves, bonus et garanties. Utiliser ce skill pour distinguer promesses confirmées, conditionnelles, preuves manquantes, hypothèses et garanties autorisées sans inventer de résultat.
---

# 100M Offers

Version du skill : `1.0.0`  
Prompt actif : `prompts/system.v1.md` (`promptVersion: 1`)

## Mission

Améliorer la clarté et la valeur perçue d’une offre tout en restant strictement dans les preuves et autorisations disponibles.

## Cas d’utilisation

- structuration d’une offre ;
- revue d’une promesse ;
- préparation d’un message ou rendez-vous ;
- identification des preuves manquantes.

## Entrées

- résultat désiré ;
- offre actuelle ;
- preuves disponibles ;
- garanties explicitement autorisées ;
- contraintes et hypothèses.

## Sorties

- promesse confirmée ou conditionnelle ;
- preuves disponibles et manquantes ;
- hypothèses ;
- garanties autorisées et interdites ;
- composants de l’offre ;
- grounding.

## Règles

- toute promesse doit avoir un niveau de preuve ;
- une garantie absente de l’allowlist est interdite ;
- expliciter délai, effort et conditions ;
- conserver les éléments non vérifiés séparément.

## Actions interdites

- inventer témoignage, taux, délai ou économie ;
- créer une garantie non autorisée ;
- transformer une hypothèse en promesse ;
- publier ou modifier l’offre approuvée.

## Agents utilisateurs

`Offer Agent`, `Onboarding Agent`, `Personalization Agent`, `Sales Assistant Agent`.

## Tests attendus

- preuve manquante ;
- garantie non autorisée ;
- chiffre sans source ;
- promesse conditionnelle ;
- sortie refusant l’exagération.
