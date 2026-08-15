import "server-only";

import { z } from "zod";

import { DomainError } from "@/domain/errors/domain-error";
import { getRequestedPermissionSnapshot } from "@/lib/authorization/server-permissions";
import { createServerLeadDataModule } from "@/lib/lead-data/server-lead-data-module";
import { resolveActiveClientTenant } from "@/lib/tenancy/server-tenant-context";

const searchSchema = z.string().trim().max(100).catch("");

async function resolveModule() {
  const { supabase, tenant } = await resolveActiveClientTenant("lead.read");
  const leadDataModule = createServerLeadDataModule(supabase, tenant);
  const permissionSnapshot = await getRequestedPermissionSnapshot({
    agencyId: tenant.agencyId,
    clientId: tenant.clientId,
  });
  return {
    ...leadDataModule,
    canWrite: permissionSnapshot.permissions.includes("lead.write"),
  };
}

function failure(error: unknown, message: string) {
  return {
    ok: false as const,
    message: error instanceof DomainError ? error.publicMessage : message,
  };
}

export async function getCompaniesPageData(rawSearch?: string) {
  try {
    const { companies, context, canWrite } = await resolveModule();
    return {
      ok: true as const,
      data: {
        companies: await companies.list(searchSchema.parse(rawSearch), context),
        canWrite,
      },
    };
  } catch (error) {
    return failure(error, "Les entreprises sont temporairement indisponibles.");
  }
}

export async function getContactsPageData(rawSearch?: string) {
  try {
    const { contacts, companies, context, canWrite } = await resolveModule();
    const [contactRows, companyRows] = await Promise.all([
      contacts.list(searchSchema.parse(rawSearch), context),
      companies.list("", context),
    ]);
    return {
      ok: true as const,
      data: { contacts: contactRows, companies: companyRows, canWrite },
    };
  } catch (error) {
    return failure(error, "Les contacts sont temporairement indisponibles.");
  }
}

export async function getImportsPageData() {
  try {
    const { imports, context, canWrite } = await resolveModule();
    return {
      ok: true as const,
      data: { imports: await imports.list(context), canWrite },
    };
  } catch (error) {
    return failure(error, "Les imports sont temporairement indisponibles.");
  }
}

export async function getImportDetailData(importId: string) {
  try {
    const parsedId = z.uuid().parse(importId);
    const { imports, context, canWrite } = await resolveModule();
    const allImports = await imports.list(context);
    const selectedImport =
      allImports.find((dataImport) => dataImport.id === parsedId) ?? null;
    if (!selectedImport) {
      throw new DomainError("resource_not_found", "Import introuvable.");
    }
    return {
      ok: true as const,
      data: {
        dataImport: selectedImport,
        rows: await imports.listRows(parsedId, context),
        canWrite,
      },
    };
  } catch (error) {
    return failure(
      error,
      "Le rapport d’import est temporairement indisponible.",
    );
  }
}
