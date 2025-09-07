// src/actions/createTicket.jsx
'use server';

import { createSupabaseServer } from '@/lib/supabaseClient';
import { randomUUID } from 'crypto';

/**
 * MVP action — trusts sellerId from the client.
 * Dynamic-imports sharp; always returns { ok, code, message, id? }.
 */
export async function createTicket({
  eventId,
  sellerId,            // ← MVP: client-provided
  price,
  last_entry_time,
  buyer_uni_only,
  file,                // ← a real File/Blob when called via the wrapper below
}) {
  const svc = createSupabaseServer();

  try {
    // 0) Stripe check
    const { data: prof } = await svc
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', sellerId)
      .single();

    if (!prof?.stripe_account_id) {
      return { ok: false, code: 'STRIPE_ONBOARDING_REQUIRED', message: 'Connect Stripe to receive payouts.' };
    }

    // 1) Validate inputs
    const amount = Number(price);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, code: 'BAD_REQUEST', message: 'Invalid price.' };
    }
    if (!file || typeof file !== 'object') {
      return { ok: false, code: 'BAD_REQUEST', message: 'Missing image file.' };
    }

    const MAX_BYTES = 10 * 1024 * 1024;
    if (typeof file.size === 'number' && file.size > MAX_BYTES) {
      return { ok: false, code: 'BAD_REQUEST', message: 'File too large (max 10MB).' };
    }

    const name = typeof file.name === 'string' ? file.name : '';
    const ext  = (name.split('.').pop() || '').toLowerCase();
    const mime = typeof file.type === 'string' ? file.type.toLowerCase() : '';
    const allowedExts  = ['jpg', 'jpeg', 'png', 'webp'];
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (ext === 'svg' || mime === 'image/svg+xml') {
      return { ok: false, code: 'BAD_REQUEST', message: 'SVG files are not allowed.' };
    }
    if (!allowedExts.includes(ext) && !allowedMimes.includes(mime)) {
      return { ok: false, code: 'BAD_REQUEST', message: 'Only jpeg/png/webp images are allowed.' };
    }

    // 2) Read file
    const inputBuf = Buffer.from(await file.arrayBuffer());

    // 3) Try sharp → webp; fallback to original
    let outBuf  = inputBuf;
    let outExt  = ext || 'webp';
    let outMime = mime || 'image/webp';
    try {
      const sharpMod = await import('sharp').catch(() => null);
      const sharp = sharpMod?.default || sharpMod;
      if (sharp) {
        outBuf = await sharp(inputBuf)
          .rotate()
          .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
        outExt  = 'webp';
        outMime = 'image/webp';
      }
    } catch (e) {
      console.log('[createTicket] sharp unavailable, using original bytes:', e?.message || e);
    }

    // 4) Upload
    const key = `tickets/${randomUUID()}.${outExt}`;
    const { data: uploadData, error: uploadErr } = await svc
      .storage
      .from('ticket-proofs')
      .upload(key, outBuf, { contentType: outMime, upsert: false });

    if (uploadErr) {
      const msg = uploadErr?.message || uploadErr?.error || JSON.stringify(uploadErr);
      return { ok: false, code: 'UPLOAD_FAILED', message: msg };
    }

    // 5) Insert DB row
    const { data, error } = await svc
      .from('tickets')
      .insert({
        event_id: eventId,
        seller_id: sellerId,       // ← MVP: client-provided
        price: Number(amount),
        last_entry_time,
        proof_url: uploadData.path,
        buyer_uni_only,
        status: 'available',
      })
      .select('id')
      .single();

    if (error) {
      return { ok: false, code: 'DB_INSERT_FAILED', message: error.message || 'Could not save ticket.' };
    }

    return { ok: true, id: data.id };
  } catch (e) {
    console.error('[createTicket] fatal:', e);
    return { ok: false, code: 'INTERNAL', message: 'Unexpected server error.' };
  }
}

/**
 * Wrapper that accepts FormData so File uploads are stable with server actions.
 * Call THIS from the client.
 */
export async function createTicketFromForm(formData) {
  'use server';
  const eventId         = formData.get('eventId');
  const sellerId        = formData.get('sellerId'); // MVP trusts client
  const price           = formData.get('price');
  const last_entry_time = formData.get('last_entry_time');
  const buyer_uni_only  = String(formData.get('buyer_uni_only')) === 'true';
  const file            = formData.get('file');     // real File/Blob on the server

  return await createTicket({
    eventId,
    sellerId,
    price,
    last_entry_time,
    buyer_uni_only,
    file,
  });
}
