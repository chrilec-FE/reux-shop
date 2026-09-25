'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminDashboardButton({ variant = 'floating', className = '' }) {
  const pathname = usePathname();

  if (variant === 'floating' && pathname === '/admin') return null;

  const baseClasses =
    variant === 'floating'
      ? 'fixed bottom-6 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
      : 'inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

  return (
    <Link
      href="/admin"
      aria-label="Go to admin dashboard"
      className={`${baseClasses} ${className}`.trim()}
    >
      <svg aria-hidden="true" className={variant === 'floating' ? 'h-6 w-6' : 'h-4 w-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9" />
        <path d="M9 20v-6h6v6" />
      </svg>
    </Link>
  );
}