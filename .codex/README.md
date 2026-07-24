# Contexte Codex du dépôt

Les instructions permanentes obligatoires restent dans `AGENTS.md` et `CODEX.md`.

## Ressources IA versionnées

- `skills/` contient les skills, leurs contrats documentés, prompts et cas de test ;
- `agents/catalog.v1.json` contient les agents préparés et leurs skills autorisés ;
- les contrats TypeScript exécutables restent sous `apps/web/src/` ;
- aucune clé, aucun token fournisseur et aucune donnée client réelle ne doit être
  ajouté ici.

Le catalogue `.codex` décrit les capacités. Il ne constitue pas un moteur d’exécution
et ne peut pas déclencher seul une tâche, un agent ou un effet externe.
