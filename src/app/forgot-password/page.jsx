'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (!supabase) throw new Error('Supabase is not configured.');
      const redirectUrl = `${window.location.origin}/account/reset-password`;
      await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl });
    } catch (error) {
      // Intentionally silent; same confirmation for all requests.
    } finally {
      setLoading(false);
      setMessage('If an account exists for this email, a reset link has been sent.');
    }
  };

  return (
    <div className="animate-rise mx-auto max-w-sm py-10">
      <h1 className="text-2xl font-bold tracking-tight">Forgot password</h1>
      <p className="mt-2 text-sm text-neutral-500">Enter your email and we’ll send a reset link.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {message && <p className="text-sm text-neutral-700">{message}</p>}

        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? 'Please wait…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-neutral-500">
        <Link href="/login" className="underline underline-offset-2 hover:text-neutral-700">Back to sign in</Link>
      </p>
    </div>
  );
}
