// src/app/api/cron/release-funds/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServer } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export async function GET(req) {
  // 1) Protect the endpoint
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2) Optional dryRun flag for testing
  const dryRun = new URL(req.url).searchParams.get('dryRun') === '1';

  const supabase = createSupabaseServer();

  // 3) Find all pending orders older than 24h with a payment intent
  const cutoff = new Date(Date.now() - 24 * 3600e3).toISOString();
  const { data: orders, error: fetchErr } = await supabase
    .from('orders')
    .select(`
      id,
      stripe_payment_intent,
      ticket:tickets (
        id,
        price,
        seller_id
      )
    `)
    .eq('status', 'pending')
    .lt('created_at', cutoff)
    .not('stripe_payment_intent', 'is', null);

  if (fetchErr) {
    console.error('Error fetching old pending orders:', fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  let processed = 0;

  for (const order of orders ?? []) {
    const intentId = order.stripe_payment_intent;
    const amount   = Math.round(order.ticket.price * 100);
    const sellerId = order.ticket.seller_id;
  
    try {
      if (!dryRun) {
        // 1) Get the PaymentIntent
        const pi = await stripe.paymentIntents.retrieve(intentId);
  
        // 2) Capture only if needed; if already succeeded, skip capture
        if (pi.status === 'requires_capture') {
          await stripe.paymentIntents.capture(intentId);
        } else if (pi.status !== 'succeeded') {
          console.warn(`PI ${intentId} is ${pi.status}; skipping this order.`);
          continue; // don't mark complete or transfer if it's not payable
        }
  
        // 3) Mark order complete
        await supabase
          .from('orders')
          .update({ status: 'complete', released_at: new Date().toISOString() })
          .eq('id', order.id);
  
        // 4) Look up seller’s connected account
        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('stripe_account_id')
          .eq('id', sellerId)
          .single();
  
        if (profErr || !profile?.stripe_account_id) {
          console.warn(`No stripe_account_id for seller ${sellerId}, skipping transfer.`);
        } else {
          // 5) Transfer funds to the seller's connected account
          await stripe.transfers.create({
            amount,
            currency: 'gbp',
            destination: profile.stripe_account_id
            // (no source_transaction; PI != charge id)
          });
        }
      }
  
      processed++;
    } catch (err) {
      console.error(`Failed processing order ${order.id}:`, err);
    }
  }
  

  return NextResponse.json({ success: true, processed, dryRun });
}
