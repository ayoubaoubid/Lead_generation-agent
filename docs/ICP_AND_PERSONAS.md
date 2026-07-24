# ICP et Personas

## Objectif

Les modules ICP et Personas structurent le ciblage du client actif sans
transformer des suppositions en faits. Ils appliquent les principes de recherche
non biaisée du skill **Mom Test** : partir des comportements et observations
disponibles, isoler les hypothèses et rendre les preuves manquantes explicites.

## Modèle et cycle de vie

Un profil `targeting_profiles` représente un ICP ou un persona. Son contenu est
stocké dans des snapshots immuables `targeting_versions`.

```text
brouillon → validation humaine → activation facultative
     ↘ nouvelle version depuis le dernier snapshot
     ↘ duplication vers un nouveau profil
profil → archivage contrôlé
```

- Un profil possède au maximum un brouillon.
- Une version validée est immuable.
- L’activation exige que la dernière version soit validée et qu’aucun brouillon
  ne soit ouvert.
- Une duplication crée un nouveau profil et conserve la version source.
- L’archivage conserve tout l’historique et interdit les nouvelles mutations.
- Une proposition IA est toujours créée avec les statuts `draft` et `inactive`.

## Contrat ICP

Le snapshot ICP contient :

- secteurs, pays, tailles d’entreprise et effectifs ;
- chiffre d’affaires et budget avec bornes et devise ISO ;
- technologies et niveaux de maturité ;
- problèmes, signaux d’intention et exclusions ;
- poids de scoring par critère ;
- raisonnement, hypothèses et preuves manquantes.

La validation humaine exige au moins un critère de ciblage, un problème et des
poids uniques dont la somme vaut exactement 100.

## Contrat Persona

Le snapshot persona contient :

- postes, départements et niveaux hiérarchiques ;
- responsabilités, objectifs, problèmes et objections ;
- pouvoir de décision ;
- rôles dans l’achat et canaux préférés ;
- raisonnement, hypothèses et preuves manquantes.

La validation humaine exige au moins un poste, un problème ou objectif, et un
rôle dans l’achat. La valeur `unknown` est volontairement disponible pour le
pouvoir de décision afin d’éviter une invention.

## Proposition IA

L’utilisateur autorisé fournit un contexte observé et un objectif. L’adaptateur
Groq :

1. traite le texte utilisateur comme une donnée non fiable ;
2. applique le prompt `targeting-mom-test-v1` ;
3. demande une sortie JSON stricte propre au type de profil ;
4. valide la réponse avec Zod ;
5. calcule le coût technique depuis les tokens et la grille versionnée ;
6. persiste une seule proposition comme brouillon inactif.

Les métadonnées enregistrées incluent l’identifiant d’exécution, le modèle,
les versions du skill et du prompt, les tokens, le coût en micro-USD et la
version tarifaire. Le secret Groq ne quitte jamais le serveur.

Variables :

```text
LLM_PROVIDER=groq
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
```

Sans `GROQ_API_KEY`, la création manuelle reste disponible et la proposition IA
retourne une erreur de configuration propre.

## Autorisation et isolation

Permissions atomiques :

| Permission | Responsabilité |
|---|---|
| `targeting.read` | consulter les profils et versions du client autorisé |
| `targeting.write` | créer, modifier, versionner, dupliquer et archiver |
| `targeting.validate` | valider humainement et activer |
| `targeting.propose` | demander et persister une proposition IA |

Le serveur résout l’agence et le client depuis la session et les cookies
HTTP-only, puis vérifie memberships et permissions. Les RPC revalident encore
le tenant réel. Les tables :

- activent RLS ;
- n’accordent que `SELECT` à `authenticated` ;
- refusent toute mutation directe ;
- filtrent les lectures avec `private.has_permission`;
- imposent des clés étrangères composites agence/client.

Les identifiants `agency_id`, `client_id`, profil et version reçus d’un formulaire
ne sont jamais considérés comme une preuve d’accès.

## Audit et tests

Les créations, sauvegardes, validations, activations, duplications, propositions
IA et archivages sont écrits dans `audit_logs`.

Les tests couvrent :

- contrats Zod et règles de validation ;
- séparation `write`, `validate` et `propose` ;
- sortie fournisseur malformée ;
- RLS agence A/agence B et client A/client B ;
- rejet d’identifiants falsifiés ;
- interdiction des mutations directes ;
- immutabilité des versions validées ;
- persistance de la provenance IA et absence d’activation automatique.

Migration de référence :
`supabase/migrations/20260724172119_implement_icp_and_personas.sql`.
