'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TicketForm from '@/components/TicketForm';
import CityTag from '@/components/CityTag';
import { useSession } from '@supabase/auth-helpers-react';

export default function SellTicketClient({
  citySlug,
  cityId,
  cityName,
  events,
  sellerId,
  preSelectedEventId,
}) {
  const router = useRouter();
  const session = useSession();

  if (!session) {
    return (
      <p className="p-6 text-center">
        You must <a href="/signin" className="underline">log in</a> to list a ticket.
      </p>
    );
  }

  const handleTicketCreated = (eventId) =>
    router.push(`/${citySlug}/${eventId}`);

  const flagMap = { edinburgh: '', london: '🇬🇧', bristol: '🏴‍☠️' };
  
  // If preSelectedEventId is provided, find the event by ID
  // Otherwise, use the first event in the array (for event-specific sell pages)
  const selectedEvent = preSelectedEventId 
    ? events.find(e => e.id === preSelectedEventId)
    : events[0];

  // If no event is found, show an error
  if (!selectedEvent) {
    return (
      <section className="px-4 pt-[84px] pb-6 space-y-6">
        <CityTag city={cityName} flag={flagMap[citySlug] || ''} />
        <p className="p-6 text-center">Event not found.</p>
      </section>
    );
  }

  return (
    <section className="px-4 pt-[84px] pb-6 space-y-6">
      <CityTag city={cityName} flag={flagMap[citySlug] || ''} />

      {/* Removed the heading for event title */}

      <TicketForm 
        eventId={selectedEvent.id} 
        sellerId={session.user.id} 
        onTicketCreated={handleTicketCreated} 
      />
    </section>
  );
} 