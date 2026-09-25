import { Skeleton } from '@/components/LoadingSkeleton';

export default function Loading() {
  return <div aria-label="Loading page"><Skeleton className="h-8 w-40" /><Skeleton className="mt-6 h-48" /><Skeleton className="mt-6 h-32" /></div>;
}