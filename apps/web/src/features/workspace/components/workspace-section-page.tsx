import { Badge, EmptyState, PageHeader } from "@/components/ui";
import {
  getWorkspaceSection,
  type WorkspaceSectionKey,
} from "@/config/workspace-navigation";

export function WorkspaceSectionPage({
  sectionKey,
}: Readonly<{ sectionKey: WorkspaceSectionKey }>) {
  const section = getWorkspaceSection(sectionKey);
  const Icon = section.icon;

  return (
    <section className="workspace-page">
      <PageHeader
        description={section.description}
        eyebrow="Lead Operations"
        title={section.label}
      />
      <div className="workspace-page-scope">
        <Badge tone="neutral">
          Portée {section.scope === "agency" ? "agence" : "client"}
        </Badge>
        <span>
          Les données resteront vides tant que le module métier ne sera pas
          configuré.
        </span>
      </div>
      <div className="workspace-empty-surface">
        <div className="workspace-empty-glow" aria-hidden />
        <EmptyState
          description={section.emptyDescription}
          icon={<Icon aria-hidden size={24} strokeWidth={1.6} />}
          title={section.emptyTitle}
        />
      </div>
    </section>
  );
}
