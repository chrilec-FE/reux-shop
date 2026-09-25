'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/format';

const STATUSES = ['pending', 'paid', 'payment_review', 'shipped', 'received', 'canceled', 'refunded'];
const SALES_VISIBLE_STATUSES = STATUSES.filter((status) => !['shipped', 'received'].includes(status));

function formatAddress(address) {
  if (!address) return '—';
  if (typeof address === 'string') return address;
  return [
    address.line1,
    [address.postal_code, address.city].filter(Boolean).join(' '),
    address.country
  ].filter(Boolean).join(', ') || '—';
}

export default function SalesManager({ mode = 'sales' }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState({});
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  const isShippedView = mode === 'shipped';
  const statusOptions = isShippedView ? ['shipped'] : SALES_VISIBLE_STATUSES;

  const load = async () => {
    setError('');
    const res = await fetch('/api/orders');
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not load orders');
      setLoading(false);
      return;
    }
    setOrders(data.orders || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Could not update order');
      return;
    }
    load();
  };

  const deleteOrder = async (id) => {
    const confirmed = window.confirm('Delete this shipped order permanently?');
    if (!confirmed) return;

    const res = await fetch('/api/orders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Could not delete order');
      return;
    }

    load();
  };

  const saveTracking = async (order) => {
    const values = tracking[order.id] || {};
    const res = await fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: order.id, status: order.status, trackingNumber: values.number ?? order.tracking_number ?? '', trackingUrl: values.url ?? order.tracking_url ?? '' }) });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Could not save tracking details');
      return;
    }
    load();
  };

  const visibleOrders = orders.filter((order) => {
    const isVisibleInMode = isShippedView ? order.status === 'shipped' : !['shipped', 'received'].includes(order.status);
    const haystack = [order.id, order.customer_name, order.customer_email, order.customer_phone].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = haystack.includes(query.trim().toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return isVisibleInMode && matchesSearch && matchesStatus;
  });

  if (loading) return <p className="mt-8 text-neutral-500">Loading…</p>;

  if (error && orders.length === 0) return <p className="mt-8 text-sm text-red-600">{error}</p>;

  if (orders.length === 0) {
    return <p className="mt-8 rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">No {isShippedView ? 'shipped orders' : 'sales'} yet.</p>;
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_12rem]">
        <input className="input" placeholder="Search customer, email, phone, or order ID" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {statusOptions.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {visibleOrders.length === 0 && <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">No matching orders.</p>}
      {visibleOrders.map((o) => (
        <div key={o.id} className="card relative p-4">
          {mode === 'sales' && o.status === 'paid' && (
            <span className="absolute right-4 top-4 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" title="New order, not yet handled" />
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{new Date(o.created_at).toLocaleString()}</p>
              <p className="text-sm text-neutral-500">Order {o.id.slice(0, 8)}…</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-semibold">{formatCurrency(o.total)}</p>
              <select
                value={o.status}
                onChange={(e) => setStatus(o.id, e.target.value)}
                className="input w-32"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-neutral-600">
            {o.items.map((i, idx) => (
              <li key={idx}>
                {i.qty}× {i.name}{i.size ? ` (size ${i.size})` : ''} — {formatCurrency(Number(i.price) * i.qty)}
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-3 text-sm text-neutral-500 sm:grid-cols-2">
            <p><span className="font-medium text-neutral-700">Customer:</span> {o.customer_name || o.customer_email || '—'}</p>
            <p><span className="font-medium text-neutral-700">Address:</span> {formatAddress(o.shipping_address)}</p>
            {o.customer_email && <p><span className="font-medium text-neutral-700">Email:</span> {o.customer_email}</p>}
            {o.customer_phone && <p><span className="font-medium text-neutral-700">Phone:</span> {o.customer_phone}</p>}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input className="input" placeholder="Tracking number" defaultValue={o.tracking_number || ''} onChange={(e) => setTracking((old) => ({ ...old, [o.id]: { ...(old[o.id] || {}), number: e.target.value } }))} />
            <input className="input" type="url" placeholder="Tracking URL" defaultValue={o.tracking_url || ''} onChange={(e) => setTracking((old) => ({ ...old, [o.id]: { ...(old[o.id] || {}), url: e.target.value } }))} />
            <button className="btn-secondary" onClick={() => saveTracking(o)}>Save tracking</button>
          </div>
          {isShippedView && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => deleteOrder(o.id)}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
