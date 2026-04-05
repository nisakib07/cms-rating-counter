'use client';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function StatsCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-7">
      <div className="flex items-center justify-between mb-5">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <Skeleton className="w-16 h-4" />
      </div>
      <Skeleton className="w-24 h-10 mb-2" />
      <Skeleton className="w-20 h-4" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <Skeleton className={`h-4 ${i === 0 ? 'w-32' : 'w-20'}`} />
        </td>
      ))}
    </tr>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="glass rounded-2xl p-7">
      <Skeleton className="w-36 h-6 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl p-5 bg-white/[0.02] border border-white/[0.04]">
          <Skeleton className="w-24 h-3 mb-4" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="flex-1">
              <Skeleton className="w-32 h-5 mb-2" />
              <Skeleton className="w-20 h-3" />
            </div>
            <Skeleton className="w-10 h-8" />
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-white/[0.02] border border-white/[0.04]">
          <Skeleton className="w-24 h-3 mb-4" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="flex-1">
              <Skeleton className="w-32 h-5 mb-2" />
              <Skeleton className="w-20 h-3" />
            </div>
            <Skeleton className="w-10 h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass rounded-2xl p-7">
      <Skeleton className="w-40 h-6 mb-6" />
      <div className="flex items-end gap-3 justify-center" style={{ height: 240 }}>
        {[40, 65, 80, 50, 30].map((h, i) => (
          <Skeleton key={i} className="w-9 rounded-t-lg" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function RecentRatingsSkeleton() {
  return (
    <div className="glass rounded-2xl p-7">
      <Skeleton className="w-36 h-6 mb-6" />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02]">
            <Skeleton className="w-11 h-11 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="w-28 h-4 mb-2" />
              <Skeleton className="w-20 h-3" />
            </div>
            <Skeleton className="w-14 h-5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
