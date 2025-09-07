// src/components/TicketForm.jsx
'use client';

import { useState } from 'react';
import { createTicketFromForm } from '@/actions/createTicket';

export default function TicketForm({ eventId, sellerId, onTicketCreated }) {
  const [price, setPrice] = useState('');
  const [lastEntry, setLastEntry] = useState('');
  const [buyerScope, setBuyerScope] = useState('any');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file) { alert('Please choose an image file as proof'); return; }
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      alert('Enter a valid price'); return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('eventId', String(eventId));
      fd.append('sellerId', String(sellerId)); // MVP trusts client
      fd.append('price', String(parsedPrice));
      fd.append('last_entry_time', lastEntry);
      fd.append('buyer_uni_only', buyerScope === 'myUni' ? 'true' : 'false');
      fd.append('file', file); // <- the actual File

      const res = await createTicketFromForm(fd);
      console.log('createTicket result:', res);

      if (!res?.ok) {
        if (res?.code === 'STRIPE_ONBOARDING_REQUIRED') {
          window.location.href = '/api/stripe/connect/start';
          return;
        }
        alert(res?.message || res?.code || 'Failed to list ticket');
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
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4 bg-white p-4 rounded shadow">
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

      <div>
        <label className="block text-sm font-semibold">Upload proof image</label>
        <input
          type="file"
          accept="image/*"
          required
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm"
        />
        {file && <p className="mt-1 text-xs text-gray-500">Selected file: {file.name}</p>}
      </div>

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

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>First time selling?</strong> You'll be asked to register your card details with Stripe to receive payouts securely.
            </p>
          </div>
        </div>
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
