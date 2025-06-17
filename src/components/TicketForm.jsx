'use client';

import { useState } from 'react';
import { createTicket } from '@/actions/createTicket';  // your server-action
import { useRouter } from 'next/navigation';

export default function TicketForm({ eventId, onTicketCreated }) {
  const router = useRouter();
  const [price,    setPrice]    = useState('');
  const [lastEntry,setLastEntry]= useState('');
  const [buyerScope, setBuyerScope] = useState('any');
  const [file,     setFile]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      return alert('Please choose an image file as proof');
    }
    setSubmitting(true);

    try {
      // this server action should:
      // 1) take the file, upload it to storage
      // 2) insert a row into `tickets` with the returned public URL
      await createTicket({
        eventId,
        price: parseFloat(price),
        last_entry_time: lastEntry,
        buyer_uni_only: buyerOnly,
        file  // pass the File object along to your action
      });
      onTicketCreated(eventId);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to list ticket');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
      {/* Price */}
      <div>
        <label className="block text-sm font-semibold">Price (£)</label>
        <input
          type="number"
          step="0.01"
          required
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      {/* Last entry */}
      <div>
        <label className="block text-sm font-semibold">Last entry time</label>
        <input
          type="text"
          placeholder="e.g. 11:00 PM"
          required
          value={lastEntry}
          onChange={e => setLastEntry(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-semibold">Upload proof image</label>
        <input
          type="file"
          accept="image/*"
          required
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm"
        />
        {file && (
          <p className="mt-1 text-xs text-gray-500">
            Selected file: {file.name}
          </p>
        )}
      </div>

{/* Restrict buyers */}
     <div>
       <label className="block text-sm font-semibold">Buyer scope</label>
      <select
      value={buyerScope}
      onChange={e => setBuyerScope(e.target.value)}
      className="w-full rounded border px-3 py-2"
    >
      <option value="any">Anyone</option>
      <option value="verified">Any uni-verified buyer</option>
      <option value="myUni">Only buyers from my university</option>
    </select>
     </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded disabled:opacity-50"
      >
        {submitting ? 'Listing…' : 'Sell ticket'}
      </button>
    </form>
  );
}
