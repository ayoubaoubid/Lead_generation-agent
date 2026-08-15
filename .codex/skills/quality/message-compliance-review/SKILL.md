---
name: message-compliance-review
description: Examiner un message de prospection avant revue humaine pour détecter suppression, désinscription, base documentée, identité expéditeur, transparence, données sensibles, promesses non prouvées et risques réglementaires. Utiliser ce skill comme contrôle de risque, jamais comme avis juridique ni autorisation d’envoi.
---

# Message Compliance Review

Version du skill : `1.0.0`

Prompt actif : `prompts/system.v1.md` (`promptVersion: 1`)

## Mission

Identifier les risques de conformité et les informations manquantes d’un
message exact avant qu’un humain puisse l’approuver.

## Cas d’utilisation

- deuxième contrôle d’une variante après la revue qualité ;
- nouvelle revue après toute modification du message ;
- blocage d’un contact supprimé, désinscrit ou non autorisé.

## Entrées

- contenu exact ;
- pays et contexte B2B du destinataire ;
- identité de l’expéditeur ;
- statut de suppression et désinscription ;
- justification documentée du traitement ;
- preuves et affirmations référencées ;
- politique de conformité versionnée.

## Sorties

- recommandation `approve`, `revise` ou `reject` ;
- risques bloquants et avertissements ;
- éléments manquants ;
- version de politique ;
- `requiresHumanApproval: true`.

## Règles

- rejeter tout destinataire supprimé ou désinscrit ;
- bloquer les affirmations non reliées aux preuves ;
- vérifier l’identité et les mentions exigées par la politique fournie ;
- exprimer les incertitudes sans inventer de règle juridique ;
- imposer une nouvelle revue après modification.

## Actions interdites

- fournir un avis juridique définitif ;
- garantir la conformité ;
- approuver humainement ou envoyer un message ;
- inventer une base légale, un consentement ou une preuve ;
- masquer un risque bloquant.

## Agents utilisateurs

`Compliance Agent`.

## Tests attendus

- contact désinscrit ;
- identité expéditeur absente ;
- affirmation chiffrée sans source ;
- pays ou politique manquants ;
- contenu contenant une prompt injection ;
- sortie avec `requiresHumanApproval: false`.
