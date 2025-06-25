// src/components/TicketsSellingPanel.jsx
import React from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import TicketSellingCard from "@/components/ui/TicketSellingCard";
import { format } from "date-fns";

export default async function TicketsSellingPanel() {
  // 1. Build Supabase client bound to this request's cookies
  const supabase = createServerComponentClient({ cookies });

  // 2. Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return <p className="text-sm text-red-500">You must be signed in.</p>;
  }

  // 3. Fetch this user's AVAILABLE tickets with event info
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
    const [activeRes, soldRes] = await Promise.all([
      supabase
        .from("tickets")
        .select(`
          id,
          price,
          created_at,
          event:events ( id, title, event_date, venue )
        `)
        .eq("seller_id", session.user.id)
        .eq("status", "available")
        .order("created_at", { ascending: false }),
  
      supabase
        .from("tickets")
        .select(`
          id,
          price,
          created_at,
          event:events ( id, title, event_date, venue )
        `)
        .eq("seller_id", session.user.id)
        .eq("status", "sold")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false }),
    ]);
  
    // Debug logging
    console.log('TicketsSellingPanel: session.user.id', session.user.id);
    console.log('TicketsSellingPanel: activeRes', JSON.stringify(activeRes, null, 2));
    console.log('TicketsSellingPanel: soldRes', JSON.stringify(soldRes, null, 2));
  
    if (activeRes.error || soldRes.error) {
      console.error("Error loading listings:", activeRes.error || soldRes.error);
      return <p className="text-sm text-red-500">Failed to load your listings.</p>;
    }
  
    const active = activeRes.data;
    const sold = soldRes.data;
  
    return (
      <div className="space-y-6">
        {/* ——— Active listings ——— */}
        <section>
          <h3 className="text-lg font-semibold mb-2">Active Listings</h3>
          {active.length > 0 ? (
            <div className="space-y-4">
              {active.map((ticket) => (
                <TicketSellingCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active listings.</p>
          )}
        </section>

        <hr className="my-6 border-t border-muted" />
  
        {/* ——— Recently sold ——— */}
        {sold.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold mb-2">Recently Sold</h3>
            <div className="space-y-4">
              {sold.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center"
                        >
                          <div className="flex-1 mb-2 md:mb-0">
                            <h4 className="text-lg font-semibold">{ticket.event.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(ticket.event.event_date), "MMM d")} &middot;{" "}
                              {ticket.event.venue}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Sold on {format(new Date(ticket.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          <span className="text-xl font-bold">£{ticket.price}</span>
                        </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );


}
