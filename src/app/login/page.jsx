'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!supabase) throw new Error('Supabase is not configured.');
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
      }
      router.replace('/account');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-rise mx-auto max-w-sm py-10">
      <h1 className="text-2xl font-bold tracking-tight">{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
            <div className="relative"><input className="input pr-16" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-neutral-500">
        {mode === 'signin' ? (
          <>No account?{' '}
            <button className="underline" onClick={() => setMode('signup')}>Sign up</button></>
        ) : (
          <>Have an account?{' '}
            <button className="underline" onClick={() => setMode('signin')}>Sign in</button></>
        )}
      </p>
      <p className="mt-6 text-center text-xs text-neutral-400">Secure customer access</p>
    </div>
  );
}
