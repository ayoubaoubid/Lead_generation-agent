# Génération et validation des messages

## Pipeline

```text
Contexte validé
  → Cold Email Personalization
  → Made to Stick
  → Message Compliance Review
  → Revue humaine
  → Version approuvée
```

Le positionnement et l’offre doivent être validés. Les affirmations utilisables
dans le message sont limitées aux faits `confirmed_fact` ou
`extracted_fact` possédant une référence. Une estimation, une hypothèse ou une
donnée non vérifiée bloque la génération.

## Contraintes de contenu

- 50 à 120 mots pour un cold email ;
- une idée principale ;
- un CTA ;
- objet de 200 caractères au maximum ;
- absence de fausse personnalisation ;
- aucune statistique, preuve, promesse, urgence, garantie ou résultat inventé ;
- grounding et preuves manquantes conservés avec chaque version.

## Versionnement

`campaign_messages` représente le couple prospect/étape. Chaque génération,
régénération ou édition crée une ligne immuable dans
`campaign_message_versions`. L’interface peut donc comparer les variantes sans
écraser l’historique.

L’approbation s’applique à un identifiant de version exact. Une modification
crée un nouveau brouillon et invalide de fait les revues précédentes.

## Séparation des responsabilités

- L’opérateur peut éditer et soumettre un brouillon avec `message.write`.
- Seul le worker technique peut enregistrer les revues qualité et conformité.
- Le navigateur reçoit une erreur s’il tente de falsifier une revue IA.
- Un utilisateur possédant `message.approve` peut approuver ou rejeter une
  version arrivée à `human_review_pending`.
- Aucun composant de ce module ne peut envoyer un email.

## Skills

- `cold-email-personalization@1.0.0` : génération fondée.
- `made-to-stick@1.0.0` : clarté, crédibilité, longueur, exagération et CTA.
- `message-compliance-review@1.0.0` : risques, suppressions et exigences
  documentées ; ne constitue pas un avis juridique.
- Les versions StoryBrand, Obviously Awesome et 100M Offers utilisées en amont
  restent enregistrées dans `skill_versions`.

## Vérification

Le test SQL `campaign_message_review.test.sql` couvre l’ordre des revues,
l’approbation exacte, l’historique, le décompte de mots, l’isolation entre
agences, le refus d’écriture directe et le rejet d’une fausse revue
automatique.

Les tests TypeScript valident les contrats de skills, le grounding, le
décompte de mots et l’arrêt obligatoire avant revue humaine.
