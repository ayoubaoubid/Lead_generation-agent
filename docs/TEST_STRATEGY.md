# Stratégie de tests

## Pyramide

1. **Unitaires** : domaines, Zod, scoring, déduplication, idempotence, signature,
   redaction et skills.
2. **Intégration Supabase** : migrations, contraintes, RPC, permissions et RLS.
3. **Trigger.dev** : validation payload, tenant reload, concurrence, retry,
   reprise et coût.
4. **Webhooks** : signature, replay, doublon, ordre et tenant introuvable.
5. **IA** : schéma, faits/hypothèses, prompt injection, preuve manquante et
   approbation humaine.
6. **E2E** : parcours vertical complet avec fournisseurs sandbox ou simulés.
7. **UX** : responsive, clavier, contraste, états loading/error/disabled.

## Scénario E2E de référence

Créer agence → client → onboarding → offre → ICP → import → contacts →
vérification → scoring → segment → campagne → génération → approbation →
planification → envoi simulé → réponse signée → classification → rendez-vous →
opportunité → analytics.

Le scénario doit utiliser deux agences et falsifier au moins une fois les IDs
pour prouver le refus. Aucun fournisseur facturé ni email réel n’est autorisé.

## Commandes

```powershell
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run db:test
npm run build
```

## Critères bloquants

- zéro échec lint/typecheck/test/build ;
- toutes migrations rejouables par `db reset` ;
- cas négatifs cross-tenant pour chaque nouvelle surface ;
- double effet impossible sous concurrence ;
- aucun secret ou PII dans fixtures et logs ;
- tests E2E sandbox avant statut Beta ;
- audit accessibilité automatisé et clavier sur parcours critique avant Beta.

## État actuel

Les suites unitaires et pgTAP couvrent les fondations, multitenancy, RBAC,
onboarding, ciblage, imports, enrichissement mock, scoring, campagnes, messages,
opérations et rate limiting. Playwright couvre la connexion publique, la
redirection Auth, le responsive mobile, le clavier, les en-têtes HTTP et le
design system avec axe/WCAG. Le parcours E2E métier authentifié complet et les
tests fournisseur sandbox restent à construire après sélection des fournisseurs.
