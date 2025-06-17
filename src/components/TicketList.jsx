// src/components/TicketList.jsx
'use client';

import { useState, useMemo } from 'react';
import TicketCard from './TicketCard';

/**
 * props
 *   tickets : array of rows returned from Supabase
 *             (must include id, price, created_at, profiles etc.)
 *   eventId : UUID string (needed for the TicketCard's buy flow)
 */
export default function TicketList({ tickets, eventId }) {
  const [sort, setSort] = useState('price'); // 'price' | 'newest'

  /* memo-sorted list so we don’t resort on every render */
  const sorted = useMemo(() => {
    const arr = [...tickets];
    if (sort === 'price') {
      arr.sort((a, b) => a.price - b.price);
    } else {
      // newest first – assuming created_at exists. fallback to id
      arr.sort(
        (a, b) =>
          new Date(b.created_at || b.id).valueOf() -
          new Date(a.created_at || a.id).valueOf()
      );
    }
    return arr;
  }, [tickets, sort]);

  return (
    <div>
      {/* header row */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-3xl font-extrabold">Tickets</h2>

        {/* sort dropdown */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
        >
          <option value="price">Sort: Price (low → high)</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>

      {/* tickets list */}
      <div className="space-y-3">
        {sorted.length ? (
          sorted.map((t) => (
            <TicketCard key={t.id} ticket={t} eventId={eventId} />
          ))
        ) : (
          <p className="py-10 text-center text-gray-600">
            No tickets yet — be the first to list one!
          </p>
        )}
      </div>
    </div>
  );
}
