import { createSupabaseServer } from '@/lib/supabaseClient';
import SellTicketClient from './SellTicketClient';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

export default async function SellPage({ params }) {
  const { city, eventId } = await params;
  const lower = city.toLowerCase();

  // —– fetch the signed-in user's session —–
  const authSupabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await authSupabase.auth.getSession();

  if (!session) {
    return <p className="p-6 text-center">You must be signed in to sell tickets.</p>;
  }
  const sellerId = session.user.id;

  const supabase = createSupabaseServer();

  // city lookup
  const { data: cityRow } = await supabase
    .from('cities')
    .select('id,name')
    .ilike('name', lower[0].toUpperCase() + lower.slice(1))
    .single();
  if (!cityRow) return <p className="p-6 text-center">City not found.</p>;

  // fetch the specific event
  const { data: event } = await supabase
    .from('events')
    .select('id,title,event_date')
    .eq('id', eventId)
    .eq('city_id', cityRow.id)
    .single();

  if (!event) return <p className="p-6 text-center">Event not found.</p>;

    return (
        <div className="mx-auto w-full max-w-md px-4">
          <SellTicketClient
            citySlug={lower}
            cityId={cityRow.id}
            cityName={cityRow.name}
            events={[event]}
            sellerId={sellerId}
            preSelectedEventId={eventId}
          />
        </div>
      );
} 