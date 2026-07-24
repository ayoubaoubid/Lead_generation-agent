import type { TenantActionState } from "@/types/tenant-action-state";

export function TargetingActionMessage({
  state,
}: Readonly<{ state: TenantActionState }>) {
  return state.message ? (
    <p
      className={`targeting-action-message targeting-action-message--${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  ) : null;
}
