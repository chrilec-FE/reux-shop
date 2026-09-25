'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminDashboardButton from '@/components/admin/AdminDashboardButton';

export default function AdminFloatingActions({ isAdmin = false }) {
  const pathname = usePathname();

  if (!isAdmin) return null;

  const showHome = pathname !== '/admin';
  const showAdd = pathname !== '/admin/products';

  return (
    <div className="fixed bottom-6 right-6 z-20 flex flex-col gap-3">
      {showHome && <AdminDashboardButton variant="floating" />}
      {showAdd && (
        <Link
          href="/admin/products"
          aria-label="Add a product"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-2xl font-semibold text-white shadow-lg transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          +
        </Link>
      )}
    </div>
  );
}
