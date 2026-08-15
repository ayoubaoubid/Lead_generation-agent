import "@/app/operations.css";

import { ErrorState, PageHeader } from "@/components/ui";
import {
  ModuleSurface,
  OperationsEmpty,
  RecordCard,
  RecordGrid,
} from "@/features/operations/components/operations-ui";
import { getMeetingsData } from "@/features/operations/operations.queries";

export const metadata = { title: "Meetings" };

export default async function MeetingsPage() {
  const result = await getMeetingsData();
  return (
    <main className="workspace-page ops-page">
      <PageHeader
        eyebrow="RENDEZ-VOUS"
        title="Meetings"
        description="Planification tenant-scoped, fuseaux horaires et préparation commerciale SPIN Selling versionnée."
      />
      {!result.ok ? (
        <ErrorState
          title="Rendez-vous indisponibles"
          description={result.message}
        />
      ) : (
        <ModuleSurface
          count={result.data.length}
          title="Agenda commercial"
          description="Créneaux confirmés ou proposés, liés au contact et à la campagne."
        >
          {result.data.length ? (
            <RecordGrid>
              {result.data.map((meeting) => (
                <RecordCard
                  key={meeting.id}
                  title={meeting.title}
                  description={`${new Date(meeting.starts_at).toLocaleString("fr-FR")} — ${new Date(meeting.ends_at).toLocaleTimeString("fr-FR")}`}
                  status={meeting.status}
                  meta={`${meeting.timezone}${meeting.video_url ? " · visioconférence prête" : ""}`}
                />
              ))}
            </RecordGrid>
          ) : (
            <OperationsEmpty
              kind="calendar"
              title="Aucun rendez-vous"
              description="Un rendez-vous apparaîtra après confirmation humaine ou synchronisation calendrier."
            />
          )}
        </ModuleSurface>
      )}
    </main>
  );
}
