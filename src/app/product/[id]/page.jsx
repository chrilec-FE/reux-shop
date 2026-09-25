import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/products';
import AddToCart from '@/components/AddToCart';
import WishlistButton from '@/components/WishlistButton';
import ProductReviews from '@/components/ProductReviews';
import ProductGallery from '@/components/ProductGallery';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <ProductGallery product={product} />
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{product.category}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{product.name}</h1>
        <p className="mt-3 text-xl text-neutral-700">{formatCurrency(product.price)}</p>
        <p className="mt-6 leading-relaxed text-neutral-600">{product.description}</p>
        <div className="mt-8 space-y-3">
          <AddToCart product={product} />
          <WishlistButton productId={product.id} />
        </div>
        <p className="mt-4 text-sm text-neutral-400">
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </p>
      </div>
      <div className="md:col-span-2"><ProductReviews productId={product.id} /></div>
    </div>
  );
}
