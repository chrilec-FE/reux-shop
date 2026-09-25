import { Skeleton } from '@/components/LoadingSkeleton';

export default function Loading() {
  return <div aria-label="Loading product" className="grid gap-10 md:grid-cols-2"><Skeleton className="aspect-[3/4]" /><div><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-10 w-3/4" /><Skeleton className="mt-4 h-8 w-32" /><Skeleton className="mt-6 h-24" /><Skeleton className="mt-8 h-12" /></div><Skeleton className="h-32 md:col-span-2" /></div>;
}