# Conventions de nommage

Ces conventions visent à rendre les frontières entre TypeScript, PostgreSQL, Next.js, Trigger.dev et les fournisseurs prévisibles. Elles s'appliquent aux nouveaux fichiers et au code modifié ; elles ne justifient pas un renommage global hors périmètre.

## 1. Langue

- Le code, les identifiants, les noms de tables, événements, tâches et APIs sont en anglais.
- La documentation peut être en français.
- Les libellés UI passent par le mécanisme d'internationalisation lorsqu'il existe.
- Ne pas mélanger français et anglais dans un même contrat technique.
- Utiliser le vocabulaire métier défini dans le cahier des charges et éviter les synonymes non nécessaires.

## 2. Règles générales

- Choisir des noms explicites décrivant une responsabilité ou un état.
- Éviter les noms génériques : `data`, `item`, `object`, `manager`, `helper`, `utils`, `process`.
- Ne pas inclure le nom d'un fournisseur dans un concept métier canonique.
- Ne pas abréger sauf pour les termes reconnus du projet : `id`, `api`, `url`, `ui`, `db`, `ai`, `crm`, `icp`, `rbac`, `rls`, `cta`, `dns`.
- Préférer un nom long et précis à une abréviation ambiguë.
- Utiliser un seul terme pour un concept : par exemple `client`, pas alternativement `customer`, `account` et `tenant` dans les entités métier.
- Réserver `tenant` au concept générique de sécurité ; utiliser `agency` et `client` dans le domaine.

## 3. Fichiers et dossiers

### Dossiers

Utiliser `kebab-case` :

```text
lead-operations/
campaign-operations/
sender-accounts/
```

### Fichiers TypeScript et React

Utiliser `kebab-case` :

```text
campaign-service.ts
campaign-card.tsx
verify-email.task.ts
campaign.repository.ts
```

Conserver les fichiers spéciaux Next.js :

```text
page.tsx
layout.tsx
loading.tsx
error.tsx
not-found.tsx
route.ts
middleware.ts
```

### Suffixes recommandés

| Responsabilité | Suffixe |
|---|---|
| Service applicatif | `.service.ts` |
| Repository | `.repository.ts` |
| Adaptateur fournisseur | `.adapter.ts` |
| Schéma de validation | `.schema.ts` |
| Types de domaine | `.types.ts` ou fichier du domaine |
| Policy applicative | `.policy.ts` |
| Tâche Trigger.dev | `.task.ts` |
| Workflow | `.workflow.ts` |
| Mapper | `.mapper.ts` |
| Test unitaire | `.test.ts` / `.test.tsx` |
| Test d'intégration | `.integration.test.ts` |
| Test end-to-end | `.e2e.test.ts` |

Ne pas créer de fichier `utils.ts` général. Placer une fonction dans le domaine qui lui donne son sens.

## 4. TypeScript

### Variables et fonctions

Utiliser `camelCase` :

```text
agencyId
clientMembership
calculateFitScore
verifyCampaignPreflight
```

Les fonctions utilisent un verbe décrivant l'action :

```text
createCampaign
getCampaignById
listClientCampaigns
approveGeneratedMessage
```

Éviter `handle`, `do`, `run` ou `process` lorsque l'action peut être nommée précisément. `handle` reste acceptable pour un handler de transport clairement délimité.

### Types, classes, composants et schémas

Utiliser `PascalCase` :

```text
Campaign
CampaignEnrollment
SenderAccountAdapter
CampaignCard
GeneratedMessageSchema
```

- Ne pas préfixer les interfaces par `I`.
- Nommer une union ou un type selon le concept, pas selon sa forme technique.
- Ajouter `Input`, `Command`, `Result`, `Event` ou `Config` lorsque cela clarifie la frontière.

```text
CreateCampaignInput
ApproveMessageCommand
SendMessageResult
ReplyReceivedEvent
EmailProviderConfig
```

### Constantes

Utiliser `UPPER_SNAKE_CASE` uniquement pour les constantes réellement globales et immuables :

```text
MAX_IMPORT_FILE_SIZE
DEFAULT_PAGE_SIZE
```

Une constante locale ou un objet de configuration utilise `camelCase`.

### Booléens

Préfixer avec `is`, `has`, `can`, `should`, `was` ou `requires` :

```text
isActive
hasClientAccess
canApproveMessage
shouldPauseCampaign
requiresHumanApproval
```

Éviter les booléens négatifs comme `isNotActive`.

### Collections

Utiliser le pluriel :

```text
campaigns
clientIds
deliveryEvents
```

Éviter `campaignList` lorsque `campaigns` suffit.

## 5. Identifiants et contexte tenant

Dans TypeScript :

```text
agencyId
clientId
actorId
resourceId
correlationId
idempotencyKey
```

Dans PostgreSQL :

```text
agency_id
client_id
created_by
correlation_id
idempotency_key
```

Ne pas utiliser `tenantId` dans les tables métier si la portée réelle est `agencyId` ou `clientId`. Le type générique `TenantContext` peut contenir les deux :

```text
agencyId obligatoire
clientId optionnel uniquement pour une ressource agency-scoped
actorId ou identité technique
```

Éviter les paramètres ambigus comme `id` dans une fonction publique ; préférer `campaignId`, `leadId` ou `senderAccountId`.

## 6. PostgreSQL et Supabase

### Tables et colonnes

- Tables : `snake_case` au pluriel.
- Colonnes : `snake_case`.
- Clé primaire : `id`.
- Clé étrangère : `<entity_singular>_id`.
- Timestamps : suffixe `_at`.
- Dates sans heure : suffixe `_date`.
- Booléens : préfixes `is_`, `has_`, `can_`, `requires_`.
- Compteurs : suffixe `_count`.
- Montants : nommer devise et unité lorsque nécessaire.

```text
campaign_enrollments
sender_account_id
scheduled_at
retention_end_date
is_active
attempt_count
unit_cost_cents
currency_code
```

### Tables de relation

Nommer avec les deux concepts de manière stable :

```text
agency_members
client_members
segment_members
campaign_segments
role_permissions
```

### Contraintes et index

Utiliser :

```text
pk_<table>
fk_<table>__<column>
uq_<table>__<columns>
ck_<table>__<rule>
idx_<table>__<columns>
```

Exemples :

```text
fk_campaigns__client_id
uq_outbound_messages__idempotency_key
ck_lead_scores__score_range
idx_contacts__agency_id_client_id_email
```

### Policies RLS

Nommer selon table, opération et portée :

```text
<table>_<operation>_<scope>
```

Exemples :

```text
campaigns_select_client_members
campaigns_update_campaign_managers
generated_messages_update_reviewers
```

Le nom doit décrire l'intention de la policy, pas son implémentation SQL.

### Fonctions et vues

Utiliser `snake_case` et un verbe pour les fonctions :

```text
user_has_client_permission
calculate_campaign_metrics
```

Les vues décrivent le résultat :

```text
client_campaign_performance
agency_cost_summary
```

## 7. Statuts et machines d'état

Les valeurs persistées utilisent `lower_snake_case` :

```text
pending_review
approved
scheduled
in_progress
completed
failed
cancelled
```

Utiliser la même valeur dans PostgreSQL, TypeScript et les événements lorsque possible.

- Un statut décrit un état, pas une action.
- Éviter les doublons sémantiques comme `done` et `completed`.
- Préférer `cancelled` partout ou `canceled` partout ; le projet utilise `cancelled`.
- Les raisons sont séparées du statut : `failure_reason`, `pause_reason`, `disqualification_reason`.

## 8. Trigger.dev

Les identifiants de tâches utilisent le format :

```text
<domain>.<action>
```

Exemples alignés sur le cahier des charges :

```text
research.discoverCompanies
enrichment.enrichCompany
verification.verifyEmail
qualification.calculateFitScore
campaign.generateMessage
campaign.sendMessage
reply.classifyReply
meeting.syncCalendar
crm.createOpportunity
report.dailyClientReport
```

Règles :

- domaine en `lowercase` ;
- action en `camelCase` avec un verbe ;
- ne pas inclure le fournisseur dans l'identifiant métier ;
- utiliser une version explicite uniquement si deux contrats doivent coexister, par exemple `campaign.sendMessage.v2` ;
- les noms de queues décrivent la contrainte : `email-sends`, `provider-enrichment`, `client-reporting` ;
- les clés d'idempotence décrivent l'effet métier et restent stables entre retries.

## 9. Événements et webhooks

Les événements internes utilisent :

```text
<domain>.<entity>.<past_tense_event>
```

Exemples :

```text
campaign.message.approved
outreach.message.sent
outreach.delivery.bounced
reply.message.received
crm.opportunity.created
```

Les handlers fournisseurs peuvent inclure le fournisseur dans le nom de l'adaptateur, mais doivent convertir immédiatement vers l'événement canonique.

Les identifiants externes utilisent le suffixe `ExternalId` en TypeScript et `_external_id` en base, accompagnés du fournisseur :

```text
provider
externalMessageId
external_message_id
```

## 10. APIs et JSON

- Routes : noms au pluriel et `kebab-case` si plusieurs mots.
- Paramètres TypeScript/JSON : `camelCase`.
- Modèles PostgreSQL : `snake_case`.
- Mapper explicitement à la frontière repository ; ne pas exposer directement une ligne SQL comme contrat public.
- Utiliser des noms de ressources plutôt que des verbes dans les URLs, sauf action métier non CRUD explicite.

Exemples :

```text
/api/clients/{clientId}/campaigns
/api/campaigns/{campaignId}/approval
/api/webhooks/email/{provider}
```

Éviter les routes ambiguës comme `/api/process` ou `/api/do-action`.

## 11. Server Actions et handlers

Les Server Actions utilisent un verbe métier :

```text
createClientAction
approveMessageAction
pauseCampaignAction
```

Les Route Handlers n'ont pas besoin d'un export nommé spécifique au métier lorsque Next.js impose `GET`, `POST`, etc. Les fonctions internes appelées par le handler restent explicites.

## 12. Fournisseurs et adaptateurs

Contrats canoniques :

```text
EmailProvider
CalendarProvider
EnrichmentProvider
EmailVerificationProvider
CrmProvider
AiModelProvider
```

Adaptateurs :

```text
GmailEmailAdapter
MicrosoftGraphCalendarAdapter
FirecrawlResearchAdapter
OpenAiModelAdapter
```

Configuration :

```text
EmailProviderConfig
ProviderCredentials
ProviderCapabilities
```

Ne pas nommer un service métier `GmailService` s'il représente l'envoi canonique. Utiliser `OutreachService` avec un `EmailProvider` injecté.

## 13. Agents et skills

Les noms de concepts utilisent `PascalCase` :

```text
OrchestratorAgent
PersonalizationAgent
MessageQualityAgent
DiagnoseSkill
StoryBrandSkill
```

Les identifiants persistés et dossiers utilisent `kebab-case` :

```text
orchestrator-agent
message-quality-agent
email-personalization
reply-classification
```

Les versions utilisent un champ explicite, pas le nom affiché :

```text
skillId
skillVersion
promptVersion
modelId
```

## 14. Environnement et configuration

Variables d'environnement en `UPPER_SNAKE_CASE` :

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
TRIGGER_SECRET_KEY
OPENAI_API_KEY
```

- Toute variable préfixée `NEXT_PUBLIC_` doit être sûre à publier.
- Préférer des noms qualifiés par service et finalité.
- Ne pas utiliser des noms génériques comme `API_KEY` ou `SECRET`.
- Les exemples utilisent des valeurs factices reconnaissables.

## 15. Tests

Les descriptions de tests utilisent un comportement observable :

```text
denies access when the user belongs to another agency
does not send the same sequence step twice
pauses the campaign when the bounce threshold is exceeded
```

Éviter :

```text
works correctly
test campaign
handles error
```

Les fixtures indiquent clairement le tenant :

```text
agencyA
agencyB
clientA1
clientA2
clientB1
```

Ne pas utiliser de données personnelles réelles dans les fixtures.

## 16. Documentation et décisions

- Titres de documents : `UPPER_SNAKE_CASE.md` pour les références racine ou transversales existantes.
- ADR futurs : `NNNN-short-decision-title.md`.
- Les exemples utilisent des noms factices et neutres.
- Les liens internes utilisent des chemins relatifs lorsqu'ils restent dans le dépôt.
- Une convention nouvelle doit être ajoutée ici seulement si elle s'applique à plusieurs modules.
