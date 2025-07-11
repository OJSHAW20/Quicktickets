// app/settings/ResetPasswordForm.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [pwd, setPwd] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) {
      alert(error.message);
    } else {
      alert('Password updated!');
      router.replace('/'); // back home
    }
  }

  return (
    <main className="mx-auto max-w-xs pt-32 space-y-6">
      <h1 className="text-2xl font-bold text-center">
        Choose a new password
      </h1>
      <form onSubmit={handleSave} className="space-y-4">
        <input
          type="password"
          required
          placeholder="New password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
        >
          Save
        </button>
      </form>
    </main>
  );
}
