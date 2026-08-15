# Tâches Trigger.dev

## Rôle

Next.js authentifie, autorise et enregistre l’intention. Trigger.dev exécute les
traitements longs, planifiés ou réessayables. La base Supabase reste la source de
vérité durable.

## Contrat commun

Toutes les tâches valident strictement :

```ts
{
  agencyId: string;
  clientId: string;
  actorId?: string;
  resourceId: string;
  idempotencyKey: string;
}
```

Ces identifiants ne constituent jamais une autorisation. La tâche recharge la
ressource avec la clé serveur, compare son tenant réel, puis vérifie le membership
actif de l’acteur. L’Agency Owner dispose de l’accès hérité aux clients ; le
Recruiter exige une affectation client active.

## Registre durable

`async_task_runs` impose une clé unique `(task_id, idempotency_key)`. Les RPC
service-role-only `claim_async_task_run`, `complete_async_task_run` et
`fail_async_task_run` garantissent :

- un seul effet métier pour une clé stable ;
- aucun second claim pendant un run actif ;
- reprise après échec avec compteur de tentatives ;
- réutilisation du résultat après succès ;
- refus d’une clé rejouée sur un autre tenant ou une autre ressource ;
- coût, run Trigger, erreur redacted et timestamps.

L’idempotence Trigger.dev globale protège la mise en file ; le registre Supabase
protège l’effet métier même si la plateforme de tâches rejoue le run.

## Catalogue initial

| Tâche | Ressource rechargée | Queue | Durée |
| --- | --- | --- | --- |
| `import.processCsv` | import CSV | `csv-imports` | 900 s |
| `enrichment.enrichCompany` | entreprise | `enrichment` | 300 s |
| `enrichment.enrichContact` | contact | `enrichment` | 300 s |
| `verification.verifyEmail` | contact | `verification` | 180 s |
| `qualification.calculateScores` | contact | `qualification` | 180 s |
| `campaign.generateMessages` | campagne | `campaign-generation` | 600 s |
| `campaign.prepareRecipients` | campagne | `campaign-control` | 300 s |
| `campaign.scheduleMessage` | envoi sortant | `campaign-control` | 180 s |
| `campaign.stopSequence` | prospect de campagne | `campaign-control` | 120 s |
| `reply.processInbound` | événement webhook | `inbound-replies` | 300 s |
| `report.generateDaily` | client | `reports` | 600 s |

`import.processCsv` est fonctionnelle. Les autres contrats sont indexables et
sécurisés, mais retournent une erreur `intervention_required` tant que leur
adaptateur réel n’est pas configuré. Ils ne simulent jamais un succès fournisseur.

## Retries et coûts

Les erreurs `permanent` et `intervention_required` désactivent les retries.
Les erreurs transitoires suivent un backoff borné à trois tentatives. Chaque effet
payant doit utiliser la même clé fournisseur sur retry. Un retry technique ajoute
une tentative technique ; il ne crée ni nouveau message commercial ni nouvelle
relance.

## Vérification locale

```powershell
npm run typecheck:trigger
npx supabase test db --local supabase/tests/database/operations_security.test.sql
npm run trigger:dev
```

Le dernier appel nécessite les secrets locaux, mais ne doit jamais être utilisé
pour un envoi réel de test.
