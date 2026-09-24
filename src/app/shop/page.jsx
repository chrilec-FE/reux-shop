import Link from 'next/link';
import { getProducts, getCategories } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function Shop({ searchParams }) {
  const category = searchParams.category || 'All';
  const search = searchParams.search || '';
  const [products, categories] = await Promise.all([getProducts({ category, search }), getCategories()]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Shop</h1>
      <form className="mt-4 flex max-w-lg gap-2">
        <input name="search" defaultValue={search} placeholder="Search products" className="input flex-1" />
        {category !== 'All' && <input type="hidden" name="category" value={category} />}
        <button className="btn-secondary" type="submit">Search</button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c}
            href={c === 'All' ? '/shop' : `/shop?category=${encodeURIComponent(c)}`}
            className={`rounded-full border px-4 py-1.5 text-sm ${c === category ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white hover:border-neutral-500'}`}
          >
            {c}
          </Link>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && (
        <p className="mt-8 rounded-lg border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
          {search ? `No products found for “${search}”.` : 'Nothing in this category yet.'}
        </p>
      )}
    </div>
  );
}
