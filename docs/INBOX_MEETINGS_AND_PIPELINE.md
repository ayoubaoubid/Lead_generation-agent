# Inbox, Meetings et pipeline

## Réponses entrantes

Le route handler `/api/webhooks/email/inbound` :

1. vérifie HMAC SHA-256 et fenêtre anti-replay de cinq minutes ;
2. valide un payload strict ;
3. déduplique par fournisseur et identifiant d’événement ;
4. résout le tenant depuis le message sortant enregistré, jamais depuis le body ;
5. conserve le message original ;
6. arrête immédiatement la séquence ;
7. met en file `reply.processInbound`.

Un événement non corrélable est conservé sans tenant comme incident à résoudre. Il
ne crée aucune réponse et ne déclenche aucune action commerciale.

Le skill `reply-classification` classe dans le vocabulaire contrôlé, cite ses
preuves et impose une revue humaine selon le risque. Le skill
`objection-handling` propose ensuite un brouillon factuel. `reply_drafts` ne donne
jamais l’autorisation d’envoyer.

## Meetings

`calendar_connections` sépare la métadonnée de la référence secrète.
`calendar_availability_rules` porte les créneaux, fuseaux et buffers.
`meetings` associe contact, campagne, prospect et message entrant.

`meeting_preparations` est versionnée et suit SPIN Selling : informations connues
et manquantes, questions Situation, Problème, Implication, Need-Payoff,
objections, objectif et prochaine étape. Toute préparation IA reste à valider.

## Pipeline CRM

`ensure_default_pipeline` crée les treize étapes du MVP sans créer de données
commerciales fictives. Chaque client peut ensuite configurer ses étapes.

`opportunities` conserve valeur déclarée, devise, probabilité, responsable,
prochaine action, échéance et raison de perte. Les mouvements passent par
`move_opportunity`, alimentent `opportunity_history` et `audit_logs`.
`sales_tasks` et `opportunity_notes` sont tenant-scoped.

L’interface expose une Inbox réelle, un agenda réel et un Kanban horizontal
responsive. Les états vides ne présentent aucune statistique de démonstration.
