import {
  BarChart3,
  Blocks,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ContactRound,
  Gauge,
  Inbox,
  Layers3,
  Lightbulb,
  ListFilter,
  Megaphone,
  Settings,
  ShieldCheck,
  Shapes,
  Target,
  Upload,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type WorkspaceSection = Readonly<{
  key: string;
  label: string;
  href: `/${string}`;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  scope: "agency" | "client";
  icon: LucideIcon;
}>;

export const workspaceSections = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    description:
      "Vue de pilotage de l’activité, alimentée uniquement par les données réelles du workspace.",
    emptyTitle: "Votre espace de pilotage est prêt",
    emptyDescription:
      "Les indicateurs apparaîtront ici lorsque les premiers workflows métier auront produit des données.",
    scope: "client",
    icon: Gauge,
  },
  {
    key: "clients",
    label: "Clients",
    href: "/clients",
    description:
      "Administration des espaces clients rattachés à l’agence active.",
    emptyTitle: "Aucun client à afficher",
    emptyDescription:
      "Les espaces clients autorisés apparaîtront ici après leur création et leur affectation.",
    scope: "agency",
    icon: BriefcaseBusiness,
  },
  {
    key: "strategy",
    label: "Strategy",
    href: "/strategy",
    description:
      "Cadre stratégique et éléments de positionnement du client actif.",
    emptyTitle: "La stratégie n’est pas encore renseignée",
    emptyDescription:
      "Cet espace accueillera le positionnement validé et ses éléments de contexte.",
    scope: "client",
    icon: Lightbulb,
  },
  {
    key: "offers",
    label: "Offers",
    href: "/offers",
    description:
      "Catalogue des offres utilisées pour construire les campagnes de prospection.",
    emptyTitle: "Aucune offre configurée",
    emptyDescription:
      "Les offres du client actif seront disponibles ici dès leur configuration.",
    scope: "client",
    icon: Shapes,
  },
  {
    key: "icp-personas",
    label: "ICP & Personas",
    href: "/icp-personas",
    description:
      "Définition des entreprises cibles et des interlocuteurs prioritaires.",
    emptyTitle: "Aucun profil cible défini",
    emptyDescription:
      "Les ICP et personas validés seront regroupés dans cet espace.",
    scope: "client",
    icon: Target,
  },
  {
    key: "companies",
    label: "Companies",
    href: "/companies",
    description:
      "Référentiel des entreprises découvertes, importées ou enrichies.",
    emptyTitle: "Aucune entreprise disponible",
    emptyDescription:
      "Les entreprises autorisées du client actif apparaîtront ici.",
    scope: "client",
    icon: Building2,
  },
  {
    key: "contacts",
    label: "Contacts",
    href: "/contacts",
    description:
      "Référentiel des contacts professionnels et de leur provenance.",
    emptyTitle: "Aucun contact disponible",
    emptyDescription:
      "Les contacts importés ou enrichis seront affichés avec leur provenance.",
    scope: "client",
    icon: ContactRound,
  },
  {
    key: "imports",
    label: "Imports",
    href: "/imports",
    description:
      "Prévisualisation, mapping et suivi des imports CSV du client actif.",
    emptyTitle: "Aucun import",
    emptyDescription:
      "Les imports CSV et leurs rapports d’erreurs apparaîtront ici.",
    scope: "client",
    icon: Upload,
  },
  {
    key: "leads",
    label: "Leads",
    href: "/leads",
    description:
      "Qualification des prospects retenus pour les opérations commerciales.",
    emptyTitle: "Aucun lead qualifié",
    emptyDescription:
      "Les prospects validés pour le client actif seront centralisés ici.",
    scope: "client",
    icon: UsersRound,
  },
  {
    key: "segments",
    label: "Segments",
    href: "/segments",
    description:
      "Organisation des audiences selon les critères de ciblage validés.",
    emptyTitle: "Aucun segment créé",
    emptyDescription:
      "Les audiences enregistrées apparaîtront ici après leur définition.",
    scope: "client",
    icon: ListFilter,
  },
  {
    key: "campaigns",
    label: "Campaigns",
    href: "/campaigns",
    description:
      "Préparation, validation et pilotage des campagnes de prospection.",
    emptyTitle: "Aucune campagne disponible",
    emptyDescription:
      "Les brouillons et campagnes validées seront présentés dans cet espace.",
    scope: "client",
    icon: Megaphone,
  },
  {
    key: "inbox",
    label: "Inbox",
    href: "/inbox",
    description:
      "Centralisation des réponses et préparation de leur traitement.",
    emptyTitle: "La boîte de réception est vide",
    emptyDescription:
      "Les réponses synchronisées et autorisées apparaîtront ici.",
    scope: "client",
    icon: Inbox,
  },
  {
    key: "meetings",
    label: "Meetings",
    href: "/meetings",
    description: "Suivi des rendez-vous issus des conversations commerciales.",
    emptyTitle: "Aucun rendez-vous planifié",
    emptyDescription:
      "Les rendez-vous confirmés seront regroupés dans cet espace.",
    scope: "client",
    icon: CalendarDays,
  },
  {
    key: "pipeline",
    label: "Pipeline",
    href: "/pipeline",
    description: "Suivi structuré des opportunités et de leur progression.",
    emptyTitle: "Le pipeline est vide",
    emptyDescription:
      "Les opportunités créées à partir de signaux validés apparaîtront ici.",
    scope: "client",
    icon: Layers3,
  },
  {
    key: "analytics",
    label: "Analytics",
    href: "/analytics",
    description:
      "Analyses fondées sur les données réelles et attribuées au bon tenant.",
    emptyTitle: "Aucune analyse disponible",
    emptyDescription:
      "Les rapports seront calculés lorsque des données métier vérifiées seront disponibles.",
    scope: "client",
    icon: BarChart3,
  },
  {
    key: "integrations",
    label: "Integrations",
    href: "/integrations",
    description:
      "Configuration des connexions externes autorisées pour le workspace.",
    emptyTitle: "Aucune intégration configurée",
    emptyDescription:
      "Les connexions actives et leur état seront affichés ici.",
    scope: "client",
    icon: Blocks,
  },
  {
    key: "compliance",
    label: "Compliance",
    href: "/compliance",
    description:
      "Finalités, conservation, oppositions, suppressions et demandes relatives aux données.",
    emptyTitle: "Configuration juridique à compléter",
    emptyDescription:
      "La base juridique et la conservation doivent être validées selon les pays et canaux utilisés.",
    scope: "client",
    icon: ShieldCheck,
  },
  {
    key: "settings",
    label: "Settings",
    href: "/settings",
    description:
      "Paramètres du workspace, accès et préférences opérationnelles.",
    emptyTitle: "Aucun paramètre métier à configurer",
    emptyDescription:
      "Les réglages seront ajoutés progressivement avec les modules concernés.",
    scope: "agency",
    icon: Settings,
  },
] as const satisfies readonly WorkspaceSection[];

export type WorkspaceSectionKey = (typeof workspaceSections)[number]["key"];

export const workspaceNavigationGroups = [
  {
    label: "Pilotage",
    sectionKeys: ["dashboard", "clients", "strategy", "offers", "icp-personas"],
  },
  {
    label: "Données",
    sectionKeys: ["companies", "contacts", "imports", "leads", "segments"],
  },
  {
    label: "Engagement",
    sectionKeys: ["campaigns", "inbox", "meetings", "pipeline"],
  },
  {
    label: "Système",
    sectionKeys: ["analytics", "integrations", "compliance", "settings"],
  },
] as const;

export function getWorkspaceSection(
  key: WorkspaceSectionKey,
): (typeof workspaceSections)[number] {
  const section = workspaceSections.find((candidate) => candidate.key === key);

  if (!section) {
    throw new Error(`Unknown workspace section: ${key}`);
  }

  return section;
}

export function getWorkspaceSectionByPath(
  pathname: string,
): (typeof workspaceSections)[number] | undefined {
  return workspaceSections.find(
    (section) =>
      pathname === section.href || pathname.startsWith(`${section.href}/`),
  );
}

export function getWorkspaceBreadcrumbs(
  pathname: string,
): readonly Readonly<{ label: string; href?: string }>[] {
  const section = getWorkspaceSectionByPath(pathname);

  if (!section || section.key === "dashboard") {
    return [{ label: "Dashboard" }];
  }

  return [{ label: "Dashboard", href: "/dashboard" }, { label: section.label }];
}
