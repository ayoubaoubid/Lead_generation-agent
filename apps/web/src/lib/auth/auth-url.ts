import "server-only";

import { getApplicationUrl } from "@/config/server-env";

export function buildPasswordRecoveryRedirectUrl(): string {
  const redirectUrl = new URL("/auth/callback", getApplicationUrl());
  redirectUrl.searchParams.set("next", "/auth/update-password");
  return redirectUrl.toString();
}
