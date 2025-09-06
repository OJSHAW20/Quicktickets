// src/app/api/cron/release-funds/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServer } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export async function GET(req) {
  // 1) Protect the endpoint
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2) Optional dry-run flag
  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dryRun') === '1';

  const db = createSupabaseServer();

  // 3) Pick orders that are READY TO PAY OUT
  // - status: complete (set by webhook)
  // - not yet transferred
  // - older than 24h (simple protection window)
  const cutoff = new Date(Date.now() - 24 * 3600e3).toISOString();
  const { data: orders, error: fetchErr } = await db
    .from('orders')
    .select('id, amount_cents, currency, seller_id, charge_id, transfer_id, transfer_status, created_at')
    .eq('status', 'complete')
    .is('transfer_id', null)
    .lt('created_at', cutoff);

  if (fetchErr) {
    console.error('Fetch orders error:', fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const results = [];
  for (const o of orders || []) {
    try {
      // 4) Get seller’s connected account
      const { data: profile, error: profErr } = await db
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', o.seller_id)
        .single();

      const sellerAcct = profile?.stripe_account_id || null;
      if (!sellerAcct) {
        // Mark as waiting for seller onboarding; try again later
        await db.from('orders').update({ transfer_status: 'waiting_seller_onboarding' }).eq('id', o.id);
        results.push({ order: o.id, status: 'skipped_no_seller_account' });
        continue;
      }

      const amount = Number(o.amount_cents) || 0;
      const currency = (o.currency || 'gbp').toLowerCase();
      if (!(amount > 0)) {
        await db.from('orders').update({ transfer_status: 'failed_invalid_amount' }).eq('id', o.id);
        results.push({ order: o.id, status: 'failed_invalid_amount' });
        continue;
      }

      if (dryRun) {
        results.push({ order: o.id, status: 'dryRun', destination: sellerAcct, amount, currency });
        continue;
      }

      // 5) Create Transfer; link to the original charge if we have it
      const idempotencyKey = `transfer_order_${o.id}`;
      const transfer = await stripe.transfers.create(
        {
          amount,
          currency,
          destination: sellerAcct,
          ...(o.charge_id ? { source_transaction: o.charge_id } : {}),
        },
        { idempotencyKey }
      );

      // 6) Persist transfer info
      await db
        .from('orders')
        .update({
          transfer_id: transfer.id,
          transfer_status: 'paid',
          released_at: new Date().toISOString(),
        })
        .eq('id', o.id);

      results.push({ order: o.id, status: 'paid', transfer_id: transfer.id });
    } catch (err) {
      console.error(`Transfer failed for order ${o.id}:`, err?.message || err);
      await db.from('orders').update({ transfer_status: 'failed' }).eq('id', o.id);
      results.push({ order: o.id, status: 'failed' });
    }
  }

  return NextResponse.json({ ok: true, dryRun, processed: results.length, results });
}
