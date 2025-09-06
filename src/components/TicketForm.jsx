// src/components/TicketForm.jsx
'use client';

import { useState } from 'react';
import { createTicket } from '@/actions/createTicket';

export default function TicketForm({
  eventId,
  sellerId,            // comes from SellTicketClient
  onTicketCreated
}) {
  const [price, setPrice] = useState('');
  const [lastEntry, setLastEntry] = useState('');
  const [buyerScope, setBuyerScope] = useState('any');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file) {
      alert('Please choose an image file as proof');
      return;
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      alert('Enter a valid price');
      return;
    }

    setSubmitting(true);
    try {
      const buyer_uni_only = buyerScope === 'myUni';

      const res = await createTicket({
        eventId,
        sellerId, // from props
        price: parsedPrice,
        last_entry_time: lastEntry,
        buyer_uni_only,
        file,
      });

      if (!res?.ok) {
        if (res?.code === 'STRIPE_ONBOARDING_REQUIRED') {
          // Send the seller to Stripe onboarding
          window.location.href = '/api/stripe/connect/start';
          return;
        }
        alert(res?.message || 'Failed to list ticket');
        return;
      }

      onTicketCreated?.(eventId);
    } catch (err) {
      console.error(err);
      alert('Failed to list ticket');
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
