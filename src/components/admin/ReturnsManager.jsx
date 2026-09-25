'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/LoadingSkeleton';

const statuses = ['requested', 'approved', 'completed', 'rejected'];

export default function ReturnsManager() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const response = await fetch('/api/returns');
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Could not load return requests');
      setLoading(false);
      return;
    }
    setRequests(data.requests || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    setSavingId(id);
    setError('');
    const response = await fetch('/api/returns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    const data = await response.json();
    setSavingId(null);
    if (!response.ok) {
      setError(data.error || 'Could not update return request');
      return;
    }
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status: data.request.status, updated_at: data.request.updated_at } : request));
  };

  if (loading) return <div className="mt-6 space-y-4" aria-label="Loading return requests"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;
  if (error && requests.length === 0) return <p className="mt-6 text-sm text-red-600">{error}</p>;
  if (requests.length === 0) return <p className="mt-6 rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">No return requests yet.</p>;

  return (
    <div className="mt-6 space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {requests.map((request) => (
        <article key={request.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-medium">Order {request.order.id.slice(0, 8)}…</p>
              <p className="mt-1 text-sm text-neutral-500">Requested {new Date(request.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-semibold">{formatCurrency(request.order.total)}</p>
              <select className="input w-36" value={request.status} disabled={savingId === request.id} onChange={(event) => updateStatus(request.id, event.target.value)} aria-label={`Status for order ${request.order.id.slice(0, 8)}`}>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-neutral-600 sm:grid-cols-2">
            <p><span className="font-medium text-neutral-800">Customer:</span> {request.order.customer_name || '—'}</p>
            <p><span className="font-medium text-neutral-800">Email:</span> {request.order.customer_email || '—'}</p>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-neutral-600">
            {(request.order.items || []).map((item, index) => <li key={`${request.id}-${index}`}>{item.qty}× {item.name}{item.size ? ` (size ${item.size})` : ''}</li>)}
          </ul>
          <p className="mt-4 text-sm text-neutral-600"><span className="font-medium text-neutral-800">Reason:</span> {request.reason || 'No reason provided'}</p>
          {request.status === 'completed' && <p className="mt-4 text-xs text-neutral-500">Order marked refunded. Process the actual refund manually in Stripe.</p>}
        </article>
      ))}
    </div>
  );
}
