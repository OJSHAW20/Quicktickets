// src/actions/addInterest.js
'use server';

import { createSupabaseServer } from '@/lib/supabaseClient';

export async function addInterest(eventId) {
  const supabase = createSupabaseServer();
  await supabase.from('interest').insert({ event_id: eventId });
}
