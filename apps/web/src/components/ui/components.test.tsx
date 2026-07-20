// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { Button, Dialog, FormField, Input, Tabs } from ".";

afterEach(cleanup);

describe("design system accessibility", () => {
  it("disables a loading button while keeping its accessible name", () => {
    render(<Button loading>Enregistrer</Button>);

    const button = screen.getByRole("button", { name: "Enregistrer" });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("exposes invalid fields and their error message", () => {
    render(
      <FormField error="Adresse invalide" htmlFor="email" label="Email">
        <Input id="email" invalid />
      </FormField>,
    );

    expect(screen.getByLabelText("Email").getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(screen.getByRole("alert").textContent).toBe("Adresse invalide");
  });

  it("opens a dialog, moves focus inside it, and closes with Escape", async () => {
    const user = userEvent.setup();
    render(
      <Dialog title="Confirmer" trigger={<Button>Ouvrir</Button>}>
        <Button>Action interne</Button>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Ouvrir" }));
    const dialog = screen.getByRole("dialog", { name: "Confirmer" });
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Confirmer" })).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Ouvrir" }),
    );
  });

  it("supports arrow-key navigation between tabs", async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        items={[
          { value: "first", label: "Premier", content: "Contenu un" },
          { value: "second", label: "Second", content: "Contenu deux" },
        ]}
      />,
    );

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("tab", { name: "Premier" }),
    );
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(
      screen.getByRole("tab", { name: "Second" }),
    );
    expect(screen.getByRole("tabpanel").textContent).toBe("Contenu deux");
  });
});
