'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TicketForm from '@/components/TicketForm';
import NewEventForm from '@/components/NewEventForm';
import CityTag from '@/components/CityTag';

export default function SellTicketClient({
  citySlug,
  cityId,
  cityName,
  events,
}) {
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [query, setQuery]    = useState('');
  const [open, setOpen]     = useState(false);

  const handleTicketCreated = (eventId) =>
    router.push(`/${citySlug}/${eventId}`);

  const handleNewEventCreated = (newId) => setSelected(newId);

  const flagMap = { edinburgh: '🏴', london: '🇬🇧', bristol: '🏴‍☠️' };

  return (
    <section className="px-4 pt-[84px] pb-6 space-y-6">
      <CityTag city={cityName} flag={flagMap[citySlug] || ''} />

      <h2 className="mx-auto w-max rounded border-2 border-black px-6 py-1 text-2xl font-bold">
        Selling ticket
      </h2>

      {/* ▾ searchable event dropdown */}
    <div className="space-y-1">
      <label className="block text-sm font-semibold">Event</label>

      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search or select…"
        className="w-full rounded border px-3 py-2 mb-1"
      />

      {open && (
        <ul className="max-h-48 overflow-y-auto border rounded">
          {events
            .filter((ev) =>
              ev.title.toLowerCase().includes(query.toLowerCase())
            )
            .map((ev) => (
              <li key={ev.id}>
                <button
                  onClick={() => {
                    setSelected(ev.id);
                    setQuery(ev.title);
                    setOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 hover:bg-blue-50 ${
                    ev.id === selected && 'bg-blue-100 font-semibold'
                  }`}
                >
                  {ev.title}
                </button>
              </li>
            ))}

          {/* create-new option */}
          <li>
            <button
              onClick={() => {
                setSelected('new');
                setQuery('');
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-blue-50"
            >
              ➕ Create new event…
            </button>
          </li>
        </ul>
      )}
    </div>


      {selected === 'new' && (
        <NewEventForm cityId={cityId} onEventCreated={handleNewEventCreated} />
      )}

      {selected && selected !== 'new' && (
        <TicketForm eventId={selected} onTicketCreated={handleTicketCreated} />
      )}
    </section>
  );
}
