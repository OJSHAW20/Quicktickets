// src/components/DisputesBuySidePanel.jsx
'use client';

import { useEffect, useState } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

export default function DisputesBuySidePanel() {
  const supabase = createPagesBrowserClient();

  // null = loading, [] = no disputes, [ … ] = data
  const [disputes, setDisputes] = useState(null);

  useEffect(() => {
    (async () => {
      // 1) get current user
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        setDisputes([]);    // no user => no disputes
        return;
      }

      // 2) fetch disputes raised by this user
      const { data, error } = await supabase
        .from('disputes')
        .select(
          'id, message, status, created_at,' +
          'orders(ticket_id, tickets(event_id, events(title, event_date)))'
        )
        .eq('raised_by', user.id);

      setDisputes(error ? [] : data || []);
    })();
  }, [supabase]);

  // Loading
  if (disputes === null) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  // Empty
  if (disputes.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending disputes.</p>;
  }

  // Data
  return (
    <ul className="space-y-2">
            {disputes.map((d) => {
        // make sure we actually got an order → tickets → events
        if (
          !d.orders ||
          !d.orders.tickets ||
          !d.orders.tickets.events
        ) {
          return null;
        }
        const ev = d.orders.tickets.events;
        return (
          <li key={d.id} className="p-3 border rounded">
            <div className="font-semibold">{ev.title}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(ev.event_date).toLocaleDateString()}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
