'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';
import { Eye, EyeOff } from 'lucide-react';         
import ResetModal from './ResetModal';


export default function AuthPage({ mode }) {
  const router   = useRouter();
  const supabase = createSupabaseBrowser();

  // form state
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [name,       setName]       = useState('');
  const [university, setUniversity] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [showPwd,    setShowPwd]    = useState(false);
  const [showReset, setShowReset] = useState(false);   

  const emailLooksUni = email.trim().toLowerCase().endsWith('.ac.uk');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!emailLooksUni) {
      alert('Please use your university e-mail (…ac.uk)');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        // ── sign-up ───────────────────────────────────────────────
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, university }
          }
        });
        if (error) throw error;

        // update profiles row the trigger just created
        if (data.user) {
          await supabase.from('profiles')
            .update({ name, university })
            .eq('id', data.user.id);
        }

        alert('We’ve sent a quick confirmation e-mail — verify to continue!');
      } else {
        // ── sign-in ───────────────────────────────────────────────
        const { error } = await supabase.auth
          .signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/');
      }
    } catch (err) {
      alert(err.message || 'Auth failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xs pt-32 pb-16 space-y-6">
      <h1 className="text-3xl font-extrabold text-center">
        {mode === 'signup' ? 'Register' : 'Log in'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <input
            type="text"
            required
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        )}

        <input
          type="email"
          required
          placeholder="Uni e-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />

        {mode === 'signup' && (
          <input
            type="text"
            required
            placeholder="University (e.g. Edinburgh)"
            value={university}
            onChange={e => setUniversity(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        )}

        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            required={mode === 'signup'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded border px-3 py-2 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute inset-y-0 right-2 flex items-center text-gray-500"
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded disabled:opacity-50"
        >
          {loading
            ? '…'
            : mode === 'signup'
              ? 'Register / Confirm e-mail'
              : 'Continue'}
        </button>

        {mode === 'signup' && (
          <p className="mt-1 text-xs text-gray-600 text-center">
            We’ll send a verification link to your uni e-mail.
          </p>
        )}
      </form>

      {mode === 'signup' ? (
        <p className="text-center text-sm">
          Already have an account?{' '}
          <a href="/signin" className="underline">Log in</a>
        </p>
      ) : (
        <>
          <p className="text-center text-sm">
            First time?{' '}
            <a href="/signup" className="underline">Register</a>
          </p>
      
          <p className="text-center mt-2">
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="underline text-xs text-gray-600 hover:text-black"
            >
              Forgot password?
            </button>
          </p>
      
          {showReset && <ResetModal close={() => setShowReset(false)} />}
        </>
      )}
    </main>
  );
}
