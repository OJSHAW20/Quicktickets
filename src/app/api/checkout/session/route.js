// src/app/api/checkout/session/route.js

import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { ticketId } = await request.json();

    // TODO: load your ticket from Supabase to get price, etc.
    // e.g.:
    // const ticket = await getTicketById(ticketId);

    // For now, let’s pretend the price is £10:
    const unitAmount = 1000;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: `Ticket ${ticketId}` },
          unit_amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/my-listings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
      metadata: { ticketId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe session creation error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
