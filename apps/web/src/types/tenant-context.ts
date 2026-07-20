export type UserActor = Readonly<{
  kind: "user";
  actorId: string;
}>;

export type ServiceActor = Readonly<{
  kind: "service";
  serviceName: string;
}>;

export type ActorIdentity = UserActor | ServiceActor;

export type AgencyTenantContext = Readonly<{
  scope: "agency";
  agencyId: string;
  actor: ActorIdentity;
}>;

export type ClientTenantContext = Readonly<{
  scope: "client";
  agencyId: string;
  clientId: string;
  actor: ActorIdentity;
}>;

export type TenantContext = AgencyTenantContext | ClientTenantContext;
