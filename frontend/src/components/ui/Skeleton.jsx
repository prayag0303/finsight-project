export function SkeletonBlock({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ background: '#f0f0f0', ...style }}
    />
  );
}

export function KPICardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="h-7 w-32" />
      <SkeletonBlock className="h-3 w-20" />
    </div>
  );
}

export function ChartSkeleton({ height = 'h-64' }) {
  return (
    <div className={`${height} flex items-end justify-center gap-2 px-4`}>
      {[60, 80, 45, 90, 55, 75, 40, 85, 65, 70, 50, 80].map((h, i) => (
        <div
          key={i}
          className="animate-pulse rounded-sm flex-1"
          style={{ height: `${h}%`, background: '#f0f0f0' }}
        />
      ))}
    </div>
  );
}

export function TableRowSkeleton({ rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100">
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <SkeletonBlock className="h-3" style={{ width: `${40 + (j * 13) % 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded ${className}`} style={{ background: '#f0f0f0' }} />;
}
