'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function CityPicker({ cities }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const filtered = useMemo(() => {
    if (!query) return cities;
    return cities.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, cities]);

  return (
    <div className="w-full max-w-xs">
      {/* sub-heading */}
      <p className="mx-auto mb-3 inline-block min-w-60 rounded-full bg-blue-200 px-6 py-3 text-sm font-medium font-bold">
        Pick your city
      </p>

      {/* always-visible picker */}
      <div className="rounded-lg border bg-gray-100 p-3 shadow-inner">
        <div className="mb-2 flex items-center gap-2 rounded bg-white px-2 py-1">
          <span className="text-gray-500">🔍</span>
          <input
            placeholder="City"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {filtered.map(city => (
            <li key={city.id}>
              <button
                onClick={() => router.push(`/${city.name.toLowerCase()}`)}
                className="w-full rounded bg-white px-4 py-2 text-center font-semibold hover:bg-blue-50"
              >
                {city.name}
              </button>
            </li>
          ))}
          {!filtered.length && (
            <li className="py-4 text-center text-sm text-gray-500">No matches</li>
          )}
        </ul>
      </div>
    </div>
  );
}
