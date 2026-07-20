"use client";

import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  Copy,
  Ellipsis,
  Moon,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { useState } from "react";

import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  DataTable,
  Dialog,
  DialogClose,
  Drawer,
  Dropdown,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  LoadingState,
  MetricCard,
  PageHeader,
  Pagination,
  RadioGroup,
  Select,
  StatusIndicator,
  Switch,
  Tabs,
  Textarea,
  Toast,
  ToastProvider,
  ToastViewport,
  Tooltip,
  type DataTableColumn,
} from "@/components/ui";

type ExampleRow = {
  id: string;
  contact: string;
  company: string;
  status: string;
  score: string;
};
const rows: ExampleRow[] = [
  {
    id: "1",
    contact: "Nora Benali",
    company: "Northstar Labs",
    status: "Qualifié",
    score: "92",
  },
  {
    id: "2",
    contact: "Lucas Meyer",
    company: "Forma Studio",
    status: "À vérifier",
    score: "78",
  },
  {
    id: "3",
    contact: "Maya Laurent",
    company: "Arc Systems",
    status: "Enrichi",
    score: "84",
  },
];
const columns: DataTableColumn<ExampleRow>[] = [
  {
    key: "contact",
    header: "Contact",
    sortable: true,
    render: (row) => (
      <div className="demo-person">
        <Avatar name={row.contact} size="sm" />
        <span>
          <strong>{row.contact}</strong>
          <small>{row.company}</small>
        </span>
      </div>
    ),
  },
  {
    key: "status",
    header: "Statut",
    sortable: true,
    render: (row) => (
      <StatusIndicator
        label={row.status}
        status={
          row.status === "Qualifié"
            ? "active"
            : row.status === "À vérifier"
              ? "pending"
              : "paused"
        }
      />
    ),
  },
  {
    key: "score",
    header: "Score",
    sortable: true,
    align: "right",
    render: (row) => <strong className="demo-score">{row.score}</strong>,
  },
];
const palette: ReadonlyArray<readonly [string, string]> = [
  ["Canvas", "var(--canvas)"],
  ["Surface", "var(--surface)"],
  ["Ink", "var(--ink)"],
  ["Brand", "var(--brand)"],
  ["Success", "var(--success)"],
  ["Warning", "var(--warning)"],
  ["Danger", "var(--danger)"],
];

export function DesignSystemDemo() {
  const [dark, setDark] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [page, setPage] = useState(2);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
  };

  return (
    <ToastProvider swipeDirection="right">
      <div className="demo-shell">
        <aside className="demo-sidebar">
          <a className="demo-mark" href="#top" aria-label="Haut de la page">
            <span>LS</span>
            <strong>Orbit</strong>
          </a>
          <nav aria-label="Navigation du design system">
            <a href="#foundations">Fondations</a>
            <a href="#actions">Actions</a>
            <a href="#forms">Formulaires</a>
            <a href="#overlays">Superpositions</a>
            <a href="#data">Données</a>
            <a href="#feedback">Feedback</a>
          </nav>
          <div className="demo-sidebar-note">
            <Sparkles aria-hidden size={15} />
            <span>
              <strong>Interface v1.0</strong>Usage interne
            </span>
          </div>
        </aside>
        <main className="demo-main" id="top">
          <div className="demo-topbar">
            <Badge tone="brand">Design system</Badge>
            <div>
              <Tooltip content="Basculer le thème">
                <Button
                  aria-label="Basculer le thème"
                  onClick={toggleTheme}
                  size="icon"
                  variant="ghost"
                >
                  {dark ? (
                    <Sun aria-hidden size={17} />
                  ) : (
                    <Moon aria-hidden size={17} />
                  )}
                </Button>
              </Tooltip>
              <Avatar name="Amine Rahal" status="online" />
            </div>
          </div>
          <PageHeader
            eyebrow="Orbit Interface"
            title="Clair dans l’intention. Précis dans l’exécution."
            description="Un langage visuel compact et humain pour les opérations complexes de la plateforme. Les composants ci-dessous sont une référence interne, pas un écran métier."
            actions={
              <>
                <Button
                  iconLeading={<Copy aria-hidden size={15} />}
                  variant="secondary"
                >
                  Copier les tokens
                </Button>
                <Button iconLeading={<Plus aria-hidden size={15} />}>
                  Nouveau
                </Button>
              </>
            }
          />

          <section className="demo-section" id="foundations">
            <SectionHeading
              index="01"
              title="Fondations"
              description="Une neutralité chaude pour réduire la fatigue, un indigo net pour guider l’action et des couleurs sémantiques réservées aux événements importants."
            />
            <Card className="demo-foundations">
              <div className="demo-palette">
                {palette.map(([name, color]) => (
                  <div key={name}>
                    <span
                      className="demo-swatch"
                      style={{ background: color }}
                    />
                    <small>{name}</small>
                    <code>{color.replace("var(--", "").replace(")", "")}</code>
                  </div>
                ))}
              </div>
              <div className="demo-type">
                <p className="demo-display">
                  La prospection,
                  <br />
                  <em>avec discernement.</em>
                </p>
                <div>
                  <p>
                    <strong>Heading / 690</strong>
                    <br />
                    Des décisions rapides, sans perdre le contexte.
                  </p>
                  <p>
                    <strong>Body / 400</strong>
                    <br />
                    Une lecture stable dans les interfaces denses, avec une
                    hiérarchie explicite et peu de bruit.
                  </p>
                  <code>MONO 12 — correlation_id: 8F42A</code>
                </div>
              </div>
            </Card>
          </section>

          <section className="demo-section" id="actions">
            <SectionHeading
              index="02"
              title="Actions & identité"
              description="Les actions principales restent rares. Le contraste, la taille et le libellé doivent suffire sans effets décoratifs."
            />
            <div className="demo-grid demo-grid--2">
              <Card className="demo-block">
                <BlockTitle title="Button" subtitle="4 variantes · 4 tailles" />
                <div className="demo-row">
                  <Button>Continuer</Button>
                  <Button variant="secondary">Enregistrer</Button>
                  <Button variant="ghost">Annuler</Button>
                  <Button variant="danger">Supprimer</Button>
                </div>
                <div className="demo-row">
                  <Button loading>Traitement</Button>
                  <Button disabled>Désactivé</Button>
                  <Button
                    iconLeading={<Send aria-hidden size={15} />}
                    size="sm"
                  >
                    Envoyer
                  </Button>
                  <Button
                    aria-label="Plus d’options"
                    size="icon"
                    variant="secondary"
                  >
                    <Ellipsis aria-hidden size={17} />
                  </Button>
                </div>
              </Card>
              <Card className="demo-block">
                <BlockTitle
                  title="Badge, Avatar & Status"
                  subtitle="Identité et signaux compacts"
                />
                <div className="demo-row">
                  <Badge>Neutre</Badge>
                  <Badge tone="brand">Nouveau</Badge>
                  <Badge tone="success">Validé</Badge>
                  <Badge tone="warning">Attention</Badge>
                  <Badge tone="danger">Bloqué</Badge>
                </div>
                <div className="demo-row">
                  <Avatar name="Nora Benali" size="lg" status="online" />
                  <Avatar name="Lucas Meyer" status="away" />
                  <Avatar name="Maya Laurent" size="sm" />
                  <StatusIndicator label="Opérationnel" status="active" />
                  <StatusIndicator label="En pause" status="paused" />
                </div>
              </Card>
            </div>
          </section>

          <section className="demo-section" id="forms">
            <SectionHeading
              index="03"
              title="Formulaires"
              description="Chaque champ possède un nom accessible, une aide concise et un état d’erreur visible qui ne dépend jamais de la couleur seule."
            />
            <Card className="demo-form-card">
              <div className="demo-form-grid">
                <FormField
                  htmlFor="email"
                  hint="Utilisé uniquement pour les notifications opérationnelles."
                  label="Adresse professionnelle"
                >
                  <Input
                    id="email"
                    placeholder="nom@entreprise.com"
                    type="email"
                  />
                </FormField>
                <FormField label="Segment">
                  <Select
                    ariaLabel="Segment"
                    defaultValue="saas"
                    options={[
                      { label: "SaaS B2B", value: "saas" },
                      { label: "Cabinets de conseil", value: "consulting" },
                      { label: "Industrie", value: "industry" },
                    ]}
                  />
                </FormField>
                <FormField
                  error="Le message doit contenir au moins 20 caractères."
                  htmlFor="message"
                  label="Message"
                >
                  <Textarea id="message" invalid defaultValue="Trop court" />
                </FormField>
                <div className="demo-stack">
                  <Checkbox
                    defaultChecked
                    description="Une validation sera demandée avant l’envoi."
                    label="Validation humaine"
                  />
                  <Switch
                    defaultChecked
                    description="Suspend les traitements hors horaires."
                    label="Fenêtre de sécurité"
                  />
                  <RadioGroup
                    defaultValue="balanced"
                    label="Densité"
                    options={[
                      { label: "Confortable", value: "comfortable" },
                      { label: "Équilibrée", value: "balanced" },
                      { label: "Compacte", value: "compact", disabled: true },
                    ]}
                  />
                </div>
              </div>
            </Card>
          </section>

          <section className="demo-section" id="overlays">
            <SectionHeading
              index="04"
              title="Navigation & superpositions"
              description="Le focus est piégé dans les modales, rendu au déclencheur à la fermeture, et chaque menu se pilote au clavier."
            />
            <div className="demo-grid demo-grid--2">
              <Card className="demo-block">
                <BlockTitle
                  title="Tooltip & Dropdown"
                  subtitle="Contexte à la demande"
                />
                <div className="demo-row">
                  <Tooltip content="Rechercher dans la vue (⌘K)">
                    <Button
                      iconLeading={<Search aria-hidden size={15} />}
                      variant="secondary"
                    >
                      Rechercher
                    </Button>
                  </Tooltip>
                  <Dropdown
                    trigger={
                      <Button
                        iconTrailing={<Ellipsis aria-hidden size={15} />}
                        variant="secondary"
                      >
                        Actions
                      </Button>
                    }
                    items={[
                      {
                        label: "Configurer",
                        icon: <Settings2 aria-hidden size={15} />,
                        shortcut: "⌘,",
                      },
                      {
                        label: "Dupliquer",
                        icon: <Copy aria-hidden size={15} />,
                        shortcut: "⌘D",
                      },
                      { separator: true },
                      { label: "Archiver", danger: true },
                    ]}
                  />
                </div>
              </Card>
              <Card className="demo-block">
                <BlockTitle
                  title="Dialog & Drawer"
                  subtitle="Décisions et contexte secondaire"
                />
                <div className="demo-row">
                  <Dialog
                    trigger={
                      <Button variant="secondary">Ouvrir le dialog</Button>
                    }
                    title="Confirmer la modification"
                    description="Cette démonstration ne déclenche aucune action métier."
                    footer={
                      <>
                        <DialogClose asChild>
                          <Button variant="ghost">Annuler</Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button>Confirmer</Button>
                        </DialogClose>
                      </>
                    }
                  >
                    <p className="demo-copy">
                      Les modales sont réservées aux décisions courtes qui
                      demandent toute l’attention.
                    </p>
                  </Dialog>
                  <Drawer
                    trigger={
                      <Button variant="secondary">Ouvrir le drawer</Button>
                    }
                    title="Détails de l’activité"
                    description="Un espace latéral pour conserver le contexte de la page."
                  >
                    <div className="demo-timeline">
                      <span />
                      <p>
                        <strong>Analyse terminée</strong>
                        <small>Il y a 2 minutes</small>
                      </p>
                    </div>
                    <div className="demo-timeline">
                      <span />
                      <p>
                        <strong>Validation demandée</strong>
                        <small>Il y a 8 minutes</small>
                      </p>
                    </div>
                  </Drawer>
                </div>
              </Card>
            </div>
            <Card className="demo-block demo-tabs-card">
              <Tabs
                items={[
                  {
                    value: "overview",
                    label: "Vue d’ensemble",
                    content: (
                      <p className="demo-copy">
                        Les onglets regroupent des vues parallèles sans masquer
                        une étape obligatoire.
                      </p>
                    ),
                  },
                  {
                    value: "activity",
                    label: "Activité",
                    badge: "12",
                    content: (
                      <p className="demo-copy">
                        L’historique conserve un ordre chronologique et des
                        libellés explicites.
                      </p>
                    ),
                  },
                  {
                    value: "settings",
                    label: "Paramètres",
                    content: (
                      <p className="demo-copy">
                        Les paramètres sensibles restent séparés des opérations
                        quotidiennes.
                      </p>
                    ),
                  },
                ]}
              />
            </Card>
          </section>

          <section className="demo-section" id="data">
            <SectionHeading
              index="05"
              title="Données"
              description="La densité est pensée pour scanner rapidement sans transformer l’interface en feuille de calcul."
            />
            <div className="demo-metrics">
              <MetricCard
                label="Contacts qualifiés"
                value="1 284"
                change="12,4 %"
                trend="up"
                detail="vs. période précédente"
                icon={<Users aria-hidden size={15} />}
              />
              <MetricCard
                label="Taux de réponse"
                value="8,7 %"
                change="1,2 pt"
                trend="up"
                detail="sur 30 jours"
                icon={<Activity aria-hidden size={15} />}
              />
              <MetricCard
                label="Signal moyen"
                value="84/100"
                change="3 pts"
                trend="down"
                detail="à surveiller"
                icon={<ChartNoAxesCombined aria-hidden size={15} />}
              />
            </div>
            <Card className="demo-table-card">
              <DataTable
                caption="Exemple de contacts"
                columns={columns}
                data={rows}
              />
              <div className="demo-table-footer">
                <span>1–3 sur 24 résultats</span>
                <Pagination onPageChange={setPage} page={page} totalPages={5} />
              </div>
            </Card>
          </section>

          <section className="demo-section" id="feedback">
            <SectionHeading
              index="06"
              title="États & feedback"
              description="Les états décrivent ce qui se passe, pourquoi, et la prochaine action possible. Les animations respectent la préférence de mouvement réduit."
            />
            <div className="demo-grid demo-grid--3">
              <EmptyState
                title="Aucun élément"
                description="Commencez par ajouter une première entrée."
                action={<Button size="sm">Ajouter</Button>}
              />
              <LoadingState
                title="Synchronisation"
                description="Connexion aux services autorisés…"
              />
              <ErrorState
                title="Connexion interrompue"
                description="Vérifiez le service puis réessayez."
                onRetry={() => undefined}
              />
            </div>
            <Card className="demo-block demo-toast-trigger">
              <BlockTitle title="Toast" subtitle="Confirmation non bloquante" />
              <Button
                iconLeading={<Bell aria-hidden size={15} />}
                onClick={() => {
                  setToastOpen(false);
                  setTimeout(() => setToastOpen(true), 0);
                }}
                variant="secondary"
              >
                Afficher une notification
              </Button>
            </Card>
          </section>
          <footer className="demo-footer">
            <span>Orbit Interface · v1.0</span>
            <span>Accessible · Responsive · Mode sombre</span>
          </footer>
        </main>
      </div>
      <Toast
        onOpenChange={setToastOpen}
        open={toastOpen}
        title="Préférences enregistrées"
        description="Les modifications sont appliquées à cette session."
      />
      <ToastViewport />
    </ToastProvider>
  );
}

function SectionHeading({
  description,
  index,
  title,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div className="demo-section-heading">
      <span>{index}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
function BlockTitle({ subtitle, title }: { title: string; subtitle: string }) {
  return (
    <div className="demo-block-title">
      <h3>{title}</h3>
      <span>{subtitle}</span>
    </div>
  );
}
