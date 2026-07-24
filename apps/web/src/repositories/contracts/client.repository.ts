import type {
  AgencyMemberOption,
  ClientListItem,
  ClientMember,
  ClientProfile,
  ClientRoleOption,
  ClientStatus,
  EditableClientStatus,
} from "@/domain/clients/client";
import type { RepositoryContext } from "@/repositories/repository-context";

export type ClientProfileValues = Readonly<{
  name: string;
  slug: string;
  legalName: string | null;
  websiteUrl: string | null;
  industry: string | null;
  countryCode: string | null;
  languageCode: string | null;
  timezone: string | null;
  description: string | null;
  logoUrl: string | null;
  objectives: readonly string[];
}>;

export type CreateClientRecord = ClientProfileValues &
  Readonly<{ status: "draft" | "onboarding" }>;

export type UpdateClientRecord = ClientProfileValues &
  Readonly<{
    clientId: string;
    status: EditableClientStatus;
  }>;

export type ListClientsFilter = Readonly<{
  query: string;
  status: ClientStatus | "current";
  industry: string;
  countryCode: string;
  page: number;
  pageSize: number;
}>;

export type ClientPage = Readonly<{
  items: readonly ClientListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}>;

export interface ClientRepository {
  list(
    filter: ListClientsFilter,
    context: RepositoryContext,
  ): Promise<ClientPage>;
  findById(
    clientId: string,
    context: RepositoryContext,
  ): Promise<ClientProfile | null>;
  create(
    input: CreateClientRecord,
    context: RepositoryContext,
  ): Promise<string>;
  update(
    input: UpdateClientRecord,
    context: RepositoryContext,
  ): Promise<string>;
  archive(clientId: string, context: RepositoryContext): Promise<string>;
  listMembers(
    clientId: string,
    context: RepositoryContext,
  ): Promise<readonly ClientMember[]>;
  listAssignableAgencyMembers(
    clientId: string,
    context: RepositoryContext,
  ): Promise<readonly AgencyMemberOption[]>;
  listClientRoles(
    clientId: string,
    context: RepositoryContext,
  ): Promise<readonly ClientRoleOption[]>;
}
