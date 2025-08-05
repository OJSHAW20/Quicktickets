// src/app/api/checkout/session/route.js

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabaseClient';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const supabase = createSupabaseServer();
    const { ticketId, buyerId } = await request.json();

    // TODO: load your ticket from Supabase to get price, etc.
    // e.g.:
    // const ticket = await getTicketById(ticketId);

        // 1) Load the ticket to get its real price
    const { data: ticket, error: ticketErr } = await supabase
    .from('tickets')
    .select('price')
    .eq('id', ticketId)
    .single();

    if (ticketErr || !ticket) {
    console.error('Ticket lookup error:', ticketErr);
    return NextResponse.json(
      { error: 'Ticket not found' },
      { status: 404 }
    );
    }

    // 2) Compute amount in pence (Stripe expects the smallest currency unit)
    const unitAmount = Math.round(ticket.price * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: `Ticket ${ticketId}` },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/my-listings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
      metadata: { ticketId, buyerId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe session creation error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
