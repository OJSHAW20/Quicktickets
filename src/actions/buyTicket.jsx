// src/actions/buyTicket.jsx
'use server';

import { createSupabaseServer } from '@/lib/supabaseClient';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export async function buyTicket(ticketId, eventId) {
  const supabase = createSupabaseServer();

  // 1) Load the ticket and its flag + seller
  const { data: ticket, error: ticketErr } = await supabase
    .from('tickets')
    .select('price, buyer_uni_only, seller_id')
    .eq('id', ticketId)
    .single();
  if (ticketErr || !ticket) throw new Error('Ticket not found');

  // 2) If uni‐only, fetch both universities
  if (ticket.buyer_uni_only) {
    // buyer
    const {
      data: { user },
      error: authErr
    } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error('Must be signed in to buy');

    const { data: buyerProfile, error: buyerErr } = await supabase
      .from('profiles')
      .select('university')
      .eq('id', user.id)
      .single();
    if (buyerErr || !buyerProfile) throw new Error('Profile not found');

    // seller
    const { data: sellerProfile, error: sellerErr } = await supabase
      .from('profiles')
      .select('university')
      .eq('id', ticket.seller_id)
      .single();
    if (sellerErr || !sellerProfile) throw new Error('Seller profile not found');

    if (buyerProfile.university !== sellerProfile.university) {
      throw new Error('Only buyers from the same university may purchase this ticket');
    }
  }

  // 3) Create Stripe Checkout Session (or PaymentIntent) as you do today
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
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/event/${eventId}`
  });

  // 4) Record the pending order
  const { error: orderErr } = await supabase
    .from('orders')
    .insert({
      ticket_id:             ticketId,
      buyer_id:              session.customer,      // or user.id if you store it
      stripe_payment_intent: session.payment_intent,
      status:                'pending'
    });
  if (orderErr) throw new Error(orderErr.message);

  return session.url;
}
