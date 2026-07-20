# Architecture des fournisseurs

## 1. Objectif

Ce document définit les frontières entre le domaine, les services applicatifs et les fournisseurs externes. Les contrats ci-dessous sont conceptuels : ils guident l’implémentation future, mais ne constituent ni du code à copier tel quel ni l’autorisation d’ajouter un SDK.

Objectifs :

- remplacer un fournisseur sans réécrire le métier ;
- normaliser les capacités, erreurs, usages et statuts ;
- préserver l’isolation multitenant ;
- rendre les appels simulables et auditables ;
- centraliser résilience, coûts et observabilité ;
- éviter qu’un payload fournisseur devienne un modèle de domaine.
- exclure tout port de paiement : `PaymentProvider`, `BillingProvider`, Stripe et leurs équivalents ne font pas partie de l'architecture présente ou future du projet.

## 2. Direction des dépendances

```text
UI / Route Handler / Server Action / Trigger task / Webhook
                            │
                            ▼
                  Service applicatif
                validation + autorisation
                état + budget + politique
                            │
                            ▼
                  Port fournisseur
               (contrat stable interne)
                            ▲
                            │
              Adaptateur fournisseur concret
       SDK/HTTP + auth + pagination + normalisation
                            │
                            ▼
                API externe / webhook
```

Règles de dépendance :

- le domaine ne connaît ni Apollo, ni Firecrawl, ni ZeroBounce, ni Resend, ni Gmail, ni Google Calendar, ni Groq ;
- les services applicatifs dépendent d’interfaces internes ;
- les adaptateurs dépendent des interfaces et des clients HTTP/SDK externes ;
- un Route Handler ou une tâche ne contourne jamais le service applicatif pour appeler un SDK ;
- les payloads bruts restent dans l’adaptateur ou dans une zone d’audit explicitement protégée ;
- la composition choisit un adaptateur par capacité et par environnement ;
- le MVP utilise un seul adaptateur actif par capacité, sans routeur multi-provider prématuré.

### 2.1 Règles d’importation futures

- `domain` peut importer uniquement des types et règles du domaine ;
- `application` peut importer `domain` et les ports, jamais un SDK fournisseur ;
- `ports` peut importer des modèles canoniques internes, jamais les DTO externes ;
- `adapters/<provider>` peut importer le port correspondant, le client fournisseur et les validateurs de frontière ;
- `web` et `tasks` importent les services applicatifs et la composition serveur, pas les adaptateurs concrets directement ;
- aucun module serveur de credentials ou d’adaptateur ne peut être importé depuis un composant `use client` ;
- les DTO externes sont traduits dans l’adaptateur avant de franchir la frontière ;
- les dépendances de test vers les mocks sont injectées par la composition de test et ne conditionnent pas le domaine.

## 3. Contexte commun d’appel

Chaque appel fournisseur reçoit un contexte construit côté serveur après autorisation :

```ts
type ProviderContext = {
  agencyId: string;
  clientId: string;
  resourceId: string;
  correlationId: string;
  idempotencyKey: string;
  actorId?: string;
  credentialRef?: string;
};
```

Ce contexte n’est jamais accepté aveuglément depuis le navigateur ou un webhook. Le service applicatif recharge la ressource principale et vérifie : membership, affectation client, permission, tenant réel, statut, budget et cohérence des ressources associées.

`credentialRef` référence une configuration serveur ; il ne contient jamais une clé ou un token. Un service de credentials résout la référence uniquement dans l’adaptateur autorisé.

## 4. Résultat, provenance et erreurs normalisés

### 4.1 Enveloppe de résultat

```ts
type ProviderResult<T> = {
  data: T;
  provider: string;
  providerRequestId?: string;
  observedAt: string;
  usage: ProviderUsageDelta[];
  warnings: ProviderWarning[];
};
```

Un résultat utile conserve : fournisseur, identifiant externe, source, horodatage, version d’adaptateur et avertissements. Les faits inférés ne sont pas confondus avec les faits observés.

### 4.2 Taxonomie d’erreurs

Les adaptateurs traduisent les erreurs externes vers une union interne :

```text
authentication_failed
authorization_failed
invalid_request
not_found
conflict
rate_limited
quota_exceeded
timeout
temporarily_unavailable
provider_rejected
invalid_response
cancelled
unknown_provider_error
```

Chaque erreur précise : caractère réessayable ou définitif, délai `retryAfter` éventuel, identifiant de requête fournisseur, statut HTTP éventuel et données sûres pour l’observabilité. Le message brut susceptible de contenir des données sensibles n’est pas journalisé sans filtrage.

### 4.3 Capacités

Une capacité optionnelle n’est pas devinée à partir du nom du fournisseur. L’adaptateur expose un manifeste versionné : opérations prises en charge, modes batch, limites découvertes, régions et exigences d’authentification. Le service refuse proprement une capacité indisponible.

## 5. Contrats de ports

Les types cités ci-dessous sont des modèles canoniques internes. Leurs champs exacts seront définis avec le modèle de données avant implémentation.

### 5.1 `LeadDataProvider`

```ts
interface LeadDataProvider {
  searchCompanies(
    context: ProviderContext,
    criteria: CompanySearchCriteria,
    page?: ProviderPage,
  ): Promise<ProviderResult<PageResult<CompanyCandidate>>>;

  searchPeople(
    context: ProviderContext,
    criteria: PeopleSearchCriteria,
    page?: ProviderPage,
  ): Promise<ProviderResult<PageResult<PersonCandidate>>>;

  enrichCompany(
    context: ProviderContext,
    input: CompanyEnrichmentInput,
  ): Promise<ProviderResult<EnrichedCompany>>;

  enrichPerson(
    context: ProviderContext,
    input: PersonEnrichmentInput,
  ): Promise<ProviderResult<EnrichedPerson>>;

  getUsage(context: ProviderContext): Promise<ProviderResult<ProviderUsageSnapshot>>;
}
```

Règles :

- `CompanyCandidate` et `PersonCandidate` ne promettent ni email ni téléphone ;
- recherche et enrichissement ont des commandes, budgets et traces séparés ;
- la pagination externe est traduite vers un curseur interne opaque ;
- les identifiants Apollo restent des références externes, pas les clés du domaine ;
- un enrichissement déjà valide et récent peut être réutilisé selon une politique explicite ;
- l’adresse email enrichie reste non vérifiée.

Adaptateur MVP : `ApolloLeadDataAdapter`. Fake : `MockLeadDataProvider`.

### 5.2 `WebsiteResearchProvider`

```ts
interface WebsiteResearchProvider {
  crawlWebsite(
    context: ProviderContext,
    request: WebsiteCrawlRequest,
  ): Promise<ProviderResult<WebsiteCrawlResult>>;

  extractStructuredData<T>(
    context: ProviderContext,
    request: StructuredExtractionRequest,
    schema: RuntimeSchema<T>,
  ): Promise<ProviderResult<StructuredExtraction<T>>>;
}
```

Règles :

- seuls les domaines et URLs autorisés sont traités ;
- chaque résultat relie le fait à une URL source et une date ;
- profondeur, pages, octets, temps et crédits sont plafonnés ;
- les redirections vers un domaine non autorisé sont refusées ou explicitement validées ;
- le contenu crawlé est traité comme une entrée hostile à l’égard du prompt ;
- le schéma est validé après Firecrawl, quelle que soit la promesse de l’endpoint ;
- le nom du port reste stable même si Firecrawl remplace `/extract` par `/agent` ou `/scrape` JSON.

Adaptateur MVP : `FirecrawlWebsiteResearchAdapter`. Fake : `MockWebsiteResearchProvider`.

### 5.3 `EmailVerificationProvider`

```ts
interface EmailVerificationProvider {
  verifyEmail(
    context: ProviderContext,
    email: EmailVerificationRequest,
  ): Promise<ProviderResult<NormalizedEmailVerification>>;

  verifyBatch(
    context: ProviderContext,
    emails: EmailVerificationRequest[],
  ): Promise<ProviderResult<NormalizedEmailVerification[]>>;
}
```

`NormalizedEmailVerification.status` appartient à l’ensemble fermé :

```text
valid | invalid | risky | catch_all | unknown |
disposable | role_based | suppressed
```

L’adaptateur conserve aussi `providerStatus`, `providerSubStatus`, `checkedAt` et, si connue, la durée de validité. La policy de délivrabilité décide de l’envoi ; le fournisseur ne décide pas du métier.

Le batch interne peut être découpé en plusieurs appels selon les limites découvertes. L’ordre du résultat est associé par identifiant interne, jamais par seule position.

Adaptateur MVP : `ZeroBounceEmailVerificationAdapter`. Fake : `MockEmailVerificationProvider`.

### 5.4 `TransactionalEmailProvider`

```ts
interface TransactionalEmailProvider {
  send(
    context: ProviderContext,
    message: TransactionalEmailMessage,
  ): Promise<ProviderResult<TransactionalEmailReceipt>>;
}
```

Règles :

- modèles et expéditeurs sont dédiés au transactionnel ;
- une clé d’idempotence métier accompagne l’appel ;
- le reçu ne vaut pas preuve de livraison finale ;
- les événements de livraison futurs sont dédupliqués et normalisés ;
- aucun service de campagne de prospection ne dépend de ce port.

Adaptateur MVP : `ResendTransactionalEmailAdapter`. Fake : `MockTransactionalEmailProvider`.

### 5.5 `OutreachEmailProvider`

```ts
interface OutreachEmailProvider {
  connectAccount(
    context: ProviderContext,
    authorization: OutreachAuthorizationGrant,
  ): Promise<ProviderResult<ConnectedOutreachAccount>>;

  sendMessage(
    context: ProviderContext,
    message: OutreachMessage,
  ): Promise<ProviderResult<OutreachSendReceipt>>;

  syncMessages(
    context: ProviderContext,
    cursor?: MailboxSyncCursor,
  ): Promise<ProviderResult<MailboxSyncResult>>;

  getThread(
    context: ProviderContext,
    threadRef: ExternalThreadRef,
  ): Promise<ProviderResult<NormalizedEmailThread>>;
}
```

Règles :

- `connectAccount` finalise un flow OAuth serveur ; il ne reçoit jamais un refresh token du navigateur comme donnée libre ;
- `sendMessage` exige éligibilité, approbation, quota, suppression et statut de campagne valides ;
- un envoi réserve atomiquement une clé d’effet externe avant l’appel ;
- `syncMessages` progresse depuis un curseur durable et accepte les événements dans le désordre ;
- le corps original est séparé de la classification IA ;
- l’arrêt d’un prospect ou d’un thread est déterministe et immédiat ;
- la suppression/révocation OAuth désactive le compte avant de planifier de nouveaux envois.

Adaptateur MVP : `GmailOutreachEmailAdapter`. Fake : `MockOutreachEmailProvider`. Adaptateurs futurs possibles : Microsoft Graph et SMTP, sans engagement MVP.

### 5.6 `CalendarProvider`

```ts
interface CalendarProvider {
  getAvailability(
    context: ProviderContext,
    query: AvailabilityQuery,
  ): Promise<ProviderResult<AvailabilityWindow[]>>;

  createMeeting(
    context: ProviderContext,
    meeting: MeetingCreateCommand,
  ): Promise<ProviderResult<MeetingReceipt>>;

  updateMeeting(
    context: ProviderContext,
    meeting: MeetingUpdateCommand,
  ): Promise<ProviderResult<MeetingReceipt>>;

  cancelMeeting(
    context: ProviderContext,
    meeting: MeetingCancelCommand,
  ): Promise<ProviderResult<MeetingReceipt>>;
}
```

Règles : fuseaux horaires explicites, intervalles en UTC dans le domaine, calendrier tenant-aware, clé d’idempotence à la création, relecture après notification et absence de création automatique à partir de la seule sortie IA.

Adaptateur MVP : `GoogleCalendarAdapter`. Fake : `MockCalendarProvider`.

### 5.7 `AIProvider`

```ts
interface AIProvider {
  generateStructured<T>(
    context: ProviderContext,
    request: StructuredGenerationRequest,
    schema: RuntimeSchema<T>,
  ): Promise<ProviderResult<StructuredGeneration<T>>>;
}
```

Règles :

- le domaine demande une capacité, pas un modèle Groq ;
- `promptVersion`, `schemaVersion`, finalité et références de sources sont obligatoires ;
- la température et les paramètres sont configurés par cas d’usage versionné ;
- la sortie est validée par un schéma runtime ;
- échec fermé si le résultat nécessaire à une action critique est absent ou invalide ;
- tokens, latence, modèle effectif, refus, fallback et coût sont enregistrés ;
- aucune donnée d’un tenant n’est injectée dans le contexte d’un autre.

Adaptateur MVP : `GroqAIAdapter`. Fake : `MockGroqAIProvider`.

## 6. Adaptateurs entrants

Les webhooks et notifications sont des adaptateurs entrants, pas des services métier.

### 6.1 Pipeline commun

1. Limiter taille et fréquence.
2. Vérifier authenticité, audience, timestamp et protection anti-replay selon le fournisseur.
3. Parser avec un schéma runtime.
4. Dédupliquer l’événement externe.
5. Résoudre l’intégration et son tenant depuis une référence serveur vérifiée.
6. Persister l’intention ou l’événement minimal.
7. Répondre rapidement au fournisseur.
8. Déclencher une tâche durable avec contexte tenant et corrélation.
9. Recharger la source de vérité chez le fournisseur si la notification n’est qu’un signal.

### 6.2 Gmail et Pub/Sub

Le `messageId` Pub/Sub sert à la déduplication du transport, tandis que `historyId` sert à la progression de synchronisation Gmail. Aucun des deux n’est l’identifiant d’un message métier. La synchronisation traite les trous, doublons et événements dans le désordre. Si l’historique demandé n’est plus disponible, une réconciliation complète contrôlée est déclenchée.

## 7. Résilience par catégorie

| Catégorie | Retry | Timeout | Circuit breaker | Fallback métier |
|---|---|---|---|---|
| Recherche leads | erreurs temporaires seulement | borné par page | par fournisseur/tenant | reprendre plus tard, conserver le curseur |
| Enrichissement payant | seulement avec réservation/idempotence | court à moyen | oui | revue manuelle ou reporter |
| Crawl/recherche web | oui sur erreurs transitoires | fortement borné | oui | utiliser les preuves déjà fraîches ou marquer indisponible |
| Vérification email | oui, surtout `unknown` technique selon politique | compatible réponse lente | oui | bloquer l’envoi, jamais considérer valide |
| IA | oui sur erreurs temporaires sans dupliquer l’effet aval | borné par cas d’usage | par modèle/fournisseur | gabarit déterministe ou revue humaine |
| Email transactionnel | oui avec idempotence stable | court | oui | file d’attente/alerte |
| Email outreach | très contrôlé avec réservation d’envoi | court | par compte/domaine | pause de campagne, jamais autre canal automatique |
| Sync Gmail | oui et réconciliation périodique | par lot | par compte | full sync bornée si curseur invalide |
| Calendrier | oui avec clé métier | court | par compte | proposition manuelle, pas de double rendez-vous |

Les nombres de retries, délais, tailles de lot et seuils de circuit breaker ne sont pas codés dans ce document. Ils dépendent des SLA, quotas et tests de charge, et sont configurés par environnement.

### 7.1 Backoff et rate limits

- backoff exponentiel avec jitter ;
- respect de `Retry-After` et des en-têtes de quota fiables ;
- concurrence plafonnée par plateforme, tenant, campagne, compte, domaine et fournisseur ;
- pagination bornée par un maximum métier ;
- aucun retry automatique sur authentification, autorisation, requête invalide ou quota durablement épuisé ;
- ouverture du circuit sans empêcher les autres tenants d’utiliser un autre compte sain.

### 7.2 Idempotence des effets externes

Avant un effet payant ou irréversible :

1. calculer une clé métier stable ;
2. ouvrir une transaction ;
3. vérifier l’état et le tenant ;
4. créer ou réserver une ligne unique d’effet ;
5. committer ;
6. appeler l’adaptateur avec cette clé ;
7. finaliser reçu, usage et statut ;
8. réconcilier les états ambigus après timeout.

Un timeout après envoi est un résultat **inconnu**, pas un échec autorisant immédiatement un second envoi.

## 8. Composition et sélection d’adaptateur

La composition se fait côté serveur à partir d’une configuration validée : capacité, environnement, statut de l’intégration et référence de credentials. Le nom du fournisseur peut être conservé dans les métadonnées d’intégration, mais aucun utilisateur ne choisit arbitrairement une classe ou une URL.

MVP :

| Capacité | Adaptateur actif prévu |
|---|---|
| IA structurée | Groq |
| données leads | Apollo |
| recherche site web | Firecrawl |
| vérification email | ZeroBounce |
| email transactionnel | Resend |
| email de prospection | Gmail API |
| calendrier | Google Calendar API |

Le remplacement futur suit une procédure : implémenter le même port, vérifier le mapping canonique, exécuter la suite de tests de contrat, tester en environnement protégé, migrer les credentials et basculer explicitement. Aucun double appel payant en production sans décision approuvée.

Adaptateurs futurs explicitement anticipés, sans implémentation MVP :

- `AlternativeB2BLeadDataAdapter`, `CsvLeadDataAdapter`, `ManualLeadDataAdapter` et `InternalLeadDataAdapter` ;
- `MicrosoftGraphOutreachEmailAdapter` et un adaptateur SMTP validé ;
- `MicrosoftCalendarAdapter` et `CalendlyCalendarAdapter` ;
- autres fournisseurs IA, leads ou vérification uniquement après décision de bascule.

## 9. Conventions de nommage

Ces conventions complètent `docs/NAMING_CONVENTIONS.md` :

- port de capacité : nom métier au singulier terminé par `Provider`, par exemple `LeadDataProvider` ;
- adaptateur concret : `<Provider><Capability>Adapter`, par exemple `ApolloLeadDataAdapter` ;
- fake : `Mock<CapabilityProvider>` conformément aux noms exigés pour le MVP ;
- entrées applicatives : suffixes `Command`, `Query`, `Criteria` ou `Request` selon leur rôle ;
- résultats canoniques : nom métier sans préfixe fournisseur ;
- DTO externes : préfixe fournisseur et suffixe `Dto`, confinés à l’adaptateur ;
- statuts internes : `snake_case` stable, statuts TypeScript en unions fermées ;
- opérations de télémétrie : verbe canonique stable, sans version d’endpoint dans le nom métier ;
- identifiants externes : suffixe `ExternalRef` ou champ `provider*`, jamais `id` seul ;
- fichiers d’adaptateurs : `kebab-case`, organisés par capacité puis fournisseur ;
- aucune classe, variable ou table générique nommée seulement `integration` lorsqu’une capacité précise existe.

## 10. Tests de contrat et fakes

Fakes obligatoires :

- `MockLeadDataProvider` ;
- `MockWebsiteResearchProvider` ;
- `MockEmailVerificationProvider` ;
- `MockTransactionalEmailProvider` ;
- `MockOutreachEmailProvider` ;
- `MockCalendarProvider` ;
- `MockGroqAIProvider`.

Chaque fake permet de configurer : succès, latence, pagination, rate limit, quota épuisé, timeout, réponse invalide, duplication, erreur définitive et résultat partiel. Il enregistre les appels pour vérifier tenant, idempotency key et corrélation sans conserver de secret.

La même suite de contrat vérifie fake et adaptateur réel :

- mapping canonique ;
- validation des entrées/sorties ;
- taxonomie d’erreurs ;
- pagination et batch ;
- usage et coût ;
- redaction des logs ;
- isolation des credentials ;
- idempotence observable.

Les tests live sont opt-in, protégés par environnement et budget, utilisent des comptes dédiés et ne s’exécutent jamais dans la CI standard. Aucun email réel ni rendez-vous réel ne part sans une cible de test explicitement autorisée.

## 11. Observabilité et audit

Chaque appel émet un événement structuré sans contenu sensible :

```text
provider
operation
adapterVersion
agencyId
clientId
resourceId
correlationId
idempotencyKeyHash
startedAt / completedAt
status
latencyMs
retryCount
providerRequestId
usage units
estimatedCost / actualCost
normalizedErrorCode
```

Les prompts, réponses, emails et pages sources sont conservés uniquement dans les tables métier ou d’audit prévues, avec accès tenant-aware et politique de rétention. Sentry reçoit des métadonnées minimales et nettoyées.

## 12. Points à décider avant le code

- structure exacte des packages/modules et justification éventuelle de Turborepo ;
- formes canoniques de `CompanyCandidate`, `PersonCandidate`, thread et meeting ;
- politique de fraîcheur et réutilisation des enrichissements/vérifications ;
- matrice de statut ZeroBounce vers éligibilité d’envoi ;
- paramètres de résilience par opération ;
- stratégie de réconciliation après effet fournisseur ambigu ;
- forme du catalogue de capacités et de prix ;
- emplacement et mécanisme de résolution des credentials tenant ;
- scopes Google minimaux et processus de validation OAuth ;
- règles de conservation du contenu brut et des preuves web ;
- comportement exact de chaque workflow pendant une panne fournisseur.
