import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 1) client-side singleton (optional, for use in 'use client' components)
export const supabaseBrowser = createClient(url, key);

// 2) server helper — THIS is what Home() needs
export function createSupabaseServer() {
  return createClient(url, key);
}