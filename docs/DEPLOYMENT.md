# Déploiement

Ce document prépare un déploiement contrôlé. Il n’autorise pas un déploiement
automatique et ne remplace pas la checklist de production.

## Cibles

- **Web** : Next.js 16 sur Vercel ou runtime Node.js 22 équivalent.
- **Données/Auth** : un projet Supabase dédié par environnement.
- **Tâches durables** : un environnement Trigger.dev distinct par environnement.
- **Observabilité** : Sentry ou équivalent, plus les journaux structurés.

Ne jamais partager le projet Supabase, les secrets ou les comptes d’envoi avec
une autre application.

## Ordre de déploiement

1. Créer `staging` et `production` avec des projets séparés.
2. Configurer les variables selon `ENVIRONMENT_VARIABLES.md`.
3. Vérifier la sauvegarde et le point de restauration Supabase.
4. Exécuter localement `lint`, `typecheck`, `test`, `test:e2e`, `db:test` et
   `build`.
5. Examiner la liste des migrations et le résultat de `supabase db lint`.
6. Appliquer les migrations versionnées sur le staging uniquement.
7. Régénérer les types et confirmer qu’aucun diff inattendu n’apparaît.
8. Déployer les tâches Trigger.dev sur l’environnement staging.
9. Déployer Next.js staging avec la même révision Git.
10. Configurer Supabase Auth : Site URL, redirect URLs, SMTP et inscription
    publique désactivée.
11. Configurer les webhooks avec HTTPS, secret distinct et test de signature.
12. Exécuter le parcours de validation staging et les tests inter-tenant.
13. Obtenir l’approbation humaine de mise en production.
14. Répéter migrations → Trigger.dev → Web en production.
15. Effectuer les contrôles post-déploiement et surveiller les erreurs.

## Migrations

- Une migration publiée n’est jamais modifiée.
- Les migrations sont appliquées dans l’ordre et depuis une révision Git
  identifiée.
- RLS et GRANT sont relus séparément.
- Une migration destructive exige une sauvegarde, un test de restauration et
  un plan spécifique.
- La commande `db reset` reste strictement locale.

## Trigger.dev

Les tâches doivent être déployées après la base et avant le Web qui les appelle.
Le projet contient les identifiants de tâches initiaux, mais seul
`import.processCsv` dispose actuellement d’un adaptateur métier complet. Les
autres tâches refusent explicitement l’exécution tant que leur adaptateur réel
n’est pas configuré ; ce comportement est volontaire et bloque la bêta.

## Webhooks, email et calendrier

- utiliser un secret par environnement ;
- vérifier la signature sur le corps brut et la fenêtre temporelle ;
- limiter la taille et le débit ;
- tester déduplication et replay ;
- vérifier SPF, DKIM, DMARC et les quotas avant toute campagne ;
- ne jamais utiliser une boîte personnelle comme compte d’envoi de production ;
- sélectionner et valider les contrats réels des fournisseurs email et
  calendrier avant activation.

## Rollback

Le rollback applicatif consiste à redéployer la dernière version saine. Le
rollback d’une migration n’est jamais un `down` improvisé : préférer une
migration corrective compatible, puis restaurer uniquement si l’intégrité des
données l’exige. Suspendre les campagnes et tâches d’envoi avant toute
restauration.

## Contrôles post-déploiement

- `/api/health` répond sans exposer de secret ;
- connexion, récupération de mot de passe et invitation fonctionnent ;
- une agence A ne peut lire aucune ressource d’une agence B ;
- un Recruiter ne voit que ses clients affectés ;
- les tâches conservent idempotence et tenant ;
- une adresse supprimée ou désabonnée ne peut pas être planifiée ;
- aucune donnée sensible n’apparaît dans les logs ;
- les alertes d’erreur et de délivrabilité sont reçues.
