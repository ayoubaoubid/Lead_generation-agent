import type { Company } from "@/domain/companies/company";
import type { RepositoryContext } from "@/repositories/repository-context";
import type { CreateCompanyInput } from "@/validations/companies/company.schema";

export interface CompanyRepository {
  list(search: string, context: RepositoryContext): Promise<readonly Company[]>;
  create(
    input: CreateCompanyInput,
    context: RepositoryContext,
  ): Promise<string>;
  archive(companyId: string, context: RepositoryContext): Promise<string>;
}
