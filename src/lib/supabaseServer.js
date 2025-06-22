// src/lib/supabaseServer.js
import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';

/** Returns a Supabase client that reads/writes the auth cookies.
 *  Use ONLY inside Server Components or Server Actions. */
export function createSupabaseServer() {
  return createServerActionClient({ cookies });
}
