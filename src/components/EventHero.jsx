// src/components/EventHero.jsx
export default function EventHero({ event }) {
    if (!event) return null;
  
    // format helpers
    const dt     = new Date(event.event_date);
    const dayStr = dt.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    const timeStr = dt.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  
    return (
      <div className="rounded bg-gray-200 px-4 py-6 text-center space-y-4">
        {/* big title */}
        <h1 className="text-4xl font-extrabold leading-tight">
          {event.title}
        </h1>
  
        {/* venue + start time row */}
        <div className="flex justify-between text-lg font-semibold">
          <span>{event.venue}</span>
          <span>{dayStr} • {timeStr}</span>
        </div>
  
        {/* description */}
        {event.description && (
          <p className="mt-2 text-base">{event.description}</p>
        )}
      </div>
    );
  }
  