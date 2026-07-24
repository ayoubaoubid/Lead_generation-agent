# Agents IA

`catalog.v1.json` documente les agents préparés, leur mission et leur allowlist de
skills. Cette allowlist ne remplace pas l’autorisation serveur du membre actif.

Un agent :

1. reçoit un contexte tenant déjà résolu ;
2. ne choisit qu’un skill explicitement autorisé ;
3. ne reçoit pas de secret dans son prompt ;
4. ne déclenche aucun effet externe sans workflow déterministe et validation ;
5. produit une sortie Zod-validée et une trace technique.
