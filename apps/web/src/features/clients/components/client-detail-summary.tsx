import { Clock3, ExternalLink, Globe2, Languages, MapPin } from "lucide-react";

import { Card } from "@/components/ui";
import type { ClientProfile } from "@/domain/clients/client";

function Detail({
  icon,
  label,
  value,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}>) {
  return (
    <div className="client-detail-item">
      <span>{icon}</span>
      <div>
        <dt>{label}</dt>
        <dd>{value || "Non renseigné"}</dd>
      </div>
    </div>
  );
}

export function ClientDetailSummary({ client }: { client: ClientProfile }) {
  return (
    <div className="client-summary-stack">
      <Card className="client-summary-card">
        <div className="client-panel-heading">
          <div>
            <p className="ui-eyebrow">Profil</p>
            <h2>Informations générales</h2>
          </div>
        </div>
        <dl className="client-detail-list">
          <Detail
            icon={<Globe2 aria-hidden size={15} />}
            label="Site web"
            value={
              client.websiteUrl ? (
                <a href={client.websiteUrl} rel="noreferrer" target="_blank">
                  {new URL(client.websiteUrl).hostname.replace(/^www\./u, "")}
                  <ExternalLink aria-hidden size={12} />
                </a>
              ) : null
            }
          />
          <Detail
            icon={<MapPin aria-hidden size={15} />}
            label="Pays"
            value={client.countryCode}
          />
          <Detail
            icon={<Languages aria-hidden size={15} />}
            label="Langue"
            value={client.languageCode}
          />
          <Detail
            icon={<Clock3 aria-hidden size={15} />}
            label="Fuseau horaire"
            value={client.timezone}
          />
        </dl>
        {client.description ? (
          <div className="client-description">
            <h3>Contexte</h3>
            <p>{client.description}</p>
          </div>
        ) : null}
      </Card>

      <Card className="client-summary-card">
        <div className="client-panel-heading">
          <div>
            <p className="ui-eyebrow">Résultats attendus</p>
            <h2>Objectifs</h2>
          </div>
        </div>
        {client.objectives.length > 0 ? (
          <ol className="client-objectives">
            {client.objectives.map((objective, index) => (
              <li key={`${objective}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {objective}
              </li>
            ))}
          </ol>
        ) : (
          <p className="client-restricted-copy">
            Aucun objectif n’a encore été renseigné.
          </p>
        )}
      </Card>
    </div>
  );
}
