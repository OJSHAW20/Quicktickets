// src/components/TicketCard.jsx
'use client';

import { useState, useEffect } from 'react';
import { buyTicket } from '@/actions/buyTicket';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useSession } from '@supabase/auth-helpers-react';    // ← add this

export default function TicketCard({ ticket, eventId }) {
  const [allowedToBuy, setAllowedToBuy] = useState(true);
  const session = useSession();          // ← new
  const buyerId = session?.user?.id;     // ← new
  const sellerId = ticket.seller_id;      // who listed this ticket

  useEffect(() => {
         // 1) no restriction → allow
     if (!ticket.buyer_uni_only) {
       setAllowedToBuy(true);
       return;
     }
 
     // 2) seller viewing their own ticket → allow
     if (buyerId && buyerId === sellerId) {
       setAllowedToBuy(true);
       return;
     }

   // 3) Different user & uni-only: fetch buyer’s uni & compare to seller’s
  async function checkUni() {
    const { data: buyerProfile, error } = await supabaseBrowser
      .from('profiles')
      .select('university')
      .eq('id', buyerId)
      .single();
    if (error || !buyerProfile) {
      setAllowedToBuy(false);
      return;
    }

    const sellerUni = ticket.profiles?.university;
    setAllowedToBuy(buyerProfile.university === sellerUni);
  }
  checkUni();
  }, [ticket.buyer_uni_only, ticket.profiles?.university]);

  return (
    <div className="flex rounded border overflow-hidden">
      {/* Ticket info */}
      <div className="flex-1 p-3">
        <p className="text-xl font-bold">£{ticket.price.toFixed(2)}</p>
        <div className="mt-1 flex items-center text-sm text-gray-600 gap-6">
          {ticket.last_entry_time && (
            <span className="flex items-center gap-1">
              {ticket.last_entry_time} <span role="img" aria-label="alarm">⏰</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            {ticket.profiles?.university
              ? `${ticket.profiles.university} verified`
              : 'No Uni verified'}
            {ticket.profiles?.university ? '✅' : '❌'}
          </span>
        </div>
      </div>

      {/* Buy button */}
      <button
        disabled={!allowedToBuy}
        className={`w-24 font-bold rounded py-2 ${
          allowedToBuy
            ? 'bg-green-300 hover:bg-green-400 text-black'
            : 'bg-gray-300 cursor-not-allowed opacity-50 text-gray-600'
        }`}
        onClick={async () => {
          if (!allowedToBuy) return;
          try {
            const url = await buyTicket(ticket.id, eventId);
            if (url) window.location.href = url;
          } catch (err) {
            alert(err.message);
          }
        }}
      >
        {ticket.buyer_uni_only && !allowedToBuy
          ? 'Only my university'
          : `Buy for £${ticket.price.toFixed(2)}`}
      </button>
    </div>
  );
}
