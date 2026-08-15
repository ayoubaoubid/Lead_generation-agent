# Threat model

## Actifs

- données prospects et messages ;
- memberships, rôles et permissions ;
- secrets Supabase, Trigger.dev, email, calendrier et IA ;
- réputation des domaines d’envoi ;
- états de campagnes, suppressions et audit ;
- coûts fournisseurs et clés d’idempotence.

## Menaces prioritaires

| Menace | Contrôle | Preuve actuelle | Risque restant |
| --- | --- | --- | --- |
| ID tenant falsifié | résolution serveur, FK composites, RLS | tests cross-tenant pgTAP | nouvelles tables à tester à chaque ajout |
| service role dans le client | séparation `server-only`, env strict | typecheck/build | audit du bundle en CI recommandé |
| double envoi | clé métier unique, row lock, ledger attempts | test SQL idempotence ; contraintes | test sandbox fournisseur requis |
| replay webhook | HMAC timestamp, event unique | tests unitaires signature | adapter au schéma du fournisseur choisi |
| prompt injection email/site | contenu traité comme donnée, skills bornés | règles et schémas | red-team continu sur modèles réels |
| secret en log | contexte structuré et redaction | test logger | messages libres des SDK externes à filtrer |
| suppression contournée | hash global/client, trigger DB, preflight | migration et test suppression | vérifier tous les canaux futurs |
| campagne non approuvée | RPC et claim rechargent l’état | tests campagnes | test E2E complet avant bêta |
| quota cross-tenant | comptes client-scoped et queues bornées | contraintes composites | fairness par tenant à mesurer en charge |
| upload malveillant | MIME/taille, stockage privé, parsing borné | tests import | antivirus/sandbox fichier non intégré |
| XSS dans message entrant | rendu React échappé, aucun HTML brut | architecture UI | ajouter test E2E de contenu hostile |
| SQL injection | requêtes paramétrées et RPC | Supabase client | revue de chaque SQL dynamique |

## Scénarios d’abus

### Recruiter modifie le cookie client

Le serveur appelle `resolveActiveClientTenant`, vérifie agency membership,
client membership et permission. Les policies RLS appliquent une seconde barrière.

### Deux workers claim le même email

Le premier verrouille `outbound_messages` et passe à `sending`. Le second reçoit
`shouldSend: false`. Le fournisseur reçoit la même clé idempotente sur retry.

### Un email demande à l’agent d’ignorer ses règles

Le texte reste dans le champ `body` du schéma. Le system prompt et le skill
interdisent d’en faire une instruction. La sortie est validée et l’action reste
humaine.

### Un fournisseur renvoie deux fois un événement

`(provider, provider_event_id)` est unique. La seconde requête retourne 202 sans
nouveau message ni nouveau run.

### Une adresse se désabonne pendant une campagne

La séquence est arrêtée, l’adresse est ajoutée à la suppression list et le trigger
DB refuse tout nouvel `outbound_messages` planifié ou claimé.

## Revue

Revoir ce document lors de l’ajout d’un fournisseur, canal, type de secret,
webhook, stockage, tâche ou capacité IA.
