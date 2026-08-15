import "@/app/operations.css";

import { ErrorState, PageHeader } from "@/components/ui";
import {
  ModuleSurface,
  OperationsEmpty,
  RecordCard,
  RecordGrid,
} from "@/features/operations/components/operations-ui";
import { getInboxData } from "@/features/operations/operations.queries";

export const metadata = { title: "Inbox" };

export default async function InboxPage() {
  const result = await getInboxData();
  return (
    <main className="workspace-page ops-page">
      <PageHeader
        eyebrow="CONVERSATIONS"
        title="Inbox"
        description="Les réponses entrantes arrêtent la séquence avant classification. Toute réponse proposée par l’IA reste soumise à validation humaine."
      />
      {!result.ok ? (
        <ErrorState title="Inbox indisponible" description={result.message} />
      ) : (
        <ModuleSurface
          count={result.data.length}
          title="Réponses reçues"
          description="Message original, classification explicable et état de revue."
        >
          {result.data.length ? (
            <RecordGrid>
              {result.data.map((message) => (
                <RecordCard
                  key={message.id}
                  title={message.subject || "Sans objet"}
                  description={`${message.sender_address} — ${message.body_text.slice(0, 180)}`}
                  status={message.review_status}
                  meta={`${message.category?.replaceAll("_", " ") ?? "classification en attente"} · ${new Date(message.received_at).toLocaleString("fr-FR")}`}
                />
              ))}
            </RecordGrid>
          ) : (
            <OperationsEmpty
              kind="inbox"
              title="Aucune réponse reçue"
              description="Les réponses vérifiées par webhook apparaîtront ici. Aucun message de démonstration n’est injecté."
            />
          )}
        </ModuleSurface>
      )}
    </main>
  );
}
