import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — not instantiated at module load time (safe for Next.js build)
let _browserClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_browserClient) {
    _browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _browserClient;
}

// Alias so existing code using `supabase.channel(...)` still works
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    return (getSupabase() as any)[prop];
  },
});

export function createServerClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}
