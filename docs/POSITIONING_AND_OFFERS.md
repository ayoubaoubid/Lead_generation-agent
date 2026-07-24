# Positioning et Offers

## Objectif

Ces modules transforment les faits collectés pendant l’onboarding en artefacts
stratégiques versionnés. `Positioning` applique les principes de
**Obviously Awesome** ; `Offers` applique les principes de **100M Offers**.
Aucun agent IA n’est lancé automatiquement par ces écrans.

## Cycle de vie

- Un positionnement unique est maintenu par client.
- Un client peut posséder plusieurs offres.
- Un artefact possède au maximum un brouillon actif.
- La création d’une nouvelle version copie le contenu de la version la plus
  récente.
- Une validation est une action humaine explicite.
- Une version validée est immuable et reste consultable dans l’historique.

Les mutations passent exclusivement par des fonctions RPC auditées. Le
navigateur ne choisit jamais le tenant de sécurité : l’agence et le client
actifs sont résolus depuis la session côté serveur, puis revalidés dans la base.

## Qualification des éléments

Chaque élément de contenu stocke obligatoirement une qualification :

| Qualification | Sens |
|---|---|
| `confirmed` | Soutenu par une preuve confirmée et sourcée |
| `inferred` | Déduction raisonnable à vérifier |
| `hypothesis` | Proposition de travail non validée |
| `missing` | Information ou validation encore absente |

Une sortie IA éventuelle devra rester `inferred`, `hypothesis` ou `missing`
tant qu’une personne n’a pas fourni et contrôlé une preuve. Le système interdit
notamment de confirmer sans preuve un témoignage, une statistique, une promesse,
un résultat ou une garantie.

## Registre de preuves

Les preuves sont client-scoped et peuvent être associées aux éléments des deux
modules. Une preuve `confirmed` exige une URL ou une référence de source. Une
garantie `confirmed` exige en plus une preuve `authorization` confirmée. Les
clés étrangères tenant-aware et les RPC refusent toute référence à une preuve
d’un autre client.

## Positioning — Obviously Awesome

La validation exige au minimum :

- un énoncé de positionnement ;
- une alternative concurrente ;
- une capacité unique ;
- une valeur client ;
- un segment le plus adapté ;
- un différenciateur.

La catégorie de marché, les points de preuve et les segments exclus restent
facultatifs, mais chaque élément saisi conserve sa qualification.

## Offers — 100M Offers

La validation exige au minimum :

- un résultat désiré ;
- une promesse ;
- un délai ;
- un différenciateur.

Les obstacles, objections, garanties, bonus et preuves complètent l’équation de
valeur sans créer de garantie ou de résultat fictif.

## Autorisation, RLS et audit

- Lecture : permission atomique `offer.read`.
- Création, sauvegarde, preuve et validation : `offer.read` + `offer.write`.
- RLS filtre toutes les lectures par agence, client, membership et permission.
- Les tables n’accordent aucune mutation directe au rôle `authenticated`.
- Les créations, sauvegardes et validations sont enregistrées dans
  `audit_logs`.

## Tables

- `strategy_artifacts`
- `strategy_versions`
- `strategy_evidence`
- `strategy_version_evidence`

La migration de référence est
`supabase/migrations/20260724145952_implement_positioning_and_offers.sql`.
