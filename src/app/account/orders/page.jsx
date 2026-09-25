'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/LoadingSkeleton';

const statusDetails = {
  pending: { label: 'Waiting for payment', className: 'bg-neutral-100 text-neutral-600' },
  paid: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
  packaging: { label: 'Packaging', className: 'bg-orange-100 text-orange-700' },
  shipped: { label: 'Shipped', className: 'bg-green-100 text-green-700' },
  received: { label: 'Received', className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', className: 'bg-neutral-100 text-neutral-600' },
  canceled: { label: 'Cancelled', className: 'bg-neutral-100 text-neutral-600' },
  refunded: { label: 'Refunded', className: 'bg-red-100 text-red-700' }
};

export default function AccountOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [undoIds, setUndoIds] = useState({});

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
    if (!res.ok) {
      setError(data.error || 'Could not load your orders');
      return;
    }
    setOrders(data.orders || []);
    setError('');
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
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
    init();
    return () => { active = false; };
  }, [router]);

  const handleStatusUpdate = async (id, status) => {
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    if (!session) {
      router.replace('/login');
      return;
    }

    const res = await fetch('/api/account/orders', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ id, status })
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not update order');
      return;
    }

    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
    if (status === 'received') {
      setUndoIds((current) => ({ ...current, [id]: true }));
      setNotice('');
    }
    if (status === 'shipped') {
      setUndoIds((current) => ({ ...current, [id]: false }));
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this order permanently?');
    if (!confirmed) return;

    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    if (!session) {
      router.replace('/login');
      return;
    }

    const res = await fetch('/api/account/orders', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ id })
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not delete order');
      return;
    }

    setOrders((current) => current.filter((order) => order.id !== id));
    setNotice('Order removed.');
    setError('');
  };

  if (loading) return <div className="py-8" aria-label="Loading orders"><Skeleton className="h-8 w-40" /><div className="mt-8 space-y-4"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">My orders</h1>
      {notice && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
      {!error && orders.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
          You have no orders yet. <Link href="/shop" className="underline">Start shopping</Link>
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const status = statusDetails[order.status] || statusDetails.pending;
            const isUndoVisible = undoIds[order.id] && order.status === 'received';
            const showDelete = order.status === 'received';
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

                {order.status === 'shipped' && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const confirmed = window.confirm('Confirm that you received this order?');
                        if (!confirmed) return;
                        handleStatusUpdate(order.id, 'received');
                      }}
                      className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Confirm received
                    </button>
                  </div>
                )}

                {isUndoVisible && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(order.id, 'shipped')}
                      className="text-sm font-medium text-amber-700 underline underline-offset-2"
                    >
                      Undo
                    </button>
                  </div>
                )}

                {showDelete && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDelete(order.id)}
                      className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}