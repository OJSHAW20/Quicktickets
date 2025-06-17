// src/components/DemandChip.jsx
'use client';

import { useState, useEffect, useTransition } from 'react';

import { addInterest } from '@/actions/addInterest';           // server action: INSERT row
import { fetchInterestCount } from '@/actions/fetchInterestCount'; // server action: SELECT count

export default function DemandChip({ eventId }) {
  const [count, setCount]   = useState(0);
  const [pending, start]    = useTransition();

  /* fetch the current count once on mount (and when eventId changes) */
  useEffect(() => {
    fetchInterestCount(eventId).then(setCount);
  }, [eventId]);

  return (
    <div className="flex items-center gap-2">
      {/* label */}
      <div className="rounded border px-4 py-2 bg-gray-100 font-semibold">
        Would buy
      </div>

      {/* green circle with number */}
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-3xl font-bold">
        {count}
      </div>

      {/* 🔔 button */}
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            await addInterest(eventId);     // server insert
            setCount((c) => c + 1);         // optimistic +1
          })
        }
        className="px-3 py-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
      >
        {pending ? '…' : '🔔'}
      </button>
    </div>
  );
}
