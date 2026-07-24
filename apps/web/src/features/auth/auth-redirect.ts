const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback = DEFAULT_AUTHENTICATED_PATH,
): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  if (candidate.includes("\\") || /[\u0000-\u001f\u007f]/u.test(candidate)) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, "http://application.local");

    if (parsed.origin !== "http://application.local") {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function getPostAuthRedirectPath(
  candidate: string | null | undefined,
): string {
  const path = getSafeRedirectPath(candidate);

  return path.startsWith("/auth/") ? DEFAULT_AUTHENTICATED_PATH : path;
}

export function getCallbackRedirectPath(
  candidate: string | null | undefined,
  authType?: string | null,
): string {
  if (authType === "invite" || authType === "recovery") {
    return "/auth/update-password";
  }

  const path = getSafeRedirectPath(candidate);
  const allowedPaths = [
    "/dashboard",
    "/account/profile",
    "/auth/update-password",
    "/auth/mfa",
  ];

  return allowedPaths.some(
    (allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}?`),
  )
    ? path
    : DEFAULT_AUTHENTICATED_PATH;
}
