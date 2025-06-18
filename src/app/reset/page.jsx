'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function ResetPage() {
  const router   = useRouter();
  const supabase = createSupabaseBrowser();
  const [msg, setMsg] = useState('Verifying your reset link…');
  const [error, setError] = useState(false);

  useEffect(() => {
    async function handle() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/settings?pwReset=1');
          return;
        }
      const { search, hash } = window.location;

      /* ── style A : query params ───────────────────────────── */
      const qs = new URLSearchParams(search);
      if (qs.get('type') === 'recovery' && qs.get('token')) {
        const { error } = await supabase.auth.verifyOtp({
          type : 'recovery',
          token: qs.get('token'),
        });
        if (error) { setError(true); setMsg(error.message); return; }
        router.replace('/settings?pwReset=1'); return;
      }

      /* ── style B : hash params ────────────────────────────── */
      if (hash.startsWith('#')) {
        const hs = new URLSearchParams(hash.slice(1));
        const access  = hs.get('access_token');
        const refresh = hs.get('refresh_token');
        if (access && refresh) {
          const { error } = await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
          if (error) { setError(true); setMsg(error.message); return; }
          router.replace('/settings?pwReset=1'); return;
        }
      }

      /* ── fallback ─────────────────────────────────────────── */
      setError(true);
      setMsg('Invalid or expired link. Please request a new reset e-mail.');
    }

    handle();
  }, [router, supabase]);

  return (
    <p className={`pt-32 text-center ${error ? 'text-red-600 max-w-xs mx-auto' : ''}`}>
      {msg}
    </p>
  );
}
