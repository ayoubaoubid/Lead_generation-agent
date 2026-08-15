# Companies, Contacts et Imports CSV

## Objectif

Ce module fournit le référentiel client-scoped des entreprises et contacts, leur provenance, ainsi qu’un pipeline CSV contrôlé. Il ne qualifie pas encore les leads, ne lance aucun enrichissement fournisseur et n’envoie aucun message.

## Frontières et sécurité

- Une entreprise, un contact, une source et un import appartiennent toujours à un couple `agency_id` / `client_id`.
- Le serveur dérive ce couple de la session et du client actif. Les routes d’import n’acceptent aucun identifiant de tenant du navigateur.
- `lead.read` protège les lectures et `lead.write` protège les créations, archivages, imports et annulations.
- Les écritures utilisateur passent par des fonctions SQL qui revérifient le membership et la permission.
- Les endpoints JSON de préparation et de planification refusent les requêtes sans origine same-origin valide.
- Les tables sont lisibles via RLS, mais les écritures directes sont retirées au rôle `authenticated`.
- Le bucket `lead-imports` est privé. Une policy Storage n’autorise l’upload que si le chemin correspond exactement à un import brouillon créé par l’utilisateur dans son tenant.
- Le worker possède une clé privilégiée uniquement côté serveur. Son payload ne contient que `importId`; il recharge le tenant, le mapping, le chemin Storage et l’état durable depuis la base.
- Le contenu CSV brut et les PII ne sont jamais écrits dans les logs. Les lignes
  persistées ne conservent que les colonnes explicitement mappées, et le rapport
  UI n’affiche que le numéro de ligne, le statut et un message d’erreur
  neutralisé.

## Qualité et provenance

Les valeurs portent un statut de fait :

- `confirmed` : confirmé humainement ou par une source autorisée ;
- `extracted` : extrait directement d’une source ;
- `estimated` : estimation explicitement identifiée ;
- `hypothesis` : hypothèse à vérifier ;
- `unverified` : origine ou exactitude non vérifiée.

Le statut de vérification est distinct : `unverified`, `pending`, `verified`, `invalid` ou `stale`. Un CSV ne peut pas s’auto-déclarer vérifié : les nouvelles lignes importées commencent à `unverified`.

`company_sources` et `contact_sources` stockent la source, l’identifiant externe, l’URL, la date de collecte, la confiance et les statuts. Aucun secret fournisseur ne doit être enregistré dans ces tables.

## Déduplication

La stratégie par défaut est conservative : un doublon est rattaché au rapport et ignoré, jamais fusionné automatiquement.

Ordre des clés déterministes :

1. couple fournisseur / identifiant externe ;
2. domaine normalisé pour une entreprise ;
3. email normalisé pour un contact ;
4. URL LinkedIn normalisée pour un contact ;
5. nom normalisé uniquement lorsqu’il existe un seul candidat dans le client.

Le nom normalisé est indexé mais n’est pas unique. Deux entreprises peuvent légitimement porter le même nom. Les index uniques partiels ne concernent que les enregistrements actifs, afin qu’un archivage ne supprime pas l’historique.

## Flux CSV

1. Le navigateur lit le CSV localement, détecte sa structure et affiche jusqu’à 25 lignes.
2. L’utilisateur choisit le type, le séparateur et le mapping.
3. Le serveur valide le mapping et crée un import `draft`.
4. Le navigateur téléverse le fichier directement dans le bucket privé au chemin fourni par le serveur.
5. Le serveur vérifie l’existence de l’objet et marque l’import `ready`.
6. Trigger.dev reçoit uniquement `importId` avec une clé d’idempotence globale.
7. Le worker recharge l’import et traite les lignes par lots de 100.
8. La clé unique `(import_id, row_number)` et les colonnes `source_import_*` empêchent une relance de recréer la même ligne.
9. Les compteurs sont recalculés depuis les résultats persistés.
10. Le statut terminal devient `completed`, `completed_with_errors`, `failed` ou `cancelled`.

Si Trigger.dev est momentanément indisponible, l’import reste `ready` et peut
être relancé depuis son rapport sans téléverser une seconde fois le fichier.

Tous les fichiers sont traités de manière asynchrone. La limite actuelle est de 6 Mo, compatible avec le flux d’upload standard utilisé. Un besoin supérieur doit passer par un protocole resumable et une stratégie de découpage des fichiers.

## Annulation

- `draft`, `ready` ou `queued` devient immédiatement `cancelled`.
- `processing` devient `cancel_requested`; le worker vérifie cet état avant chaque lot.
- Les lignes déjà validées restent enregistrées. Les supprimer automatiquement serait dangereux si elles ont été enrichies ou modifiées depuis leur import.

Une fonctionnalité de restauration transactionnelle pourra être ajoutée plus tard avec des snapshots et une vérification `updated_at`, mais elle ne doit pas être assimilée à l’annulation du traitement.

## Exécution locale

Services requis :

- Docker Desktop et Supabase local pour les migrations et tests RLS ;
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` et `SUPABASE_SERVICE_ROLE_KEY` ;
- `TRIGGER_SECRET_KEY` ;
- le processus Next.js et `npm run trigger:dev`.

Commandes :

```text
npm run supabase:start
npm run db:reset
npm run db:test
npm run dev
npm run trigger:dev
```

`SUPABASE_SERVICE_ROLE_KEY` et `TRIGGER_SECRET_KEY` ne doivent jamais être préfixées par `NEXT_PUBLIC_`.

## Limites MVP

- Le format pris en charge est CSV encodé en UTF-8, jusqu’à 6 Mo.
- La prévisualisation détecte les erreurs structurelles principales mais le worker reste l’autorité de validation.
- Les doublons sont ignorés et leur nouvelle source est attachée lorsque possible ; aucune fusion de champs n’est automatique.
- L’annulation ne constitue pas un rollback des lignes déjà persistées.
- Le rapport affiche au maximum 1 000 lignes dans l’interface actuelle. La pagination serveur sera nécessaire pour des rapports plus grands.
- Les types TypeScript ont été préparés avec les migrations. Ils doivent être régénérés via `npm run db:types` dès que Supabase local est disponible.
