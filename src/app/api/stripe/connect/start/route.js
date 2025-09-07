// src/app/api/stripe/connect/start/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createSupabaseServer } from '@/lib/supabaseClient';
import Stripe from 'stripe';

export async function GET() {
  const secret    = process.env.STRIPE_SECRET_KEY;
  const returnUrl = process.env.STRIPE_CONNECT_RETURN_URL;   // e.g. /my-listings?connected=1
  const refreshUrl= process.env.STRIPE_CONNECT_REFRESH_URL;  // e.g. /my-listings
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL;
  if (!secret || !returnUrl || !refreshUrl || !appUrl) {
    return NextResponse.json(
      { error: 'Missing STRIPE_* or NEXT_PUBLIC_APP_URL envs' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });

  // who is the seller
  const anon = createRouteHandlerClient({ cookies });
  const { data: { user } } = await anon.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const svc = createSupabaseServer();

  // read/create connected account
  let acctId = null;
  const { data: profile } = await svc
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single();
  acctId = profile?.stripe_account_id ?? null;

  if (!acctId) {
    const account = await stripe.accounts.create({
      type: 'express',
      business_type: 'individual',                // ← force Individual
      capabilities: { transfers: { requested: true } },
      business_profile: {
        url: appUrl,                              // prefill to avoid “what’s your website?”
        product_description: 'Peer-to-peer ticket resales',
      },
      metadata: { app: 'quicktickets', user_id: user.id },
    });
    acctId = account.id;

    // upsert stripe_account_id
    const { error: updErr } = await svc
      .from('profiles')
      .update({ stripe_account_id: acctId })
      .eq('id', user.id);
    if (updErr) {
      await svc.from('profiles').insert({ id: user.id, stripe_account_id: acctId });
    }
  }

  // Express onboarding link (URL must look like https://connect.stripe.com/setup/...)
  const link = await stripe.accountLinks.create({
    account: acctId,
    type: 'account_onboarding',
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });

  return NextResponse.redirect(link.url, { status: 302 });
}
