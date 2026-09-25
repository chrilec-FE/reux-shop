'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import AuthLogo from '@/components/AuthLogo';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('SE');
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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              street_address: streetAddress,
              postal_code: postalCode,
              city,
              country
            }
          }
        });
        if (error) throw error;
        if (!data.session) {
          setError('Account created. Check your email to confirm your address, then sign in.');
          return;
        }
      }
      router.replace('/account');
      router.refresh();
    } catch (err) {
      setError(err.message === 'Email not confirmed'
        ? 'Please confirm your email address before signing in.'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-rise mx-auto max-w-sm py-10">
      <div className="mb-8 flex justify-center"><AuthLogo /></div>
      <h1 className="text-2xl font-bold tracking-tight">{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === 'signup' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">First name</label>
                <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Last name</label>
                <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="label">Street address</label>
              <input className="input" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Postal code</label>
                <input className="input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="label">Country</label>
              <select className="input" value={country} onChange={(e) => setCountry(e.target.value)} required>
                <option value="SE">Sweden</option>
              </select>
            </div>
          </>
        )}
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
            <div className="relative"><input className="input pr-16" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div>
        </div>
        {mode === 'signin' && (
          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-700">
              Forgot password?
            </Link>
          </div>
        )}
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
