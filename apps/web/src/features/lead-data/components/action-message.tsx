import type { TenantActionState } from "@/types/tenant-action-state";

export function LeadDataActionMessage({
  state,
}: Readonly<{ state: TenantActionState }>) {
  return state.message ? (
    <p
      className={`lead-data-message lead-data-message--${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  ) : null;
}
