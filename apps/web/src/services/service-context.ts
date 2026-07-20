import type { Logger } from "@/lib/logging/logger";
import type { TenantContext } from "@/types/tenant-context";

export type ServiceContext = Readonly<{
  tenant: TenantContext;
  correlationId: string;
  logger: Logger;
}>;
