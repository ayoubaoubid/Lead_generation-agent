import { z } from "zod";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function parsePublicEnv(
  input: Record<string, string | undefined>,
): PublicEnv {
  return publicEnvSchema.parse(input);
}

export const publicEnv = parsePublicEnv({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

export type SupabasePublicConfig = Readonly<{
  url: string;
  publishableKey: string;
}>;

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return url && publishableKey ? { publishableKey, url } : null;
}
