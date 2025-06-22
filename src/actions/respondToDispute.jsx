// src/actions/respondToDispute.jsx
'use server';

import { createSupabaseServer } from '@/lib/supabaseServer';

/**
 * Next will call this action with the form’s FormData.
 * We extract the two fields by name, validate them,
 * then update & .single() so Supabase returns exactly one row.
 */
export async function respondToDispute(formData) {
  // grab the two inputs from the submitted form
  const disputeId = formData.get('disputeId')?.toString();
  const response  = formData.get('response') ?.toString();

  if (!disputeId || !response) {
    throw new Error('Missing disputeId or response');
  }

  const supabase = createSupabaseServer();

  // update exactly that dispute, return a single object
  const { data, error } = await supabase
    .from('disputes')
    .update({ seller_response: response })
    .eq('id', disputeId)
    .select('id')
    .single();

  if (error) {
    console.error('respondToDispute error', error);
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error(`No dispute found with id ${disputeId}`);
  }

  return data.id;
}
