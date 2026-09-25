import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifyAdmin } from '@/lib/admin-auth';
import AdminLogout from '@/components/admin/AdminLogout';

export default function AdminPanelLayout({ children }) {
  if (!verifyAdmin(cookies().get('reux_admin')?.value)) {
    redirect('/admin/login');
  }

  const nav = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/sales', label: 'Sales' },
    { href: '/admin/shipped', label: 'Shipped' }
  ];

  return (
    <div className="flex gap-8">
      <aside className="w-48 shrink-0">
        <nav className="card sticky top-8 space-y-1 p-3">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">ReUX Admin</p>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="block rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100">
              {n.label}
            </Link>
          ))}
          <Link href="/" className="block rounded-md px-2 py-1.5 text-sm text-neutral-400 hover:bg-neutral-100">
            View store
          </Link>
          <AdminLogout />
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
