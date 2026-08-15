import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicConfig } from "@/config/public-env";
import {
  isGuestOnlyPath,
  isProtectedPath,
} from "@/features/auth/auth-route-policy";
import { getSafeRedirectPath } from "@/features/auth/auth-redirect";
import type { Database } from "@/types/database.generated";

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

export async function updateAuthSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const config = getSupabasePublicConfig();

  if (!config) {
    if (isProtectedPath(pathname)) {
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = "/auth/sign-in";
      signInUrl.search = "";
      signInUrl.searchParams.set("notice", "configuration-unavailable");
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    config.url,
    config.publishableKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, options, value }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const hasVerifiedClaims = !error && Boolean(data?.claims.sub);

  if (!hasVerifiedClaims && isProtectedPath(pathname)) {
    const signInUrl = request.nextUrl.clone();
    const nextPath = getSafeRedirectPath(
      `${pathname}${request.nextUrl.search}`,
      "/dashboard",
    );
    signInUrl.pathname = "/auth/sign-in";
    signInUrl.search = "";
    signInUrl.searchParams.set("next", nextPath);
    return copyResponseCookies(response, NextResponse.redirect(signInUrl));
  }

  if (hasVerifiedClaims && isGuestOnlyPath(pathname)) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      await supabase.auth.signOut({ scope: "local" });
      return response;
    }

    const profileUrl = request.nextUrl.clone();
    profileUrl.pathname = "/dashboard";
    profileUrl.search = "";
    return copyResponseCookies(response, NextResponse.redirect(profileUrl));
  }

  return response;
}
