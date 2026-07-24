import {
  assertClientCanBeArchived,
  assertClientCanBeEdited,
} from "@/domain/clients/client.policy";
import { DomainError } from "@/domain/errors/domain-error";
import type { TenantAccessRepository } from "@/repositories/contracts/tenant-access.repository";
import type {
  ClientPage,
  ClientRepository,
  CreateClientRecord,
  ListClientsFilter,
  UpdateClientRecord,
} from "@/repositories/contracts/client.repository";
import { RepositoryError } from "@/repositories/repository-error";
import {
  requirePermission,
  requireAllPermissions,
} from "@/services/authorization/permission.service";
import type { ServiceContext } from "@/services/service-context";

type ClientServiceDependencies = Readonly<{
  clients: ClientRepository;
  access: TenantAccessRepository;
}>;

function repositoryFailure(error: unknown): never {
  if (error instanceof DomainError) {
    throw error;
  }

  if (error instanceof RepositoryError) {
    if (error.code === "conflict") {
      throw new DomainError(
        "conflict",
        "Un client utilise déjà ce nom technique.",
        { cause: error },
      );
    }

    throw new DomainError(
      "external_dependency_failed",
      "Les données clients sont temporairement indisponibles.",
      { cause: error },
    );
  }

  throw error;
}

export class ClientService {
  constructor(private readonly dependencies: ClientServiceDependencies) {}

  async list(
    filter: ListClientsFilter,
    context: ServiceContext,
  ): Promise<ClientPage> {
    await requirePermission(
      context.tenant,
      "client.read",
      this.dependencies.access,
    );

    try {
      return await this.dependencies.clients.list(filter, {
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async find(clientId: string, context: ServiceContext) {
    await requirePermission(
      context.tenant,
      "client.read",
      this.dependencies.access,
    );

    try {
      const client = await this.dependencies.clients.findById(clientId, {
        tenant: context.tenant,
        correlationId: context.correlationId,
      });

      if (!client) {
        throw new DomainError(
          "resource_not_found",
          "Ce client n’existe pas ou n’est pas accessible.",
        );
      }

      return client;
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async create(input: CreateClientRecord, context: ServiceContext) {
    await requirePermission(
      context.tenant,
      "client.create",
      this.dependencies.access,
    );

    try {
      const clientId = await this.dependencies.clients.create(input, {
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
      context.logger.info("Client workspace created.", {
        correlationId: context.correlationId,
        operation: "client.create",
        agencyId: context.tenant.agencyId,
        resourceType: "client",
        resourceId: clientId,
      });
      return clientId;
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async update(input: UpdateClientRecord, context: ServiceContext) {
    await requirePermission(
      context.tenant,
      "client.manage",
      this.dependencies.access,
    );
    const current = await this.find(input.clientId, context);
    assertClientCanBeEdited(current.status);

    try {
      const clientId = await this.dependencies.clients.update(input, {
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
      context.logger.info("Client workspace updated.", {
        correlationId: context.correlationId,
        operation: "client.update",
        agencyId: context.tenant.agencyId,
        clientId,
        resourceType: "client",
        resourceId: clientId,
      });
      return clientId;
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async archive(clientId: string, context: ServiceContext) {
    await requirePermission(
      context.tenant,
      "client.archive",
      this.dependencies.access,
    );
    const current = await this.find(clientId, context);
    assertClientCanBeArchived(current.status);

    try {
      const archivedId = await this.dependencies.clients.archive(clientId, {
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
      context.logger.info("Client workspace archived.", {
        correlationId: context.correlationId,
        operation: "client.archive",
        agencyId: context.tenant.agencyId,
        clientId: archivedId,
        resourceType: "client",
        resourceId: archivedId,
      });
      return archivedId;
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async listMembers(clientId: string, context: ServiceContext) {
    await requireAllPermissions(
      context.tenant,
      ["client.read", "member.read"],
      this.dependencies.access,
    );

    try {
      return await this.dependencies.clients.listMembers(clientId, {
        tenant: context.tenant,
        correlationId: context.correlationId,
      });
    } catch (error) {
      return repositoryFailure(error);
    }
  }

  async listMembershipOptions(clientId: string, context: ServiceContext) {
    await requireAllPermissions(
      context.tenant,
      ["member.read", "member.invite", "member.assign_role"],
      this.dependencies.access,
    );

    try {
      const [members, roles] = await Promise.all([
        this.dependencies.clients.listAssignableAgencyMembers(clientId, {
          tenant: context.tenant,
          correlationId: context.correlationId,
        }),
        this.dependencies.clients.listClientRoles(clientId, {
          tenant: context.tenant,
          correlationId: context.correlationId,
        }),
      ]);
      return { members, roles };
    } catch (error) {
      return repositoryFailure(error);
    }
  }
}
