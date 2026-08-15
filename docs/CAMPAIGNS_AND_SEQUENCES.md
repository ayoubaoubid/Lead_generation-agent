# Campagnes et séquences

## Périmètre

Le module transforme un ciblage validé en campagne opérable, sans effectuer
d’envoi. Une campagne appartient obligatoirement à une agence et à un client.
Elle peut référencer une offre, un ICP, plusieurs personas et un segment du même
tenant.

## Cycle de vie

```text
draft → ready_for_review → approved → scheduled → running
                                               ↘ paused
                                  tout état actif → cancelled
```

- La création produit toujours un brouillon.
- `campaign.write` permet la soumission en revue.
- `campaign.approve` permet l’approbation humaine.
- `campaign.launch` permet la planification, la pause et l’annulation.
- Une date de planification doit être future et inclure explicitement son
  décalage horaire.
- Les transitions sont atomiques, vérifiées côté base et inscrites dans
  `audit_logs`.

Le passage de `scheduled` à `running`, ainsi que la reprise après pause, seront
effectués par les tâches durables du prompt 22 après un nouveau préflight.

## Modèle de données

- `campaigns` : objectif, canal, ciblage, fuseau horaire, planification et état.
- `campaign_personas` : personas validés rattachés à la campagne.
- `campaign_sequences` : versions de la séquence.
- `campaign_sequence_steps` : cold email, follow-up, délai, template et règles
  d’arrêt.
- `campaign_prospects` : inscription d’un contact et progression dans la
  séquence.

Chaque étape comporte les règles d’arrêt obligatoires : réponse reçue,
rendez-vous réservé, désinscription, hard bounce, plainte et suppression.

## Sécurité

- Le navigateur transmet une intention, jamais une preuve de tenant.
- Les fonctions serveur revérifient membership et permission.
- Les références offre/ICP/persona/segment sont rechargées avec le couple
  `agency_id`/`client_id`.
- Les utilisateurs authentifiés n’ont qu’un accès direct en lecture protégé par
  RLS ; les écritures passent par les fonctions de workflow.
- Aucun envoi réel ni fournisseur externe n’est appelé par ce module.

## Vérification locale

```powershell
npm run typecheck
npm test
npx supabase test db --local supabase/tests/database/campaigns_sequences.test.sql
```

Le test pgTAP prouve notamment l’ordre d’approbation, l’audit, l’impossibilité
de contourner les écritures et le rejet d’un tenant falsifié.
