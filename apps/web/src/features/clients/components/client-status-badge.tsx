import { Badge } from "@/components/ui";
import type { ClientStatus } from "@/domain/clients/client";

const statusPresentation: Record<
  ClientStatus,
  Readonly<{
    label: string;
    tone: "neutral" | "brand" | "success" | "warning" | "danger";
  }>
> = {
  draft: { label: "Brouillon", tone: "neutral" },
  onboarding: { label: "Onboarding", tone: "brand" },
  active: { label: "Actif", tone: "success" },
  paused: { label: "En pause", tone: "warning" },
  archived: { label: "Archivé", tone: "danger" },
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const presentation = statusPresentation[status];
  return <Badge tone={presentation.tone}>{presentation.label}</Badge>;
}
