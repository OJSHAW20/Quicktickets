'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

/*
 * props
 *   citySlug : "edinburgh"
 *   events   : [{ id, title, venue, event_date }]
 */
export default function EventAccordion({ citySlug, events }) {
  const router = useRouter();

  /* util → ISO YYYY-MM-DD for n days ahead */
  const addDaysIso = (n) =>
    new Date(Date.now() + n * 86400e3).toISOString().split('T')[0];

  /* 1️⃣ map events by date */
  const byDate = useMemo(() => {
    const map = {};
    events.forEach((e) => ((map[e.event_date] ??= []).push(e)));
    return map; // { '2025-06-16': [ ..events ] }
  }, [events]);

  /* 2️⃣ build the FULL 7-day list whether or not events exist */
  const next7 = useMemo(
    () =>
      Array.from({ length: 7 }, (_, idx) => {
        const iso = addDaysIso(idx);
        return [iso, byDate[iso] ?? []]; // [date, events[]]
      }),
    [byDate]
  );

  /* 3️⃣ multiple open panels allowed – default open Today+Tomorrow */
  const defaultOpen = new Set(next7.slice(0, 2).map(([d]) => d));
  const [openDates, setOpenDates] = useState(defaultOpen);
  const toggle = (d) =>
    setOpenDates((s) => {
      const nxt = new Set(s);
      nxt.has(d) ? nxt.delete(d) : nxt.add(d);
      return nxt;
    });

  /* label helper */
  const nice = (iso) => {
    const d  = new Date(iso);
    const t0 = new Date();
    t0.setHours(0, 0, 0, 0);
  
    const diff = Math.round((d - t0) / 86400e3);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    // ↳ force UK style "17 Jun" on both server and client
    return d.toLocaleDateString("en-GB", {
      day:   "2-digit",
      month: "short",
    });
  };

  return (
    <div className="rounded-lg border bg-gray-100 p-4 h-[400px] flex flex-col">
      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {next7.map(([date, list]) => {
          const isOpen = openDates.has(date);
          return (
            <div key={date} className="space-y-2">
              {/* date pill */}
              <button
                onClick={() => toggle(date)}
                className="inline-flex items-center justify-between rounded-full border border-black bg-blue-100 px-5 py-1.5 text-base font-semibold"
              >
                {nice(date)}
                <span
                  className={`transition-transform transform text-sm ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                >
                  ▶
                </span>
              </button>
  
              {/* panel content */}
              {isOpen && (
                <div className="space-y-2">
                  {list.length ? (
                    list.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => router.push(`/${citySlug}/${e.id}`)}
                        className="flex w-full items-center justify-between rounded bg-gray-200 px-4 py-3 hover:bg-gray-300"
                      >
                        <span className="font-bold">{e.title}</span>
                        <span className="text-sm text-gray-700 flex items-center gap-1">
                          📍 {e.venue}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-6 text-center text-sm">
                      Currently, no events,&nbsp;
                      <span className="underline">add one by selling a ticket!</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
  
      {/* Always visible scroll cue */}
      <p className="pt-2 text-center text-sm font-semibold">
        Scroll to see more events <br />
        <span className="text-2xl leading-none">⌄⌄</span>
      </p>
    </div>
  );
}
  