import { DomainError } from "@/domain/errors/domain-error";
import { buildOnboardingSkillContexts } from "@/domain/onboarding/onboarding-skill-context";
import type { OnboardingRepository } from "@/repositories/contracts/onboarding.repository";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";
import { RepositoryError } from "@/repositories/repository-error";
import {
  requirePermission,
  requireAllPermissions,
} from "@/services/authorization/permission.service";
import type { ServiceContext } from "@/services/service-context";
import type { ClientTenantContext } from "@/types/tenant-context";

type OnboardingServiceDependencies = Readonly<{
  onboarding: OnboardingRepository;
  access: TenantAccessRepository;
}>;

function repositoryFailure(error: unknown): never {
  if (error instanceof DomainError) throw error;

  if (error instanceof RepositoryError) {
    if (error.code === "conflict") {
      throw new DomainError(
        "invalid_state",
        "L’onboarding ne peut pas effectuer cette transition.",
        { cause: error },
      );
    }

    throw new DomainError(
      "external_dependency_failed",
      "L’onboarding est temporairement indisponible.",
      { cause: error },
    );
  }

  throw error;
}

function assertClientScope(
  context: ServiceContext,
): asserts context is ServiceContext & { tenant: ClientTenantContext } {
  if (context.tenant.scope !== "client") {
    throw new DomainError(
      "invalid_state",
      "Sélectionnez un client actif pour accéder à l’onboarding.",
    );
  }
}

export class OnboardingService {
  constructor(private readonly dependencies: OnboardingServiceDependencies) {}

  async find(context: ServiceContext) {
    assertClientScope(context);
    await requirePermission(
      context.tenant,
      "onboarding.read",
      this.dependencies.access,
    );

    try {
      return await this.dependencies.onboarding.find({
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async saveStep(
    input: Parameters<OnboardingRepository["saveStep"]>[0],
    context: ServiceContext,
  ) {
    assertClientScope(context);
    await requireAllPermissions(
      context.tenant,
      ["onboarding.read", "onboarding.write"],
      this.dependencies.access,
    );

    try {
      const sessionId = await this.dependencies.onboarding.saveStep(input, {
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
      context.logger.info("Onboarding step saved.", {
        operation: "onboarding.save_step",
        correlationId: context.correlationId,
        agencyId: context.tenant.agencyId,
        clientId: context.tenant.clientId,
        resourceType: "onboarding_session",
        resourceId: sessionId,
      });
      return sessionId;
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async complete(context: ServiceContext) {
    assertClientScope(context);
    await requireAllPermissions(
      context.tenant,
      ["onboarding.read", "onboarding.write"],
      this.dependencies.access,
    );

    try {
      return await this.dependencies.onboarding.complete({
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async validate(context: ServiceContext) {
    assertClientScope(context);
    await requireAllPermissions(
      context.tenant,
      ["onboarding.read", "onboarding.validate"],
      this.dependencies.access,
    );

    try {
      return await this.dependencies.onboarding.validate({
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async buildSkillContexts(context: ServiceContext) {
    const session = await this.find(context);
    return buildOnboardingSkillContexts(session);
  }
}
