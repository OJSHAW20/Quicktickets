'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';
import { Button } from '@/components/ui/button';
import { respondToDispute } from '@/actions/respondToDispute';

export default function DisputeCard({ dispute }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const formattedDate = new Date(dispute.created_at).toLocaleString('en-GB', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <form
      action={async (formData) => {
        setSubmitting(true);
        await respondToDispute(formData);
        router.refresh();
      }}
      className="border rounded-lg p-4 bg-white shadow-sm space-y-4"
    >
      <h3 className="text-lg font-semibold">
        {dispute.order.ticket.event.title} — £{dispute.order.ticket.price}
      </h3>
      <p className="text-sm text-muted-foreground">
        Raised on {formattedDate}
      </p>
      <div>
        <h4 className="font-medium">Buyer’s Message</h4>
        <p className="mb-2">{dispute.message}</p>
      </div>
      {dispute.order.ticket.proof_url && (
        <div>
          <h4 className="font-medium">Proof Image</h4>
          <img
            src={dispute.order.ticket.proof_url}
            alt="Ticket proof"
            className="mt-1 max-h-48 object-contain border"
          />
        </div>
      )}

      {/* ← New textarea for the admin’s response */}
      <div>
        <label htmlFor={`response-${dispute.id}`} className="font-medium">
          Your Response
        </label>
        <textarea
          id={`response-${dispute.id}`}
          name="response"
          required
          className="w-full mt-1 border rounded p-2"
          placeholder="Explain your decision..."
        />
      </div>

      {/* Hidden fields for disputeId and orderId */}
      <input type="hidden" name="disputeId" value={dispute.id} />
      <input type="hidden" name="orderId" value={dispute.order.id} />

      {/* Action buttons */}
      <div className="flex space-x-2">
        <Button
          type="submit"
          name="action"
          value="capture"
          variant="default"
          disabled={submitting}
        >
          {submitting ? 'Processing…' : 'Release Funds'}
        </Button>
        <Button
          type="submit"
          name="action"
          value="cancel"
          variant="destructive"
          disabled={submitting}
        >
          {submitting ? 'Processing…' : 'Refund Buyer'}
        </Button>
      </div>
    </form>
  );
}
