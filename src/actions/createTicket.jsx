'use server';

import { createSupabaseServer } from '@/lib/supabaseClient';
import { randomUUID } from 'crypto';

export async function createTicket({ 
  eventId, 
  sellerId,         // ← we’ll pass this in 
  price, 
  last_entry_time, 
  buyer_uni_only, 
  file 
}) {
  const svc = createSupabaseServer();

  // 1) upload image
  const ext = file.name.split('.').pop();
  const key = `tickets/${randomUUID()}.${ext}`;
  const { data: uploadData, error: uploadErr } = await svc
    .storage
    .from('ticket-proofs')
    .upload(key, file);
  if (uploadErr) throw new Error(`Upload error: ${uploadErr.message}`);

  // 2) insert with seller_id supplied
  const { data, error } = await svc
    .from('tickets')
    .insert({
      event_id:        eventId,
      seller_id:       sellerId,        // ← comes from the client
      price,
      last_entry_time,
      proof_url:       uploadData.path,
      buyer_uni_only,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  return data.id;
}
