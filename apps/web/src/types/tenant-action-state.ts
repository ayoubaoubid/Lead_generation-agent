export type TenantFieldErrors = Readonly<Record<string, string[] | undefined>>;

export type TenantActionState = Readonly<{
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: TenantFieldErrors;
  resourceId?: string;
}>;

export const initialTenantActionState: TenantActionState = { status: "idle" };
