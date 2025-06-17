import { createSupabaseServer } from '@/lib/supabaseClient';
import SellTicketClient from './SellTicketClient';

export const dynamic = 'force-dynamic';

export default async function SellPage({ params: { city } }) {
  const lower = city.toLowerCase();
  const supabase = createSupabaseServer();

  // city lookup
  const { data: cityRow } = await supabase
    .from('cities')
    .select('id,name')
    .ilike('name', lower[0].toUpperCase() + lower.slice(1))
    .single();
  if (!cityRow) return <p className="p-6 text-center">City not found.</p>;

  // next-7-days events
  const today = new Date();
  const plus7 = new Date(today.getTime() + 7 * 86400e3);
  const { data: events } = await supabase
    .from('events')
    .select('id,title,event_date')
    .eq('city_id', cityRow.id)
    .gte('event_date', today.toISOString())
    .lte('event_date', plus7.toISOString())
    .order('event_date');

  return (
    <SellTicketClient
      citySlug={lower}
      cityId={cityRow.id}
      cityName={cityRow.name}
      events={events || []}
    />
  );
}
