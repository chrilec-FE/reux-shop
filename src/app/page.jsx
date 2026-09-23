import Link from 'next/link';
import { getProducts } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = await getProducts();

  return (
    <div>
      <section className="rounded-lg bg-neutral-900 px-8 py-20 text-center text-white">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Wear the future.</h1>
        <p className="mx-auto mt-4 max-w-md text-neutral-400">
          Clean lines. Quality fabrics. ReUX is modern clothing without the noise.
        </p>
        <Link href="/shop" className="btn-primary mt-8 bg-white text-neutral-900 hover:bg-neutral-200">
          Shop the collection
        </Link>
      </section>

      <section className="mt-12">
        <h2 className="mb-6 text-lg font-semibold">New arrivals</h2>
        {products.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
            No products yet — sign in to the admin panel and add your first item.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
