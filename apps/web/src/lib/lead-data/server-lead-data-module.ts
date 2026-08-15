import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { serverLogger } from "@/lib/logging/server-logger";
import { SupabaseCompanyRepository } from "@/repositories/supabase/supabase-company.repository";
import { SupabaseContactRepository } from "@/repositories/supabase/supabase-contact.repository";
import { SupabaseDataImportRepository } from "@/repositories/supabase/supabase-data-import.repository";
import { SupabaseTenantAccessRepository } from "@/repositories/supabase/supabase-tenant-access.repository";
import { CompanyService } from "@/services/companies/company.service";
import { ContactService } from "@/services/contacts/contact.service";
import { DataImportService } from "@/services/imports/data-import.service";
import type { ServiceContext } from "@/services/service-context";
import type { Database } from "@/types/database.generated";
import type { TenantContext } from "@/types/tenant-context";

export function createServerLeadDataModule(
  supabase: SupabaseClient<Database>,
  tenant: TenantContext,
) {
  const access = new SupabaseTenantAccessRepository(supabase);
  const context: ServiceContext = {
    tenant,
    correlationId: crypto.randomUUID(),
    logger: serverLogger,
  };
  return {
    context,
    companies: new CompanyService({
      companies: new SupabaseCompanyRepository(supabase),
      access,
    }),
    contacts: new ContactService({
      contacts: new SupabaseContactRepository(supabase),
      access,
    }),
    imports: new DataImportService({
      imports: new SupabaseDataImportRepository(supabase),
      access,
    }),
  };
}
