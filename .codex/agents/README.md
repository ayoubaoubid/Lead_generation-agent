# Agents IA

`catalog.v1.json` est conservé comme historique du premier catalogue.
`catalog.v2.json` est le catalogue actif : il documente les skills et les
capacités opérationnelles explicitement autorisés pour chaque agent.

Une capacité d’agent est une analyse ou une production probabiliste. Elle ne
doit pas être confondue avec un service déterministe comme la déduplication, la
vérification d’un email, l’arrêt d’une séquence ou l’envoi.

Un agent :

1. reçoit un contexte tenant déjà résolu ;
2. ne choisit qu’un skill ou une capacité explicitement autorisé ;
3. ne reçoit pas de secret dans son prompt ;
4. ne déclenche aucun effet externe sans workflow déterministe et validation ;
5. produit une sortie structurée, validée et traçable ;
6. distingue les faits confirmés, les inférences, les hypothèses et les données
   manquantes.
