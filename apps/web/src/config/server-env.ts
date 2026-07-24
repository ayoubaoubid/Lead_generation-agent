import "server-only";

import { z } from "zod";

const optionalSecret = z.string().min(1).optional();
const emptyAsUndefined = (value: unknown) => (value === "" ? undefined : value);

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  APP_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  TRIGGER_SECRET_KEY: optionalSecret,
  SENTRY_DSN: z.url().optional(),
  LLM_PROVIDER: z.preprocess(
    emptyAsUndefined,
    z.literal("groq").default("groq"),
  ),
  GROQ_API_KEY: optionalSecret,
  GROQ_MODEL: z.preprocess(
    emptyAsUndefined,
    z.literal("openai/gpt-oss-20b").default("openai/gpt-oss-20b"),
  ),
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
  APP_URL: process.env.APP_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
  LLM_PROVIDER: process.env.LLM_PROVIDER,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL,
  APOLLO_API_KEY: process.env.APOLLO_API_KEY,
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
  ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
});

export function getApplicationUrl(): string {
  if (serverEnv.APP_URL) {
    return serverEnv.APP_URL;
  }

  if (serverEnv.NODE_ENV === "production") {
    throw new Error("APP_URL is required in production.");
  }

  return "http://localhost:3000";
}
