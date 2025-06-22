'use client';


import { useState, useTransition } from 'react';
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


 return (
   <div className="border rounded-md overflow-hidden grid grid-cols-[120px_1fr_auto]">
     {/* left band with event title */}
     <div className="bg-muted/50 flex items-center justify-center p-2 font-semibold">
       {ticket.event_title}
     </div>


     {/* middle – ticket facts */}
     <div className="p-3 space-y-1 text-sm">
       <div>📍 Location: {ticket.venue}</div>
       <div>⏰ Last entry: {ticket.last_entry_time}</div>
       <div>📦 Status: {ticket.status}</div>
       <div>💰 Price: £{ticket.price}</div>
     </div>


     {/* right – report button */}
     {ticket.status === 'delivered' && (
       <Dialog open={open} onOpenChange={setOpen}>
         <DialogTrigger asChild>
           <Button 
             variant="destructive" 
             className="h-full rounded-none"
             disabled={hasDispute}
           >
             {hasDispute ? 'Issue Reported' : 'Report issue'}
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
     )}
   </div>
 );
}


