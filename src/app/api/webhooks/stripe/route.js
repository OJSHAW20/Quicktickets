import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Buffer } from 'buffer';
import { createSupabaseServer } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = { api: { bodyParser: false } };

export async function POST(request) {
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    const arrayBuffer = await request.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const supabase = createSupabaseServer();

    // Get ticket and buyer information from session metadata
    const { ticketId, eventId, buyerId } = session.metadata;
    
    if (!buyerId) {
      console.error('No buyer ID found in session metadata');
      return new NextResponse('No buyer ID found', { status: 400 });
    }

    // Create the order only after successful payment
    const { error: orderErr } = await supabase
      .from('orders')
      .insert({
        ticket_id: ticketId,
        buyer_id: buyerId,
        stripe_checkout_session: session.id,
        stripe_payment_intent: session.payment_intent,
        status: 'completed'
      });

    if (orderErr) {
      console.error('Error creating order:', orderErr);
      return new NextResponse('Error creating order', { status: 500 });
    }

    // Mark the ticket as sold
    const { error: ticketErr } = await supabase
      .from('tickets')
      .update({ status: 'sold' })
      .eq('id', ticketId);

    if (ticketErr) {
      console.error('Error updating ticket status:', ticketErr);
      return new NextResponse('Error updating ticket status', { status: 500 });
    }
  }

  return new NextResponse('OK', { status: 200 });
}
