export function Skeleton({ className = '' }) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} />;
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-label="Loading products">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="card overflow-hidden">
          <Skeleton className="aspect-[3/4]" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
