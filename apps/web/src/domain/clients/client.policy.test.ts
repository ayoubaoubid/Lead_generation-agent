import { describe, expect, it } from "vitest";

import { DomainError } from "@/domain/errors/domain-error";

import {
  assertClientCanBeArchived,
  assertClientCanBeEdited,
} from "./client.policy";

describe("client lifecycle policy", () => {
  it("allows editing and archiving an operational client", () => {
    expect(() => assertClientCanBeEdited("onboarding")).not.toThrow();
    expect(() => assertClientCanBeArchived("paused")).not.toThrow();
  });

  it("rejects mutations after archival", () => {
    for (const assertion of [
      () => assertClientCanBeEdited("archived"),
      () => assertClientCanBeArchived("archived"),
    ]) {
      expect(assertion).toThrowError(DomainError);
    }
  });
});
