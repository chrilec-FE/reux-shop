import ReturnsManager from '@/components/admin/ReturnsManager';

export const dynamic = 'force-dynamic';

export default function AdminReturnsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Returns</h1>
      <p className="mt-1 text-sm text-neutral-500">Review customer requests. Refunds must be processed manually in Stripe.</p>
      <ReturnsManager />
    </div>
  );
}
