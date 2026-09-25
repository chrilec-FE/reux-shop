import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/format';
import { getProductImages } from '@/lib/images';

export default function ProductCard({ product }) {
  const image = getProductImages(product)[0];
  return (
    <Link href={`/product/${product.id}`} className="card group block overflow-hidden">
      <div className="relative aspect-[3/4] w-full bg-neutral-100">
        {image ? (
          <Image src={image} alt={product.name} fill className="object-cover transition group-hover:opacity-90" sizes="(max-width:768px) 50vw, 25vw" />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300">No image</div>
        )}
      </div>
      <div className="p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{product.category}</p>
        <h3 className="mt-1 truncate font-medium">{product.name}</h3>
        <p className="mt-1 text-sm text-neutral-600">{formatCurrency(product.price)}</p>
      </div>
    </Link>
  );
}
