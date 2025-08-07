import CityPicker from '@/components/CityPicker';
import { createSupabaseServer } from '@/lib/supabaseClient';
/* src/components/HomeHero.jsx */
import React from 'react';

export const revalidate = 3600;   // optional: cache for 1 hour

export default async function Home() {
  const supabase = createSupabaseServer();

  const { data: cities, error } = await supabase
    .from('cities')
    .select('id, name')
    .order('name');          // already London, Edinburgh, Bristol

  if (error) throw error;    // bubble to Next.js error page
  
  return (
    /* pad top & bottom so content never hides under fixed header/footer */
    <section className="mx-auto max-w-screen-md px-4 pt-[80px] pb-20 text-center">
      {/* main headline */}
      <h1 className="pt-8 text-3xl xs:text-5xl sm:text-5xl md:text-6xl font-bold leading-tight break-words">
        Welcome to<br />
        quicktickets.com
      </h1>

      {/* sub-headline */}
      <p className="mt-4 text-[13px] text-gray-600 leading-snug">
        Instantly buy or sell tickets without the group chat hassle – make last-minute nights out flexible and stress-free.
      </p>

      {/* City picker centered in a narrower container */}
      <div className="mt-6 max-w-xs mx-auto">
        <CityPicker cities={cities ?? []} />
      </div>

      {/* Lower info area */}
      <div className="mt-7">
        <p className="text-2xl font-medium">3-Click Payout + 0% Fees</p>

        {/* Pills: 2 columns on mobile, 4 columns from md up */}
        <div className="hidden md:grid mt-4 grid-cols-2 md:grid-cols-4 gap-4 max-w-md md:max-w-xl mx-auto">
          {[
            ['🔥 0% buyer fee'],
            ['✅ Improved flexibility'],
            ['🎓 Uni-verified sellers'],
            ['🔒 24h escrow'],
          ].map(([label]) => (
            <span
              key={label}
              className="bg-blue-200 text-black font-semibold rounded-full px-4 py-2 text-sm flex items-center justify-center w-full"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
