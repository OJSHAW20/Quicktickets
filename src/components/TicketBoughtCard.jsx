'use client';


import { useState, useTransition, useEffect} from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';  // add this
import { useRouter } from 'next/navigation';
import {
 Dialog,
 DialogTrigger,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createDispute } from '@/actions/createDispute';


/**
* Props: { ticket, hasDispute }  — one row from
* `SELECT tickets.*, orders.id AS order_id, events.title AS event_title`
*/
export default function TicketBoughtCard({ ticket, hasDispute }) {
 const [open, setOpen]       = useState(false);
 const [msg, setMsg]         = useState('');
 const [pending, startTx]    = useTransition();
 const router = useRouter();
 const browserSupabase = createPagesBrowserClient();
 const [sellerVerified, setSellerVerified] = useState(null);



 const submit = (e) => {
   e.preventDefault();
   startTx(async () => {
     await createDispute({ orderId: ticket.order_id, message: msg });
     setOpen(false);
     setMsg('');
     // Refresh the page to update the hasDispute prop
     router.refresh();
   });
 };

 const eventTimeMs = new Date(ticket.event_date).getTime();
 const allowDispute = Date.now() < eventTimeMs + 24 * 60 * 60 * 1000;

  useEffect(() => {
    // Only fetch if seller_id is a non-empty string and looks like a UUID
    if (!ticket.seller_id || typeof ticket.seller_id !== 'string' || ticket.seller_id.length !== 36) {
      setSellerVerified(false);
      return;
    }
    // fetch the seller's uni_verified flag
    browserSupabase
      .from('profiles')
      .select('uni_verified')
      .eq('id', ticket.seller_id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // only log when there's a real Supabase error
          console.error("Profile fetch error:", error);
          return;
        }
        if (data && typeof data.uni_verified === 'boolean') {
          setSellerVerified(data.uni_verified);
        } else {
          // no row found → treat as "not verified"
          setSellerVerified(false);
        }
      });
  }, [ticket.seller_id]);


 return (
   <div className="border rounded-md overflow-hidden grid grid-cols-[120px_1fr_auto]">
     {/* left band with event title */}
     <div className="bg-muted/50 flex items-center justify-center p-2 font-semibold">
       {ticket.event_title}
     </div>


     {/* middle – ticket facts */}
     <div className="p-3 space-y-1 text-sm">
         {/* 1. Event date */}
  <div>
    📅 Event:{" "}
    {new Date(ticket.event_date).toLocaleDateString("en-GB", {
      day:   "2-digit",
      month: "short",
      year:  "numeric",
    })}
  </div>

  {/* 2. Location & entry */}
  <div>📍 Location: {ticket.venue}</div>
  <div>⏰ Last entry: {ticket.last_entry_time}</div>

  {/* 3. Status & price */}
  <div>📦 Status: {ticket.status}</div>
  <div>💰 Price: £{ticket.price}</div>

  {/* 4. Seller verification */}
  <div>
  👩‍🎓 Seller:&nbsp;
  {sellerVerified === null
    ? 'Loading…'
    : sellerVerified
    ? 'University verified'
    : 'Not verified'}
  </div>

  {/* 5. Ticket image link */}
  {ticket.proof_url && (
    <div>
      <a
        href={ticket.proof_url}
        target="_blank"
        rel="noopener noreferrer"
        download
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
           // 1) Already disputed
           <Button variant="destructive" disabled 
           className="max-w-[5rem] whitespace-pre-wrap text-center px-2 py-1">
             Issue{"\n"}Reported
           </Button>
         ) : allowDispute ? (
           // 2) Within 24h → full dialog
           <Dialog open={open} onOpenChange={setOpen}>
             <DialogTrigger asChild>
               <Button variant="destructive">
                 Report issue
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-md">
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
           // 3) Too late → plain button with alert
           <Button
           variant="destructive"
           onClick={() =>
             alert("You can only raise a dispute within 24 hours of the event.")
           }
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


