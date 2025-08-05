"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "./button";

export default function BuyTicketButton({ ticketId }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createPagesBrowserClient();

  async function handleBuy() {
    setLoading(true);
        // 1️⃣ Get the current user
     const {
       data: { user },
       error: userErr,
     } = await supabase.auth.getUser();
     if (userErr || !user) {
       alert("Please log in to buy tickets");
       setLoading(false);
       return;
     }
    // 2) Call our Checkout-Session API
    const res = await fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           ticketId,
           buyerId: user.id,
         }),
    });
    const { url, error } = await res.json();
    if (error) {
      alert("Checkout error: " + error);
      setLoading(false);
      return;
    }
    // 2) Redirect into Stripe Checkout
    router.push(url);
  }

  return (
    <Button
      onClick={handleBuy}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {loading ? "Redirecting…" : "Buy"}
    </Button>
  );
}
