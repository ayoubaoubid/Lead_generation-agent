# Modèle multitenant

## 1. Hiérarchie

```text
Platform
└── Agency
    ├── Client
    │   └── Resources
    └── Agency-scoped resources
```

L’agence est le tenant commercial racine. Un client appartient à une seule agence.
Toute future ressource client doit conserver le couple `agency_id` / `client_id` et
utiliser une clé étrangère composite vers `clients (agency_id, id)` lorsque cela est
pertinent.

Un utilisateur accède à un client uniquement s’il possède d’abord un membership dans
l’agence parente. La table `client_members` possède donc une clé étrangère composite
vers `agency_members (agency_id, profile_id)`. Les helpers RLS exigent en plus que les
deux memberships soient actifs.

## 2. Source de vérité

La source de vérité de l’identité est l’utilisateur retourné côté serveur par
`supabase.auth.getUser()`. Les métadonnées utilisateur, les cookies non vérifiés, les
paramètres de route et les champs de formulaire ne constituent jamais une preuve
d’autorisation.

Un `agencyId` ou `clientId` reçu du navigateur sert uniquement à localiser l’intention.
Le serveur :

1. valide le format UUID ;
2. récupère l’utilisateur Supabase Auth ;
3. vérifie le membership agence actif ;
4. vérifie l’accès au client exact lorsqu’un `clientId` est fourni ;
5. vérifie la permission demandée ;
6. construit seulement ensuite un `TenantContext`.

Un identifiant falsifié produit une erreur générique `tenant_mismatch`. La réponse ne
révèle pas si le tenant existe.

## 3. Contexte tenant serveur

`resolveRequestedServerTenant` construit l’une des deux formes suivantes :

```ts
type AgencyTenantContext = {
  scope: "agency";
  agencyId: string;
  actor: { kind: "user"; actorId: string };
};

type ClientTenantContext = {
  scope: "client";
  agencyId: string;
  clientId: string;
  actor: { kind: "user"; actorId: string };
};
```

La résolution applicative est doublée par les policies RLS. Le repository ne considère
jamais un filtre `agency_id` comme un contrôle suffisant : la requête est exécutée avec
la session de l’utilisateur et reste filtrée par PostgreSQL.

## 4. Agence active

La sélection est conservée dans le cookie de session HttpOnly
`active_agency_id`. Le cookie est :

- écrit uniquement par une Server Action après vérification du membership actif ;
- inaccessible au JavaScript du navigateur ;
- `SameSite=Lax` ;
- `Secure` en production ;
- revalidé à chaque résolution.

Modifier ou fabriquer la valeur du cookie ne donne aucun accès supplémentaire. Une
valeur absente, invalide, suspendue ou appartenant à une autre personne est rejetée.

## 5. Workflows

### 5.1 Création d’une agence

`createAgencyAction` appelle la fonction SQL publique `create_agency`. Cette entrée
Data API utilise un wrapper `security invoker` et délègue à la fonction non exposée
`private.bootstrap_agency`.

L’opération est atomique :

1. vérification de `auth.uid()` et du profil ;
2. création de l’agence ;
3. création du rôle système `owner` ;
4. affectation du catalogue complet de permissions ;
5. création du membership actif du créateur ;
6. création de l’audit `agency.created`.

Les fonctions privilégiées sont placées dans le schéma non exposé `private`, utilisent
un `search_path` vide, vérifient l’identité en interne et possèdent des droits
`EXECUTE` minimaux. Aucun client privilégié Supabase n’est utilisé dans le navigateur.

### 5.2 Adhésion à une agence

Un administrateur ayant `member.invite` crée un membership `invited` pour un profil
et un rôle agence appartenant au même tenant. L’utilisateur invité appelle ensuite
`acceptAgencyMembershipAction`.

La fonction privée n’active la ligne que si :

- le membership correspond à l’identifiant demandé ;
- `profile_id = auth.uid()` ;
- le statut courant est `invited`.

L’acceptation produit l’audit `agency_membership.accepted`.

### 5.3 Création d’un client

Le formulaire ne transmet pas d’`agencyId`. `createClientAction` résout l’agence depuis
le cookie actif, revalide le membership et exige `client.create`. La fonction RPC
`create_client` refait ensuite le contrôle de permission dans PostgreSQL, crée le
client avec l’`agency_id` vérifié et écrit l’audit `client.created`.

### 5.4 Affectation des utilisateurs

- l’affectation agence exige `member.invite`, `member.assign_role` et un rôle agence
  du tenant actif ;
- l’affectation client exige `member.invite`, `member.assign_role`, un client
  accessible et un rôle client appartenant exactement au même couple agence/client ;
- un utilisateur doit recevoir un membership agence avant un membership client ;
- les nouvelles affectations utilisent le statut `invited` ;
- les RPC `assign_agency_member` et `assign_client_member` refont les contrôles dans
  PostgreSQL et créent les audits d’invitation correspondants ;
- l’envoi de l’email d’invitation reste une fonctionnalité séparée.

## 6. RLS et droits Data API

RLS reste activé sur toutes les tables `public`. Les rôles `anon` et `authenticated`
n’obtiennent aucun droit implicite. Les `GRANT` définissent les opérations possibles ;
les policies limitent les lignes.

Principaux contrôles :

- `agencies` : lecture uniquement par membership agence actif ;
- `clients` : lecture par permission agence ou membership client actif exact ;
- `agency_members` et `client_members` : lecture personnelle ou permission
  `member.read`; les mutations exposées passent par des RPC auditées ;
- `roles` et `role_permissions` : visibilité du rôle personnel ou permissions RBAC ;
- `audit_logs` : lecture avec `audit.read`, aucune mutation utilisateur ;
- helpers RLS : fonctions `private`, `security definer`, `search_path` vide et
  vérification systématique de `auth.uid()`.

Les policies `UPDATE` conservent `USING` et `WITH CHECK`. Les colonnes de tenant ne
peuvent pas être réaffectées grâce aux triggers existants.

## 7. Tests

Les tests pgTAP sous `supabase/tests/database` démontrent notamment :

- Agence A ne voit pas Agence B ;
- un membre Client A ne voit pas Client B ;
- un utilisateur non membre ne voit aucune agence ni ressource client ;
- une création avec un `agency_id` falsifié est rejetée par RLS ;
- un membership client sans membership agence est rejeté par clé étrangère ;
- le bootstrap d’agence crée atomiquement rôle, permissions, membership et audit ;
- la sélection d’agence, la création de client et les affectations sont revalidées
  par les RPC avant tout effet ;
- une invitation n’accorde aucun accès avant son acceptation.

Les tests TypeScript vérifient séparément que le service serveur refuse les identifiants
agence/client falsifiés avant de construire un `TenantContext`.

Commandes locales :

```powershell
npm run supabase:start
npm run db:reset
npm run db:test
npm test
npm run typecheck
```

`db:reset` et `db:test` ciblent exclusivement la stack locale. Cette implémentation ne
doit être appliquée au projet distant qu’après revue du diff, succès des tests locaux
et autorisation explicite de déploiement.
