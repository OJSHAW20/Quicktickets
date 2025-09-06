'use client';

import { Button } from '@/components/ui/button';

export default function ConnectStripeButton({ label = 'Connect Stripe' }) {
  const go = () => {
    // simple redirect to the API route we built
    window.location.href = '/api/stripe/connect/start';
  };
  return (
    <Button onClick={go}>
      {label}
    </Button>
  );
}
