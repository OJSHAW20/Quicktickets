'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

export default function UserMenu() {
  const session  = useSession();
  const supabase = useSupabaseClient();
  const router   = useRouter();

  /* ── logged-out nav ─────────────────────────────────────────── */
  if (!session) {
    return (
      <>
        <Link href="/signup" className="hover:underline">Sign up</Link>
        <Link href="/signin" className="hover:underline">Log in</Link>
      </>
    );
  }

  /* ── logged-in nav ──────────────────────────────────────────── */
  const { user } = session;
  const displayName = user.user_metadata?.name || user.email;

  async function handleLogout() {
    if (!confirm('Log out?')) return;
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <span className="font-semibold whitespace-nowrap max-w-[12ch] truncate">
        {displayName}
      </span>

      <button
        onClick={handleLogout}
        className="text-xs underline hover:text-red-600"
      >
        Log out
      </button>
    </div>
  );
}
