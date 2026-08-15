# Trigger.dev

La tâche `imports/process-csv-import.ts` traite les CSV privés par lots. Elle
recharge systématiquement l’import et son tenant depuis Supabase, applique une
déduplication conservative et conserve un résultat idempotent par numéro de
ligne.

Voir `docs/LEAD_DATA_IMPORTS.md` pour les états, l’annulation et les variables
d’environnement.

Cette frontière accueille les tâches durables, réessayables ou planifiées du projet
Trigger.dev Cloud `lead_generation_workflow`.

La fondation est configurée dans `../trigger.config.ts`. Aucune tâche d'exemple ou
fonctionnalité métier n'est créée à ce stade.

## Développement local

Depuis la racine du dépôt :

```powershell
npm run trigger:dev
```

La CLI charge automatiquement les fichiers `.env`, `.env.development`, `.env.local`
et leurs variantes de développement. `TRIGGER_SECRET_KEY` doit rester dans un fichier
ignoré par Git.

## Règles obligatoires pour les futures tâches

- recharger la ressource principale depuis Supabase ;
- revalider l'agence, le client, la permission et l'état métier ;
- utiliser une clé d'idempotence métier stable pour chaque effet externe ;
- définir explicitement les retries, les erreurs terminales et la concurrence ;
- ne jamais placer de secret, contenu sensible ou PII inutile dans un payload ;
- ne jamais envoyer d'email ou appeler un fournisseur réel depuis une tâche de test.

Le défaut global interdit les retries automatiques. Chaque future tâche devra activer
une stratégie de retry seulement après avoir démontré son idempotence. La durée
maximale globale de 300 secondes constitue un garde-fou de fondation et pourra être
surchargée par tâche après analyse de ses contraintes.
