# Catalogue des skills

Chaque skill possède un identifiant stable en `kebab-case`, une version sémantique
dans `SKILL.md` et un prompt immuable nommé `prompts/system.vN.md`.

Une nouvelle version de prompt crée un nouveau fichier. Une nouvelle version de
contrat met à jour le registre TypeScript et reçoit des tests de compatibilité.
Les anciens artefacts ne sont pas réécrits lorsqu’une exécution historique peut
encore les référencer.

Catégories :

- `strategy/` : diagnostic, recherche, validation, positionnement, offre et acquisition ;
- `sales/` : préparation commerciale et génération encadrée de messages ;
- `lead-operations/` : futures opérations déterministes sur les leads ;
- `platform/` : futurs skills techniques de plateforme ;
- `quality/` : revue, conformité et qualité.
