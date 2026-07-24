import "server-only";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

type RequireAuthenticatedUserOptions = Readonly<{
  requireMfa?: boolean;
}>;

export async function requireAuthenticatedUser({
  requireMfa = true,
}: RequireAuthenticatedUserOptions = {}) {
  let supabase;

  try {
    supabase = await createServerSupabaseClient();
  } catch {
    redirect("/auth/sign-in?notice=configuration-unavailable");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/sign-in");
  }

  if (requireMfa) {
    const { data: assurance } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (assurance?.currentLevel === "aal1" && assurance.nextLevel === "aal2") {
      redirect("/auth/mfa");
    }
  }

  return { supabase, user };
}
