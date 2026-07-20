import { describe, expect, it } from "vitest";

import { parsePublicEnv } from "./public-env";

describe("parsePublicEnv", () => {
  it("accepts an empty configuration before Supabase is enabled", () => {
    expect(parsePublicEnv({})).toEqual({});
  });

  it("accepts a valid public Supabase configuration", () => {
    const input = {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    };

    expect(parsePublicEnv(input)).toEqual(input);
  });

  it("rejects an invalid public URL", () => {
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "not-a-url" }),
    ).toThrow();
  });
});
