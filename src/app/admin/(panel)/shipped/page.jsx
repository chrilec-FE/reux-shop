import SalesManager from '@/components/admin/SalesManager';

export const dynamic = 'force-dynamic';

export default function AdminShippedPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Shipped</h1>
      <p className="mt-1 text-sm text-neutral-500">Orders that have been shipped and are awaiting final delivery.</p>
      <SalesManager mode="shipped" />
    </div>
  );
}
