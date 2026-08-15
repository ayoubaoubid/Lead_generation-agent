# Revue UX et design final

## Portée

Revue effectuée le 26 juillet 2026 sur le shell public, la connexion, le design
system et les nouvelles surfaces opérationnelles. Les écrans protégés ont été
revus dans le code et par leurs états structurels ; leur parcours visuel complet
avec données réelles devra être rejoué avec un compte E2E dédié.

## Résultat

L’interface repose sur un langage visuel unique : surfaces neutres chaudes,
accent indigo, densité opérationnelle, rayons contenus et ombres discrètes. Les
écrans n’affichent pas de métriques fictives. Les états vides expliquent
l’action suivante et les actions sensibles restent soumises aux permissions.

Corrections réalisées pendant la revue :

- connexion mobile compactée pour afficher le formulaire avant 300 px ;
- palette tertiaire assombrie pour atteindre le contraste WCAG AA ;
- couleurs success, warning et danger corrigées pour les petits badges ;
- statut d’avatar annoncé avec le nom, sans attribut ARIA interdit ;
- liste d’onglets défilante rendue accessible au clavier ;
- en-têtes de sécurité vérifiés dans le navigateur ;
- absence de débordement horizontal vérifiée à 390 px ;
- états disabled et composants de formulaire associés à leurs libellés.

## Vérifications automatisées

`npm run test:e2e` couvre :

1. redirection d’une route protégée ;
2. ordre de focus du formulaire de connexion ;
3. largeur et position du formulaire à 390 × 844 ;
4. audit axe WCAG 2 A/AA du design system ;
5. présence des principaux en-têtes de sécurité.

Le résultat courant est de 5 tests sur 5 réussis dans Microsoft Edge/Chromium.

## Risques UX restants

- Le grand parcours métier authentifié n’est pas encore automatisé de bout en
  bout avec une fixture multi-tenant.
- Les écrans Inbox, Meetings, Pipeline et Analytics sont opérationnels sur les
  données existantes, mais nécessitent une campagne simulée complète pour
  valider leur densité avec des volumes réalistes.
- Une revue manuelle lecteur d’écran NVDA/VoiceOver reste requise avant bêta.
- Le mode sombre existe dans les tokens, mais n’est pas encore un engagement
  produit et ne doit pas être présenté comme terminé.

## Critère avant bêta

Rejouer le parcours Agency Owner puis Recruiter sur desktop, tablette et mobile,
avec des données de démonstration non sensibles et un fournisseur mock
déterministe. Toute action irréversible doit disposer d’une confirmation et
d’un feedback final visible.
