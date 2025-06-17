'use server';

import { createSupabaseServer } from '@/lib/supabaseClient';

/**
 * fields = { city_id, title, venue, event_date (ISO), description? }
 * Returns the new event’s id.
 */
export async function createEvent(fields) {
  const supabase = createSupabaseServer();

  const { data, error } = await supabase
    .from('events')
    .insert(fields)
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}
