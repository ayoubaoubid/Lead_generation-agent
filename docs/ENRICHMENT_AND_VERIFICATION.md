# Enrichissement et vérification

## Périmètre

Le module fournit une frontière indépendante des fournisseurs pour :

- l’enrichissement d’entreprise ;
- l’enrichissement de contact ;
- la vérification d’email ;
- la validation de domaine.

Le domaine métier ne dépend d’aucune API spécifique. Les adaptateurs réels
seront sélectionnés par environnement et devront respecter les mêmes contrats.

## Fournisseur de développement

`DevelopmentEnrichmentProvider` et
`DevelopmentEmailVerificationProvider` permettent de tester le workflow sans
réseau ni consommation payante.

Le fournisseur de développement :

- conserve seulement les faits déjà présents ;
- valide uniquement la syntaxe d’un domaine ;
- détecte quelques cas déterministes d’email jetable ou générique ;
- retourne `unknown` pour une adresse ordinaire ;
- ne prétend jamais avoir vérifié une boîte email, un DNS ou une donnée externe.

Il ne doit pas être utilisé pour prendre une décision réelle de délivrabilité.

## Ledger des opérations

La table `provider_operations` conserve :

- le tenant et la ressource concernés ;
- le type d’opération et son état ;
- le fournisseur ;
- la clé d’idempotence et l’empreinte SHA-256 des entrées ;
- le résultat fournisseur préalablement assaini ;
- le résultat normalisé ;
- la confiance, la source et la date ;
- le coût technique et la devise ;
- le code d’erreur redacted et son caractère réessayable.

Les résultats bruts non assainis, les en-têtes, credentials et secrets ne
doivent jamais être persistés.

## Multitenancy et autorisation

Le navigateur ne fournit pas les données à enrichir. Le service recharge
l’entreprise, le contact ou l’adresse email depuis le tenant actif, puis compare
leur `agency_id` et `client_id` au contexte résolu côté serveur.

Les utilisateurs authentifiés ont uniquement un droit `SELECT` tenant-scoped
sur le ledger. Les écritures sont réservées aux services serveur autorisés. Un
repository utilisant un client Supabase privilégié doit donc être construit
uniquement côté serveur, après vérification du membership et de la permission
`lead.write`.

## Idempotence

L’unicité porte sur :

```text
agency_id + client_id + operation_kind + idempotency_key
```

Une empreinte des entrées est associée à la réservation. Réutiliser une clé avec
des entrées différentes provoque un conflit. Une opération terminée est
retournée sans nouvel appel fournisseur.

## Statuts d’email

```text
valid
risky
catch_all
unknown
invalid
disposable
role_based
bounced
suppressed
unsubscribed
```

Les statuts `suppressed` et `unsubscribed` sont également des interdictions
d’envoi. Leur contrôle final appartient au moteur d’envoi et au module
Compliance.

## Trigger.dev

Les contrats sont conçus pour des tâches durables, mais aucune tâche distante
n’est déclenchée par ce module seul. Les tâches du prompt Trigger.dev devront :

1. recharger l’opération et sa ressource ;
2. revalider le tenant ;
3. réserver la consommation ;
4. appeler l’adaptateur ;
5. valider et persister le résultat ;
6. enregistrer coût, run et erreur ;
7. éviter tout second appel facturé lors d’un retry.
