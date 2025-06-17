'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { buyTicket } from '@/actions/buyTicket';

export default function TicketCard({ ticket, eventId }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const uniLabel = ticket.profiles?.university
    ? `${ticket.profiles.university} verified`
    : 'No Uni verified';
  const uniIcon = ticket.profiles?.university ? '✅' : '❌';

  return (
    <div className="flex rounded border overflow-hidden">
      {/* Left cell */}
      <div className="flex-1 p-3">
        <p className="text-xl font-bold">£{ticket.price.toFixed(2)}</p>

        {/* Inline info row */}
        <div className="mt-1 flex flex-row items-center text-sm text-gray-600 gap-6">
          {ticket.last_entry_time && (
            <span className="flex items-center gap-1">
              11PM last entry <span role="img" aria-label="alarm">⏰</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            {ticket.profiles?.university ? `${ticket.profiles.university} verified` : 'No Uni verified'} {ticket.profiles?.university ? '✅' : '❌'}
          </span>
        </div>
      </div>

      {/* Buy button */}
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            try {
              const url = await buyTicket(ticket.id, eventId);
              router.push(url);
            } catch (err) {
              alert(err.message);
            }
          })
        }
        className="w-24 bg-green-300 hover:bg-green-400 font-bold disabled:opacity-50"
      >
        {pending ? '…' : 'Buy'}
      </button>
    </div>
  );
}
