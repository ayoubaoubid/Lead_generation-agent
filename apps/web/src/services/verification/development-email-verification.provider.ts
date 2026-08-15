import type {
  ProviderContext,
  ProviderResult,
} from "@/services/providers/provider-context";
import type { EmailVerificationProvider } from "@/services/verification/email-verification.provider";
import type { NormalizedEmailVerification } from "@/validations/verification/email-verification.schema";

const disposableDomains = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
]);
const rolePrefixes = new Set([
  "admin",
  "contact",
  "hello",
  "info",
  "sales",
  "support",
]);

export class DevelopmentEmailVerificationProvider implements EmailVerificationProvider {
  async verifyEmail(
    _context: ProviderContext,
    input: Readonly<{ contactId: string; email: string }>,
  ): Promise<ProviderResult<NormalizedEmailVerification>> {
    const [localPart = "", domain = ""] = input.email.split("@");
    const disposable = disposableDomains.has(domain);
    const roleBased = rolePrefixes.has(localPart);
    const invalid = domain.endsWith(".invalid");
    const status = invalid
      ? "invalid"
      : disposable
        ? "disposable"
        : roleBased
          ? "role_based"
          : "unknown";
    const checkedAt = new Date().toISOString();

    return {
      data: {
        status,
        providerStatus: status,
        providerSubStatus: "development_heuristic",
        checkedAt,
        expiresAt: null,
        confidenceScore: invalid || disposable || roleBased ? 100 : null,
      },
      provider: "development-mock",
      observedAt: checkedAt,
      usage: [
        {
          operation: "email_verification",
          quantity: 1,
          unit: "development_request",
        },
      ],
      cost: { amount: 0, currency: "USD" },
      warnings: [
        {
          code: "development_only",
          message:
            "Development verification cannot confirm deliverability or mailbox existence.",
        },
      ],
      sanitizedRawResult: {
        mode: "heuristic_only",
        contactId: input.contactId,
        status,
      },
    };
  }
}
