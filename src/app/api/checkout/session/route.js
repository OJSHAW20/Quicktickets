// src/app/api/checkout/session/route.js
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export async function POST(request) {
  try {
    const supabase = createSupabaseServer();
    const { ticketId } = await request.json();

    // (Optional but safer) derive buyer from session instead of trusting body
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const buyerId = user.id;

    // 1) Load ticket to get price + seller
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select('id, price, seller_id, status')
      .eq('id', ticketId)
      .single();

    if (ticketErr || !ticket) {
      console.error('Ticket lookup error:', ticketErr);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    if (ticket.status === 'sold') {
      return NextResponse.json({ error: 'Ticket already sold' }, { status: 409 });
    }

    // 2) Amount in pence (smallest currency unit)
    const unitAmount = Math.round(Number(ticket.price) * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      return NextResponse.json({ error: 'Invalid ticket price' }, { status: 400 });
    }

    // 3) Create a pending order row first (so webhook can find it later)
    const { data: order, error: orderInsErr } = await supabase
      .from('orders')
      .insert({
        buyer_id: buyerId,
        ticket_id: ticketId,
        seller_id: ticket.seller_id,
        status: 'pending',
        amount_cents: unitAmount,
        currency: 'gbp',
      })
      .select('id')
      .single();

    if (orderInsErr) {
      console.error('Order insert error:', orderInsErr);
      return NextResponse.json({ error: 'Could not create order' }, { status: 500 });
    }

    // 4) Create the Checkout Session and include identifiers in metadata
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: { name: `Ticket ${ticketId}` },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      // Redirects
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/my-listings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,

      // ★ IMPORTANT: pass order + useful ids so the webhook (and logs) can link things
      metadata: {
        order_id: String(order.id),
        ticketId: String(ticketId),
        sellerId: String(ticket.seller_id || ''),
        buyerId: String(buyerId),
      },
    });

    // 5) Store the Checkout Session id on the order (webhook will use it)
    await supabase
      .from('orders')
      .update({ stripe_checkout_session: session.id })
      .eq('id', order.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe session creation error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
