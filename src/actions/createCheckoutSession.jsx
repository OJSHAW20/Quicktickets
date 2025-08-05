// src/actions/createCheckoutSession.jsx
'use server';

import { createSupabaseServer } from '@/lib/supabaseClient';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

/**
 * Creates a Stripe Checkout session for a ticket purchase, inserts a pending order,
 * and returns the URL to redirect the buyer to.
 */
export async function createCheckoutSession({ ticketId, eventId, buyerId }) {
  const supabase = createSupabaseServer();

  // 1) Load the ticket
  const { data: ticket, error: ticketErr } = await supabase
    .from('tickets')
    .select('price, buyer_uni_only, seller_id')
    .eq('id', ticketId)
    .single();
  if (ticketErr || !ticket) throw new Error('Ticket not found');
  if (ticket.buyer_uni_only) {
    // enforce uni-check if you want, or assume UI did
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('university')
      .eq('id', buyerId)
      .single();
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('university')
      .eq('id', ticket.seller_id)
      .single();
    if (buyerProfile.university !== sellerProfile.university) {
      throw new Error('Only buyers from the same university may purchase this ticket');
    }
  }

  // 2) Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        product_data: { name: `Ticket for event ${eventId}` },
        unit_amount: Math.round(ticket.price * 100),
        currency: 'gbp'
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/event/${eventId}`,
    metadata: { 
      ticketId,
      eventId,
      buyerId
    }
  });

  // 3) Insert a pending order
  const { error: orderErr } = await supabase
     .from('orders')
     .upsert(
       {
         ticket_id:               ticketId,
         buyer_id:                buyerId,
         stripe_checkout_session: session.id,
         stripe_payment_intent:   session.payment_intent,
         status:                  'pending'
       },
       { onConflict: 'ticket_id' }
     );
  if (orderErr) throw new Error(orderErr.message);

  return session.url;
}
