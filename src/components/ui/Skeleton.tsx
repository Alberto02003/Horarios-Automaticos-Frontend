interface Props {
  className?: string;
}

export function Skeleton({ className = "" }: Props) {
  return <div className={`animate-pulse rounded-xl bg-[#F0EDF3] ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-surface-card rounded-2xl border border-[#F0EDF3] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 10 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-1 p-4">
      <div className="flex gap-1">
        <Skeleton className="h-8 w-[160px]" />
        <Skeleton className="h-8 w-[50px]" />
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-8 flex-1 min-w-[38px]" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-1">
          <Skeleton className="h-10 w-[160px]" />
          <Skeleton className="h-10 w-[50px]" />
          {Array.from({ length: cols }, (_, i) => (
            <Skeleton key={i} className="h-10 flex-1 min-w-[38px]" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="bg-surface-card rounded-xl border border-[#F0EDF3] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={`h${i}`} className="h-4 w-full" />
        ))}
        {Array.from({ length: 35 }, (_, i) => (
          <Skeleton key={i} className="h-16 sm:h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-[#F0EDF3] bg-surface-card">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
