/*  src/app/[city]/[eventId]/page.jsx  */

import CityTag from '@/components/CityTag';
import SellTicketButton from '@/components/SellTicketButton';
import { createSupabaseServer } from '@/lib/supabaseClient';

import EventHero  from '@/components/EventHero';   // built
import DemandChip from '@/components/DemandChip';  // unified chip + button
import TicketList from '@/components/TicketList';  // built

export const dynamic = 'force-dynamic'; // no caching

export default async function EventPage({ params: { city, eventId } }) {
  const lower = city.toLowerCase();
  const supabase = createSupabaseServer();

  /* 1. fetch city row (case-insensitive) */
  const { data: cRow } = await supabase
    .from('cities')
    .select('id, name')
    .ilike('name', lower[0].toUpperCase() + lower.slice(1))
    .single();

  if (!cRow) return <p className="p-6 text-center">City not found.</p>;

  /* 2. fetch event (must belong to that city) */
  const { data: event } = await supabase
    .from('events')
    .select('id, city_id, title, venue, description, event_date')
    .eq('id', eventId)
    .eq('city_id', cRow.id)
    .single();

  if (!event) return <p className="p-6 text-center">Event does not exist.</p>;

  /* 3. pull available tickets with seller profile */
  const { data: tickets } = await supabase
    .from('tickets')
    .select(`
      id, price, proof_url,  buyer_uni_only, last_entry_time,
      profiles ( id, university, avatar_url )
    `)
    .eq('event_id', eventId)
    .eq('status', 'available')
    .order('price');

  /* 4. flag emoji for city pill */
  const flagMap = { edinburgh: '🏴', london: '🇬🇧', bristol: '🏴‍☠️' };
  const flag    = flagMap[lower] || '';

  /* 5. render page */
  return (
    <section className="px-4 pt-[84px] pb-6 space-y-6">
      <CityTag city={cRow.name} flag={flag} />

      <EventHero event={event} />

      <div className="flex items-center justify-between gap-4">
        <SellTicketButton href={`/${lower}/${eventId}/sell`} />
        {/* unified DemandChip also contains the "🔔 I'd buy" button */}
        <DemandChip eventId={eventId} />
      </div>

      <TicketList tickets={tickets || []} eventId={eventId} />
    </section>
  );
}