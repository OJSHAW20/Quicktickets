'use client';

import { useState, useTransition, useEffect } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { sanitizeUrl } from '@/lib/utils';
import { createDispute } from '@/actions/createDispute';

export default function TicketBoughtCard({ ticket, hasDispute }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg]   = useState('');
  const [pending, startTx] = useTransition();
  const router = useRouter();
  const browserSupabase = createPagesBrowserClient();
  const [sellerVerified, setSellerVerified] = useState(null);

  const openTicket = () => {
    if (!ticket?.id) return;
    router.push(`/api/tickets/${ticket.id}`);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openTicket();
    }
  };

  const submit = (e) => {
    e.preventDefault();
    startTx(async () => {
      await createDispute({ orderId: ticket.order_id, message: msg });
      setOpen(false);
      setMsg('');
      router.refresh();
    });
  };

  const eventTimeMs = new Date(ticket.event_date).getTime();
  const allowDispute = Date.now() < eventTimeMs + 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (!ticket.seller_id || typeof ticket.seller_id !== 'string' || ticket.seller_id.length !== 36) {
      setSellerVerified(false);
      return;
    }
    browserSupabase
      .from('profiles')
      .select('uni_verified')
      .eq('id', ticket.seller_id)
      .single()
      .then(({ data, error }) => {
        if (error && (error.message || error.status || Object.keys(error).length > 0)) {
          console.error('Profile fetch error:', error);
        }
        setSellerVerified(Boolean(data?.uni_verified));
      });
  }, [ticket.seller_id, browserSupabase]);

  return (
    <div
      className="border rounded-md overflow-hidden grid grid-cols-[120px_1fr_auto] cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={openTicket}
      role="button"
      tabIndex={0}
      onKeyDown={onKey}
    >
      {/* left band with event title */}
      <div className="bg-muted/50 flex items-center justify-center p-2 font-semibold">
        {ticket.event_title}
      </div>

      {/* middle – ticket facts */}
      <div className="p-3 space-y-1 text-sm">
        <div>
          📅 Event:{' '}
          {new Date(ticket.event_date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>

        <div>📍 Location: {ticket.venue}</div>
        <div>⏰ Last entry: {ticket.last_entry_time}</div>

        <div>📦 Status: {ticket.status}</div>
        <div>💰 Price: £{ticket.price}</div>

        <div>
          👩‍🎓 Seller:&nbsp;
          {sellerVerified === null ? 'Loading…' : sellerVerified ? 'University verified' : 'Not verified'}
        </div>

        {/* secondary link (same target) */}
        {ticket.id && (
          <div>
            <a
              href={sanitizeUrl(`/api/tickets/${ticket.id}`)}
              onClick={(e) => e.stopPropagation()} // don’t trigger parent click
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 underline"
            >
              View / Download ticket
            </a>
          </div>
        )}
      </div>

      {/* right – report button */}
      {ticket.status === 'delivered' && (
        <div className="col-span-1 flex items-center justify-center">
          {hasDispute ? (
            <Button
              variant="destructive"
              disabled
              onClick={(e) => e.stopPropagation()}
              className="max-w-[5rem] whitespace-pre-wrap text-center px-2 py-1"
            >
              Issue{'\n'}Reported
            </Button>
          ) : allowDispute ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" onClick={(e) => e.stopPropagation()}>
                  Report issue
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                  <DialogTitle>Report an issue</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                  <textarea
                    required
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    placeholder="Describe the problem…"
                    rows={4}
                    className="w-full rounded-md border p-2 text-sm"
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={pending}>
                      {pending ? 'Sending…' : 'Submit'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                alert('You can only raise a dispute within 24 hours of the event.');
              }}
              className="max-w-[6rem] whitespace-pre-wrap text-center px-3 py-15"
            >
              Dispute
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
