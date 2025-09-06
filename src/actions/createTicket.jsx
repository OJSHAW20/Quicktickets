'use server';

import { createSupabaseServer } from '@/lib/supabaseClient';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

export async function createTicket({
  eventId,
  sellerId,
  price,
  last_entry_time,
  buyer_uni_only,
  file,
}) {
  const svc = createSupabaseServer();

  // HARD GATE: seller must have a connected Stripe account
  const { data: prof, error: profErr } = await svc
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', sellerId)
    .single();

  if (profErr || !prof?.stripe_account_id) {
    return { ok: false, code: 'STRIPE_ONBOARDING_REQUIRED' };
  }

  // --- existing validation ---
  if (!file || typeof file !== 'object') {
    return { ok: false, code: 'BAD_REQUEST', message: 'Missing file' };
  }
  const MAX_BYTES = 10 * 1024 * 1024;
  if (typeof file.size === 'number' && file.size > MAX_BYTES) {
    return { ok: false, code: 'BAD_REQUEST', message: 'File too large (max 10MB)' };
  }
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const originalName = typeof file.name === 'string' ? file.name : '';
  const ext = (originalName.split('.').pop() || '').toLowerCase();
  const mime = typeof file.type === 'string' ? file.type.toLowerCase() : '';
  if (ext === 'svg' || mime === 'image/svg+xml') {
    return { ok: false, code: 'BAD_REQUEST', message: 'SVG files are not allowed' };
  }
  const looksLikeAllowedExt = allowedExts.includes(ext);
  const looksLikeAllowedMime = allowedMimes.includes(mime);
  if (!looksLikeAllowedExt && !looksLikeAllowedMime) {
    return { ok: false, code: 'BAD_REQUEST', message: 'Only image files (jpeg, png, webp) are allowed' };
  }

  try {
    // 1) re-encode to WebP
    const inputBuf = Buffer.from(await file.arrayBuffer());
    const processed = await sharp(inputBuf)
      .rotate()
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // 2) upload
    const key = `tickets/${randomUUID()}.webp`;
    const { data: uploadData, error: uploadErr } = await svc
      .storage
      .from('ticket-proofs')
      .upload(key, processed, { contentType: 'image/webp', upsert: false });
    if (uploadErr) return { ok: false, code: 'UPLOAD_FAILED', message: uploadErr.message };

    // 3) insert ticket
    const { data, error } = await svc
      .from('tickets')
      .insert({
        event_id: eventId,
        seller_id: sellerId,
        price,
        last_entry_time,
        proof_url: uploadData.path,
        buyer_uni_only,
      })
      .select('id')
      .single();
    if (error) return { ok: false, code: 'DB_INSERT_FAILED', message: error.message };

    return { ok: true, id: data.id };
  } catch (e) {
    console.error('createTicket failed:', e);
    return { ok: false, code: 'INTERNAL', message: 'Could not create ticket' };
  }
}
