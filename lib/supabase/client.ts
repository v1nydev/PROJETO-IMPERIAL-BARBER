"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";

type BrowserClient = ReturnType<typeof createBrowserClient>;

let browserClient: BrowserClient | undefined;

export function getSupabaseBrowserClient(): BrowserClient {
  if (browserClient) return browserClient;

  const { url, publishableKey } = getSupabasePublicEnv();
  browserClient = createBrowserClient(url, publishableKey);
  return browserClient;
}
