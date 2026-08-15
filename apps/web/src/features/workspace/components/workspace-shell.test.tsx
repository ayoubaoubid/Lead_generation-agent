// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/campaigns",
}));

vi.mock("@/features/auth/auth.actions", () => ({
  signOutAction: vi.fn(),
}));

vi.mock("@/features/agency/agency.actions", () => ({
  selectActiveAgencyAction: vi.fn(async () => ({ status: "idle" })),
}));

vi.mock("@/features/clients/client.actions", () => ({
  selectActiveClientAction: vi.fn(async () => ({ status: "idle" })),
}));

import { ApplicationShell } from "./workspace-shell";

afterEach(cleanup);

describe("application shell", () => {
  it("exposes the active navigation, tenant selectors and prepared utilities", () => {
    render(
      <ApplicationShell
        context={{
          user: {
            displayName: "Ayouba Oubid",
            email: "ayouba@example.com",
          },
          agencies: [
            { id: "a1000000-0000-4000-8000-000000000001", name: "Agency A" },
          ],
          clients: [
            { id: "c1000000-0000-4000-8000-000000000001", name: "Client A" },
          ],
          activeAgencyId: "a1000000-0000-4000-8000-000000000001",
          activeClientId: "c1000000-0000-4000-8000-000000000001",
        }}
      >
        <h1>Campaigns</h1>
      </ApplicationShell>,
    );

    const activeLinks = screen
      .getAllByRole("link", { name: "Campaigns" })
      .filter((link) => link.getAttribute("aria-current") === "page");

    expect(activeLinks).toHaveLength(1);
    expect(
      screen.getByRole("combobox", { name: "Agence active" }),
    ).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Client actif" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Ouvrir la recherche globale" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Ouvrir les notifications" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Ouvrir la navigation" }),
    ).toBeTruthy();
  });

  it("offers agency creation when the user has no workspace", () => {
    render(
      <ApplicationShell
        context={{
          user: {
            displayName: "Nouvel utilisateur",
            email: "new@example.com",
          },
          agencies: [],
          clients: [],
        }}
      >
        <h1>Dashboard</h1>
      </ApplicationShell>,
    );

    expect(
      screen
        .getByRole("link", { name: "Créer une agence" })
        .getAttribute("href"),
    ).toBe("/agency/new");
  });
});
