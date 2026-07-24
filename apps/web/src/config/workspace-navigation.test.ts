import { describe, expect, it } from "vitest";

import {
  getWorkspaceBreadcrumbs,
  getWorkspaceSectionByPath,
  workspaceNavigationGroups,
  workspaceSections,
} from "./workspace-navigation";

describe("workspace navigation", () => {
  it("exposes each requested section exactly once", () => {
    expect(workspaceSections.map((section) => section.label)).toEqual([
      "Dashboard",
      "Clients",
      "Strategy",
      "Offers",
      "ICP & Personas",
      "Companies",
      "Contacts",
      "Leads",
      "Segments",
      "Campaigns",
      "Inbox",
      "Meetings",
      "Pipeline",
      "Analytics",
      "Integrations",
      "Settings",
    ]);

    const groupedKeys = workspaceNavigationGroups.flatMap(
      (group) => group.sectionKeys,
    );
    expect(groupedKeys).toHaveLength(workspaceSections.length);
    expect(new Set(groupedKeys).size).toBe(workspaceSections.length);
  });

  it("resolves active nested paths without accepting unrelated routes", () => {
    expect(getWorkspaceSectionByPath("/campaigns/draft")?.key).toBe(
      "campaigns",
    );
    expect(getWorkspaceSectionByPath("/campaign")).toBeUndefined();
  });

  it("builds concise, linked breadcrumbs", () => {
    expect(getWorkspaceBreadcrumbs("/dashboard")).toEqual([
      { label: "Dashboard" },
    ]);
    expect(getWorkspaceBreadcrumbs("/contacts")).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Contacts" },
    ]);
  });
});
