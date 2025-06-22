'use server';

import { createSupabaseServer } from '../lib/supabaseServer';   // one level up

/**
 * fields = {
 *   city_id,
 *   title,
 *   venue,
 *   event_date,   // ISO string
 *   description?  // optional
 * }
 * Returns the newly-inserted event id.
 */
export async function createEvent(fields) {
  /* 1⃣  get the Supabase server client (reads auth cookies) */
  const supabase = createSupabaseServer();

  /* 2⃣  fetch the logged-in user so we can satisfy RLS */
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw new Error(userErr.message);
  if (!user)   throw new Error('Not signed in');

  /* 3⃣  add created_by and insert */
  const { data, error } = await supabase
    .from('events')
    .insert({
      ...fields,
      created_by: user.id,        // 🔑 REQUIRED by your RLS policy
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  return data.id;
}
