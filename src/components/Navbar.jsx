'use client';

import Link from 'next/link';
import { useCart } from './CartContext';

export default function Navbar() {
  const { count } = useCart();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Re<span className="text-neutral-400">UX</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/shop" className="text-neutral-600 hover:text-neutral-900">Shop</Link>
          <Link href="/cart" className="relative text-neutral-600 hover:text-neutral-900">
            Cart
            {count > 0 && (
              <span className="absolute -right-4 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white">
                {count}
              </span>
            )}
          </Link>
          <Link href="/wishlist" className="text-neutral-600 hover:text-neutral-900">Wishlist</Link>
          <Link href="/account" className="text-neutral-600 hover:text-neutral-900">Account</Link>
        </nav>
      </div>
    </header>
  );
}
