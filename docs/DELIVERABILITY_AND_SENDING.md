# Comptes d’envoi, délivrabilité et moteur d’envoi

## Modèle

- `sending_domains` : domaines normalisés par client ;
- `sending_accounts` : métadonnées, quotas, fenêtres et état ;
- `campaign_sending_accounts` : affectation pondérée à une campagne ;
- `deliverability_checks` : preuves append-only des contrôles ;
- `outbound_messages` : un effet commercial planifié ;
- `delivery_attempts` : retries techniques du même effet ;
- `sequence_stop_events` : raisons d’arrêt auditables.

Les identifiants OAuth, mots de passe ou tokens ne sont jamais stockés dans ces
tables. `credential_reference` contient uniquement une référence opaque vers un
secret manager.

## Préflight

Une campagne doit disposer d’au moins un compte connecté et de contrôles récents
`passed` pour SPF, DKIM, DMARC, domaine, connexion, volume, taux de rebond et liste
vérifiée. `campaign_deliverability_preflight` recalcule ce résultat.

`claim_outbound_delivery` recharge, verrouille et vérifie juste avant l’effet :

1. message encore planifié et non déjà envoyé ;
2. campagne `scheduled` ou `running` ;
3. prospect non arrêté ou exclu ;
4. compte connecté sous quota ;
5. préflight délivrabilité ;
6. version de message approuvée ;
7. email vérifié et non supprimé.

## Idempotence

`outbound_messages.business_idempotency_key` est unique. Un prospect, une étape et
une tentative commerciale ne peuvent produire qu’un seul envoi. Une exécution
concurrente qui voit `sending`, `sent`, `delivered` ou `stopped` reçoit
`shouldSend: false`.

Les retries fournisseur partagent `provider_request_key` et créent uniquement des
`delivery_attempts`. Les follow-ups sont d’autres étapes de séquence, jamais des
retries.

## Arrêts

`stop_campaign_prospect_sequence` arrête les envois planifiés pour :

- réponse reçue ;
- rendez-vous réservé ;
- désabonnement ;
- hard bounce ;
- plainte ;
- suppression ;
- campagne en pause ;
- compte déconnecté.

Le trigger de conformité constitue une dernière ligne de défense en base.

## État d’intégration

Le modèle, les contraintes, RLS et RPC de contrôle sont implémentés. Aucun
fournisseur d’envoi réel n’est activé : l’adaptateur, le secret manager, les
webhooks de delivery/bounce/complaint et les tests sandbox du fournisseur restent
requis avant un envoi externe.
