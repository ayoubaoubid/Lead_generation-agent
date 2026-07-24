import { DomainError } from "@/domain/errors/domain-error";

import type { ClientStatus } from "./client";

export function assertClientCanBeEdited(status: ClientStatus): void {
  if (status === "archived") {
    throw new DomainError(
      "invalid_state",
      "Un client archivé ne peut plus être modifié.",
    );
  }
}

export function assertClientCanBeArchived(status: ClientStatus): void {
  if (status === "archived") {
    throw new DomainError("invalid_state", "Ce client est déjà archivé.");
  }
}
