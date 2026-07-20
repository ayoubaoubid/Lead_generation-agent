import type { TenantContext } from "@/types/tenant-context";

export type RepositoryContext = Readonly<{
  tenant: TenantContext;
  correlationId: string;
}>;
