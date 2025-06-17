// server-only function to fetch current count
'use server';
import { createSupabaseServer } from '@/lib/supabaseClient';

export async function fetchInterestCount(eventId) {
  const supabase = createSupabaseServer();
  const { count } = await supabase
    .from('interest')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);
  return count ?? 0;
}
