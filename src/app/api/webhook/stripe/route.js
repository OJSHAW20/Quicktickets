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
  console.log('Webhook endpoint hit');
  const sig = request.headers.get('stripe-signature');
  console.log('Stripe signature present:', !!sig);

  let event;
  try {
    const arrayBuffer = await request.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    console.log('Event type:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    console.log('Webhook received: checkout.session.completed');
    const session = event.data.object;
    console.log('Session metadata:', session.metadata);
    const supabase = createSupabaseServer();

    // Get ticket and buyer information from session metadata
    const { ticketId, eventId, buyerId } = session.metadata;
    
    if (!ticketId || !buyerId) {
      console.error('Missing required metadata:', { ticketId, buyerId });
      return new NextResponse('Missing required metadata', { status: 400 });
    }

    // Update the existing pending order to completed
    console.log('Updating order status to complete for session:', session.id);
    const { error: orderErr } = await supabase
      .from('orders')
      .update({
        stripe_payment_intent: session.payment_intent,
        status: 'complete'
      })
      .eq('stripe_checkout_session', session.id);

    if (orderErr) {
      console.error('Error updating order:', orderErr);
      return new NextResponse('Error updating order', { status: 500 });
    }
    
    console.log('Successfully updated order status to completed');

    // Mark the ticket as sold
    console.log('Updating ticket status to sold for ticketId:', ticketId);
    
    // First, let's check the current ticket status
    const { data: currentTicket, error: fetchErr } = await supabase
      .from('tickets')
      .select('status, price, seller_id')
      .eq('id', ticketId)
      .single();
    
    if (fetchErr) {
      console.error('Error fetching current ticket:', fetchErr);
      return new NextResponse('Error fetching ticket', { status: 500 });
    }
    
    console.log('Current ticket status:', currentTicket?.status);
    
    const { error: ticketErr } = await supabase
      .from('tickets')
      .update({ status: 'sold' })
      .eq('id', ticketId);

    if (ticketErr) {
      console.error('Error updating ticket status:', ticketErr);
      return new NextResponse('Error updating ticket status', { status: 500 });
    }
    
    console.log('Successfully updated ticket status to sold');
  }

  return new NextResponse('OK', { status: 200 });
}
