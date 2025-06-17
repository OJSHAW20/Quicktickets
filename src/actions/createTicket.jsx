// server action – inserts ticket and returns the new row’s id
'use server';

import { createSupabaseServer } from '@/lib/supabaseClient';

export async function createTicket(fields) {
  const supabase = createSupabaseServer();

  const { data, error } = await supabase
    .from('tickets')
    .insert(fields)
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id;        // used for redirect
}
