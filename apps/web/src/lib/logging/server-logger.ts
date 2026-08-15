import "server-only";

import {
  sanitizeLogContext,
  type LogContext,
  type LogError,
  type Logger,
} from "@/lib/logging/logger";

function serialize(
  level: string,
  message: string,
  context: LogContext,
  error?: LogError,
) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitizeLogContext(context),
    ...(error ? { error } : {}),
  });
}

export const serverLogger: Logger = {
  debug(message, context) {
    console.debug(serialize("debug", message, context));
  },
  info(message, context) {
    console.info(serialize("info", message, context));
  },
  warn(message, context) {
    console.warn(serialize("warn", message, context));
  },
  error(message, error, context) {
    console.error(serialize("error", message, context, error));
  },
};
