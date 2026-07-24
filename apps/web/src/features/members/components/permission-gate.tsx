import type { ReactNode } from "react";

import type {
  PermissionKey,
  PermissionRequirement,
} from "@/domain/members/permission";
import { satisfiesPermissionRequirement } from "@/services/authorization/permission.service";

export type PermissionGateProps = PermissionRequirement &
  Readonly<{
    children: ReactNode;
    fallback?: ReactNode;
    grantedPermissions: readonly PermissionKey[];
  }>;

export function PermissionGate({
  allOf,
  anyOf,
  children,
  fallback = null,
  grantedPermissions,
}: PermissionGateProps) {
  const isAuthorized = satisfiesPermissionRequirement(grantedPermissions, {
    ...(allOf ? { allOf } : {}),
    ...(anyOf ? { anyOf } : {}),
  });

  return isAuthorized ? children : fallback;
}
