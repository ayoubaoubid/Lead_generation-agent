import "server-only";

import { z } from "zod";

const optionalSecret = z.string().min(1).optional();

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  TRIGGER_SECRET_KEY: optionalSecret,
  SENTRY_DSN: z.url().optional(),
  GROQ_API_KEY: optionalSecret,
  APOLLO_API_KEY: optionalSecret,
  FIRECRAWL_API_KEY: optionalSecret,
  ZEROBOUNCE_API_KEY: optionalSecret,
  RESEND_API_KEY: optionalSecret,
  GOOGLE_CLIENT_ID: optionalSecret,
  GOOGLE_CLIENT_SECRET: optionalSecret,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const serverEnv: ServerEnv = serverEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  APOLLO_API_KEY: process.env.APOLLO_API_KEY,
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
  ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
});
