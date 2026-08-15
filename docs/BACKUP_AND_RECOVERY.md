# Sauvegarde et restauration

## Objectifs à décider

Avant production, l’Agency Owner technique doit approuver le RPO et le RTO.
Proposition pilote : RPO maximal 24 heures, RTO maximal 8 heures. Une offre
Supabase avec sauvegardes quotidiennes et, si le risque le justifie, PITR est
requise.

## Données couvertes

- base Postgres, Auth et métadonnées tenant ;
- objets Storage réellement utilisés ;
- configuration versionnée des migrations et tâches ;
- références de secrets, sans exporter les secrets eux-mêmes ;
- journaux nécessaires à l’audit selon la politique de conservation.

Trigger.dev et les fournisseurs restent des systèmes externes : la base
conserve l’état métier durable permettant de reprendre ou réconcilier les runs.

## Procédure de sauvegarde

1. Vérifier quotidiennement l’état de la sauvegarde gérée.
2. Produire avant migration risquée un point de restauration identifié.
3. Conserver la révision Git et la liste de migrations correspondant au backup.
4. Chiffrer tout export manuel et limiter son accès.
5. Tester trimestriellement une restauration dans un projet isolé.

## Procédure d’incident

1. Suspendre campagnes, webhooks et tâches à effets externes.
2. Identifier le dernier instant sain et l’étendue des tenants touchés.
3. Préserver les logs et preuves selon `INCIDENT_RESPONSE.md`.
4. Restaurer vers un projet isolé, jamais directement par-dessus la production.
5. Exécuter contraintes, tests RLS et contrôles de cohérence.
6. Reconfigurer secrets et URLs sans réutiliser de clé compromise.
7. Basculer l’application après approbation.
8. Réconcilier les opérations externes par leurs clés d’idempotence.
9. Réactiver progressivement les tâches.

## Validation de restauration

- nombre d’agences, clients et memberships cohérent ;
- aucune association inter-tenant ;
- contraintes et policies présentes ;
- suppressions et désabonnements conservés ;
- ledger d’idempotence et historique d’envoi cohérents ;
- Auth fonctionne avec les URLs autorisées ;
- health check, tests RLS et parcours de connexion réussissent.

## Limites

La restauration de la base ne retire pas un email déjà remis ni un événement
déjà créé chez un fournisseur. Toute reprise doit comparer les identifiants
externes et ne jamais rejouer aveuglément un run.
