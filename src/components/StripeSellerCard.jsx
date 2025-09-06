'use client';

import { useEffect, useState } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import ConnectStripeButton from '@/components/ConnectStripeButton';

export default function StripeSellerCard({ justConnected = false }) {
  const supabase = createPagesBrowserClient();
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [stripeAccountId, setStripeAccountId] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (mounted) { setSignedIn(false); setLoading(false); } return; }

      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', user.id)
        .single();

      if (!mounted) return;
      setStripeAccountId(data?.stripe_account_id ?? null);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, [supabase]);

  if (!signedIn) return null;

  return (
    <div className="rounded-md border p-4 mb-4 space-y-2">
      {justConnected && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-green-800">
          Stripe account connected!
        </div>
      )}

      <h2 className="font-semibold">Getting paid</h2>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !stripeAccountId ? (
        <>
          <p className="text-sm text-muted-foreground">
            Connect your Stripe account to receive payouts for sold tickets.
          </p>
          <ConnectStripeButton label="Connect Stripe" />
        </>
      ) : (
        <>
          <p className="text-sm">
            Connected account: <span className="font-mono">{stripeAccountId}</span>
          </p>
          <p className="text-sm text-muted-foreground">Need to update your details?</p>
          <ConnectStripeButton label="Open Stripe onboarding" />
        </>
      )}
    </div>
  );
}
