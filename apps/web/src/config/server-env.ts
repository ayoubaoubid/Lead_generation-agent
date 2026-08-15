import "server-only";

import { z } from "zod";

const emptyAsUndefined = (value: unknown) => (value === "" ? undefined : value);
const optionalSecret = z.preprocess(
  emptyAsUndefined,
  z.string().min(1).optional(),
);
const optionalUrl = z.preprocess(emptyAsUndefined, z.url().optional());

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  APP_URL: optionalUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  TRIGGER_SECRET_KEY: optionalSecret,
  SENTRY_DSN: optionalUrl,
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
  RESEND_FROM_EMAIL: z.preprocess(emptyAsUndefined, z.email().optional()),
  GOOGLE_CLIENT_ID: optionalSecret,
  GOOGLE_CLIENT_SECRET: optionalSecret,
  INBOUND_WEBHOOK_SECRET: optionalSecret,
  INBOUND_WEBHOOK_PROVIDER: z.preprocess(
    emptyAsUndefined,
    z.string().trim().min(2).max(80).default("generic-email"),
  ),
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
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  INBOUND_WEBHOOK_SECRET: process.env.INBOUND_WEBHOOK_SECRET,
  INBOUND_WEBHOOK_PROVIDER: process.env.INBOUND_WEBHOOK_PROVIDER,
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
