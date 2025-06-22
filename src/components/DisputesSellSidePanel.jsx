// src/components/DisputesSellSidePanel.jsx
'use client';

import { useEffect, useState } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { respondToDispute }     from '@/actions/respondToDispute';

export default function DisputesSellSidePanel() {
  const supabase = createPagesBrowserClient();
  const [disputes, setDisputes] = useState(null);
  const [justSent, setJustSent] = useState(null);

  useEffect(() => {
    (async () => {
      // 1️⃣ fetch current user
      const {
        data: { user },
        error: userErr
      } = await supabase.auth.getUser();

      if (userErr) {
        console.error('Could not fetch user:', userErr);
        return setDisputes([]);
      }

      // 2️⃣ pull only disputes on tickets this user sold
      const { data, error } = await supabase
        .from('disputes')
        .select(
          `
            id,
            message,
            status,
            seller_response,
            order:orders (
              id,
              ticket:tickets (
                event:events (
                  title,
                  event_date
                )
              )
            )
          `
        )
        .eq('order.ticket.seller_id', user.id);

      if (error) {
        console.error('Fetch sell-side disputes error:', error);
        setDisputes([]);
      } else {
        setDisputes(data);
      }
    })();
  }, [supabase]);

  if (disputes === null) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (disputes.length === 0) {
    return <p className="text-sm text-muted-foreground">No disputes on your listings.</p>;
  }

  return (
    <ul className="space-y-4">
      {disputes.map((d) => {
        const ord = d.order;
                // if there's no order → ticket → event, skip it
        if (
          !ord ||
          !ord.ticket ||
          !ord.ticket.event
        ) {
          return null;
        }
        const ev = ord.ticket.event;


        return (
          <li key={d.id} className="p-4 border rounded-lg space-y-2">
            <div className="font-semibold text-lg">{ev.title}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(ev.event_date).toLocaleDateString()}
            </div>

            <p><strong>Buyer said:</strong> {d.message}</p>

            {d.seller_response ? (
              <p><strong>Your response:</strong> {d.seller_response}</p>
            ) : justSent === d.id ? (
              <p className="text-green-600">Response submitted!</p>
            ) : (
              <form
                action={respondToDispute}
                className="space-y-2"
                onSubmit={() => setJustSent(d.id)}
              >
                <input type="hidden" name="disputeId" value={d.id} />
                <textarea
                  name="response"
                  placeholder="Write your response…"
                  required
                  className="w-full border rounded p-2 text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Submit response
                </button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
