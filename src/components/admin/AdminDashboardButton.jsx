'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminDashboardButton() {
  const pathname = usePathname();

  if (pathname === '/admin') return null;

  return (
    <Link
      href="/admin"
      aria-label="Go to admin dashboard"
      className="fixed bottom-6 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9" />
        <path d="M9 20v-6h6v6" />
      </svg>
    </Link>
  );
}