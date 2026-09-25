import { ProductGridSkeleton, Skeleton } from '@/components/LoadingSkeleton';

export default function Loading() {
  return <div aria-label="Loading shop"><Skeleton className="h-8 w-32" /><Skeleton className="mt-5 h-10 max-w-lg" /><ProductGridSkeleton /></div>;
}