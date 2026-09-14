import { z } from "zod";

const supabasePublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type SupabasePublicEnv = {
  url: string;
  publishableKey: string;
};

let cachedEnv: SupabasePublicEnv | undefined;

export function getSupabasePublicEnv(): SupabasePublicEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = supabasePublicEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const missingKeys = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");

    throw new Error(
      `Invalid Supabase environment configuration: ${missingKeys || "unknown field"}. Copy .env.example to .env.local and provide the public project values.`,
    );
  }

  cachedEnv = {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };

  return cachedEnv;
}
