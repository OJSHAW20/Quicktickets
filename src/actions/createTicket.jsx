'use server';

import { createSupabaseServer } from '@/lib/supabaseClient';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

export async function createTicket({ 
  eventId, 
  sellerId,         // ← we’ll pass this in 
  price, 
  last_entry_time, 
  buyer_uni_only, 
  file 
}) {
  const svc = createSupabaseServer();

  // 0) basic validation: require an image (jpeg/png/webp), max ~10MB
  if (!file || typeof file !== 'object') {
    throw new Error('Missing file');
  }
  const MAX_BYTES = 10 * 1024 * 1024; // 10MB
  if (typeof file.size === 'number' && file.size > MAX_BYTES) {
    throw new Error('File too large (max 10MB)');
  }
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const originalName = typeof file.name === 'string' ? file.name : '';
  const ext = (originalName.split('.').pop() || '').toLowerCase();
  const mime = typeof file.type === 'string' ? file.type.toLowerCase() : '';
  if (ext === 'svg' || mime === 'image/svg+xml') {
    throw new Error('SVG files are not allowed');
  }
  const looksLikeAllowedExt = allowedExts.includes(ext);
  const looksLikeAllowedMime = allowedMimes.includes(mime);
  if (!looksLikeAllowedExt && !looksLikeAllowedMime) {
    throw new Error('Only image files (jpeg, png, webp) are allowed');
  }

  // 1) re-encode to WebP, strip metadata, and bound dimensions (e.g., 2000x2000)
  const inputBuf = Buffer.from(await file.arrayBuffer());
  const processed = await sharp(inputBuf)
    .rotate() // respect orientation and normalize
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  // 2) upload processed image (always .webp)
  const safeExt = 'webp';
  const key = `tickets/${randomUUID()}.${safeExt}`;
  const { data: uploadData, error: uploadErr } = await svc
    .storage
    .from('ticket-proofs')
    .upload(key, processed, { contentType: 'image/webp', upsert: false });
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
