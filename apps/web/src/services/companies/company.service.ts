import { DomainError } from "@/domain/errors/domain-error";
import type { CompanyRepository } from "@/repositories/contracts/company.repository";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";
import { RepositoryError } from "@/repositories/repository-error";
import { requirePermission } from "@/services/authorization/permission.service";
import type { ServiceContext } from "@/services/service-context";
import type { ClientTenantContext } from "@/types/tenant-context";

type Dependencies = Readonly<{
  companies: CompanyRepository;
  access: TenantAccessRepository;
}>;

function assertClientScope(
  context: ServiceContext,
): asserts context is ServiceContext & { tenant: ClientTenantContext } {
  if (context.tenant.scope !== "client") {
    throw new DomainError(
      "invalid_state",
      "Sélectionnez un client actif pour gérer les entreprises.",
    );
  }
}

function repositoryFailure(error: unknown): never {
  if (error instanceof DomainError) throw error;
  if (error instanceof RepositoryError) {
    throw new DomainError(
      error.code === "conflict" ? "conflict" : "external_dependency_failed",
      error.code === "conflict"
        ? "Une entreprise correspondante existe déjà."
        : "Les entreprises sont temporairement indisponibles.",
      { cause: error },
    );
  }
  throw error;
}

export class CompanyService {
  constructor(private readonly dependencies: Dependencies) {}

  async list(search: string, context: ServiceContext) {
    assertClientScope(context);
    await requirePermission(
      context.tenant,
      "lead.read",
      this.dependencies.access,
    );
    try {
      return await this.dependencies.companies.list(search, {
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async create(
    input: Parameters<CompanyRepository["create"]>[0],
    context: ServiceContext,
  ) {
    assertClientScope(context);
    await requirePermission(
      context.tenant,
      "lead.write",
      this.dependencies.access,
    );
    try {
      const id = await this.dependencies.companies.create(input, {
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
      context.logger.info("Company created.", {
        operation: "company.create",
        agencyId: context.tenant.agencyId,
        clientId: context.tenant.clientId,
        resourceType: "company",
        resourceId: id,
        correlationId: context.correlationId,
      });
      return id;
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async archive(companyId: string, context: ServiceContext) {
    assertClientScope(context);
    await requirePermission(
      context.tenant,
      "lead.write",
      this.dependencies.access,
    );
    try {
      return await this.dependencies.companies.archive(companyId, {
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
    } catch (error) {
      return repositoryFailure(error);
    }
  }
}
