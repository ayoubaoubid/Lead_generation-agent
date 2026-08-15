# Infrastructure des skills et agents IA

> Le catalogue actif est désormais `.codex/agents/catalog.v2.json`. Il ajoute
> les agents opérationnels et leurs capacités autorisées. Le catalogue v1 reste
> conservé comme historique. Le workflow complet et la séparation entre agents,
> services déterministes et validations humaines sont décrits dans
> `docs/AGENT_WORKFLOW_ARCHITECTURE.md`.

## 1. Périmètre de ce lot

Ce lot crée les contrats et garde-fous nécessaires aux capacités IA. Le module
ICP/Personas ajoute ensuite un adaptateur Groq strict et limité à une seule
proposition de ciblage à la demande. Aucun agent autonome ni aucune tâche
Trigger.dev n’est lancé automatiquement.

Les règles métier critiques restent déterministes et hors des prompts. Une sortie IA
reste une proposition structurée, jamais une autorisation d’envoi, de modification de
permissions ou d’autre effet externe.

## 2. Organisation

```text
.codex/
├── agents/
│   ├── catalog.v1.json
│   └── catalog.v2.json
└── skills/
    ├── strategy/
    ├── sales/
    ├── lead-operations/
    ├── platform/
    └── quality/

apps/web/src/
├── domain/ai/
├── validations/ai/
├── services/ai/
└── repositories/contracts/ai-execution-trace.repository.ts
```

Chaque skill commercial contient :

- `SKILL.md` : mission, déclenchement, contrats, règles et tests ;
- `prompts/system.v1.md` : prompt immuable de première version ;
- `evals/evals.json` : scénarios réalistes à utiliser lors des futures évaluations.

## 3. Versionnement

Quatre versions sont indépendantes :

| Champ | Rôle |
| --- | --- |
| `agentVersion` | comportement et allowlist d’un agent |
| `skillVersion` | contrat fonctionnel et schémas du skill |
| `promptVersion` | instructions exactes envoyées au modèle |
| `pricingVersion` | grille ayant servi au calcul du coût technique |

Une nouvelle version de prompt crée un nouveau fichier `system.vN.md`. Une exécution
historique conserve ses quatre références et le `modelId` réellement retourné par
l’adaptateur.

## 4. Contrats structurés et Zod

`commercial-skill.schemas.ts` porte les entrées et sorties des dix skills. Le runner
valide :

1. l’entrée avant toute trace ou consommation ;
2. l’enveloppe du fournisseur ;
3. la sortie propre au skill avant retour ou persistance.

Une erreur de schéma est terminale. Elle ne doit pas être corrigée silencieusement ni
persistée comme un résultat valide.

## 5. Faits, estimations et hypothèses

Toute affirmation structurée possède :

```text
statement
classification
confidence
sourceReferenceIds
```

Les classifications autorisées sont :

```text
confirmed_fact
extracted_fact
estimate
hypothesis
unverified
```

Une affirmation sans classification est invalide. L’absence de preuve est enregistrée
dans `missingEvidence`; elle ne doit pas être remplacée par une invention.

## 6. Agents et autorisation

Le catalogue v2 définit les agents préparés, leur allowlist de skills et leur
allowlist de capacités opérationnelles. Deux contrôles restent distincts :

1. l’agent est conçu pour utiliser le skill ;
2. l’acteur possède l’autorisation serveur nécessaire dans le tenant actif.

`AiExecutionAuthorizer` représente le second contrôle. Une implémentation future devra
recharger memberships, client et permission depuis Supabase. La commande d’exécution
ne contient ni `agencyId` ni `clientId`; ces valeurs viennent exclusivement du
`ServiceContext` vérifié.

## 7. Choix du modèle et budgets

Le code sélectionne un profil abstrait :

```text
fast
balanced
reasoning
```

L’adaptateur fournisseur futur traduira le profil en `modelId` depuis une configuration
serveur allowlistée. Aucun nom de modèle ou secret fournisseur n’est imposé dans les
skills.

Chaque définition fixe :

- profils autorisés et profil par défaut ;
- maximum de tokens d’entrée et de sortie ;
- timeout ;
- nombre maximum de tentatives ;
- délai de retry.

Un appelant ne peut pas augmenter ces limites depuis le navigateur.

## 8. Retry, timeout et statuts

Statuts préparés :

```text
queued
running
retrying
succeeded
failed
timed_out
cancelled
```

Seules les erreurs explicitement réessayables le sont. Une entrée ou sortie invalide
est terminale. Le timeout utilise un `AbortSignal` et une limite dure dans le runner.
Les retries ne doivent concerner que la génération sans effet externe.

## 9. Coûts et journalisation

`AiTechnicalCost` représente exclusivement une consommation fournisseur :

```text
amountMicrousd
currency = USD
pricingVersion
```

Il ne s’agit ni d’une facture client, ni d’un paiement, ni d’un crédit prépayé.
`AiCostCalculator` calcule ce montant à partir du `modelId`, des tokens validés et
d’une grille de prix versionnée ; le runner ne fait pas confiance à un montant brut
retourné par le fournisseur.

La trace conserve les identifiants, versions, statut, tentative, modèle, tokens, coût,
timestamps et références de données. Les prompts, payloads, secrets et PII ne sont
jamais écrits dans les logs applicatifs. Les références de données devront pointer vers
une persistance tenant-aware lors du futur lot Supabase.

## 10. Séquence d’exécution préparée

```text
Contexte tenant vérifié
→ autorisation agent/skill
→ autorisation RBAC serveur
→ validation Zod de l’entrée
→ création de la trace queued
→ chargement du prompt versionné
→ génération avec timeout et budget
→ validation de l’enveloppe fournisseur
→ validation Zod de la sortie
→ validation des tokens et calcul versionné du coût
→ trace terminale
→ résultat proposé à la validation humaine
```

## 11. Adaptateur ciblé ICP/Personas

Le module ICP/Personas est la première exception au périmètre initial :

- fournisseur Groq côté serveur uniquement ;
- modèle allowlisté `openai/gpt-oss-20b` ;
- schéma JSON strict distinct pour ICP et persona ;
- principes `mom-test` version 1.0.0 ;
- un seul brouillon inactif par requête ;
- enregistrement du modèle, prompt, skill, tokens, coût technique et version
  tarifaire avec la version proposée ;
- aucune activation, validation ou autre action automatique.

Cette intégration locale au module ne remplace pas encore le runner générique ni
le repository global de traces d’exécution.

## 12. Points volontairement non implémentés

- adaptateur OpenAI ou fournisseur supplémentaire ;
- résolution générique profil → modèle pour tous les skills ;
- repository Supabase des exécutions ;
- migration des tables de traces et coûts ;
- tâches Trigger.dev ;
- exécution automatique après onboarding ;
- outils d’agent, navigation, recherche ou envoi ;
- logique métier complète des dix frameworks ;
- approbation UI des résultats.

Ces éléments nécessitent leurs propres décisions de permissions, rétention, budgets,
modèles, fournisseurs et politiques de validation humaine.

## 13. Stratégie de tests

Les tests actuels couvrent :

- présence et version des dix skills ;
- validation de la classification faits/hypothèses ;
- validation des confiances ;
- refus d’un agent hors allowlist ;
- refus d’une entrée invalide avant consommation ;
- retry d’une erreur fournisseur réessayable ;
- transitions de trace et absence de payload dans les logs.

Les futurs adaptateurs devront ajouter : timeout réel, annulation, coût cumulé des
tentatives, output malformé, prompt injection, tenant falsifié, quotas, persistance
RLS et reprise Trigger.dev.
