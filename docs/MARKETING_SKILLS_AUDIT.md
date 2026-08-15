# Audit des skills marketing

## Décision

Le dépôt `founder-playbook` contient 15 skills. Aucun n’est copié tel quel :
leurs conseils couvrent parfois la publicité, le contenu, le paiement, des
tactiques manipulatoires ou des heuristiques non vérifiées qui sortent du
périmètre. Dix frameworks ont été réécrits sous forme de skills structurés,
versionnés et testables. Deux skills opérationnels propres au produit ont été
ajoutés pour combler les frontières cold email et conformité.

## Évaluation complète

| Skill source | Objectif | Note | Décision | Motif |
|---|---|---:|---|---|
| `diagnose` | Router un problème vers le bon framework | 9/10 | Intégrer | Utile pour l’agent analytics et l’orchestrateur, avec métriques et preuves obligatoires. |
| `mom-test` | Préparer des entretiens non biaisés | 8/10 | Intégrer | Alimente onboarding, ICP et signaux de douleur sans automatiser le contact. |
| `four-steps` | Situer la maturité de validation commerciale | 8/10 | Intégrer | Empêche de scaler une campagne avant preuves suffisantes. |
| `lean-startup` | Transformer une hypothèse en expérience mesurable | 7/10 | Intégrer | Utile pour les recommandations analytics, sans mutation automatique. |
| `obviously-awesome` | Positionnement B2B fondé sur alternatives et capacités | 10/10 | Intégrer | Fondation directe de Positioning, ICP et cohérence campagne. |
| `100m-offers` | Clarifier résultat, obstacles, valeur et preuve | 9/10 | Adapter | Conserver offre et preuves ; supprimer fausse urgence, garantie non autorisée et logique de paiement. |
| `100m-leads` | Choisir et tester une stratégie d’acquisition | 8/10 | Adapter | Conserver cold outreach, métriques et règles d’arrêt ; exclure ads, contenu, affiliation et volume aveugle. |
| `spin-selling` | Préparer une découverte B2B et une prochaine étape | 9/10 | Intégrer | Directement utile aux rendez-vous et objections, sans pression automatique. |
| `storybrand` | Structurer un message clair centré prospect | 9/10 | Intégrer | Bon cadre de génération si chaque affirmation reste sourcée. |
| `made-to-stick` | Revoir clarté, crédibilité, longueur et CTA | 9/10 | Intégrer | Devient le reviewer qualité ; il recommande mais n’approuve pas humainement. |
| `influence` | Décrire des mécanismes de persuasion | 6/10 | Adapter | Ne conserver que preuves réelles, clarté et détection de manipulation ; supprimer rareté artificielle et pression. |
| `crossing-the-chasm` | Choisir un beachhead et adapter le whole product | 5/10 | Adapter plus tard | Quelques critères ICP enterprise sont utiles, mais le framework est trop large et daté pour le MVP. |
| `blue-ocean-strategy` | Recomposer une catégorie et l’espace concurrentiel | 4/10 | Ignorer | Chevauche Positioning et augmente le risque de catégorie inventée sans preuves. |
| `traction` | Tester plusieurs canaux d’acquisition | 4/10 | Ignorer pour le MVP | La majorité des 19 canaux est explicitement hors périmètre ; `100m-leads` couvre le test outbound utile. |
| `monetizing-innovation` | Concevoir prix, packages et monétisation | 1/10 | Ignorer | Le produit ne gère ni paiement, ni plans, ni billing ; l’offre peut stocker un prix fourni sans moteur de monétisation. |

## Architecture retenue

```text
strategy/
  diagnose
  mom-test
  four-steps
  lean-startup
  obviously-awesome
  100m-offers
  100m-leads

sales/
  storybrand
  cold-email-personalization
  spin-selling

quality/
  made-to-stick
  message-compliance-review
```

Les capacités futures `reply-analysis`, `objection-handling` et
`follow-up-strategy` seront créées au moment des prompts 24 à 26 pour éviter des
contrats sans consommateur.

## Ordre d’utilisation

1. Onboarding : `mom-test` puis `four-steps`.
2. Positionnement : `obviously-awesome`.
3. Offre : `100m-offers`.
4. Acquisition : `100m-leads` avec règles d’arrêt.
5. Message : `cold-email-personalization`, qui réutilise les principes
   StoryBrand et les artefacts validés.
6. Qualité : `made-to-stick`.
7. Risque conformité : `message-compliance-review`.
8. Approbation humaine.
9. Rendez-vous : `spin-selling`.
10. Performance : `diagnose` puis, si pertinent, `lean-startup`.

## Garde-fous

- Les skills ne lisent que des références autorisées du tenant courant.
- Toute entrée et sortie est validée au runtime.
- Les faits, extractions, estimations et hypothèses restent distincts.
- Une sortie IA ne déclenche jamais directement un envoi.
- Le navigateur ne peut pas enregistrer une fausse revue automatique.
- Versions de skill, prompt, modèle, tokens et coûts techniques sont
  traçables.
