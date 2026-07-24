# Module Onboarding

## Périmètre

Le module collecte les informations commerciales du client actif avant la création
du positionnement, de l’offre, de l’ICP et des personas. Il reste strictement
client-scoped : l’agence et le client sont résolus depuis les cookies HttpOnly puis
revalidés avec la session, les memberships et les permissions persistées.

Le parcours contient quatorze sections :

1. informations de l’entreprise ;
2. produits et services ;
3. offre actuelle ;
4. prix de l’offre commerciale ;
5. clients existants ;
6. cas clients ;
7. preuves disponibles ;
8. concurrents ;
9. problèmes résolus ;
10. processus commercial ;
11. marchés ciblés ;
12. objectifs ;
13. canaux existants ;
14. intégrations disponibles.

Les prix renseignés décrivent l’offre du client. Ils ne créent aucun paiement,
checkout, abonnement ou mécanisme de facturation dans la plateforme.

## Architecture

```text
Page `/strategy/onboarding`
→ Server Action ou query serveur
→ résolution du client actif et des permissions
→ OnboardingService
→ OnboardingRepository
→ SupabaseOnboardingRepository
→ RLS pour la lecture / RPC auditables pour les mutations
```

Les mutations ne transmettent pas d’`agencyId`, de `clientId` ou de `sessionId`
depuis le formulaire. Ces identifiants sont reconstruits côté serveur, puis les RPC
refont les mêmes contrôles avant toute écriture.

## Modèle de données

- `onboarding_sessions` conserve le statut, l’étape de reprise, la complétude et les
  informations de validation ;
- `onboarding_answers` conserve la dernière réponse structurée de chaque section ;
- `onboarding_answer_history` conserve un snapshot append-only par révision.

Une seule session existe par client. Les réponses utilisent `jsonb` afin de préserver
un schéma structuré par section sans créer une table par formulaire. Zod valide et
normalise chaque champ côté serveur ; PostgreSQL impose en plus le type objet, une
taille maximale, l’unicité des sections et la cohérence tenant.

Les écritures sont atomiques :

1. vérification de l’identité et de `onboarding.write` ;
2. vérification du client réel et de son état ;
3. création ou reprise de la session ;
4. sauvegarde de la réponse et incrément de révision si elle a changé ;
5. ajout du snapshot d’historique ;
6. recalcul du nombre d’étapes complètes ;
7. ajout de l’audit sans copier le contenu commercial dans `audit_logs`.

## Cycle de vie

```text
draft
  → completed
  → validated
```

- une sauvegarde partielle reste `draft` ;
- une étape ne devient complète qu’après validation de ses champs obligatoires ;
- `completed` exige exactement quatorze étapes complètes ;
- `validated` exige `onboarding.validate` et une session `completed` ;
- une version `validated` est verrouillée et ne peut plus être modifiée.

Modifier une session `completed` avant sa validation la ramène en `draft`. Une future
fonction de nouvelle version ou de réouverture devra être conçue explicitement ; elle
n’est pas simulée dans ce lot.

## Permissions

| Permission | Usage |
|---|---|
| `onboarding.read` | lire session, réponses et historique |
| `onboarding.write` | sauvegarder les étapes et soumettre l’onboarding |
| `onboarding.validate` | valider une session terminée |

Le provisionnement actuel attribue ces nouvelles permissions aux rôles
administrateurs qui reçoivent toutes les permissions de leur scope : Agency Owner,
Agency Admin et Client Admin. L’extension à Reviewer ou à d’autres rôles doit être
une décision RBAC explicite.

Les contrôles UI améliorent l’expérience, mais les actions serveur, le service, les
RPC et RLS restent les barrières d’autorisation.

## Préparation des skills

Une transformation déterministe prépare cinq contextes :

- Mom Test ;
- Four Steps ;
- Obviously Awesome ;
- 100M Offers ;
- 100M Leads.

Chaque contexte contient uniquement les sections complètes nécessaires au skill,
l’identifiant de la session source et le statut `completed` ou `validated`. Les
contenus restent des données non fiables pour un futur agent : ils ne sont jamais
convertis en instructions.

Ce lot ne crée aucun run IA, aucune tâche Trigger.dev, aucun prompt et aucune sortie
générée. Un futur workflow devra vérifier de nouveau le tenant, utiliser une sortie
structurée, conserver la version du skill et imposer une validation humaine.

## Audit

Les événements suivants sont append-only :

- `onboarding.step_saved` ;
- `onboarding.completed` ;
- `onboarding.validated`.

L’audit conserve section, révision, état de complétude et compteur, mais ne duplique
pas les réponses commerciales. L’historique détaillé reste dans
`onboarding_answer_history`, protégé par RLS.

## Tests

- validation Zod des brouillons, champs requis, listes et prix ;
- préparation des cinq contextes sans réponse incomplète ;
- services refusant un scope agence ou une permission absente ;
- pgTAP pour RLS agence A/B, identifiant falsifié, écritures directes refusées,
  historique, complétude, validation, verrouillage et audit.

Commandes locales :

```powershell
npm run supabase:start
npm run db:reset
npm run db:test
npm test
npm run typecheck
npm run lint
npm run build
```

Aucune migration distante n’est appliquée automatiquement.
