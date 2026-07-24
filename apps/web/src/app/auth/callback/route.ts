import { NextResponse, type NextRequest } from "next/server";

import { getCallbackRedirectPath } from "@/features/auth/auth-redirect";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = getCallbackRedirectPath(
    request.nextUrl.searchParams.get("next"),
  );

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
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
