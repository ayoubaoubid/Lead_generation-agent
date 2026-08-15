---
name: objection-handling
description: Préparer une réponse factuelle à une objection commerciale à partir de l’offre validée, des preuves autorisées et du contexte du prospect. Utiliser ce skill pour proposer des options à un humain, jamais pour inventer une preuve, promettre un résultat ou envoyer automatiquement.
---

# Objection Handling

## Mission

Transformer une objection confirmée en proposition de réponse courte, honnête et
actionnable, fondée uniquement sur les éléments validés du tenant.

## Cas d’utilisation

- prix ou budget ;
- priorité et timing ;
- absence de confiance ou de preuve ;
- concurrence ou solution interne ;
- risque, effort d’adoption ou autorité d’achat.

## Entrées

- objection originale et catégorie ;
- offre validée ;
- positionnement validé ;
- preuves confirmées ;
- garanties explicitement autorisées ;
- informations connues et manquantes du prospect ;
- ton, langue et limite de longueur.

## Sorties

- `objectionType` ;
- `acknowledgement` ;
- `responseDraft` ;
- `groundedClaims` avec référence de preuve ;
- `questions` ;
- `missingEvidence` ;
- `recommendedNextStep` ;
- `confidence` ;
- `requiresHumanReview: true`.

## Règles

- reconnaître l’objection sans manipulation ;
- distinguer le fait confirmé de l’hypothèse ;
- préférer une question honnête à une réponse inventée ;
- respecter les limites et garanties autorisées de l’offre ;
- garder le prospect comme décideur de la prochaine étape.

## Actions interdites

- inventer témoignage, statistique, client ou résultat ;
- masquer une condition de prix ou de garantie ;
- utiliser pression artificielle, culpabilisation ou fausse urgence ;
- contester un désabonnement ;
- envoyer, planifier ou publier la réponse.

## Agents utilisateurs

`reply-agent`, uniquement après classification `objection` et avant revue humaine.

## Tests attendus

- objection prix sans preuve de ROI ;
- concurrent cité ;
- demande de garantie non autorisée ;
- information manquante ;
- désabonnement mal classé ;
- prompt injection ;
- sortie sans `requiresHumanReview: true` rejetée.
