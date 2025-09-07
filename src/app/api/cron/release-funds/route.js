export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServer } from '@/lib/supabaseClient';

// Keep your existing API version if you prefer
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export async function GET(req) {
  // ───────────────────────────────────────────────────────────────────────────
  // 0) Protect the endpoint
  // ───────────────────────────────────────────────────────────────────────────
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun       = url.searchParams.get('dryRun') === '1';
  const ignoreCutoff = url.searchParams.get('ignoreCutoff') === '1';

  // Fee knobs
  const PLATFORM_FEE_BPS = Number.parseInt(process.env.PLATFORM_FEE_BPS ?? '0', 10); // e.g., 500 = 5%
  const BUFFER_PENCE     = Number.parseInt(process.env.TRANSFER_SAFETY_BUFFER_PENCE ?? '0', 10); // e.g., 1-2 p

  const db = createSupabaseServer();

  // ───────────────────────────────────────────────────────────────────────────
  // 1) Find orders that are complete, not yet transferred
  // ───────────────────────────────────────────────────────────────────────────
  const cutoffIso = new Date(Date.now() - 24 * 3600e3).toISOString();

  // We need: id, created_at, charge/payment ids, and the ticket's seller_id
  const baseSel = `
    id, status, created_at,
    charge_id, payment_intent_id, stripe_payment_intent,
    transfer_id, transfer_status,
    ticket:tickets(id, seller_id)
  `;

  let query = db
    .from('orders')
    .select(baseSel)
    .eq('status', 'complete')
    .is('transfer_id', null);

  if (!ignoreCutoff) {
    query = query.lt('created_at', cutoffIso);
  }

  const { data: orders, error: fetchErr } = await query;

  if (fetchErr) {
    console.error('[cron] fetch orders error:', fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, results: [], dryRun, ignoreCutoff });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2) Process each order → compute seller payout from the charge's balance txn
  // ───────────────────────────────────────────────────────────────────────────
  const results = [];
  let processed = 0;

  for (const order of orders) {
    try {
      const sellerId = order?.ticket?.seller_id;
      if (!sellerId) {
        results.push({ order: order.id, status: 'skipped_no_seller', reason: 'No ticket.seller_id' });
        continue;
      }

      // Resolve the charge id (prefer saved charge_id; else derive from PI)
      let chargeId = order.charge_id ?? null;

      if (!chargeId) {
        const piId = order.payment_intent_id || order.stripe_payment_intent;
        if (!piId) {
          results.push({ order: order.id, status: 'skipped_no_charge', reason: 'No charge_id or payment_intent_id' });
          continue;
        }
        const pi = await stripe.paymentIntents.retrieve(piId, {
          expand: ['charges.data.balance_transaction'],
        });
        const charges = pi?.charges?.data || [];
        if (charges.length === 0) {
          results.push({ order: order.id, status: 'skipped_no_charge', reason: 'PI has no charges yet' });
          continue;
        }
        // take the latest charge
        const ch = charges[charges.length - 1];
        chargeId = ch.id;
      }

      // Retrieve charge with expanded balance_transaction (for net/fee)
      const charge = await stripe.charges.retrieve(chargeId, { expand: ['balance_transaction'] });
      let bt = charge.balance_transaction;

      if (typeof bt === 'string') {
        bt = await stripe.balanceTransactions.retrieve(bt);
      }
      if (!bt || typeof bt.amount !== 'number') {
        results.push({ order: order.id, status: 'skipped_no_bt', reason: 'Missing balance transaction' });
        continue;
      }

      // Stripe returns amounts in the smallest currency unit (e.g., pence)
      const gross       = bt.amount; // e.g., 100 for £1.00
      const stripeFee   = bt.fee;    // e.g., 22 for 20p + ~1.5% on £1
      const net         = bt.net;    // = gross - fee
      const currency    = charge.currency || 'gbp';
      const platformFee = Math.max(0, Math.round((gross * PLATFORM_FEE_BPS) / 10_000));
      let payout        = net - platformFee - BUFFER_PENCE;

      if (payout <= 0) {
        results.push({
          order: order.id,
          status: 'skipped_zero_payout',
          gross,
          stripeFee,
          platformFee,
          buffer: BUFFER_PENCE,
          computedPayout: payout,
        });
        continue;
      }

      // Get seller's connected account
      const { data: profile, error: profErr } = await db
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', sellerId)
        .single();

      if (profErr || !profile?.stripe_account_id) {
        results.push({ order: order.id, status: 'skipped_no_destination', reason: 'No stripe_account_id' });
        continue;
      }

      // Create transfer (or simulate in dryRun)
      let transfer = null;
      if (!dryRun) {
        try {
          transfer = await stripe.transfers.create({
            amount: payout,
            currency,
            destination: profile.stripe_account_id,
            // Nice for reconciliation: link to the original charge
            source_transaction: chargeId,
          });
        } catch (e) {
          // If platform balance is genuinely insufficient, we log and retry next cron
          results.push({
            order: order.id,
            status: 'transfer_error',
            error: e?.message || String(e),
            payout,
            currency,
            chargeId,
          });
          continue;
        }

        // Mark the order as released/paid
        const { error: updErr } = await db
          .from('orders')
          .update({
            transfer_id: transfer.id,
            transfer_status: 'paid',
            released_at: new Date().toISOString(),
            // (Optional: if you later add columns, you can also persist computed fields)
            // seller_payout_cents: payout,
            // stripe_fee_cents: stripeFee,
            // platform_fee_cents: platformFee,
            // amount_cents: gross,
            // currency,
          })
          .eq('id', order.id);

        if (updErr) {
          results.push({
            order: order.id,
            status: 'db_update_error',
            error: updErr.message || String(updErr),
            transfer_id: transfer.id,
          });
          continue;
        }
      }

      processed += 1;
      results.push({
        order: order.id,
        status: dryRun ? 'would_pay' : 'paid',
        gross,
        stripeFee,
        platformFee,
        buffer: BUFFER_PENCE,
        payout,
        currency,
        chargeId,
        transfer_id: transfer?.id || null,
      });
    } catch (err) {
      console.error(`[cron] order ${order.id} fatal:`, err);
      results.push({ order: order.id, status: 'error', error: err?.message || String(err) });
    }
  }

  return NextResponse.json({ ok: true, processed, results, dryRun, ignoreCutoff });
}
