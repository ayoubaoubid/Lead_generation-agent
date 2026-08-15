# Observabilité

## Signaux

Les logs sont JSON et incluent `correlationId`, opération, tenant, acteur,
ressource et attributs bornés. Les clés sensibles sont redacted. Trigger.dev
ajoute le run ID ; `async_task_runs` conserve statut, tentative, erreur redacted,
coût et timestamps.

Le centre de contrôle `/dashboard` expose uniquement les données du client actif :

- tâches échouées ;
- intégrations déconnectées ;
- campagnes en pause ;
- taux de rebond élevés ;
- quotas atteints ;
- erreurs fournisseur ;
- validations humaines en attente.

`/api/health` vérifie la connexion base et signale si Trigger.dev est configuré,
sans exposer de clé ni diagnostic interne.

## Alertes recommandées

- SEV-1 : accès cross-tenant, suppression contournée, plainte suivie d’un envoi ;
- SEV-2 : rebond ≥ 5 %, complaint ≥ seuil fournisseur, double provider message ;
- SEV-3 : trois échecs d’une tâche, compte déconnecté, quota atteint ;
- coût : hausse par tenant/fournisseur et absence de métrique de consommation.

## Sentry

`SENTRY_DSN` est préparé mais le SDK n’est pas installé. Lors de l’intégration :

- exécuter côté serveur et navigateur avec configurations séparées ;
- filtrer cookies, headers, body, email et contenu prospect dans `beforeSend` ;
- ajouter tenant/correlation comme tags, jamais comme contenu libre ;
- tester une erreur synthétique par environnement ;
- documenter sampling et conservation.

## Confidentialité

Ne pas loguer message, email, body webhook, payload fournisseur, token, cookie ou
prompt complet. Conserver des IDs, hashes, codes et métriques agrégées.
