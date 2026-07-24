import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getCallbackRedirectPath } from "@/features/auth/auth-redirect";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const allowedOtpTypes = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const rawType = request.nextUrl.searchParams.get("type");

  if (tokenHash && rawType && allowedOtpTypes.has(rawType as EmailOtpType)) {
    const type = rawType as EmailOtpType;

    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (!error) {
        const nextPath = getCallbackRedirectPath(
          request.nextUrl.searchParams.get("next"),
          type,
        );
        return NextResponse.redirect(new URL(nextPath, request.url));
      }
    } catch {
      // A safe, generic notice is returned below.
    }
  }

  return NextResponse.redirect(
    new URL("/auth/sign-in?notice=link-invalid", request.url),
  );
}
