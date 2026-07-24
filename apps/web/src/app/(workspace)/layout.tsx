import type { ReactNode } from "react";

import { ApplicationShell } from "@/features/workspace/components/workspace-shell";
import { getWorkspaceShellContext } from "@/features/workspace/workspace-shell-context.service";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const context = await getWorkspaceShellContext();

  return <ApplicationShell context={context}>{children}</ApplicationShell>;
}
