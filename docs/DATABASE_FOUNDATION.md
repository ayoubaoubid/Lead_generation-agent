# Fondation de la base de données

## 1. Objectif et périmètre

Cette fondation fournit le minimum structurel nécessaire pour l’identité applicative, l’isolation `Plateforme → Agence → Client`, le RBAC et l’audit. Elle ne contient aucun module métier de prospection, campagne, message, réponse ou pipeline.

Le schéma est versionné dans des migrations distinctes afin de séparer les responsabilités :

1. identité, agences, clients et utilitaires de timestamps ;
2. rôles, permissions, memberships et audit ;
3. fonctions privées utilisées par les policies ;
4. droits Data API et RLS.
5. workflows multitenant sécurisés ;
6. rôles système et catalogue RBAC atomique.

Aucune commande de ce dépôt n’applique implicitement une migration à un projet distant.

## 2. Modèle de tenant

| Entité | Portée | Identifiants de tenant |
|---|---|---|
| `profiles` | plateforme | aucun ; `id` référence `auth.users` |
| `agencies` | agence racine | l’identifiant `id` est le tenant |
| `clients` | client | `agency_id` et `id` |
| `agency_members` | agence | `agency_id` |
| `client_members` | client | `agency_id`, `client_id` |
| `roles` | agence ou client | `agency_id`, `client_id` nullable selon `scope` |
| `permissions` | plateforme | aucun ; catalogue global défini par le code |
| `role_permissions` | rôle | portée dérivée de `role_id` pour éviter une duplication incohérente |
| `audit_logs` | agence ou client | `agency_id`, `client_id` nullable |

Les clés étrangères composites garantissent qu’un client, un rôle client ou un membership client ne peut pas être relié à une autre agence. Des triggers interdisent la réaffectation ultérieure de `agency_id` ou `client_id` : une ressource change de tenant par une opération métier explicite de copie, jamais par un simple `UPDATE`.

## 3. Identité et profils

`profiles.id` est une clé étrangère un-à-un vers `auth.users.id`. Un trigger après création Auth ajoute automatiquement le profil. Une migration idempotente provisionne aussi les profils manquants lorsqu’un projet Supabase contient déjà des utilisateurs Auth avant l’installation du schéma applicatif. Le champ `raw_user_meta_data.full_name` est accepté uniquement comme texte d’affichage tronqué et validé ; aucune metadata utilisateur ne participe à l’autorisation.

`profiles.id` est lié à l’utilisateur Auth avec suppression en cascade, mais un profil ayant encore des memberships conservés ne peut pas être supprimé grâce aux clés étrangères `restrict`. L’offboarding normal utilise donc les statuts `suspended` puis `removed`, sans effacer l’historique. La stratégie définitive d’anonymisation et de suppression dure reste une décision conformité. Les références historiques `created_by` utilisent `set null` ; la création normale doit néanmoins toujours fournir l’acteur et l’audit append-only conserve le contexte autorisé nécessaire.

## 4. RBAC

Un rôle appartient toujours à une agence et possède l’une de ces portées :

- `agency` : `client_id` doit être nul ;
- `client` : `client_id` doit identifier un client de la même agence.

`agency_members.role_id` est validé par une clé étrangère tenant-aware puis par un trigger exigeant un rôle agence actif. `client_members.role_id` utilise une clé étrangère `(agency_id, client_id, role_id)`, ce qui rend impossible l’affectation d’un rôle d’un autre client.

Le seed maintient localement le catalogue atomique décrit dans `docs/RBAC.md`. Les
permissions sont définies par ressource/action et possèdent une liste
`allowed_scopes` contrôlant leur affectation aux rôles agence ou client.

Il ne crée ni utilisateur, ni agence, ni client. Le bootstrap d’agence provisionne
atomiquement les rôles système, le propriétaire, son membership et l’audit sans
exposer de clé privilégiée au navigateur.

## 5. RLS et Data API

RLS est activé sur les neuf tables publiques. `anon` ne reçoit aucun droit. `authenticated` reçoit des droits explicites par table et, pour les mutations, par colonne. Cette déclaration explicite est nécessaire avec les nouveaux paramètres Supabase qui n’exposent plus automatiquement les tables du schéma `public`.

Les policies suivent ces principes :

- un profil est visible par son propriétaire et ses pairs actifs dans la même agence ou le même client ;
- un membre d’agence voit son agence ; les listes de clients, membres et rôles exigent respectivement `client.read`, `member.read` et `role.read` ;
- un membre client voit uniquement son client exact ;
- une mutation RBAC exige une permission explicite ;
- `audit_logs` est lisible uniquement avec `audit.read` et n’est jamais insérable depuis un client authentifié ;
- aucune policy de suppression n’existe pour les entités durables.

Les vérifications complexes sont dans le schéma non exposé `private`. Les fonctions sont `SECURITY DEFINER` uniquement pour éviter la récursion RLS, utilisent un `search_path` vide, vérifient toujours `auth.uid()` et ne sont exécutables que par `authenticated`. Elles retournent un booléen et n’exposent aucune ligne ni donnée sensible.

La clé privilégiée reste strictement serveur. Lorsqu’elle contourne RLS, le service appelant doit refaire les contrôles d’agence, de client, de rôle et de ressource avant toute opération.

## 6. Timestamps, archivage et audit

Toutes les tables mutables ont `created_at` et `updated_at`. Le trigger `private.set_updated_at` met à jour ce dernier avec l’heure de la requête.

Il n’existe pas de soft delete générique :

- agences et clients utilisent un statut `archived` ;
- memberships utilisent `removed` ;
- seuls les rôles utilisent `archived_at`, car leur identité doit rester disponible pour les memberships et l’historique ;
- `audit_logs` est append-only, sans `updated_at` ni suppression.

Les logs d’audit ne doivent contenir ni secret, ni token, ni PII non nécessaire. `created_by` est nul uniquement pour un acteur technique vérifié, dont l’identité doit alors être placée sous une clé documentée de `metadata`.

## 7. Développement local

Prérequis : Node.js compatible avec le dépôt, Docker Desktop ou un runtime Docker compatible, et le CLI Supabase installé par `npm install`.

```powershell
npm run supabase:start
npm run supabase:status
npm run db:test
npm run db:types
```

- `supabase:start` démarre la pile locale Auth/API/Studio nécessaire au MVP ;
- `supabase:status` affiche les URLs locales sans modifier les données ;
- `supabase:stop` arrête les conteneurs et conserve les volumes Docker ;
- `db:reset` est destructif : il reconstruit la base locale depuis les migrations puis exécute `seed.sql` ;
- `db:test` exécute les tests pgTAP locaux ;
- `db:types` régénère `apps/web/src/types/database.generated.ts` depuis le schéma local.

Pour éviter une action distante accidentelle, employer systématiquement `--local` pour les commandes destructives ou de test. Ne jamais lancer `db reset --linked`, `db push` ou une migration depuis le Dashboard sans revue, sauvegarde et autorisation explicite.

Les données de développement persistent après un arrêt normal du PC dans le
volume `supabase_db_lead_generation_sales`. Ne jamais employer
`supabase stop --no-backup`, supprimer ce volume ou lancer
`docker system prune --volumes`. Avant d’éteindre la machine, utiliser
`npm run supabase:stop`; après redémarrage de Docker Desktop, utiliser
`npm run supabase:start`.

## 8. Tests de sécurité

`supabase/tests/database/foundation_rls.test.sql` couvre :

- visibilité agence A / agence B ;
- visibilité client exacte ;
- résolution positive et négative des permissions ;
- isolation des profils ;
- lecture tenant-aware des audits ;
- refus d’une création de client dans une autre agence ;
- refus d’insertion d’un audit par un utilisateur ;
- immutabilité des audits.

Chaque future table tenant-scoped doit ajouter des tests positifs et négatifs pour `SELECT`, `INSERT`, `UPDATE` et `DELETE` selon les opérations réellement exposées.

## 9. Décisions restant à confirmer

- La matrice initiale est définie dans `docs/RBAC.md`. Toute nouvelle permission doit
  être ajoutée par migration, typée côté serveur et attribuée explicitement aux rôles
  concernés.
- La politique d’invitation et le bootstrap du premier propriétaire seront définis avec le module Auth.
- Les durées de rétention légale des audits et des données personnelles restent une décision conformité.
- Le traitement d’une demande de suppression d’un utilisateur ayant un historique de membership doit arbitrer entre anonymisation, conservation légale et suppression en cascade.
- Le format exact de l’acteur technique dans `audit_logs.metadata` doit être normalisé avant les premiers workflows Trigger.dev.
- Les réglages Auth de production, MFA, SMTP, sauvegardes et réseau ne font pas partie de cette migration et devront être définis par environnement.
