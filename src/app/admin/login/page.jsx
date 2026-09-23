'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    setLoading(false);
    if (res.ok) {
      router.replace('/admin');
      router.refresh();
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="mx-auto max-w-sm py-16">
      <div className="card p-8">
        <h1 className="text-xl font-bold">ReUX Admin</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign in to manage your store.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Username</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-sm">
        <Link href="/" className="text-neutral-400 underline hover:text-neutral-900">← Back to store</Link>
      </p>
    </div>
  );
}
