import type { OnboardingSectionKey } from "@/domain/onboarding/onboarding";

export type OnboardingFieldConfig = Readonly<{
  name: string;
  label: string;
  kind: "text" | "textarea" | "list" | "url" | "number" | "date" | "select";
  placeholder?: string;
  hint?: string;
  optional?: boolean;
  options?: readonly Readonly<{ label: string; value: string }>[];
}>;

export type OnboardingSectionConfig = Readonly<{
  key: OnboardingSectionKey;
  title: string;
  shortTitle: string;
  description: string;
  fields: readonly OnboardingFieldConfig[];
}>;

export const onboardingSections: readonly OnboardingSectionConfig[] = [
  {
    key: "company_information",
    title: "Informations de l’entreprise",
    shortTitle: "Entreprise",
    description:
      "Posez le contexte factuel qui servira de référence aux analyses suivantes.",
    fields: [
      { name: "companyName", label: "Nom de l’entreprise", kind: "text" },
      {
        name: "websiteUrl",
        label: "Site web",
        kind: "url",
        optional: true,
        placeholder: "https://exemple.com",
      },
      { name: "industry", label: "Secteur", kind: "text" },
      {
        name: "countryCode",
        label: "Pays",
        kind: "text",
        optional: true,
        placeholder: "MA",
        hint: "Code ISO à deux lettres.",
      },
      {
        name: "employeeRange",
        label: "Taille de l’équipe",
        kind: "text",
        optional: true,
        placeholder: "11–50 personnes",
      },
      {
        name: "description",
        label: "Description factuelle",
        kind: "textarea",
        placeholder: "Activité, marché et contexte actuel.",
      },
    ],
  },
  {
    key: "products_services",
    title: "Produits et services",
    shortTitle: "Produits",
    description:
      "Décrivez ce qui est réellement vendu et comment la valeur est délivrée.",
    fields: [
      {
        name: "primaryProductsServices",
        label: "Produits et services principaux",
        kind: "list",
        hint: "Un élément par ligne.",
      },
      {
        name: "deliveryModel",
        label: "Mode de livraison",
        kind: "textarea",
        optional: true,
      },
      {
        name: "differentiators",
        label: "Différenciateurs démontrables",
        kind: "list",
        optional: true,
        hint: "N’ajoutez que des éléments pouvant être justifiés.",
      },
    ],
  },
  {
    key: "current_offer",
    title: "Offre actuelle",
    shortTitle: "Offre",
    description:
      "Formalisez l’offre existante sans encore demander à l’IA de la réécrire.",
    fields: [
      { name: "offerName", label: "Nom de l’offre", kind: "text" },
      { name: "offerSummary", label: "Résumé", kind: "textarea" },
      {
        name: "desiredOutcome",
        label: "Résultat recherché par le client",
        kind: "textarea",
      },
      {
        name: "includedItems",
        label: "Éléments inclus",
        kind: "list",
        optional: true,
      },
      {
        name: "guarantees",
        label: "Garanties actuellement autorisées",
        kind: "list",
        optional: true,
      },
    ],
  },
  {
    key: "pricing",
    title: "Prix",
    shortTitle: "Prix",
    description:
      "Renseignez le modèle commercial de l’offre. Ces données ne constituent pas un système de paiement.",
    fields: [
      { name: "pricingModel", label: "Modèle de prix", kind: "text" },
      {
        name: "currencyCode",
        label: "Devise",
        kind: "text",
        placeholder: "EUR",
      },
      {
        name: "minimumPrice",
        label: "Prix minimum",
        kind: "number",
        optional: true,
      },
      {
        name: "maximumPrice",
        label: "Prix maximum",
        kind: "number",
        optional: true,
      },
      {
        name: "pricingNotes",
        label: "Conditions et précisions",
        kind: "textarea",
        optional: true,
      },
    ],
  },
  {
    key: "existing_customers",
    title: "Clients existants",
    shortTitle: "Clients",
    description:
      "Identifiez les profils de clients déjà servis et les raisons observées de leur achat.",
    fields: [
      {
        name: "customerTypes",
        label: "Types de clients",
        kind: "list",
      },
      {
        name: "representativeCustomers",
        label: "Clients représentatifs",
        kind: "list",
        optional: true,
        hint: "Utilisez des noms partageables ou des descriptions anonymisées.",
      },
      {
        name: "buyingReasons",
        label: "Raisons d’achat observées",
        kind: "list",
        optional: true,
      },
    ],
  },
  {
    key: "customer_cases",
    title: "Cas clients",
    shortTitle: "Cas clients",
    description:
      "Documentez les situations, interventions et résultats sans extrapolation.",
    fields: [
      {
        name: "caseSummaries",
        label: "Résumés des cas",
        kind: "list",
        hint: "Un cas synthétique par ligne.",
      },
      {
        name: "measuredResults",
        label: "Résultats mesurés",
        kind: "list",
        optional: true,
      },
      {
        name: "sourceLinks",
        label: "Sources",
        kind: "list",
        optional: true,
        hint: "Une URL complète par ligne.",
      },
    ],
  },
  {
    key: "available_proofs",
    title: "Preuves disponibles",
    shortTitle: "Preuves",
    description: "Séparez les preuves disponibles de ce qui reste à démontrer.",
    fields: [
      { name: "proofTypes", label: "Types de preuves", kind: "list" },
      {
        name: "proofStatements",
        label: "Éléments prouvés",
        kind: "list",
      },
      {
        name: "sourceLinks",
        label: "Sources vérifiables",
        kind: "list",
        optional: true,
      },
      {
        name: "usageAuthorized",
        label: "Autorisation d’utilisation",
        kind: "select",
        options: [
          { label: "À confirmer", value: "unknown" },
          { label: "Autorisée", value: "yes" },
          { label: "Non autorisée", value: "no" },
        ],
      },
    ],
  },
  {
    key: "competitors",
    title: "Concurrents",
    shortTitle: "Concurrents",
    description:
      "Cartographiez les concurrents directs et les alternatives réellement utilisées.",
    fields: [
      {
        name: "directCompetitors",
        label: "Concurrents directs",
        kind: "list",
      },
      { name: "alternatives", label: "Alternatives", kind: "list" },
      {
        name: "strengths",
        label: "Forces observées",
        kind: "list",
        optional: true,
      },
      {
        name: "weaknesses",
        label: "Faiblesses observées",
        kind: "list",
        optional: true,
      },
    ],
  },
  {
    key: "problems_solved",
    title: "Problèmes résolus",
    shortTitle: "Problèmes",
    description:
      "Décrivez les problèmes récurrents, leurs impacts et les solutions actuelles.",
    fields: [
      { name: "problems", label: "Problèmes récurrents", kind: "list" },
      {
        name: "businessImpacts",
        label: "Impacts métier",
        kind: "list",
      },
      {
        name: "urgencySignals",
        label: "Signaux d’urgence",
        kind: "list",
        optional: true,
      },
      {
        name: "currentWorkarounds",
        label: "Contournements actuels",
        kind: "list",
        optional: true,
      },
    ],
  },
  {
    key: "sales_process",
    title: "Processus commercial",
    shortTitle: "Vente",
    description:
      "Capturez le processus réellement suivi et les objections rencontrées.",
    fields: [
      { name: "stages", label: "Étapes du processus", kind: "list" },
      {
        name: "averageCycleDays",
        label: "Cycle moyen en jours",
        kind: "number",
        optional: true,
      },
      {
        name: "salesTeamRoles",
        label: "Rôles impliqués",
        kind: "list",
        optional: true,
      },
      {
        name: "commonObjections",
        label: "Objections fréquentes",
        kind: "list",
        optional: true,
      },
    ],
  },
  {
    key: "target_markets",
    title: "Marchés ciblés",
    shortTitle: "Marchés",
    description:
      "Délimitez les marchés visés et les segments explicitement exclus.",
    fields: [
      { name: "industries", label: "Secteurs", kind: "list" },
      { name: "countries", label: "Pays", kind: "list" },
      {
        name: "companySizes",
        label: "Tailles d’entreprise",
        kind: "list",
        optional: true,
      },
      {
        name: "languages",
        label: "Langues",
        kind: "list",
        optional: true,
      },
      {
        name: "excludedSegments",
        label: "Segments exclus",
        kind: "list",
        optional: true,
      },
    ],
  },
  {
    key: "objectives",
    title: "Objectifs",
    shortTitle: "Objectifs",
    description:
      "Définissez le résultat attendu et les métriques qui permettront de l’évaluer.",
    fields: [
      {
        name: "primaryObjective",
        label: "Objectif principal",
        kind: "textarea",
      },
      {
        name: "successMetrics",
        label: "Métriques de réussite",
        kind: "list",
      },
      {
        name: "targetDate",
        label: "Date cible",
        kind: "date",
        optional: true,
      },
      {
        name: "constraints",
        label: "Contraintes",
        kind: "list",
        optional: true,
      },
    ],
  },
  {
    key: "existing_channels",
    title: "Canaux existants",
    shortTitle: "Canaux",
    description:
      "Inventoriez les canaux déjà utilisés et les résultats réellement observés.",
    fields: [
      { name: "activeChannels", label: "Canaux actifs", kind: "list" },
      {
        name: "pastChannels",
        label: "Canaux passés",
        kind: "list",
        optional: true,
      },
      {
        name: "observedResults",
        label: "Résultats observés",
        kind: "list",
        optional: true,
      },
      {
        name: "channelConstraints",
        label: "Contraintes par canal",
        kind: "list",
        optional: true,
      },
    ],
  },
  {
    key: "available_integrations",
    title: "Intégrations disponibles",
    shortTitle: "Intégrations",
    description:
      "Recensez les systèmes disponibles. Aucune connexion n’est lancée pendant l’onboarding.",
    fields: [
      {
        name: "crmSystems",
        label: "CRM",
        kind: "list",
        optional: true,
      },
      { name: "emailSystems", label: "Systèmes email", kind: "list" },
      {
        name: "calendarSystems",
        label: "Calendriers",
        kind: "list",
        optional: true,
      },
      {
        name: "dataSources",
        label: "Sources de données",
        kind: "list",
        optional: true,
      },
      {
        name: "integrationNotes",
        label: "Précisions",
        kind: "textarea",
        optional: true,
      },
    ],
  },
];

export function getOnboardingSectionConfig(step: number) {
  return onboardingSections[Math.min(Math.max(step, 1), 14) - 1]!;
}
