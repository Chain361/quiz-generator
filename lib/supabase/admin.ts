import { createClient } from "@supabase/supabase-js";

/**
 * This is a server-only Supabase client initialized with the service_role key.
 * It can be used to perform administrative tasks that require bypassing RLS.
 *
 * IMPORTANT: This client should NEVER be used or exposed on the client-side.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
