import type {
  ProviderContext,
  ProviderResult,
} from "@/services/providers/provider-context";
import type { NormalizedEmailVerification } from "@/validations/verification/email-verification.schema";

export type EmailVerificationRequest = Readonly<{
  contactId: string;
  email: string;
}>;

export interface EmailVerificationProvider {
  verifyEmail(
    context: ProviderContext,
    request: EmailVerificationRequest,
  ): Promise<ProviderResult<NormalizedEmailVerification>>;
}
