import { DomainError } from "@/domain/errors/domain-error";
import type { StrategyArtifactType } from "@/domain/strategy/strategy-artifact";
import type { StrategyRepository } from "@/repositories/contracts/strategy.repository";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";
import { RepositoryError } from "@/repositories/repository-error";
import {
  requireAllPermissions,
  requirePermission,
} from "@/services/authorization/permission.service";
import type { ServiceContext } from "@/services/service-context";
import type { ClientTenantContext } from "@/types/tenant-context";

type StrategyServiceDependencies = Readonly<{
  strategy: StrategyRepository;
  access: TenantAccessRepository;
}>;

function assertClientScope(
  context: ServiceContext,
): asserts context is ServiceContext & { tenant: ClientTenantContext } {
  if (context.tenant.scope !== "client") {
    throw new DomainError(
      "invalid_state",
      "Sélectionnez un client actif pour accéder à cette stratégie.",
    );
  }
}

function repositoryFailure(error: unknown): never {
  if (error instanceof DomainError) throw error;
  if (error instanceof RepositoryError) {
    if (error.code === "conflict" || error.code === "not_found") {
      throw new DomainError(
        "invalid_state",
        "Cette opération ne respecte pas l’état ou les preuves de la stratégie.",
        { cause: error },
      );
    }
    throw new DomainError(
      "external_dependency_failed",
      "Les données de stratégie sont temporairement indisponibles.",
      { cause: error },
    );
  }
  throw error;
}

export class StrategyService {
  constructor(private readonly dependencies: StrategyServiceDependencies) {}

  async findWorkspace(
    artifactType: StrategyArtifactType,
    context: ServiceContext,
  ) {
    assertClientScope(context);
    await requirePermission(
      context.tenant,
      "offer.read",
      this.dependencies.access,
    );
    try {
      return await this.dependencies.strategy.findWorkspace(artifactType, {
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async createEvidence(
    input: Parameters<StrategyRepository["createEvidence"]>[0],
    context: ServiceContext,
  ) {
    assertClientScope(context);
    await this.requireWrite(context);
    try {
      const evidenceId = await this.dependencies.strategy.createEvidence(
        input,
        this.repositoryContext(context),
      );
      this.logMutation(context, "strategy.evidence_created", evidenceId);
      return evidenceId;
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async createDraft(
    input: Parameters<StrategyRepository["createDraft"]>[0],
    context: ServiceContext,
  ) {
    assertClientScope(context);
    await this.requireWrite(context);
    try {
      const versionId = await this.dependencies.strategy.createDraft(
        input,
        this.repositoryContext(context),
      );
      this.logMutation(context, "strategy.draft_created", versionId);
      return versionId;
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async saveDraft(
    input: Parameters<StrategyRepository["saveDraft"]>[0],
    context: ServiceContext,
  ) {
    assertClientScope(context);
    await this.requireWrite(context);
    try {
      const versionId = await this.dependencies.strategy.saveDraft(
        input,
        this.repositoryContext(context),
      );
      this.logMutation(context, "strategy.draft_saved", versionId);
      return versionId;
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async validateVersion(
    input: Parameters<StrategyRepository["validateVersion"]>[0],
    context: ServiceContext,
  ) {
    assertClientScope(context);
    await this.requireWrite(context);
    try {
      const versionId = await this.dependencies.strategy.validateVersion(
        input,
        this.repositoryContext(context),
      );
      this.logMutation(context, "strategy.version_validated", versionId);
      return versionId;
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  private requireWrite(
    context: ServiceContext & { tenant: ClientTenantContext },
  ) {
    return requireAllPermissions(
      context.tenant,
      ["offer.read", "offer.write"],
      this.dependencies.access,
    );
  }

  private repositoryContext(
    context: ServiceContext & { tenant: ClientTenantContext },
  ) {
    return {
      tenant: context.tenant,
      correlationId: context.correlationId,
    };
  }

  private logMutation(
    context: ServiceContext & { tenant: ClientTenantContext },
    operation: string,
    resourceId: string,
  ) {
    context.logger.info("Strategy mutation completed.", {
      operation,
      correlationId: context.correlationId,
      agencyId: context.tenant.agencyId,
      clientId: context.tenant.clientId,
      resourceType: "strategy_version",
      resourceId,
    });
  }
}
