import { ChevronLeft, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar, ErrorState, PageHeader } from "@/components/ui";
import { ArchiveClientDialog } from "@/features/clients/components/archive-client-dialog";
import { ClientDetailSummary } from "@/features/clients/components/client-detail-summary";
import { ClientMembersPanel } from "@/features/clients/components/client-members-panel";
import { ClientProfileForm } from "@/features/clients/components/client-profile-form";
import { ClientStatusBadge } from "@/features/clients/components/client-status-badge";
import { getClientDetailPageData } from "@/features/clients/client.queries";
import { clientRouteParamsSchema } from "@/validations/clients/client.schema";

type ClientDetailPageProps = Readonly<{
  params: Promise<{ clientId: string }>;
}>;

export async function generateMetadata({
  params,
}: ClientDetailPageProps): Promise<Metadata> {
  const parsed = clientRouteParamsSchema.safeParse(await params);
  return { title: parsed.success ? "Fiche client" : "Client introuvable" };
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const parsed = clientRouteParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();

  const result = await getClientDetailPageData(parsed.data.clientId);
  if (!result.ok) {
    return (
      <div className="workspace-page client-page">
        <PageHeader title="Fiche client" />
        <ErrorState description={result.message} title="Accès indisponible" />
      </div>
    );
  }

  const { data } = result;
  const archived = data.client.status === "archived";

  return (
    <div className="workspace-page client-page">
      <PageHeader
        actions={
          <div className="client-header-actions">
            {data.canManage && !archived ? (
              <span className="client-edit-indicator">
                <PencilLine aria-hidden size={14} />
                Modification autorisée
              </span>
            ) : null}
            {data.canArchive && !archived ? (
              <ArchiveClientDialog
                clientId={data.client.id}
                clientName={data.client.name}
              />
            ) : null}
          </div>
        }
        breadcrumbs={
          <Link className="client-back-link" href="/clients">
            <ChevronLeft aria-hidden size={13} />
            Clients
          </Link>
        }
        description={
          data.client.legalName ?? data.client.industry ?? "Informations client"
        }
        eyebrow={data.client.slug}
        title={data.client.name}
      />

      <div className="client-identity-strip">
        <Avatar
          name={data.client.name}
          size="lg"
          {...(data.client.logoUrl ? { src: data.client.logoUrl } : {})}
        />
        <div>
          <ClientStatusBadge status={data.client.status} />
          <span>
            Mis à jour le{" "}
            {new Intl.DateTimeFormat("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(data.client.updatedAt))}
          </span>
        </div>
      </div>

      <div className="client-detail-layout">
        <ClientDetailSummary client={data.client} />
        <ClientMembersPanel
          canAssign={data.canAssignMembers}
          canRead={data.canReadMembers}
          clientId={data.client.id}
          members={data.members}
          membershipOptions={data.membershipOptions}
        />
      </div>

      {data.canManage && !archived ? (
        <section className="client-edit-section">
          <div className="client-edit-heading">
            <p className="ui-eyebrow">Administration</p>
            <h2>Modifier la fiche</h2>
            <p>
              Chaque modification est validée côté serveur et enregistrée dans
              le journal d’audit.
            </p>
          </div>
          <ClientProfileForm client={data.client} mode="update" />
        </section>
      ) : null}
    </div>
  );
}
