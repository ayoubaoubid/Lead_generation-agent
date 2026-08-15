# Analytics, coûts et conformité

## Analytics

`analytics_daily_metrics` agrège les événements réels par client et date :
leads, qualifiés, messages préparés, envois, livraisons, rebonds, réponses,
réponses positives, rendez-vous, opportunités et ventes.

`technical_cost_entries` ne représente que la consommation de fournisseurs
techniques. Ce n’est ni un portefeuille, ni une facture, ni un abonnement.
`get_client_funnel_analytics` calcule les coûts unitaires lorsque le dénominateur
existe.

La marge agence n’est pas calculable sans les contrats et coûts de prestation
gérés hors plateforme. L’API retourne donc explicitement
`marginAvailable: false`. La valeur d’une opportunité gagnée est une donnée CRM
déclarée, pas une preuve de paiement.

`diagnostic_runs` enregistre le skill `diagnose`, la confiance, les preuves, les
données manquantes, le modèle, le prompt et le coût.

## Conformité

- `client_compliance_profiles` : finalité, base juridique configurable, audience,
  pays, canaux et conservation ;
- `contact_compliance_records` : source, collecte, finalité et preuve ;
- `suppression_entries` : opposition client ou agence, adresse hashée et masquée ;
- `data_subject_requests` : accès, export et suppressions suivis par statut.

Une adresse désabonnée, supprimée, plainte, hard bounce ou suppression list est
bloquée avant planification et à nouveau au claim d’envoi.

La configuration juridique dépend des pays, destinataires, canaux et pratiques de
l’agence. La plateforme fournit contrôles et traçabilité, jamais une garantie
universelle de conformité.
