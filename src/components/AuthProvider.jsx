'use client';

import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function AuthProvider({ children }) {
    const supabase = createSupabaseBrowser()

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
}
