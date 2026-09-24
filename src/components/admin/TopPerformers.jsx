import { supabaseAdmin } from '@/lib/supabase-admin';

function rankEntries(entries) {
  return [...entries].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)).slice(0, 5);
}

export default async function TopPerformers() {
  if (!supabaseAdmin) {
    return null;
  }

  const [{ data: products }, { data: paidOrders }, { data: reviews }] = await Promise.all([
    supabaseAdmin.from('products').select('id, name, category'),
    supabaseAdmin.from('orders').select('items').eq('status', 'paid'),
    supabaseAdmin.from('product_reviews').select('product_id')
  ]);

  const productMap = new Map((products || []).map((product) => [product.id, product]));
  const productSales = new Map();
  const categorySales = new Map();

  for (const order of paidOrders || []) {
    for (const item of Array.isArray(order.items) ? order.items : []) {
      const quantity = Number(item.qty) || 0;
      if (!item.id || quantity <= 0) continue;

      const product = productMap.get(item.id);
      const productEntry = productSales.get(item.id) || {
        label: product?.name || item.name || 'Deleted product',
        value: 0
      };
      productEntry.value += quantity;
      productSales.set(item.id, productEntry);

      const category = product?.category || item.category || 'Uncategorized';
      categorySales.set(category, (categorySales.get(category) || 0) + quantity);
    }
  }

  const reviewCounts = new Map();
  for (const review of reviews || []) {
    if (review.product_id) reviewCounts.set(review.product_id, (reviewCounts.get(review.product_id) || 0) + 1);
  }

  const bestSellers = rankEntries([...productSales.values()]);
  const mostReviewed = rankEntries([...reviewCounts.entries()].map(([productId, value]) => ({
    label: productMap.get(productId)?.name || 'Deleted product',
    value
  })));
  const topCategories = rankEntries([...categorySales.entries()].map(([label, value]) => ({ label, value })));

  return (
    <section className="mt-8">
      <div>
        <h2 className="text-lg font-semibold">Top Performers</h2>
        <p className="mt-1 text-sm text-neutral-500">Sales and review leaders across your catalog.</p>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <RankingCard title="Best-selling products" entries={bestSellers} suffix="sold" />
        <RankingCard title="Most-reviewed products" entries={mostReviewed} suffix="reviews" />
        <RankingCard title="Top-selling categories" entries={topCategories} suffix="sold" />
      </div>
    </section>
  );
}

function RankingCard({ title, entries, suffix }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-5 text-sm text-neutral-500">No data yet.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {entries.map((entry, index) => (
            <li key={`${entry.label}-${index}`} className="flex items-center gap-3 text-sm">
              <span className="w-5 text-xs font-semibold text-neutral-400">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate">{entry.label}</span>
              <span className="shrink-0 font-medium text-neutral-600">{entry.value} {suffix}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}