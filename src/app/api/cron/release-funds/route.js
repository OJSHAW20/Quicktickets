// src/app/api/cron/release-funds/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServer } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export async function GET() {
  const supabase = createSupabaseServer();

  // 1) Find all pending orders older than 24h that have a payment_intent
  const cutoff = new Date(Date.now() - 24 * 3600e3).toISOString();
  const { data: orders, error: fetchErr } = await supabase
    .from('orders')
    .select(`
      id,
      stripe_payment_intent,
      ticket: tickets (
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

  for (const order of orders) {
    const intentId = order.stripe_payment_intent;
    const amount   = Math.round(order.ticket.price * 100); // in pence
    const sellerId = order.ticket.seller_id;

    try {
      // 2) Capture the payment
      await stripe.paymentIntents.capture(intentId);

      // 3) Mark order complete
      await supabase
        .from('orders')
        .update({ status: 'complete', released_at: new Date().toISOString() })
        .eq('id', order.id);

      // 4) Look up the seller’s connected account ID
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', sellerId)
        .single();

      if (profErr || !profile?.stripe_account_id) {
        console.warn(
          `No stripe_account_id for seller ${sellerId}, skipping transfer.`
        );
      } else {
        // 5) Transfer the funds to the seller
        await stripe.transfers.create({
          amount,
          currency: 'gbp',
          destination: profile.stripe_account_id,
          source_transaction: intentId, // optional: ties to the charge
        });
      }

      processed++;
    } catch (err) {
      console.error(`Failed processing order ${order.id}:`, err);
    }
  }

  return NextResponse.json({ success: true, processed });
}
