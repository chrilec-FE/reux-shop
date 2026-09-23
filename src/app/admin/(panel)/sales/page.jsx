import SalesManager from '@/components/admin/SalesManager';

export const dynamic = 'force-dynamic';

export default function AdminSalesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
      <p className="mt-1 text-sm text-neutral-500">Track every order and update its status.</p>
      <SalesManager />
    </div>
  );
}
