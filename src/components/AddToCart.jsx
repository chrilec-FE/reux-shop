'use client';

import { useState } from 'react';
import { useCart } from './CartContext';

export default function AddToCart({ product }) {
  const { add } = useCart();
  const [size, setSize] = useState(product.sizes?.[0] || null);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    add(product, size, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div>
      {product.sizes?.length > 0 && (
        <div className="mb-4">
          <p className="label">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`min-w-10 rounded-md border px-3 py-2 text-sm ${size === s ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white hover:border-neutral-500'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <button onClick={handleAdd} className="btn-primary w-full" disabled={product.stock === 0}>
        {product.stock === 0 ? 'Out of stock' : added ? 'Added to cart' : 'Add to cart'}
      </button>
    </div>
  );
}
