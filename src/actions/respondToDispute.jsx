'use server';

import Stripe from 'stripe';
import { createSupabaseServer } from '@/lib/supabaseServer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

/**
 * Resolves a dispute by:
 *  • calling the resolve_dispute RPC (updates statuses)
 *  • saving the seller_response
 *  • capturing or refunding on Stripe (if there's a real intent)
 */
export async function respondToDispute(formData) {
  const disputeId = formData.get('disputeId')?.toString();
  const action    = formData.get('action')   ?.toString(); // 'capture' or 'cancel'
  const response  = formData.get('response') ?.toString();

  if (!disputeId || !action || !response) {
    throw new Error('Missing disputeId, action, or response');
  }

  const supabase = createSupabaseServer();

  // 1) Lookup the order ID & any payment_intent
  const { data: disputeRow, error: dErr } = await supabase
    .from('disputes')
    .select('order_id, order:orders(stripe_payment_intent)')
    .eq('id', disputeId)
    .single();
  if (dErr || !disputeRow) {
    console.error('Could not fetch dispute → order:', dErr);
    throw new Error('Dispute lookup failed');
  }
  const { order_id: orderId, order } = disputeRow;
  const paymentIntent = order?.stripe_payment_intent;

  // 2) Call the Postgres RPC to update dispute & order statuses
  const { error: rpcErr } = await supabase
    .rpc('resolve_dispute', {
      p_dispute_id: disputeId,
      p_order_id:   orderId,
      p_action:     action,
    });
  if (rpcErr) {
    console.error('RPC resolve_dispute error:', rpcErr);
    throw new Error(rpcErr.message);
  }

  // 3) Save the seller’s message
  const { error: updErr } = await supabase
    .from('disputes')
    .update({ seller_response: response })
    .eq('id', disputeId);
  if (updErr) {
    console.error('Error saving response text:', updErr);
    throw new Error(updErr.message);
  }

  // 4) Only hit Stripe if we actually have an Intent
  if (paymentIntent) {
    try {
      if (action === 'capture') {
        await stripe.paymentIntents.capture(paymentIntent);
      } else {
        await stripe.refunds.create({ payment_intent: paymentIntent });
      }
    } catch (stripeErr) {
      console.error('Stripe API error:', stripeErr);
      // you could choose to throw here if you want the whole action to rollback
    }
  } else {
    console.warn(
      `No stripe_payment_intent for order ${orderId}; skipped Stripe ${action}`
    );
  }

  return disputeId;
}
