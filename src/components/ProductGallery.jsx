'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getProductImages } from '@/lib/images';

export default function ProductGallery({ product }) {
  const images = getProductImages(product);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  return (
    <div>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-neutral-100">
        {activeImage ? (
          <Image src={activeImage} alt={`${product.name} image ${activeIndex + 1}`} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" priority />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300">No image</div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Product images">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-20 w-16 overflow-hidden rounded-md border-2 bg-neutral-100 ${activeIndex === index ? 'border-neutral-900' : 'border-transparent'}`}
              aria-label={`Show image ${index + 1}`}
              aria-pressed={activeIndex === index}
            >
              <Image src={image} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
