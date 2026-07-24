import type { TenantActionState } from "@/types/tenant-action-state";

export function StrategyActionMessage({
  state,
}: Readonly<{ state: TenantActionState }>) {
  return state.message ? (
    <p
      className={`strategy-action-message strategy-action-message--${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  ) : null;
}
