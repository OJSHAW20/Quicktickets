'use client';

import { useState, useTransition } from 'react';
import { createEvent } from '@/actions/createEvent';

export default function NewEventForm({ cityId, onEventCreated }) {
  const [pending, start] = useTransition();

  /* local state */
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [date,  setDate]  = useState('');
  const [time,  setTime]  = useState('');
  const [desc,  setDesc]  = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    start(async () => {
      try {
        const eventId = await createEvent({
          city_id: cityId,
          title,
          venue,
          // combine date+time → ISO string; if time omitted default to 21:00
          event_date: new Date(`${date}T${time || '21:00'}:00`).toISOString(),
          description: desc || null,
        });
        onEventCreated(eventId);  // parent will swap to TicketForm
      } catch (err) {
        alert(err.message);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded border p-4 bg-gray-50"
    >
      <h3 className="text-lg font-bold text-center">Add event</h3>

      <div>
        <label className="block text-sm font-semibold mb-1">Event name</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Venue</label>
        <input
          required
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-semibold mb-1">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-semibold mb-1">Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Description</label>
        <textarea
          rows={3}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-blue-600 py-2 text-white font-bold disabled:opacity-50"
      >
        {pending ? 'Creating…' : 'Create event'}
      </button>
    </form>
  );
}
