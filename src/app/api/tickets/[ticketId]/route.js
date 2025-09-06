// src/app/api/tickets/[ticketId]/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createSupabaseServer } from '@/lib/supabaseClient'; // your server/service-role client

// This route:
// 1) checks the signed-in user
// 2) validates they own the ticket (buyer) or are the seller
// 3) creates a short-lived signed URL for the Storage object
// 4) redirects the browser to it
export async function GET(_req, { params }) {
  const { ticketId } = params;

  // anon client knows the user from cookies
  const anon = createRouteHandlerClient({ cookies });
  const {
    data: { user },
    error: authErr,
  } = await anon.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // service-role client to freely read DB + sign storage URL
  const svc = createSupabaseServer();

  // fetch ticket (proof path + seller)
  const { data: ticket, error: tErr } = await svc
    .from('tickets')
    .select('id, proof_url, seller_id')
    .eq('id', ticketId)
    .single();

  if (tErr || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  // find the order to verify the buyer (assumes orders.ticket_id -> tickets.id)
  const { data: order, error: oErr } = await svc
    .from('orders')
    .select('id,buyer_id,status')
    .eq('ticket_id', ticketId)
    .limit(1)
    .maybeSingle();

  if (oErr) {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }

  const isBuyer = order?.buyer_id === user.id;
  const isSeller = ticket.seller_id === user.id;

  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!ticket.proof_url) {
    return NextResponse.json({ error: 'No file attached' }, { status: 404 });
  }

  // sign for 60s; download:true sets Content-Disposition=attachment (optional)
  const { data: signed, error: sErr } = await svc.storage
    .from('ticket-proofs')
    .createSignedUrl(ticket.proof_url, 60); // { download: true } if you prefer

  if (sErr || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Could not sign URL' }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
