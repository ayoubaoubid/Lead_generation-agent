# Authentification

## Politique d’accès

L’application utilise Supabase Auth avec email et mot de passe, sessions SSR en cookies et flux PKCE. L’inscription publique est désactivée : un compte est créé uniquement par invitation depuis un environnement d’administration fiable.

L’Agency Owner invite désormais les Recruiters depuis `/settings`. La Server Action
vérifie `member.invite` et `member.assign_role` avant tout appel serveur à
`inviteUserByEmail`, puis la base valide chaque client affecté.

L’invitation Auth et l’affectation métier restent deux opérations distinctes : Auth
crée ou retrouve le compte, puis la RPC contrôlée crée les memberships Recruiter.

## Routes

| Route | Accès | Fonction |
|---|---|---|
| `/auth/sign-in` | public, invité | connexion email/mot de passe |
| `/auth/register` | public | explique le parcours invitation-only, sans `signUp` |
| `/auth/forgot-password` | public | demande de récupération avec réponse non énumérable |
| `/auth/callback` | public technique | échange un code PKCE contre une session |
| `/auth/confirm` | public technique | vérifie un `token_hash` d’email |
| `/auth/update-password` | session vérifiée | définit le mot de passe après invitation/récupération |
| `/auth/mfa` | session AAL1 avec facteur | challenge TOTP préparé pour l’activation future |
| `/account/profile` | session vérifiée | profil, changement de mot de passe et statut MFA |

Le Proxy Next.js renouvelle les cookies puis utilise `getClaims()` pour protéger les routes. Les pages et mutations sensibles appellent aussi `getUser()` afin d’obtenir un utilisateur à jour. `getSession()` n’est jamais utilisé comme preuve d’identité.

## Configuration locale

Variables nécessaires :

```text
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clé publishable locale>
APP_URL=http://localhost:3000
```

La clé `SUPABASE_SERVICE_ROLE_KEY` est requise uniquement par le service serveur
d’invitation. Elle n’est jamais importée dans un composant client.

`supabase/config.toml` configure :

- inscriptions générales et email désactivées ;
- mots de passe d’au moins 12 caractères avec majuscule, minuscule et chiffre ;
- URLs locales autorisées ;
- MFA TOTP désactivé mais sections de configuration conservées.

Les emails locaux sont capturés par Mailpit lorsque la pile Supabase locale est démarrée.

## Configuration du projet hébergé

Avant un test cloud :

1. désactiver les inscriptions publiques dans Authentication → Providers → Email ;
2. définir le Site URL avec l’origine exacte de l’application ;
3. autoriser explicitement les URLs `/auth/callback` et `/auth/confirm` ;
4. configurer un SMTP de production ;
5. personnaliser le template d’invitation pour diriger vers le flux de confirmation ou utiliser `inviteUserByEmail` avec `redirectTo` ;
6. conserver la clé secrète exclusivement dans l’environnement serveur ;
7. vérifier les limites Auth et ajouter CAPTCHA/rate limiting applicatif avant exposition publique à fort volume.

Exemple de lien PKCE pour une invitation envoyée ultérieurement par l’API Admin :

```text
https://app.example.com/auth/callback?next=/auth/update-password
```

Pour un template basé sur `token_hash`, la destination est :

```text
https://app.example.com/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/auth/update-password
```

## Sécurité

- Toutes les entrées sont validées côté serveur avec Zod.
- Les mots de passe ne sont jamais placés dans une URL, un état persistant ou un log.
- Les erreurs de connexion sont génériques.
- La récupération retourne toujours la même confirmation pour une adresse syntaxiquement valide.
- Les redirections n’acceptent que des chemins locaux et les callbacks utilisent une allowlist plus stricte.
- Le profil est lu et modifié sous la session utilisateur et la policy RLS `profiles_update_self`.
- Le changement de mot de passe depuis le profil exige le mot de passe actuel.
- Le challenge MFA revalide côté serveur que le facteur appartient à l’utilisateur et qu’il est vérifié.
- Le formulaire public n’appelle jamais `signUp` et aucune permission n’est lue depuis `user_metadata`.

## Préparation MFA

Le challenge TOTP et la détection AAL1/AAL2 sont implémentés, mais l’enrôlement reste désactivé. Pour activer MFA, il faudra encore :

1. valider la politique obligatoire ou optionnelle par rôle ;
2. activer enrollment et verification TOTP dans Supabase ;
3. ajouter l’écran d’enrôlement, QR code, récupération et désenrôlement ;
4. ajouter des policies RLS restrictives basées sur le niveau AAL pour les actions concernées ;
5. tester perte du facteur, récupération, révocation et session ancienne.
