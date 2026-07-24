"use client";

import type { PermissionKey } from "@/domain/members/permission";
import { Button, type ButtonProps } from "@/components/ui/button";
import { satisfiesPermissionRequirement } from "@/services/authorization/permission.service";

export type AuthorizedButtonProps = ButtonProps & {
  allOf?: readonly PermissionKey[];
  anyOf?: readonly PermissionKey[];
  grantedPermissions: readonly PermissionKey[];
  unauthorizedMessage?: string;
  unauthorizedMode?: "hide" | "disable";
};

export function AuthorizedButton({
  allOf,
  anyOf,
  disabled,
  grantedPermissions,
  title,
  unauthorizedMessage = "Vous n’avez pas la permission d’effectuer cette action.",
  unauthorizedMode = "disable",
  ...props
}: AuthorizedButtonProps) {
  const isAuthorized = satisfiesPermissionRequirement(grantedPermissions, {
    ...(allOf ? { allOf } : {}),
    ...(anyOf ? { anyOf } : {}),
  });

  if (!isAuthorized && unauthorizedMode === "hide") {
    return null;
  }

  return (
    <Button
      aria-disabled={disabled || !isAuthorized || undefined}
      disabled={disabled || !isAuthorized}
      title={!isAuthorized ? unauthorizedMessage : title}
      {...props}
    />
  );
}
