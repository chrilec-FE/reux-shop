'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const response = await fetch('/api/auth/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    setLoading(false);
    if (response.ok) {
      router.replace('/admin');
      router.refresh();
    } else setError('Invalid credentials');
  };

  return <div className="animate-rise mx-auto max-w-sm py-16"><div className="card p-8"><h1 className="text-xl font-bold">ReUX Admin</h1><p className="mt-1 text-sm text-neutral-500">Sign in to manage your store.</p><form onSubmit={submit} className="mt-6 space-y-4"><div><label className="label">Username</label><input className="input" value={username} onChange={(event) => setUsername(event.target.value)} required autoComplete="username" /></div><div><label className="label">Password</label><div className="relative"><input className="input pr-16" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div></div>{error && <p className="text-sm text-red-600">{error}</p>}<button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button></form></div><p className="mt-4 text-center text-sm"><Link href="/" className="text-neutral-400 underline hover:text-neutral-900">← Back to store</Link></p></div>;
}
