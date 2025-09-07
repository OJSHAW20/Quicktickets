'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@supabase/auth-helpers-react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

import CityTag from '@/components/CityTag';
import TicketForm from '@/components/TicketForm';
import NewEventForm from '@/components/NewEventForm';
import ConnectStripeButton from '@/components/ConnectStripeButton';

export default function SellTicketClient({
  citySlug,
  cityId,
  cityName,
  events,
  // if this page is /[city]/[eventId]/sell you can pass defaultEventId from the server page
  defaultEventId,
}) {
  const router = useRouter();
  const session = useSession();

  // create the browser client once
  const supabase = useMemo(() => createPagesBrowserClient(), []);

  // local state – keep hooks in fixed order
  const [selected, setSelected] = useState(defaultEventId || '');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch stripe_account_id once we know the session
  useEffect(() => {
    let mounted = true;
    (async () => {
      // No user → not connected; stop loading
      if (!session?.user) {
        if (mounted) {
          setIsConnected(false);
          setLoadingProfile(false);
        }
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', session.user.id)
        .single();

      if (!mounted) return;
      setIsConnected(Boolean(data?.stripe_account_id) && !error);
      setLoadingProfile(false);
    })();
    return () => { mounted = false; };
  }, [session, supabase]);

  const handleTicketCreated = (eventId) => router.push(`/${citySlug}/${eventId}`);
  const handleNewEventCreated = (newId) => setSelected(newId);

  const flagMap = { edinburgh: '🏴', london: '🇬🇧', bristol: '🏴‍☠️' };

  return (
    <section className="px-4 pt-[84px] pb-6 space-y-6">
      <CityTag city={cityName} flag={flagMap[citySlug] || ''} />
      <h2 className="mx-auto w-max rounded border-2 border-black px-6 py-1 text-2xl font-bold">
        Selling ticket
      </h2>

      {!session?.user ? (
        <p className="p-6 text-center">
          You must <a href="/signin" className="underline">log in</a> to list a ticket.
        </p>
      ) : loadingProfile ? (
        <p className="text-sm text-muted-foreground">Loading your payout status…</p>
      ) : !isConnected ? (
        <div className="rounded-md border p-4 space-y-2">
          <h3 className="font-semibold">Connect Stripe to list tickets</h3>
          <p className="text-sm text-muted-foreground">
            You need to connect your Stripe account once to receive payouts.
          </p>
          <ConnectStripeButton label="Connect Stripe" />
        </div>
      ) : (
        <>
          {/* Searchable event picker */}
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
                  .filter((ev) => ev.title.toLowerCase().includes(query.toLowerCase()))
                  .map((ev) => (
                    <li key={ev.id}>
                      <button
                        onClick={() => {
                          setSelected(ev.id);
                          setQuery(ev.title);
                          setOpen(false);
                        }}
                        className={`block w-full text-left px-3 py-2 hover:bg-blue-50 ${
                          ev.id === selected ? 'bg-blue-100 font-semibold' : ''
                        }`}
                      >
                        {ev.title}
                      </button>
                    </li>
                  ))}
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
            <TicketForm eventId={selected} sellerId={session.user.id}   onTicketCreated={handleTicketCreated} />
          )}
        </>
      )}
    </section>
  );
}
