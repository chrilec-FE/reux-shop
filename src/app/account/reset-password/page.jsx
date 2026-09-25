'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const verify = async () => {
      if (!supabase) {
        if (active) setChecking(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      setValidSession(Boolean(!error && data.session));
      setChecking(false);
    };

    verify();
    return () => { active = false; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      if (!supabase) throw new Error('Supabase is not configured.');

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setSuccess('Password updated');
      setTimeout(() => router.replace('/login'), 1200);
    } catch (err) {
      setError(err.message || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="animate-rise mx-auto max-w-sm py-10"><p className="text-center text-neutral-500">Checking reset link…</p></div>;
  }

  if (!validSession) {
    return (
      <div className="animate-rise mx-auto max-w-sm py-10">
        <div className="card p-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
          <p className="mt-4 text-sm text-neutral-600">This reset link is invalid or has expired, request a new one.</p>
          <Link href="/forgot-password" className="btn-primary mt-6 inline-block">Request new reset link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise mx-auto max-w-md py-10">
      <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label">New password</label>
          <input
            className="input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}

        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? 'Please wait…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
