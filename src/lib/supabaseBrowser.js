import { createPagesBrowserClient }   from '@supabase/auth-helpers-nextjs';
// v0.9+ exposes createBrowserSupabaseClient().
// It automatically reads NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY.
export const createSupabaseBrowser = () => createPagesBrowserClient();