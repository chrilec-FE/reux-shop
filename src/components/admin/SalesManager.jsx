'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/format';

const STATUSES = ['pending', 'paid', 'payment_review', 'shipped', 'canceled', 'refunded'];

export default function SalesManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState({});
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

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
    const haystack = [order.id, order.customer_name, order.customer_email, order.customer_phone].filter(Boolean).join(' ').toLowerCase();
    return (statusFilter === 'all' || order.status === statusFilter) && haystack.includes(query.trim().toLowerCase());
  });

  if (loading) return <p className="mt-8 text-neutral-500">Loading…</p>;

  if (error && orders.length === 0) return <p className="mt-8 text-sm text-red-600">{error}</p>;

  if (orders.length === 0) {
    return <p className="mt-8 rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">No sales yet.</p>;
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_12rem]">
        <input className="input" placeholder="Search customer, email, phone, or order ID" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {visibleOrders.length === 0 && <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">No matching orders.</p>}
      {visibleOrders.map((o) => (
        <div key={o.id} className="card p-4">
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
          <div className="mt-3 space-y-1 text-sm text-neutral-500">
            {o.customer_name && <p><span className="font-medium text-neutral-700">Customer:</span> {o.customer_name}</p>}
            {o.customer_email && <p><span className="font-medium text-neutral-700">Email:</span> {o.customer_email}</p>}
            {o.customer_phone && <p><span className="font-medium text-neutral-700">Phone:</span> {o.customer_phone}</p>}
            {o.shipping_address && <p><span className="font-medium text-neutral-700">Address:</span> {[o.shipping_address.line1, o.shipping_address.line2, [o.shipping_address.postal_code, o.shipping_address.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</p>}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input className="input" placeholder="Tracking number" defaultValue={o.tracking_number || ''} onChange={(e) => setTracking((old) => ({ ...old, [o.id]: { ...(old[o.id] || {}), number: e.target.value } }))} />
            <input className="input" type="url" placeholder="Tracking URL" defaultValue={o.tracking_url || ''} onChange={(e) => setTracking((old) => ({ ...old, [o.id]: { ...(old[o.id] || {}), url: e.target.value } }))} />
            <button className="btn-secondary" onClick={() => saveTracking(o)}>Save tracking</button>
          </div>
        </div>
      ))}
    </div>
  );
}
