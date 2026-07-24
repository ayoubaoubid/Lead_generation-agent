import type { StrategyFieldDefinition } from "@/validations/strategy/strategy-artifact.schema";

export const positioningFields = [
  {
    kind: "positioning_statement",
    label: "Énoncé de positionnement",
    description:
      "Pour qui, dans quelle catégorie, avec quelle valeur distinctive.",
    requiredForValidation: true,
  },
  {
    kind: "competitive_alternative",
    label: "Alternatives concurrentes",
    description: "Ce que le client ferait si cette solution n’existait pas.",
    requiredForValidation: true,
  },
  {
    kind: "unique_capability",
    label: "Capacités uniques",
    description: "Capacités démontrées que les alternatives ne proposent pas.",
    requiredForValidation: true,
  },
  {
    kind: "customer_value",
    label: "Valeur pour le client",
    description: "Bénéfices concrets rendus possibles par les capacités.",
    requiredForValidation: true,
  },
  {
    kind: "best_fit_segment",
    label: "Segments les plus adaptés",
    description: "Profils qui valorisent le plus cette différence.",
    requiredForValidation: true,
  },
  {
    kind: "market_category",
    label: "Catégorie de marché",
    description: "Contexte qui rend la valeur immédiatement compréhensible.",
    requiredForValidation: false,
  },
  {
    kind: "differentiator",
    label: "Différenciateurs",
    description: "Différences importantes, spécifiques et démontrables.",
    requiredForValidation: true,
  },
  {
    kind: "proof_point",
    label: "Points de preuve",
    description: "Sources qui soutiennent le positionnement.",
    requiredForValidation: false,
  },
  {
    kind: "excluded_segment",
    label: "Segments exclus",
    description: "Profils pour lesquels le positionnement ne convient pas.",
    requiredForValidation: false,
  },
] satisfies readonly StrategyFieldDefinition[];

export const offerFields = [
  {
    kind: "desired_result",
    label: "Résultats désirés",
    description: "Résultats précis recherchés par le client.",
    requiredForValidation: true,
  },
  {
    kind: "promise",
    label: "Promesses",
    description:
      "Transformation promise, sans présenter une hypothèse comme un fait.",
    requiredForValidation: true,
  },
  {
    kind: "timeline",
    label: "Délais",
    description: "Délai attendu ou hypothétique, clairement qualifié.",
    requiredForValidation: true,
  },
  {
    kind: "differentiator",
    label: "Différenciateurs",
    description: "Mécanismes qui augmentent la valeur perçue de l’offre.",
    requiredForValidation: true,
  },
  {
    kind: "obstacle",
    label: "Obstacles et effort",
    description: "Friction, effort ou sacrifices perçus par le client.",
    requiredForValidation: false,
  },
  {
    kind: "objection",
    label: "Objections",
    description: "Raisons explicites qui pourraient empêcher l’achat.",
    requiredForValidation: false,
  },
  {
    kind: "guarantee",
    label: "Garanties",
    description:
      "Uniquement les garanties expressément autorisées et prouvées.",
    requiredForValidation: false,
  },
  {
    kind: "bonus",
    label: "Bonus",
    description: "Éléments complémentaires répondant à un obstacle réel.",
    requiredForValidation: false,
  },
  {
    kind: "proof_point",
    label: "Preuves",
    description: "Éléments vérifiables qui augmentent la probabilité perçue.",
    requiredForValidation: false,
  },
] satisfies readonly StrategyFieldDefinition[];
