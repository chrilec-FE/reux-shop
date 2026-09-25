'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/LoadingSkeleton';

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user || null);
      if (data.session?.user) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', data.session.user.id)
          .order('created_at', { ascending: false });
        setOrders(orderData || []);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="py-8" aria-label="Loading account"><Skeleton className="h-8 w-40" /><div className="mt-8 grid gap-4 sm:grid-cols-2"><Skeleton className="h-28" /><Skeleton className="h-28" /></div><Skeleton className="mt-8 h-32" /></div>;

  if (!supabase) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-500">Accounts are not configured yet. Set up Supabase env keys first.</p>
        <Link href="/" className="btn-secondary mt-6">Back home</Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">You are not signed in</h1>
        <Link href="/login" className="btn-primary mt-6">Sign in / Sign up</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My account</h1>
        <button
          className="btn-secondary"
          onClick={async () => { await supabase.auth.signOut(); location.href = '/'; }}
        >
          Sign out
        </button>
      </div>
      <p className="mt-2 text-neutral-500">{user.email}</p>

      <h2 className="mt-10 mb-4 text-lg font-semibold">Order history</h2>
      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
          No orders yet. <Link href="/shop" className="underline">Start shopping</Link>
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card flex items-center justify-between p-4 text-sm">
              <div>
                <p className="font-medium">Order {o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()}</p>
                <p className="text-neutral-500">
                  {o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                </p>
                {o.shipping_address && <p className="mt-1 text-xs text-neutral-400">Ship to: {[o.shipping_address.line1, o.shipping_address.line2, [o.shipping_address.postal_code, o.shipping_address.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</p>}
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(o.total)}</p>
                <p className={`text-xs ${o.status === 'paid' || o.status === 'shipped' ? 'text-green-600' : 'text-amber-600'}`}>{o.status.replace('_', ' ')}</p>
                {o.tracking_url && <a href={o.tracking_url} target="_blank" rel="noreferrer" className="mt-1 block text-xs underline">Track shipment</a>}
                {o.tracking_number && <p className="text-xs text-neutral-400">{o.tracking_number}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
