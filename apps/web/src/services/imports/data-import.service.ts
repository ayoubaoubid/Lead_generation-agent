import { DomainError } from "@/domain/errors/domain-error";
import type { DataImportRepository } from "@/repositories/contracts/data-import.repository";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";
import { RepositoryError } from "@/repositories/repository-error";
import { requirePermission } from "@/services/authorization/permission.service";
import type { ServiceContext } from "@/services/service-context";
import type { ClientTenantContext } from "@/types/tenant-context";

type Dependencies = Readonly<{
  imports: DataImportRepository;
  access: TenantAccessRepository;
}>;

function assertClientScope(
  context: ServiceContext,
): asserts context is ServiceContext & { tenant: ClientTenantContext } {
  if (context.tenant.scope !== "client") {
    throw new DomainError(
      "invalid_state",
      "Sélectionnez un client actif pour gérer les imports.",
    );
  }
}

function repositoryFailure(error: unknown): never {
  if (error instanceof DomainError) throw error;
  if (error instanceof RepositoryError) {
    throw new DomainError(
      error.code === "conflict"
        ? "invalid_state"
        : "external_dependency_failed",
      error.code === "conflict"
        ? "Cet import ne peut pas être modifié dans son état actuel."
        : "Le service d’import est temporairement indisponible.",
      { cause: error },
    );
  }
  throw error;
}

export class DataImportService {
  constructor(private readonly dependencies: Dependencies) {}

  async list(context: ServiceContext) {
    return this.read(context, (repositoryContext) =>
      this.dependencies.imports.list(repositoryContext),
    );
  }

  async listRows(importId: string, context: ServiceContext) {
    return this.read(context, (repositoryContext) =>
      this.dependencies.imports.listRows(importId, repositoryContext),
    );
  }

  async prepare(
    input: Parameters<DataImportRepository["prepare"]>[0],
    context: ServiceContext,
  ) {
    return this.write(context, (repositoryContext) =>
      this.dependencies.imports.prepare(input, repositoryContext),
    );
  }

  async markReady(importId: string, context: ServiceContext) {
    return this.write(context, (repositoryContext) =>
      this.dependencies.imports.markReady(importId, repositoryContext),
    );
  }

  async setTriggerRun(
    importId: string,
    triggerRunId: string,
    context: ServiceContext,
  ) {
    return this.write(context, (repositoryContext) =>
      this.dependencies.imports.setTriggerRun(
        importId,
        triggerRunId,
        repositoryContext,
      ),
    );
  }

  async requestCancellation(importId: string, context: ServiceContext) {
    return this.write(context, (repositoryContext) =>
      this.dependencies.imports.requestCancellation(
        importId,
        repositoryContext,
      ),
    );
  }

  private async read<T>(
    context: ServiceContext,
    operation: (
      repositoryContext: Parameters<DataImportRepository["list"]>[0],
    ) => Promise<T>,
  ) {
    assertClientScope(context);
    await requirePermission(
      context.tenant,
      "lead.read",
      this.dependencies.access,
    );
    try {
      return await operation({
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  private async write<T>(
    context: ServiceContext,
    operation: (
      repositoryContext: Parameters<DataImportRepository["list"]>[0],
    ) => Promise<T>,
  ) {
    assertClientScope(context);
    await requirePermission(
      context.tenant,
      "lead.write",
      this.dependencies.access,
    );
    try {
      return await operation({
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
    } catch (error) {
      return repositoryFailure(error);
    }
  }
}
