// src/app/admin/disputes/page.jsx
import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import DisputeCard from "@/components/ui/DisputeCard";


export default async function AdminDisputesPage() {
  // 1) Build a Supabase client bound to this request’s cookies
  const supabase = createServerComponentClient({ cookies });

  // 2) Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 3) Redirect non-signed-in users
  if (!session) {
    return redirect("/");
  }

  // 4) Check “is_admin” on your profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", session.user.id)
    .single();

  if (!profile?.is_admin) {
    // non-admins get bounced to home
    return redirect("/");
  }

    // 5) Fetch all pending disputes with order → ticket → event
  const { data: disputes, error } = await supabase
    .from("disputes")
    .select(`
      id,
      message,
      seller_response,
      created_at,
      order:orders (
        id,
        ticket_id,
        buyer_id,
        status,
        ticket: tickets (
          id,
          price,
          proof_url,
          event: events (
            id,
            title,
            venue,
            event_date
          )
        )
      )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading disputes:", error);
    return (
      <main className="mx-auto max-w-3xl p-6 pt-70">
        <h1 className="text-2xl font-bold mb-4">🛠 Admin: Manage Disputes</h1>
        <p className="text-sm text-red-500">Failed to load disputes.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">🛠 Admin: Manage Disputes</h1>

      {disputes.length === 0 ? (
        <p className="text-muted-foreground">No pending disputes.</p>
      ) : (
        disputes.map((d) => (
            <DisputeCard key={d.id} dispute={d} />
          ))
      )}
    </main>
  );
  
}
