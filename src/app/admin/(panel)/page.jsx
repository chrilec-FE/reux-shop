import { supabaseAdmin } from '@/lib/supabase-admin';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const today = new Date();
  const chartStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 29));
  const chartDays = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(chartStart);
    date.setUTCDate(chartStart.getUTCDate() + index);
    return { key: date.toISOString().slice(0, 10), label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }), income: 0 };
  });

  let stats = { income: 0, refunded: 0, orders: 0, paid: 0, pending: 0, cancelled: 0, refundedOrders: 0, averageOrder: 0 };
  let recent = [];

  if (supabaseAdmin) {
    const [{ data: orders }, { data: products }] = await Promise.all([
      supabaseAdmin.from('orders').select('id, items, total, status, created_at').order('created_at', { ascending: false }),
      supabaseAdmin.from('products').select('id', { count: 'exact' })
    ]);
    const allOrders = orders || [];
    const paidOrders = allOrders.filter((o) => o.status === 'paid');
    const refundedOrders = allOrders.filter((o) => o.status === 'refunded');
    const income = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const chartData = new Map(chartDays.map((day) => [day.key, day]));
    paidOrders.forEach((order) => {
      const day = chartData.get(new Date(order.created_at).toISOString().slice(0, 10));
      if (day) day.income += Number(order.total);
    });

    stats = {
      income,
      refunded: refundedOrders.reduce((sum, order) => sum + Number(order.total), 0),
      orders: allOrders.length,
      paid: paidOrders.length,
      products: products?.length || 0,
      pending: allOrders.filter((o) => o.status === 'pending').length,
      cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
      refundedOrders: refundedOrders.length,
      averageOrder: paidOrders.length ? income / paidOrders.length : 0
    };
    recent = allOrders.slice(0, 8);
  }

  const cards = [
    { label: 'Total income', value: formatCurrency(stats.income) },
    { label: 'Average order value', value: formatCurrency(stats.averageOrder) },
    { label: 'Total orders', value: stats.orders },
    { label: 'Products', value: stats.products }
  ];
  const statusCounts = [
    { label: 'Paid', value: stats.paid, className: 'bg-green-500' },
    { label: 'Pending', value: stats.pending, className: 'bg-amber-400' },
    { label: 'Cancelled', value: stats.cancelled, className: 'bg-neutral-400' },
    { label: 'Refunded', value: stats.refundedOrders, className: 'bg-red-500' }
  ];
  const maxIncome = Math.max(...chartDays.map((day) => day.income), 1);

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

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Income, last 30 days</h2>
              <p className="mt-1 text-sm text-neutral-500">Paid orders by day</p>
            </div>
            <p className="text-sm font-semibold text-green-600">{formatCurrency(stats.income)}</p>
          </div>
          <div className="mt-6 flex h-44 items-end gap-1 border-b border-neutral-200 px-1">
            {chartDays.map((day) => (
              <div key={day.key} className="group flex h-full flex-1 items-end" title={`${day.label}: ${formatCurrency(day.income)}`}>
                <div
                  className="w-full rounded-t-sm bg-blue-500 transition hover:bg-blue-600"
                  style={{ height: `${Math.max((day.income / maxIncome) * 100, day.income ? 3 : 0)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-neutral-400">
            <span>{chartDays[0].label}</span>
            <span>{chartDays[chartDays.length - 1].label}</span>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold">Order status</h2>
          <div className="mt-5 space-y-4">
            {statusCounts.map((status) => (
              <div key={status.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-neutral-600">{status.label}</span>
                  <span className="font-semibold">{status.value}</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100">
                  <div className={`h-2 rounded-full ${status.className}`} style={{ width: `${stats.orders ? (status.value / stats.orders) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-neutral-200 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Refunded amount</p>
            <p className="mt-1 text-xl font-bold text-red-600">-{formatCurrency(stats.refunded)}</p>
          </div>
        </div>
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
