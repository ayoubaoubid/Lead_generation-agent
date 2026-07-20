import type { ActorIdentity } from "@/types/tenant-context";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogAttribute = boolean | number | string | null;

export type LogContext = Readonly<{
  correlationId: string;
  operation: string;
  agencyId?: string;
  clientId?: string;
  actor?: ActorIdentity;
  resourceType?: string;
  resourceId?: string;
  attributes?: Readonly<Record<string, LogAttribute>>;
}>;

export type LogError = Readonly<{
  name: string;
  code?: string;
  message: string;
}>;

export interface Logger {
  debug(message: string, context: LogContext): void;
  info(message: string, context: LogContext): void;
  warn(message: string, context: LogContext): void;
  error(message: string, error: LogError, context: LogContext): void;
}
