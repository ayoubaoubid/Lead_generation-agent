import type { ZodError } from "zod";

import { DomainError } from "@/domain/errors/domain-error";
import type { TenantActionState } from "@/types/tenant-action-state";

export function tenantValidationErrorState(error: ZodError): TenantActionState {
  return {
    status: "error",
    message: "Vérifiez les informations saisies.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

export function tenantActionErrorState(error: unknown): TenantActionState {
  if (error instanceof DomainError) {
    return { status: "error", message: error.publicMessage };
  }

  return {
    status: "error",
    message: "L’opération n’a pas pu être terminée.",
  };
}

export function tenantActionSuccessState(
  message: string,
  resourceId?: string,
): TenantActionState {
  return resourceId
    ? { status: "success", message, resourceId }
    : { status: "success", message };
}
