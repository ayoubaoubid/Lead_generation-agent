import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateAuthSession } from "./proxy";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/config/public-env", () => ({
  getSupabasePublicConfig: () => ({
    url: "https://example.supabase.co",
    publishableKey: "sb_publishable_example",
  }),
}));

const createServerClientMock = vi.mocked(createServerClient);

function configureAuthClient({
  claimsSubject = "user-1",
  user = { id: "user-1" },
}: Readonly<{
  claimsSubject?: string | null;
  user?: { id: string } | null;
}> = {}) {
  const getClaims = vi.fn().mockResolvedValue({
    data: claimsSubject ? { claims: { sub: claimsSubject } } : null,
    error: null,
  });
  const getUser = vi.fn().mockResolvedValue({
    data: { user },
    error: user ? null : new Error("User no longer exists."),
  });
  const signOut = vi.fn().mockResolvedValue({ error: null });

  createServerClientMock.mockReturnValue({
    auth: { getClaims, getUser, signOut },
  } as never);

  return { getClaims, getUser, signOut };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateAuthSession", () => {
  it("clears a stale local session instead of redirecting the sign-in page", async () => {
    const auth = configureAuthClient({ user: null });

    const response = await updateAuthSession(
      new NextRequest("http://localhost:3000/auth/sign-in"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(auth.getUser).toHaveBeenCalledOnce();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("redirects a current authenticated user away from the sign-in page", async () => {
    const auth = configureAuthClient();

    const response = await updateAuthSession(
      new NextRequest("http://localhost:3000/auth/sign-in"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard",
    );
    expect(auth.getUser).toHaveBeenCalledOnce();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("redirects an unauthenticated protected request to sign-in", async () => {
    const auth = configureAuthClient({ claimsSubject: null, user: null });

    const response = await updateAuthSession(
      new NextRequest("http://localhost:3000/dashboard"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/sign-in?next=%2Fdashboard",
    );
    expect(auth.getUser).not.toHaveBeenCalled();
  });
});
