import { createClient } from '@supabase/supabase-js';

// Service-role client. SERVER-SIDE ONLY — never import this from a
// 'use client' file or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
// Used for operations that must bypass RLS in a controlled way,
// e.g. bulk CSV import running inside a verified-admin server action.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
