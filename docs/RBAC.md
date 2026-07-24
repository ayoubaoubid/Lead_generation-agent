# Contrôle d’accès par rôles et permissions

## 1. Modèle d’autorisation

Le RBAC applique la relation suivante :

```text
Utilisateur authentifié
× membership actif
× portée agence/client vérifiée
× rôle actif
× permission atomique
```

Le nom et le slug d’un rôle ne participent jamais à une décision d’autorisation.
Ils servent uniquement à provisionner et présenter une matrice de permissions. La
source d’autorité est la relation `roles → role_permissions → permissions`.

Dans un contexte client, les permissions du rôle agence actif et du rôle client actif
sont cumulées. Cela permet à un membre interne de l’agence d’opérer un client avec son
rôle agence, tandis qu’un utilisateur client reste limité à son affectation exacte.

Les données d’autorisation ne sont pas placées dans `user_metadata` ni dans des claims
JWT susceptibles de devenir obsolètes. Chaque contrôle sensible relit les memberships,
rôles et permissions persistés.

## 2. Catalogue atomique

Les permissions sont organisées par ressource :

- agence et clients : `agency.manage`, `agency.transfer_ownership`, `client.read`,
  `client.create`, `client.manage`, `client.archive` ;
- stratégie client : `onboarding.read`, `onboarding.write`,
  `onboarding.validate`, `offer.read`, `offer.write` ;
- membres et rôles : `member.read`, `member.invite`, `member.assign_role`,
  `member.suspend`, `role.read`, `role.create`, `role.assign`, `role.archive` ;
- campagnes : `campaign.read`,
  `campaign.create`, `campaign.write`, `campaign.approve`, `campaign.launch` ;
- données et messages : `lead.read`, `lead.write`, `message.read`, `message.write`,
  `message.approve` ;
- opérations commerciales : `reply.read`, `reply.write`, `meeting.read`,
  `meeting.write`, `pipeline.read`, `pipeline.write` ;
- pilotage : `analytics.read`, `audit.read`, `settings.read`, `settings.manage`.

`permissions.allowed_scopes` indique si une permission peut être affectée à un rôle
agence, client ou aux deux. Un trigger refuse par exemple l’affectation de
`agency.transfer_ownership` à un rôle client.

## 3. Rôles système initiaux

### Rôles agence

| Rôle | Capacités principales |
|---|---|
| Agency Owner | Toutes les permissions agence, dont le transfert de propriété |
| Agency Admin | Toutes les permissions agence sauf le transfert de propriété |
| Campaign Manager | Construction, modification, approbation et lancement des campagnes |
| Lead Researcher | Lecture des offres et lecture/écriture des leads |
| SDR | Leads, messages, réponses, rendez-vous et pipeline opérationnel |
| Sales Manager | Campagnes, messages, réponses, rendez-vous, pipeline et analytics |
| Reviewer | Lecture et approbation des campagnes et messages, sans lancement |
| Analyst | Lecture opérationnelle et analytics, sans mutation |

### Rôles client

| Rôle | Capacités principales |
|---|---|
| Client Admin | Administration du client, membres, contenus et opérations, sans lancement de campagne |
| Client Reviewer | Lecture et approbation des campagnes/messages |
| Client Viewer | Lecture seule des données et analytics autorisés |

Les rôles système sont provisionnés lors de la création de l’agence ou du client. La
migration synchronise également les tenants déjà présents. Le schéma conserve la
possibilité de rôles personnalisés, mais aucune mutation directe de rôle ou de matrice
de permissions n’est exposée au navigateur.

## 4. Vérification serveur

Le serveur fournit :

- `requirePermission` pour une permission obligatoire ;
- `requireAllPermissions` pour une conjonction de permissions ;
- `requireAnyPermission` pour une alternative contrôlée ;
- `getRequestedPermissionSnapshot` après résolution sécurisée d’un contexte
  agence/client ;
- `getActiveAgencyPermissionSnapshot` pour l’agence active.

Les identifiants du navigateur servent uniquement à localiser l’intention. Le contexte
tenant est toujours reconstruit avec `auth.getUser()`, les memberships actifs et les
policies RLS.

## 5. RLS et mutations sensibles

Les policies utilisent les permissions atomiques et non les rôles :

- `client.read`, `client.create`, `client.manage` et `client.archive` protègent les
  workspaces clients ;
- `onboarding.read`, `onboarding.write` et `onboarding.validate` protègent la
  collecte, la soumission et la validation de la stratégie client ;
- `member.read` protège la visibilité des membres ;
- `role.read` protège la visibilité des rôles et matrices ;
- `audit.read` protège les journaux d’audit.

Les mutations directes de `agency_members`, `client_members`, `roles` et
`role_permissions`, ainsi que les mutations directes d’agence/client, sont retirées
au rôle PostgreSQL `authenticated`. Les invitations passent par les RPC contrôlées,
qui revalident le tenant, `member.invite` et `member.assign_role`.

## 6. Interface utilisateur

`PermissionGate` masque un contenu lorsque les permissions nécessaires manquent.
`AuthorizedButton` peut masquer ou désactiver une action.

Ces composants améliorent l’expérience utilisateur mais ne constituent jamais une
barrière de sécurité. La Server Action, le service et la base refont toujours les
contrôles.

## 7. Audit

Les actions sensibles déjà exposées écrivent des événements append-only :

- `agency.created` et `client.created`, avec provisionnement des rôles système ;
- `client.updated` et `client.archived`, sans duplication des valeurs du profil ;
- `agency_membership.invited` et `client_membership.invited`, avec le rôle affecté ;
- `agency_membership.accepted` ;
- `tenant_context.selected`.
- `onboarding.step_saved`, `onboarding.completed` et `onboarding.validated`, sans
  copier les réponses commerciales dans le journal général.

Tout futur workflow de création de rôle personnalisé, changement de matrice,
réaffectation ou suspension devra utiliser une RPC/service audité avant d’être exposé.

## 8. Tests

Les tests couvrent notamment :

- Owner/Admin et transfert de propriété ;
- Reviewer : approbation autorisée, lancement refusé ;
- Analyst : analytics autorisés, écriture des leads refusée ;
- Client Admin/Reviewer/Viewer ;
- refus d’une permission agence sur un rôle client ;
- absence d’autorité pour un rôle simplement nommé `Agency Owner` ;
- helpers serveur `allOf`/`anyOf` et refus des permissions critiques ;
- masquage et désactivation des actions UI ;
- audit des invitations.

Les tests PostgreSQL sont locaux et nécessitent Docker :

```powershell
npm run supabase:start
npm run db:reset
npm run db:test
```

Aucune migration ne doit être appliquée au projet distant sans revue, tests locaux et
autorisation explicite.
