'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';

const statusDetails = {
  pending: { label: 'Waiting for payment', className: 'bg-neutral-100 text-neutral-600' },
  paid: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
  packaging: { label: 'Packaging', className: 'bg-orange-100 text-orange-700' },
  shipped: { label: 'Shipped', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-neutral-100 text-neutral-600' },
  canceled: { label: 'Cancelled', className: 'bg-neutral-100 text-neutral-600' },
  refunded: { label: 'Refunded', className: 'bg-red-100 text-red-700' }
};

export default function AccountOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadOrders = async () => {
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      if (!session) {
        router.replace('/login');
        return;
      }

      const res = await fetch('/api/account/orders', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      if (!active) return;
      if (!res.ok) setError(data.error || 'Could not load your orders');
      else setOrders(data.orders || []);
      setLoading(false);
    };
    loadOrders();
    return () => { active = false; };
  }, [router]);

  if (loading) return <p className="py-20 text-center text-neutral-500">Loading orders…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">My orders</h1>
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
      {!error && orders.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
          You have no orders yet. <Link href="/shop" className="underline">Start shopping</Link>
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const status = statusDetails[order.status] || statusDetails.pending;
            return (
              <article key={order.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">Order {order.id.slice(0, 8)}…</p>
                    <p className="mt-1 text-sm text-neutral-500">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(order.total)}</p>
                    <span className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-neutral-600">{(order.items || []).map((item) => `${item.qty}× ${item.name}`).join(', ')}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}