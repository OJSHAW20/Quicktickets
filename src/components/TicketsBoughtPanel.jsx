// src/components/TicketsBoughtPanel.jsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { createPagesBrowserClient }      from '@supabase/auth-helpers-nextjs';
import TicketBoughtCard from '@/components/TicketBoughtCard';

export default function TicketsBoughtPanel() {
  const supabase = createPagesBrowserClient();  // ← NEW helper
  const [orders, setOrders]       = useState(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      // 1) get current user
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) {
        console.error(userErr);
        return setOrders([]);
      }
      if (!user) {
        // not signed in
        return setOrders([]);
      }

      // 2) fetch orders → tickets → events → disputes in ONE line
      const { data, error } = await supabase
        .from('orders')
        .select(
          'id,status,' +
          'tickets(id,price,last_entry_time,status,' +
                   'events(title,venue)),' +
          'disputes(id,status)'
        )
        .eq('buyer_id', user.id);

      if (error) {
        console.error(error);
        setOrders([]);
      } else {
        setOrders(data || []);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (orders === null) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tickets bought yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
            {orders.map((o) => (
        <TicketBoughtCard
          key={o.id}
          ticket={{
            ...o.tickets,
            order_id   : o.id,
            event_title: o.tickets.events.title,
            venue      : o.tickets.events.venue,
            status     : o.status === 'complete' ? 'delivered' : o.status,
          }}
          orderStatus={o.status}    // ← new prop
          hasDispute={o.disputes && o.disputes.length > 0}  // ← new prop
        />
      ))}
    </div>
  );
}
