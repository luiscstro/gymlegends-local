export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-2xl bg-surface p-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="ml-auto h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-4">
      <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, variant = 'card' }: { count?: number; variant?: 'card' | 'row' }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) =>
        variant === 'card' ? <SkeletonCard key={i} /> : <SkeletonRow key={i} />
      )}
    </div>
  );
}
