// lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

const url        = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 1) client-side singleton (for use in 'use client' components)
export const supabaseBrowser = createClient(url, anonKey);

// 2) server helper — for use in server actions only
export function createSupabaseServer() {
  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  });
}
