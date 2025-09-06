// src/app/api/webhook/stripe/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Buffer } from 'buffer';
import { createSupabaseServer } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const config = { api: { bodyParser: false } };

export async function POST(request) {
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    const buf = Buffer.from(await request.arrayBuffer());
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createSupabaseServer();

  async function handleCompleted(session) {
    // capture PaymentIntent + Charge IDs for payouts later
    const payment_intent_id = session.payment_intent || null;

    let charge_id = null;
    if (payment_intent_id) {
      try {
        const pi = await stripe.paymentIntents.retrieve(payment_intent_id, { expand: ['latest_charge'] });
        charge_id = typeof pi.latest_charge === 'string'
          ? pi.latest_charge
          : pi.latest_charge?.id || null;
      } catch (e) {
        console.error('PI retrieve failed:', e.message);
      }
    }

    // update the order by the checkout session id you stored earlier
    const { error: orderErr } = await supabase
      .from('orders')
      .update({
        status: 'complete',
        payment_intent_id,
        ...(charge_id ? { charge_id } : {}),
      })
      .eq('stripe_checkout_session', session.id);

    if (orderErr) console.error('Order update error:', orderErr);

    // mark the ticket sold (keeps your existing behavior)
    const { ticketId } = session.metadata || {};
    if (ticketId) {
      const { error: tErr } = await supabase.from('tickets').update({ status: 'sold' }).eq('id', ticketId);
      if (tErr) console.error('Ticket status update error:', tErr);
    }
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await handleCompleted(event.data.object);
      break;
    default:
      // ignore others
      break;
  }

  return new NextResponse('OK', { status: 200 });
}
