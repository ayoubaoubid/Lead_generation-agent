import { DomainError } from "@/domain/errors/domain-error";
import type { TargetingProfileType } from "@/domain/targeting/targeting-profile";
import type { TargetingRepository } from "@/repositories/contracts/targeting.repository";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";
import { RepositoryError } from "@/repositories/repository-error";
import {
  requireAllPermissions,
  requirePermission,
} from "@/services/authorization/permission.service";
import type { ServiceContext } from "@/services/service-context";
import type { ClientTenantContext } from "@/types/tenant-context";

type TargetingServiceDependencies = Readonly<{
  targeting: TargetingRepository;
  access: TenantAccessRepository;
}>;

function assertClientScope(
  context: ServiceContext,
): asserts context is ServiceContext & { tenant: ClientTenantContext } {
  if (context.tenant.scope !== "client") {
    throw new DomainError(
      "invalid_state",
      "Sélectionnez un client actif pour accéder aux ICP et personas.",
    );
  }
}

function repositoryFailure(error: unknown): never {
  if (error instanceof DomainError) throw error;
  if (error instanceof RepositoryError) {
    if (error.code === "conflict" || error.code === "not_found") {
      throw new DomainError(
        "invalid_state",
        "Cette opération ne respecte pas l’état ou le tenant du profil.",
        { cause: error },
      );
    }
    throw new DomainError(
      "external_dependency_failed",
      "Les données ICP et personas sont temporairement indisponibles.",
      { cause: error },
    );
  }
  throw error;
}

export class TargetingService {
  constructor(private readonly dependencies: TargetingServiceDependencies) {}

  async findWorkspace(
    profileType: TargetingProfileType,
    context: ServiceContext,
  ) {
    assertClientScope(context);
    await requirePermission(
      context.tenant,
      "targeting.read",
      this.dependencies.access,
    );
    try {
      return await this.dependencies.targeting.findWorkspace(
        profileType,
        this.repositoryContext(context),
      );
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async createDraft(
    input: Parameters<TargetingRepository["createDraft"]>[0],
    context: ServiceContext,
  ) {
    return this.runWrite(
      "targeting.draft_created",
      input.profileType,
      context,
      (repositoryContext) =>
        this.dependencies.targeting.createDraft(input, repositoryContext),
    );
  }

  async createVersion(
    input: Parameters<TargetingRepository["createVersion"]>[0],
    context: ServiceContext,
  ) {
    return this.runWrite(
      "targeting.version_created",
      input.profileType,
      context,
      (repositoryContext) =>
        this.dependencies.targeting.createVersion(input, repositoryContext),
    );
  }

  async saveDraft(
    input: Parameters<TargetingRepository["saveDraft"]>[0],
    context: ServiceContext,
  ) {
    return this.runWrite(
      "targeting.draft_saved",
      input.profileType,
      context,
      (repositoryContext) =>
        this.dependencies.targeting.saveDraft(input, repositoryContext),
    );
  }

  async validateVersion(
    input: Parameters<TargetingRepository["validateVersion"]>[0],
    context: ServiceContext,
  ) {
    return this.runValidated(
      "targeting.version_validated",
      input.profileType,
      context,
      (repositoryContext) =>
        this.dependencies.targeting.validateVersion(input, repositoryContext),
    );
  }

  async setLifecycle(
    input: Parameters<TargetingRepository["setLifecycle"]>[0],
    context: ServiceContext,
  ) {
    const run =
      input.lifecycleStatus === "active"
        ? this.runValidated.bind(this)
        : this.runWrite.bind(this);
    return run(
      `targeting.${input.lifecycleStatus}`,
      input.profileType,
      context,
      (repositoryContext) =>
        this.dependencies.targeting.setLifecycle(input, repositoryContext),
    );
  }

  async createAiProposal(
    input: Parameters<TargetingRepository["createAiProposal"]>[0],
    context: ServiceContext,
  ) {
    assertClientScope(context);
    await requireAllPermissions(
      context.tenant,
      ["targeting.read", "targeting.propose"],
      this.dependencies.access,
    );
    try {
      const id = await this.dependencies.targeting.createAiProposal(
        input,
        this.repositoryContext(context),
      );
      this.logMutation(context, "targeting.ai_proposed", input.profileType, id);
      return id;
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  private async runWrite(
    operation: string,
    profileType: TargetingProfileType,
    context: ServiceContext,
    mutation: (
      repositoryContext: ReturnType<TargetingService["repositoryContext"]>,
    ) => Promise<string>,
  ) {
    assertClientScope(context);
    await requireAllPermissions(
      context.tenant,
      ["targeting.read", "targeting.write"],
      this.dependencies.access,
    );
    try {
      const id = await mutation(this.repositoryContext(context));
      this.logMutation(context, operation, profileType, id);
      return id;
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  private async runValidated(
    operation: string,
    profileType: TargetingProfileType,
    context: ServiceContext,
    mutation: (
      repositoryContext: ReturnType<TargetingService["repositoryContext"]>,
    ) => Promise<string>,
  ) {
    assertClientScope(context);
    await requireAllPermissions(
      context.tenant,
      ["targeting.read", "targeting.validate"],
      this.dependencies.access,
    );
    try {
      const id = await mutation(this.repositoryContext(context));
      this.logMutation(context, operation, profileType, id);
      return id;
    } catch (error) {
      return repositoryFailure(error);
    }
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
    profileType: TargetingProfileType,
    resourceId: string,
  ) {
    context.logger.info("Targeting mutation completed.", {
      operation,
      correlationId: context.correlationId,
      agencyId: context.tenant.agencyId,
      clientId: context.tenant.clientId,
      resourceType: `${profileType}_profile`,
      resourceId,
    });
  }
}
