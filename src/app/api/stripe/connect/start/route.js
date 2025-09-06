// src/app/api/stripe/connect/start/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createSupabaseServer } from '@/lib/supabaseClient';
import Stripe from 'stripe';

// For MVP we do a GET → redirect straight to Stripe (no client code needed)
export async function GET() {
  // 0) basic env checks
  const secret = process.env.STRIPE_SECRET_KEY;
  const returnUrl  = process.env.STRIPE_CONNECT_RETURN_URL;
  const refreshUrl = process.env.STRIPE_CONNECT_REFRESH_URL;
  if (!secret || !returnUrl || !refreshUrl) {
    return NextResponse.json(
      { error: 'Stripe env vars missing: STRIPE_SECRET_KEY, STRIPE_CONNECT_RETURN_URL, STRIPE_CONNECT_REFRESH_URL' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });

  // 1) get the logged-in user
  const anon = createRouteHandlerClient({ cookies });
  const {
    data: { user },
    error: authErr,
  } = await anon.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const svc = createSupabaseServer();

  // 2) load or create the seller's Connect account id in profiles
  let acctId = null;

  // read current value
  const { data: profile, error: pErr } = await svc
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single();

  if (pErr && pErr.code !== 'PGRST116') {
    // PGRST116 = no rows found — we handle that below
    console.error('profiles read error', pErr);
  } else {
    acctId = profile?.stripe_account_id ?? null;
  }

  // create one if missing
  if (!acctId) {
    // MVP: request transfers capability (we transfer after event)
    // Country left unset so Stripe collects it during onboarding.
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: { transfers: { requested: true } },
      business_type: 'individual',
      metadata: { app: 'p2p-tickets', user_id: user.id },
    });
    acctId = account.id;

    // try update first, then insert if no row
    const { error: updErr, count } = await svc
      .from('profiles')
      .update({ stripe_account_id: acctId })
      .eq('id', user.id);

    if (updErr) {
      // if the profile row didn't exist, create a minimal one
      const { error: insErr } = await svc
        .from('profiles')
        .insert({ id: user.id, stripe_account_id: acctId });
      if (insErr) {
        console.error('profiles upsert error', insErr);
        return NextResponse.json({ error: 'Failed to save stripe_account_id' }, { status: 500 });
      }
    }
  }

  // 3) create an account onboarding link and redirect there
  const link = await stripe.accountLinks.create({
    account: acctId,
    refresh_url: refreshUrl, // e.g. https://your.app/settings
    return_url: returnUrl,   // e.g. https://your.app/settings?connected=1
    type: 'account_onboarding',
  });

  return NextResponse.redirect(link.url, { status: 302 });
}
