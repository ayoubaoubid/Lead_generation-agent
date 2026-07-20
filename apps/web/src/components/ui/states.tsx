import { AlertTriangle, Inbox, LoaderCircle, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "./button";

type StateProps = { title: string; description: string; action?: ReactNode };
export function EmptyState({ action, description, title }: StateProps) {
  return (
    <div className="ui-state">
      <span className="ui-state-icon">
        <Inbox aria-hidden size={20} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function LoadingState({
  description = "Les données sont en cours de chargement…",
  title = "Chargement",
}: Partial<StateProps>) {
  return (
    <div aria-live="polite" className="ui-state">
      <span className="ui-state-icon">
        <LoaderCircle aria-hidden className="ui-spin" size={20} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}
export function ErrorState({
  description,
  onRetry,
  title,
}: StateProps & { onRetry?: () => void }) {
  return (
    <div className="ui-state ui-state--error" role="alert">
      <span className="ui-state-icon">
        <AlertTriangle aria-hidden size={20} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {onRetry ? (
        <Button
          iconLeading={<RotateCcw aria-hidden size={15} />}
          onClick={onRetry}
          size="sm"
          variant="secondary"
        >
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}
