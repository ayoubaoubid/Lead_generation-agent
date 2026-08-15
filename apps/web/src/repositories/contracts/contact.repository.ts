import type { Contact } from "@/domain/contacts/contact";
import type { RepositoryContext } from "@/repositories/repository-context";
import type { CreateContactInput } from "@/validations/contacts/contact.schema";

export interface ContactRepository {
  list(search: string, context: RepositoryContext): Promise<readonly Contact[]>;
  create(
    input: CreateContactInput,
    context: RepositoryContext,
  ): Promise<string>;
  archive(contactId: string, context: RepositoryContext): Promise<string>;
}
