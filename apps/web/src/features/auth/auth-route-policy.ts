const protectedPrefixes = [
  "/account",
  "/agency",
  "/dashboard",
  "/clients",
  "/strategy",
  "/offers",
  "/icp-personas",
  "/companies",
  "/contacts",
  "/imports",
  "/leads",
  "/segments",
  "/campaigns",
  "/inbox",
  "/meetings",
  "/pipeline",
  "/analytics",
  "/compliance",
  "/integrations",
  "/settings",
] as const;
const protectedAuthPaths = ["/auth/update-password", "/auth/mfa"] as const;
const guestOnlyPaths = [
  "/auth/sign-in",
  "/auth/forgot-password",
  "/auth/register",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return (
    protectedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) || protectedAuthPaths.some((path) => pathname === path)
  );
}

export function isGuestOnlyPath(pathname: string): boolean {
  return guestOnlyPaths.some((path) => pathname === path);
}
