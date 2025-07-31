import CityTag from '@/components/CityTag';
import SellTicketButton from '@/components/SellTicketButton';
import EventAccordion from '@/components/EventAccordion';
import { createSupabaseServer } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';           // no ISR cache

export default async function CityPage({ params }) {
  const { city } = await params;
  /* ── 1. prep display ─────────────────────────────── */
  const lower = city.toLowerCase();
  const flagMap = { edinburgh: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', london: '🇬🇧', bristol: '🇬🇧' };
  const displayName = lower[0].toUpperCase() + lower.slice(1);
  const flag = flagMap[lower] || '';

  /* ── 2. fetch city_id ────────────────────────────── */
  const supabase = createSupabaseServer();
  const { data: cData } = await supabase
    .from('cities')
    .select('id')
    .eq('name', displayName)
    .single();

  if (!cData) return <p className="p-6 text-center">City not found.</p>;

  /* ── 3. date window (today → +7) ─────────────────── */
  const today = new Date();
  const isoToday = today.toISOString().split('T')[0];
  const isoPlus7 = new Date(today.getTime() + 7 * 86400e3)
    .toISOString()
    .split('T')[0];

  /* ── 4. fetch events ─────────────────────────────── */
  const { data: events } = await supabase
    .from('events')
    .select('id, title, venue, event_date')
    .eq('city_id', cData.id)
    .gte('event_date', isoToday)
    .lte('event_date', isoPlus7)
    .order('event_date', { ascending: true });

  // Normalize event_date to YYYY-MM-DD for grouping
  const normalizedEvents = (events || []).map(e => ({
    ...e,
    event_date: e.event_date.split('T')[0],
  }));

  return (
    <section className="mx-auto max-w-screen-lg px-4 pt-[95px] pb-6 space-y-6">
  {/* top bar */}
  <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 mb-2">
    <CityTag city={displayName} flag={flag} />
    <SellTicketButton href={`/${lower}/sell`} />
  </div>

  {/* header */}
  <h2 className="mx-auto w-max rounded border-2 border-black px-6 py-1 text-2xl font-bold bg-sky-200">
    Current Events
  </h2>

  {/* centered, capped grey box */}
  <div className="bg-gray-100 max-w-screen-md mx-auto p-4 rounded-lg">
    <EventAccordion citySlug={lower} events={normalizedEvents} />
  </div>

  {/* footer note */}
  <p className="text-center text-sm text-gray-700">
    Don’t see your event? Add one by selling a ticket
  </p>
</section>
  );
}
