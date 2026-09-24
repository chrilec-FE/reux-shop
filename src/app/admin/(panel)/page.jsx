import { supabaseAdmin } from '@/lib/supabase-admin';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  let stats = { revenue: 0, orders: 0, products: 0, pending: 0 };
  let recent = [];

  if (supabaseAdmin) {
    const [{ data: orders }, { data: products }] = await Promise.all([
      supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }).limit(8),
      supabaseAdmin.from('products').select('id', { count: 'exact' })
    ]);
    const paidOrders = (orders || []).filter((o) => o.status === 'paid');
    stats = {
      revenue: paidOrders.reduce((s, o) => s + Number(o.total), 0),
      orders: orders?.length || 0,
      products: products?.length || 0,
      pending: (orders || []).filter((o) => o.status !== 'paid').length
    };
    recent = orders || [];
  }

  const cards = [
    { label: 'Revenue (paid)', value: formatCurrency(stats.revenue) },
    { label: 'Orders', value: stats.orders },
    { label: 'Pending payments', value: stats.pending },
    { label: 'Products', value: stats.products }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{c.label}</p>
            <p className="mt-2 text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold">Recent orders</h2>
      {recent.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">No orders yet.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {recent.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-neutral-600">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${o.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
