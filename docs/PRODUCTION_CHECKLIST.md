# Checklist de production

Une case non cochée bloque la production si elle concerne sécurité, isolation,
délivrabilité, conformité ou restauration.

## Gouvernance

- [ ] périmètre pilote, pays, canaux et clients approuvés ;
- [ ] responsables incident, sécurité et délivrabilité identifiés ;
- [ ] configuration juridique revue par une personne qualifiée ;
- [ ] contrats fournisseurs et conditions d’utilisation validés.

## Build et code

- [ ] révision Git immuable identifiée ;
- [ ] `lint`, `typecheck`, `test`, `test:e2e`, `db:test`, `build` réussis ;
- [ ] aucun secret, export ou PII dans Git ;
- [ ] audit des dépendances sans vulnérabilité élevée non acceptée ;
- [ ] adaptateurs réels sélectionnés et testés en staging.

## Supabase

- [ ] projet production dédié ;
- [ ] migrations staging puis production relues ;
- [ ] types générés identiques au schéma ;
- [ ] RLS et GRANT testés entre deux agences et deux clients ;
- [ ] inscription publique désactivée ;
- [ ] Site URL et redirects exacts ;
- [ ] SMTP production et templates testés ;
- [ ] sauvegardes, PITR et restauration testés ;
- [ ] restrictions réseau et SSL évalués ;
- [ ] advisors sécurité/performance sans alerte critique non acceptée.

## Trigger.dev

- [ ] projet/environnement dédié ;
- [ ] secrets configurés ;
- [ ] concurrence et files approuvées ;
- [ ] retry, timeout et erreurs terminales testés ;
- [ ] idempotence prouvée pour chaque effet externe ;
- [ ] pause, reprise et reconciliation testées ;
- [ ] alertes sur runs échoués configurées.

## Email et délivrabilité

- [ ] fournisseur d’envoi réel connecté par coffre de secrets ;
- [ ] domaine professionnel vérifié ;
- [ ] SPF, DKIM et DMARC valides ;
- [ ] quotas, fenêtres horaires et fuseaux validés ;
- [ ] liste vérifiée et seuil de rebond défini ;
- [ ] unsubscribe, complaint, hard bounce et suppression bloquent l’envoi ;
- [ ] test de concurrence sans double envoi réussi ;
- [ ] montée en charge progressive approuvée.

## Sécurité et conformité

- [ ] service role uniquement côté serveur ;
- [ ] webhooks signés, limités, dédupliqués et protégés contre replay ;
- [ ] uploads limités en taille/type/lignes ;
- [ ] headers HTTP et HTTPS vérifiés ;
- [ ] logs expurgés de secrets et PII ;
- [ ] sorties IA validées et faits distingués des hypothèses ;
- [ ] aucune IA n’envoie sans validation humaine ;
- [ ] suppression globale/client/contact testée ;
- [ ] politique de conservation et procédure d’export définies.

## Observabilité

- [ ] Sentry ou équivalent activé avec scrubbing ;
- [ ] correlation ID, tenant, actor et Trigger run traçables ;
- [ ] alertes intégration, quota, rebond et fournisseur configurées ;
- [ ] health checks surveillés depuis l’extérieur ;
- [ ] tableau opérationnel testé avec incidents simulés.

## Go / No-Go

- [ ] parcours complet exécuté avec données non sensibles en staging ;
- [ ] restauration simulée réussie ;
- [ ] rollback applicatif testé ;
- [ ] aucune faiblesse bloquante ouverte ;
- [ ] approbation finale enregistrée.
