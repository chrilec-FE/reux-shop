'use client';

import { useEffect, useState } from 'react';

const STATUSES = ['pending', 'paid', 'payment_review', 'shipped', 'canceled', 'refunded'];

export default function SalesManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState({});

  const load = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    load();
  };

  const saveTracking = async (order) => {
    const values = tracking[order.id] || {};
    await fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: order.id, status: order.status, trackingNumber: values.number, trackingUrl: values.url }) });
    load();
  };

  if (loading) return <p className="mt-8 text-neutral-500">Loading…</p>;

  if (orders.length === 0) {
    return <p className="mt-8 rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">No sales yet.</p>;
  }

  return (
    <div className="mt-6 space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{new Date(o.created_at).toLocaleString()}</p>
              <p className="text-sm text-neutral-500">Order {o.id.slice(0, 8)}…</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-semibold">${Number(o.total).toFixed(2)}</p>
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
                {i.qty}× {i.name}{i.size ? ` (size ${i.size})` : ''} — ${(Number(i.price) * i.qty).toFixed(2)}
              </li>
            ))}
          </ul>
          {o.customer_email && <p className="mt-3 text-sm text-neutral-500">Customer: {o.customer_email}</p>}
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
