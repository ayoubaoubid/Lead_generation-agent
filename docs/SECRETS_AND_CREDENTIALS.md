# Secrets et identifiants d’intégration

## 1. Objectif

Ce document définit la classification, le stockage conceptuel, l’accès et le cycle de vie des secrets. Il ne crée aucun secret, compte, variable, table ou migration et ne choisit pas encore un produit de coffre définitif.

Principes :

- aucun secret dans Git, un fichier suivi, un bundle navigateur, une URL, une capture ou un ticket ;
- aucun secret fournisseur stocké en clair dans une table applicative ;
- une référence opaque et des métadonnées peuvent être persistées, pas la valeur lisible ;
- accès serveur uniquement, moindre privilège et séparation par environnement ;
- isolation tenant appliquée avant toute résolution de credentials ;
- rotation, révocation, expiration et santé font partie du modèle dès le départ ;
- logs et erreurs sont nettoyés avant émission.

## 2. Classification

### 2.1 Secrets plateforme par environnement

Ces secrets sont gérés par l’opérateur de la plateforme et non par un utilisateur métier :

```text
GROQ_API_KEY
APOLLO_API_KEY
FIRECRAWL_API_KEY
ZEROBOUNCE_API_KEY
RESEND_API_KEY
SUPABASE_SERVICE_ROLE_KEY
TRIGGER_SECRET_KEY
SENTRY_DSN
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Précisions :

- `SENTRY_DSN` est généralement un identifiant d’ingestion et non un secret d’administration, mais il reste configuré et contrôlé ;
- `SUPABASE_SERVICE_ROLE_KEY` est hautement privilégiée et ne doit jamais être préfixée `NEXT_PUBLIC_` ;
- un client secret OAuth n’est jamais livré au navigateur ;
- les clés de développement, staging et production sont distinctes ;
- une clé partagée entre environnements est interdite sauf impossibilité fournisseur documentée et temporaire.

### 2.2 Credentials appartenant à une agence ou un client

Exemples :

- refresh token et access token Google OAuth ;
- identifiant du compte Gmail ou Calendar connecté ;
- clé API apportée par un tenant si ce mode est autorisé plus tard ;
- identifiant externe de watch, subscription ou calendrier ;
- secrets de signature propres à une intégration.

Ces éléments possèdent toujours un propriétaire explicite : plateforme, agence ou client. Une intégration client-scoped ne peut être résolue pour un autre client. Une intégration agence-only avec `client_id` nul exige une règle de partage approuvée et testée.

### 2.3 Métadonnées non secrètes mais sensibles

Peuvent être conservées séparément de la valeur secrète :

```text
credentialRef
provider
environment
agencyId
clientId éventuel
externalAccountId
maskedIdentifier
grantedScopes
status
createdAt
lastUsedAt
expiresAt
rotatedAt
revokedAt
lastHealthCheckAt
lastErrorCode
```

Même non secrètes, ces métadonnées restent soumises à RLS et à la minimisation des logs.

## 3. Emplacements autorisés

### 3.1 Variables plateforme

Les valeurs plateforme sont injectées depuis les gestionnaires de secrets propres aux environnements d’exécution, par exemple Vercel pour Next.js et Trigger.dev pour les tâches. La configuration doit garantir que :

- seuls les workloads nécessaires lisent le secret ;
- les previews non fiables n’obtiennent pas les secrets de production ;
- une variable serveur n’est pas exposée dans une variable publique ;
- les membres et robots ont le minimum de droits ;
- les modifications sont auditées ;
- les valeurs ne sont pas recopiées entre outils par des scripts ou logs non contrôlés.

La même valeur peut devoir exister dans plusieurs runtimes. Dans ce cas, l’inventaire du secret conserve ses emplacements, sa version et son propriétaire de rotation sans exposer sa valeur.

### 3.2 Credentials tenant

Le stockage cible doit fournir : chiffrement fort au repos, clés gérées séparément, contrôle d’accès serveur, audit, rotation et suppression. Deux approches restent à évaluer avant migration :

1. coffre managé avec la base ne stockant qu’une référence opaque ;
2. stockage applicatif chiffré par enveloppe, avec clé de chiffrement dans un KMS externe au contenu chiffré.

La décision dépendra des régions, fonctions disponibles, contraintes Supabase/Vercel/Trigger.dev, coûts et exigences de conformité. Une colonne texte chiffrée avec une clé voisine dans la même base n’est pas une séparation acceptable.

La base applicative ne doit jamais exposer une valeur secrète via la Data API, une vue, Realtime ou une policy RLS. La résolution se fait côté serveur après contrôle du tenant et de l’opération.

### 3.3 Développement local

- utiliser des fichiers d’environnement ignorés par Git ;
- fournir seulement un fichier d’exemple sans valeurs réelles ;
- préférer des clés sandbox ou comptes de test ;
- ne pas copier un export de production ;
- nettoyer les historiques de terminal et captures ;
- les tests ordinaires utilisent les mocks, donc aucune clé n’est nécessaire.

## 4. Résolution d’un credential

Flux autorisé :

1. le service reçoit une identité authentifiée ou technique vérifiée ;
2. il recharge la ressource et établit `agencyId` et `clientId` ;
3. il contrôle membership, affectation, rôle et permission ;
4. il sélectionne l’intégration active appartenant au même tenant ;
5. il transmet une `credentialRef` opaque à l’adaptateur ;
6. un composant serveur résout la valeur pour la durée minimale ;
7. l’adaptateur l’utilise sans la journaliser ni la persister ailleurs ;
8. la valeur est abandonnée après l’appel ;
9. usage, succès ou erreur normalisée sont audités sans secret.

Interdictions :

- choisir le credential à partir d’un `agencyId` ou `clientId` fourni sans revalidation ;
- renvoyer un token à un composant client ;
- passer un secret complet dans un payload Trigger.dev si une référence résoluble suffit ;
- stocker un token dans Sentry, un message d’erreur, une table d’événements ou un analytics ;
- faire confiance à un `externalAccountId` sans vérifier son intégration parente.

## 5. OAuth Google

### 5.1 Flow cible

Utiliser le flow Authorization Code pour application web côté serveur :

1. créer une intention de connexion liée à la session, au tenant et à une expiration courte ;
2. générer et persister côté serveur `state` et protections nécessaires ;
3. rediriger vers Google avec les scopes minimaux ;
4. vérifier strictement `state`, redirect URI, identité et tenant au retour ;
5. échanger le code côté serveur ;
6. vérifier les scopes réellement accordés et l’identité du compte ;
7. chiffrer le refresh token et ne persister qu’une référence côté application ;
8. marquer l’intégration active seulement après un contrôle de santé ;
9. auditer l’acteur, le tenant, les scopes et le compte masqué.

L’accès durable nécessite généralement `access_type=offline`. Un refresh token peut ne pas être renvoyé à chaque consentement ; le flow doit gérer reconnexion, consentement et révocation sans écraser un credential sain par une valeur vide.

### 5.2 Scopes

Les scopes exacts ne sont pas figés avant la conception détaillée des opérations. Règles :

- demander uniquement les scopes nécessaires à l’envoi, à la synchronisation utile et au calendrier ;
- éviter un scope Gmail large si une combinaison plus limitée couvre le besoin ;
- distinguer Gmail et Calendar et expliquer chaque scope sur l’écran de consentement ;
- vérifier la catégorie sensible ou restreinte actuelle ;
- prévoir la validation OAuth Google ;
- si des données issues de scopes restreints sont stockées ou transmises côté serveur, valider l’évaluation de sécurité éventuellement exigée ;
- refuser une opération si le scope accordé ne la couvre pas.

### 5.3 Cycle de vie OAuth

États canoniques proposés :

```text
pending | active | degraded | expired | revoked | disconnected | error
```

Le système gère : expiration des access tokens, rafraîchissement serveur, rotation éventuelle, `invalid_grant`, révocation utilisateur, perte de scope, changement de mot de passe/politique, fermeture du compte et déconnexion demandée. Une erreur d’authentification durable met l’intégration en pause et bloque de nouveaux effets.

### 5.4 Gmail watches et Pub/Sub

Une watch est une ressource opérationnelle, pas un secret. Elle est toutefois liée à un credential et conserve : compte, dernier `historyId`, expiration, dernière notification, dernière synchronisation complète et état.

- renouveler avant expiration, avec une marge configurable ;
- vérifier les jetons/audiences de la push subscription selon la configuration retenue ;
- restreindre IAM du topic et de la subscription ;
- vérifier projet et nom de subscription attendus ;
- dédupliquer `messageId` ;
- ne jamais déduire le tenant de la seule adresse email contenue dans la notification ;
- effectuer une synchronisation périodique de secours.

## 6. Cycle de vie d’un secret

### 6.1 Création

- propriétaire et finalité documentés ;
- environnement explicite ;
- portée minimale ;
- responsable de rotation désigné ;
- date de création et, si disponible, expiration enregistrées ;
- valeur transmise par un canal sûr et jamais recopiée dans la documentation.

### 6.2 Utilisation

- résolution à la demande ;
- accès journalisé sans valeur ;
- usage limité au fournisseur et à l’opération autorisés ;
- aucune mise en cache longue non chiffrée ;
- santé et dernier usage mis à jour de façon non bloquante.

### 6.3 Rotation

Procédure générique :

1. créer une nouvelle version ;
2. la tester sur un contrôle de santé non destructif ;
3. basculer atomiquement la référence active ;
4. surveiller erreurs et métriques ;
5. révoquer l’ancienne version ;
6. documenter l’opération et son acteur.

Quand un fournisseur autorise deux clés simultanées, utiliser une rotation sans interruption. Sinon, planifier une pause maîtrisée. Les intervalles de rotation seront définis par classe de risque et capacité fournisseur.

### 6.4 Révocation et suppression

Déclencheurs : compromission, départ d’un membre, déconnexion tenant, fin de contrat, scope excessif, expiration ou inactivité selon politique.

Effets :

- désactiver immédiatement l’intégration ;
- empêcher la planification de nouvelles tâches ;
- annuler ou neutraliser les runs non encore exécutés ;
- révoquer chez le fournisseur lorsque possible ;
- supprimer la valeur chiffrée selon la politique de conservation ;
- conserver uniquement l’audit minimal autorisé ;
- vérifier qu’aucune copie ne subsiste dans logs ou sauvegardes au-delà des règles définies.

### 6.5 Compromission

1. révoquer/faire tourner le secret ;
2. limiter les accès et suspendre les intégrations concernées ;
3. rechercher les usages anormaux et tenants impactés ;
4. préserver les preuves sans diffuser le secret ;
5. appliquer le plan de réponse à incident et les notifications requises ;
6. corriger la cause ;
7. restaurer avec une nouvelle version ;
8. produire un rapport d’incident.

## 7. Redaction et observabilité

À masquer :

- en-têtes `Authorization`, cookies et sessions ;
- clés API et tokens OAuth ;
- codes d’autorisation et secrets webhook ;
- URL contenant une query sensible ;
- corps de requête/réponse fournisseur susceptible de répéter un token ;
- email, téléphone et contenu de message lorsque non nécessaires au diagnostic ;
- variables d’environnement et objets de configuration complets.

Les logs autorisés utilisent des valeurs masquées, hashes non réversibles lorsque nécessaire, `credentialRef`, identifiant fournisseur de requête, statut et corrélation. Un filtre de redaction est appliqué avant Sentry et avant les logs structurés, pas seulement dans l’interface de consultation.

## 8. Droits et séparation des responsabilités

| Rôle technique | Droits attendus |
|---|---|
| navigateur | aucun secret fournisseur ni clé privilégiée |
| Next.js serveur | secrets nécessaires aux opérations synchrones autorisées |
| Trigger.dev task | secrets/références strictement nécessaires à la tâche |
| CI pull request | aucun secret de production |
| CI déploiement protégé | secrets de déploiement minimaux, environnements approuvés |
| support | métadonnées et santé, jamais valeur du secret par défaut |
| administrateur sécurité | rotation/révocation auditée selon séparation des rôles |

L’accès à la plateforme d’hébergement ne doit pas automatiquement donner accès à tous les comptes fournisseurs. Les comptes propriétaires, méthodes MFA, récupération et comptes d’urgence doivent être documentés séparément.

## 9. Contrôles automatisés futurs

- secret scanning GitHub et blocage des commits détectés ;
- validation des variables obligatoires au démarrage sans afficher leur valeur ;
- tests garantissant qu’aucune clé serveur n’entre dans le bundle client ;
- tests de redaction des erreurs et traces ;
- tests RLS inter-tenant sur les métadonnées d’intégration ;
- tests d’autorisation sur la résolution de `credentialRef` ;
- alertes sur erreurs d’authentification, rotation proche et scopes modifiés ;
- inventaire des secrets orphelins ou non utilisés ;
- test de révocation et de reconnexion OAuth.

## 10. Comptes et configurations à créer plus tard

| Fournisseur | Prérequis administratifs |
|---|---|
| Supabase | organisation, projets par environnement, région, propriétaires, MFA, sauvegardes |
| Trigger.dev | organisation, projets/environnements, membres, secrets, quotas |
| Vercel | équipe, projets, environnements, domaines, droits de déploiement |
| GitHub | organisation/dépôt, protections, environnements, secret scanning |
| Groq | compte/projet, clé par environnement, budget et DPA |
| Apollo | plan API, clé, crédits, droits de données et DPA |
| Firecrawl | plan, clé, crédits, région/rétention et DPA |
| ZeroBounce | compte crédité, clé, endpoint régional et DPA |
| Resend | équipe, domaine, DNS, expéditeurs, clé et DPA |
| Google Cloud | organisation/projet, suivi des coûts fournisseur, APIs, OAuth, Pub/Sub, IAM, validation |
| Sentry | organisation/projets, membres, rétention, alertes et DPA |

## 11. Décisions bloquantes

- coffre/KMS retenu pour les credentials tenant ;
- régions de traitement et de stockage ;
- politique de rétention et suppression des tokens, messages et données fournisseurs ;
- scopes Gmail et Calendar exacts ;
- projet Google partagé ou séparé entre Gmail et Calendar ;
- exigences de vérification OAuth et d’évaluation de sécurité ;
- ownership, MFA, récupération et rotation de chaque compte fournisseur ;
- cadence de rotation par classe de secret ;
- politique d’accès support et d’accès d’urgence ;
- mécanisme de propagation sûre d’une rotation entre Vercel et Trigger.dev ;
- procédure légale et opérationnelle en cas de compromission.

## 12. Références officielles à revérifier

- [Google OAuth 2.0 pour applications serveur](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google OAuth 2.0 — bonnes pratiques](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)
- [Scopes Gmail](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Notifications push Gmail](https://developers.google.com/workspace/gmail/api/guides/push)
- [Supabase — sécurité des clés API](https://supabase.com/docs/guides/api/api-keys)
- [Trigger.dev — variables d’environnement](https://trigger.dev/docs/deploy-environment-variables)
- [Vercel — variables d’environnement](https://vercel.com/docs/environment-variables)

Les détails et catégories de scopes changent. La vérification de la documentation, des consoles et des contrats en vigueur est obligatoire avant création des credentials.
