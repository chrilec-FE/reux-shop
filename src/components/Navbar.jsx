'use client';

import Link from 'next/link';
import { useCart } from './CartContext';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AccountDrawer from './AccountDrawer';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ isAdmin = false }) {
  const { count } = useCart();
  const [accountOpen, setAccountOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const adminArea = pathname.startsWith('/admin');
  const customerView = !isAdmin && !adminArea;

  const logout = async () => {
    await fetch('/api/auth/admin-logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href={adminArea || isAdmin ? '/admin' : '/'} className="text-xl font-bold tracking-tight">
          Re<span className="text-neutral-400">UX</span>
        </Link>
        {customerView && <form action="/shop" className="mx-6 hidden min-w-0 max-w-xs flex-1 gap-2 sm:flex">
          <label htmlFor="nav-search" className="sr-only">Search products</label>
          <input id="nav-search" name="search" className="input h-9 min-w-0 flex-1" placeholder="Search products" />
          <button type="submit" className="btn-secondary h-9 px-3">Search</button>
        </form>}
        <nav className="flex items-center gap-6 text-sm font-medium">
          {customerView && <>
            <Link href="/account/orders" title="My orders" aria-label="My orders" className="text-lg leading-none" >📦</Link>
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
            <button onClick={() => setAccountOpen(true)} className="text-neutral-600 hover:text-neutral-900">Account</button>
          </>}
          <ThemeToggle />
          {isAdmin && <button onClick={logout} className="text-red-600 hover:text-red-700">Log out</button>}
        </nav>
      </div>
      {customerView && <AccountDrawer open={accountOpen} onClose={() => setAccountOpen(false)} />}
    </header>
  );
}
