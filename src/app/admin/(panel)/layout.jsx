import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifyAdmin } from '@/lib/admin-auth';
import AdminLogout from '@/components/admin/AdminLogout';
import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function AdminPanelLayout({ children }) {
  if (!verifyAdmin(cookies().get('reux_admin')?.value)) {
    redirect('/admin/login');
  }

  let requestedReturns = 0;
  if (supabaseAdmin) {
    const { count } = await supabaseAdmin
      .from('return_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'requested');
    requestedReturns = count || 0;
  }

  const nav = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/sales', label: 'Sales' },
    { href: '/admin/shipped', label: 'Shipped' },
    { href: '/admin/returns', label: 'Returns', count: requestedReturns }
  ];

  return (
    <div className="flex gap-8">
      <aside className="w-48 shrink-0">
        <nav className="card sticky top-8 space-y-1 p-3">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">ReUX Admin</p>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100">
              <span>{n.label}</span>
              {n.count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white" aria-label={`${n.count} requested returns`}>{n.count}</span>}
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
