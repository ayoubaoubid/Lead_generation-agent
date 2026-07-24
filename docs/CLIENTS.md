# Module Clients

## Périmètre

Le module gère le portefeuille de clients d’une agence. Un client reste une
ressource tenant-scoped identifiée par le couple `agency_id` / `id`. Le navigateur
ne choisit jamais seul ce contexte : chaque action relit la session, l’appartenance
active et les permissions avant d’appeler le service.

Le module couvre :

- la liste paginée, la recherche et les filtres par statut, secteur et pays ;
- la création d’un espace en statut `draft` ou `onboarding` ;
- la consultation et la modification des informations générales ;
- le site, le secteur, le pays, la langue, le fuseau, le logo par URL HTTPS et les
  objectifs ;
- la consultation et l’affectation des membres autorisés ;
- l’archivage contrôlé sans suppression de l’historique.

Le téléversement d’un fichier logo n’est pas inclus dans ce lot. `logo_url` accepte
uniquement une URL HTTPS validée. Une future intégration Storage devra définir un
bucket tenant-aware, ses limites et ses policies avant de remplacer ce mécanisme.

## Architecture

```text
Page / composant
→ Server Action ou query serveur
→ résolution du tenant + permission atomique
→ ClientService
→ contrat ClientRepository
→ SupabaseClientRepository
→ RLS pour les lectures / RPC auditée pour les mutations
```

Les actions de création, modification et archivage n’écrivent jamais directement
dans `clients`. Les RPC publiques sont `SECURITY INVOKER` et délèguent à des
fonctions privées qui vérifient `auth.uid()` et les permissions avant chaque effet.

## Permissions

| Permission | Usage |
|---|---|
| `client.read` | liste et consultation |
| `client.create` | création dans l’agence active |
| `client.manage` | modification d’un client accessible et non archivé |
| `client.archive` | transition contrôlée vers `archived` |
| `member.read` | consultation des membres |
| `member.invite` + `member.assign_role` | affectation d’un membre agence à un rôle client |

Les contrôles UI ne servent qu’à présenter les actions disponibles. Les mêmes
permissions sont revérifiées par le serveur et la base.

## Cycle de vie et audit

La modification autorise `draft`, `onboarding`, `active` et `paused`. Le statut
`archived` ne peut être atteint que par `archive_client`, avec :

- confirmation explicite `ARCHIVER` dans l’interface ;
- permission `client.archive` ;
- vérification du client dans la même agence ;
- enregistrement de `archived_at` et `archived_by` ;
- événement append-only `client.archived`.

Les autres événements sont `client.created` et `client.updated`. Les métadonnées
d’audit décrivent l’opération et les statuts, sans copier les valeurs du profil.
Un client archivé reste consultable via le filtre dédié, mais n’est plus modifiable.

## Validation

La validation Zod côté serveur borne les textes, normalise les champs optionnels,
contrôle les URLs, les codes pays/langue, le fuseau et limite les objectifs. Les
contraintes PostgreSQL répètent les invariants durables essentiels. La paire
`agency_id` / `client_id` est toujours issue du contexte serveur vérifié.

## Tests

- tests unitaires des schémas et transitions de statut ;
- tests du service pour les refus de permission et les identifiants falsifiés ;
- test pgTAP `clients_module.test.sql` pour l’isolation agence A/B, le rôle Client
  Viewer, les RPC, l’audit et l’archivage ;
- vérifications générales `test`, `typecheck`, `lint` et `build`.

Les tests pgTAP exigent Supabase local et Docker. Aucune migration distante n’est
appliquée automatiquement.
