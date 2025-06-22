"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabaseBrowser";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function TicketSellingCard({ ticket }) {
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  // UI state for editing price
  const [editing, setEditing] = useState(false);
  const [newPrice, setNewPrice] = useState(ticket.price.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cancel listing (you’ve got this working)
  const handleCancel = async () => {
    if (!confirm("Cancel this listing?")) return;
    setLoading(true);
    const { error } = await supabase
      .from("tickets")
      .update({ status: "cancelled" })
      .eq("id", ticket.id);
    setLoading(false);
    if (error) {
      setError("Failed to cancel.");
    } else {
      router.refresh();
    }
  };

  // Save updated price
  const handleSavePrice = async () => {
    const parsed = parseFloat(newPrice);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid price greater than zero.");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase
      .from("tickets")
      .update({ price: parsed })
      .eq("id", ticket.id);
    setLoading(false);
    if (error) {
      setError("Failed to update price.");
    } else {
      setEditing(false);
      router.refresh();
    }
  };

  return (
    <div className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
      {/* Event info */}
            <div className="flex-1 mb-4 md:mb-0">
          <h4 className="text-lg font-semibold">{ticket.event.title}</h4>
          <p className="text-sm text-muted-foreground">
            {format(new Date(ticket.event.event_date), "MMM d")} &middot;{" "}
            {ticket.event.venue}
        </p>
      </div>

      {/* Price & actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
        {editing ? (
          <>
            <input
              type="number"
                min="0.01"
                step="0.01"
                // always a string here
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-24 px-2 py-1 border rounded"
                disabled={loading}
            />
            <Button size="sm" onClick={handleSavePrice} disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setNewPrice(ticket.price);
                setError("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <span className="text-xl font-bold">£{ticket.price}</span>
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit Price
            </Button>
          </>
        )}

        <Button
          size="sm"
          variant="destructive"
          onClick={handleCancel}
          disabled={loading}
        >
          {loading ? "Working…" : "Cancel Listing"}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
