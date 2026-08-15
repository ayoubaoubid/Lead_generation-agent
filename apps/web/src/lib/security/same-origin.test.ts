import { describe, expect, it } from "vitest";

import { isSameOriginMutation } from "@/lib/security/same-origin";

describe("isSameOriginMutation", () => {
  it("accepts a matching browser origin", () => {
    expect(
      isSameOriginMutation(
        new Request("https://app.example.com/api/imports/prepare", {
          method: "POST",
          headers: { origin: "https://app.example.com" },
        }),
      ),
    ).toBe(true);
  });

  it("rejects missing and cross-site origins", () => {
    expect(
      isSameOriginMutation(
        new Request("https://app.example.com/api/imports/prepare", {
          method: "POST",
        }),
      ),
    ).toBe(false);
    expect(
      isSameOriginMutation(
        new Request("https://app.example.com/api/imports/prepare", {
          method: "POST",
          headers: { origin: "https://evil.example" },
        }),
      ),
    ).toBe(false);
  });
});
