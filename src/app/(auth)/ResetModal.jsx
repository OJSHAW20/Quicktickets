'use client';

import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function ResetModal({ close }) {
  const supabase = createSupabaseBrowser();
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset`,
    });
    setLoading(false);
    if (error) alert(error.message);
    else       setSent(true);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-sm rounded p-6 space-y-4">
        {!sent ? (
          <>
            <h2 className="text-xl font-bold">Reset password</h2>
            <form onSubmit={handleSend} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Uni e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Send link'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p>Check your inbox – a reset link is on its way.</p>
            <button
              onClick={close}
              className="underline text-sm text-center block mx-auto"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
