// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AuthorizedButton } from "./authorized-button";
import { PermissionGate } from "./permission-gate";

afterEach(cleanup);

describe("permission-aware UI controls", () => {
  it("hides gated content when the permission is absent", () => {
    render(
      <PermissionGate
        allOf={["campaign.launch"]}
        grantedPermissions={["campaign.approve"]}
      >
        <span>Launch campaign</span>
      </PermissionGate>,
    );

    expect(screen.queryByText("Launch campaign")).toBeNull();
  });

  it("disables an unauthorized action without presenting it as security", () => {
    render(
      <AuthorizedButton
        allOf={["campaign.launch"]}
        grantedPermissions={["campaign.approve"]}
      >
        Launch campaign
      </AuthorizedButton>,
    );

    const button = screen.getByRole("button", { name: "Launch campaign" });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("title")).toBe(
      "Vous n’avez pas la permission d’effectuer cette action.",
    );
  });

  it("can remove an unauthorized action from the interface", () => {
    render(
      <AuthorizedButton
        allOf={["settings.manage"]}
        grantedPermissions={["settings.read"]}
        unauthorizedMode="hide"
      >
        Manage settings
      </AuthorizedButton>,
    );

    expect(
      screen.queryByRole("button", { name: "Manage settings" }),
    ).toBeNull();
  });
});
