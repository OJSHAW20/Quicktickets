'use server';

import { createSupabaseServer } from '@/lib/supabaseClient';
import Stripe from 'stripe';

export async function buyTicket(ticketId, eventId) {
  const supabase = createSupabaseServer();
  const stripe   = new Stripe(process.env.STRIPE_SECRET_KEY);

  /* 1. ensure ticket is still available */
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('id, price')
    .eq('id', ticketId)
    .eq('status', 'available')
    .single();

  if (error || !ticket) throw new Error('Ticket no longer available');

  /* 2. create PaymentIntent */
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(ticket.price * 100),
    currency: 'gbp',
    metadata: { ticket_id: ticketId, event_id: eventId },
  });

  /* 3. create order row */
  await supabase.from('orders').insert({
    ticket_id: ticketId,
    buyer_id: null,
    stripe_payment_intent: intent.id,
    status: 'pending',
  });

  /* 4. mark ticket as sold */
  await supabase.from('tickets').update({ status: 'sold' }).eq('id', ticketId);

  /* 5. create checkout session and return its URL */
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_intent: intent.id,
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
    cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
  });

  return session.url;
}
