import { Skeleton } from "@/components/ui/skeleton";

function ShimmerCard({ className = "" }: { className?: string }) {
  return (
    <div className={`glass-card p-5 ${className}`}>
      <Skeleton className="h-4 w-24 bg-gold/5" />
      <Skeleton className="h-8 w-16 mt-3 bg-gold/10" />
      <Skeleton className="h-3 w-32 mt-2 bg-muted/40" />
    </div>
  );
}

export function MetricsRowSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <ShimmerCard key={i} />
      ))}
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8" aria-busy="true">
      <div>
        <Skeleton className="h-3 w-16 bg-gold/10" />
        <Skeleton className="h-10 w-72 mt-3 bg-gold/5" />
        <Skeleton className="h-4 w-48 mt-3 bg-muted/40" />
      </div>

      <MetricsRowSkeleton />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-5">
            <Skeleton className="h-5 w-5 rounded-full bg-gold/10" />
            <Skeleton className="h-4 w-28 mt-4 bg-gold/5" />
            <Skeleton className="h-3 w-40 mt-2 bg-muted/40" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <Skeleton className="h-4 w-40 bg-gold/5" />
            {Array.from({ length: 4 }).map((__, j) => (
              <div key={j} className="flex gap-3 items-center">
                <Skeleton className="h-1.5 w-1.5 rounded-full bg-gold/20" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4 bg-muted/40" />
                  <Skeleton className="h-2 w-1/3 bg-muted/30" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 bg-gold/5" />
              <Skeleton className="h-3 w-1/2 bg-muted/40" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full bg-muted/30" />
          </div>
          <Skeleton className="h-3 w-full bg-muted/30" />
          <Skeleton className="h-3 w-4/5 bg-muted/30" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-7 w-20 rounded-md bg-muted/40" />
            <Skeleton className="h-7 w-20 rounded-md bg-muted/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-4 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full bg-gold/10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3 bg-gold/5" />
            <Skeleton className="h-3 w-2/3 bg-muted/40" />
          </div>
          <Skeleton className="h-7 w-16 rounded-md bg-muted/30" />
        </div>
      ))}
    </div>
  );
}
