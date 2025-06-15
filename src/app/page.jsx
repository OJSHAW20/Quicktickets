import CityPicker from '@/components/CityPicker';
import { createSupabaseServer } from '@/lib/supabaseClient';
/* src/components/HomeHero.jsx */
import React from "react";

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
    <section className="mx-auto max-w-xs pt-[120px] pb-20 text-center">
      {/* main headline */}
      <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
        Welcome to<br />
        quicktickets.com
      </h1>

      {/* sub-headline */}
      <p className="mt-4 text-[13px] text-gray-600 leading-snug">
      Instantly buy or sell tickets without the group chat hassle – make last-minute nights out flexible and stress-free.
      </p>

      {/* ——— placeholder for city-picker button —— */}
      <CityPicker cities={cities ?? []} />

      {/* Lower info area */}
      <div className="mt-10">
        <p className="text-lg font-medium">Save your night in 3 clicks</p>

        {/* Pills in 2x2 grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 justify-center max-w-xs mx-auto">
            {[
              ["🔥 0% buyer fee"],
              ["✅ Improved flexibility"],
              ["🎓 Uni-verified sellers"],
              ["🔒 24h escrow"],
            ].map(([label]) => (
              <span
                key={label}
                className="bg-blue-200 text-black font-semibold rounded-full px-4 py-2 text-sm flex items-center justify-center"
              >
                {label}
              </span>
            ))}
        </div>
      </div>
    </section>
  );
}
