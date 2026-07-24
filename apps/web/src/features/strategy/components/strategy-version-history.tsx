import { CheckCircle2, Clock3 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui";
import type {
  StrategyArtifact,
  StrategyArtifactType,
} from "@/domain/strategy/strategy-artifact";

export function StrategyVersionHistory({
  artifact,
  artifactType,
  selectedVersionId,
}: Readonly<{
  artifact: StrategyArtifact;
  artifactType: StrategyArtifactType;
  selectedVersionId: string;
}>) {
  const basePath =
    artifactType === "positioning" ? "/strategy/positioning" : "/offers";

  return (
    <aside className="strategy-version-history">
      <h2>Historique</h2>
      <p>Les versions validées restent immuables.</p>
      <nav aria-label="Historique des versions">
        {artifact.versions.map((version) => (
          <Link
            aria-current={version.id === selectedVersionId ? "page" : undefined}
            className={
              version.id === selectedVersionId
                ? "strategy-version-link strategy-version-link--active"
                : "strategy-version-link"
            }
            href={`${basePath}?artifact=${artifact.id}&version=${version.id}`}
            key={version.id}
          >
            {version.status === "validated" ? (
              <CheckCircle2 aria-hidden size={15} />
            ) : (
              <Clock3 aria-hidden size={15} />
            )}
            <span>
              <strong>Version {version.versionNumber}</strong>
              <small>
                {new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "medium",
                }).format(new Date(version.updatedAt))}
              </small>
            </span>
            <Badge
              tone={version.status === "validated" ? "success" : "warning"}
            >
              {version.status === "validated" ? "Validée" : "Brouillon"}
            </Badge>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
