// app/orders/success/page.jsx

import Stripe from 'stripe';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export default async function SuccessPage({ searchParams }) {
  const sessionId = searchParams.session_id;
  if (!sessionId) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="text-red-500">Missing session ID.</p>
      </main>
    );
  }

  // 1) Fetch the matching order from Supabase
  const supabase = createServerComponentClient({ cookies });
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id,
      ticket: tickets (
        price,
        event: events (
          title,
          venue,
          event_date
        )
      )
    `)
    .eq('stripe_checkout_session', sessionId)
    .single();

  if (error || !order) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="text-red-500">Could not load your order.</p>
      </main>
    );
  }

  const {
    id: orderId,
    ticket: {
      price,
      event: { title, venue, event_date },
    },
  } = order;

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Thank you for your purchase!</h1>
      <p>Your order <strong>#{orderId}</strong> has been confirmed.</p>
      <div className="border rounded p-4">
        <h2 className="text-xl font-semibold">Event Details</h2>
        <p><strong>Event:</strong> {title}</p>
        <p><strong>Venue:</strong> {venue}</p>
        <p><strong>Date:</strong> {new Date(event_date).toLocaleString('en-GB', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        })}</p>
        <p><strong>Price Paid:</strong> £{price.toFixed(2)}</p>
      </div>
      <Link href="/" className="text-blue-600 hover:underline">
        Back to events
      </Link>
    </main>
  );
}
