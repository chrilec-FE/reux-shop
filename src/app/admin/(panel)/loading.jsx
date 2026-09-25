import { Skeleton } from '@/components/LoadingSkeleton';

export default function Loading() {
  return <div aria-label="Loading admin page"><Skeleton className="h-8 w-40" /><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div><Skeleton className="mt-6 h-64" /></div>;
}