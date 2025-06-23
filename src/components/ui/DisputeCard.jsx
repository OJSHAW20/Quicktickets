"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabaseBrowser";
import { Button } from "@/components/ui/button";
// If you prefer next/image for optimization:
// import Image from "next/image";

export default function DisputeCard({ dispute }) {
  const router     = useRouter();
  const supabase   = createSupabaseBrowser();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Format date (same as before)
  const formattedDate = new Date(dispute.created_at).toLocaleString("en-GB", {
    day:   "2-digit",
    month: "2-digit",
    year:  "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const handleAction = async (action) => {
    if (action === "cancel" && !confirm("Refund the buyer?")) return;

    setLoading(true);
    setError("");

    const { error } = await supabase.rpc("resolve_dispute", {
      p_dispute_id: dispute.id,
      p_order_id:   dispute.order.id,
      p_action:     action,
    });

    setLoading(false);

    if (error) {
      console.error("Dispute resolution error:", error);
      setError("Action failed. Try again.");
    } else {
      router.refresh();
    }
  };

  const { ticket } = dispute.order;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
      {/* Event + Price */}
      <h3 className="text-lg font-semibold">
        {ticket.event.title} — £{ticket.price}
      </h3>

      {/* Raised on */}
      <p className="text-sm text-muted-foreground">
        Raised on {formattedDate}
      </p>

      {/* Buyer’s message */}
      <div>
        <h4 className="font-medium">Buyer’s Message</h4>
        <p className="mb-2">{dispute.message}</p>
      </div>

      {/* Proof image */}
      {ticket.proof_url && (
        <div>
          <h4 className="font-medium">Proof Image</h4>
          <img
            src={ticket.proof_url}
            alt="Ticket proof"
            className="mt-1 max-h-48 object-contain border"
          />
          {/* Or with next/image:
            <Image
              src={ticket.proof_url}
              alt="Ticket proof"
              width={300}
              height={200}
              className="object-contain border"
            />
          */}
        </div>
      )}

      {/* Seller’s response */}
      {dispute.seller_response && (
        <div>
          <h4 className="font-medium">Seller’s Response</h4>
          <p className="mb-2">{dispute.seller_response}</p>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          size="sm"
          onClick={() => handleAction("capture")}
          disabled={loading}
        >
          {loading ? "Working..." : "Release Funds"}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleAction("cancel")}
          disabled={loading}
        >
          {loading ? "Working..." : "Refund Buyer"}
        </Button>
      </div>
    </div>
  );
}
