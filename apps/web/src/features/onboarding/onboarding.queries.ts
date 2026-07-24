import "server-only";

import { DomainError } from "@/domain/errors/domain-error";
import { getOnboardingProgress } from "@/domain/onboarding/onboarding";
import { buildOnboardingSkillContexts } from "@/domain/onboarding/onboarding-skill-context";
import { getRequestedPermissionSnapshot } from "@/lib/authorization/server-permissions";
import { createServerOnboardingModule } from "@/lib/onboarding/server-onboarding-module";
import { resolveActiveClientTenant } from "@/lib/tenancy/server-tenant-context";
import { onboardingStepQuerySchema } from "@/validations/onboarding/onboarding.schema";

export async function getOnboardingPageData(
  rawQuery: Readonly<Record<string, string | string[] | undefined>>,
) {
  try {
    const query = onboardingStepQuerySchema.parse({ step: rawQuery.step });
    const { supabase, tenant } =
      await resolveActiveClientTenant("onboarding.read");
    const { context, service } = createServerOnboardingModule(supabase, tenant);
    const [session, permissionSnapshot] = await Promise.all([
      service.find(context),
      getRequestedPermissionSnapshot({
        agencyId: tenant.agencyId,
        clientId: tenant.clientId,
      }),
    ]);

    return {
      ok: true as const,
      data: {
        query,
        session,
        progress: getOnboardingProgress(session.completedStepCount),
        canWrite: permissionSnapshot.permissions.includes("onboarding.write"),
        canValidate: permissionSnapshot.permissions.includes(
          "onboarding.validate",
        ),
        preparedSkillContexts: buildOnboardingSkillContexts(session),
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof DomainError
          ? error.publicMessage
          : "L’onboarding est temporairement indisponible.",
    };
  }
}
