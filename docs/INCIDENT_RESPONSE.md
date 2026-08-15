# Réponse aux incidents

## Gravité

- **SEV-1** : fuite cross-tenant, secret exposé, envoi massif non autorisé,
  suppression contournée ;
- **SEV-2** : doubles effets limités, webhook compromis, réputation d’envoi en
  chute, fournisseur critique indisponible ;
- **SEV-3** : tâche isolée en échec, intégration déconnectée, données incomplètes ;
- **SEV-4** : défaut UX ou anomalie sans impact sécurité/données.

## Procédure

1. Ouvrir un incident avec heure UTC, environnement et correlation ID.
2. Contenir : pauser les campagnes/comptes concernés, révoquer les clés, bloquer
   les webhooks ou arrêter les workers sans supprimer les preuves.
3. Préserver `audit_logs`, `async_task_runs`, événements webhooks et logs
   fournisseur ; ne jamais copier de PII dans le ticket.
4. Déterminer agences, clients, ressources, fenêtre temporelle et effets externes.
5. Corriger par changement versionné et test de non-régression.
6. Restaurer progressivement, commencer par un tenant de test et volume nul.
7. Communiquer selon les obligations contractuelles et légales applicables.
8. Produire un post-mortem sans blâme avec causes et actions datées.

## Playbooks

### Secret exposé

- révoquer et faire tourner immédiatement ;
- rechercher son empreinte dans Git, build et logs ;
- invalider sessions ou tokens dérivés ;
- vérifier les appels durant la fenêtre d’exposition.

### Envoi inattendu

- passer campagnes et comptes à `paused` ;
- vérifier `business_idempotency_key` et `provider_request_key` ;
- importer les bounces/complaints et mettre à jour la suppression list ;
- ne pas relancer avant preuve de l’origine.

### Suspicion cross-tenant

- désactiver la surface concernée ;
- conserver les requêtes et identités ;
- exécuter les tests RLS avec les tenants touchés ;
- corriger policy, RPC et service, pas seulement l’UI.

### Perte ou corruption de données

- figer les écritures concernées ;
- sauvegarder l’état actuel ;
- restaurer dans un environnement isolé ;
- comparer audit et checksums avant merge contrôlé.

## Contacts et outils

Les responsables sécurité, DPO/conseil juridique, fournisseur d’hébergement et
canal d’astreinte doivent être renseignés dans la checklist de production hors
Git. Aucun numéro personnel ou secret n’est stocké dans ce dépôt.
