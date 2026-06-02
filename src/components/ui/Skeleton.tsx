// ── Skeleton loading components ───────────────────────────────────────────────

/** Single animated bar. Use `className` to set width/height. */
export function SkeletonBar({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-slate-200 ${className ?? ""}`} />
  );
}

/**
 * Skeleton for table-based pages (credentials, operations, kits, etc.)
 * Renders `rows` placeholder rows with `cols` cells each.
 */
export function TableSkeleton({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  const widths = ["w-1/3", "w-1/2", "w-1/4", "w-16", "w-20", "w-24"];
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="px-6 py-3">
                  <div
                    className={`h-4 animate-pulse rounded bg-slate-200 ${
                      widths[(i + j) % widths.length]
                    }`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Skeleton for card-based pages (servers list).
 * Renders `rows` placeholder card blocks.
 */
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <SkeletonBar className="h-4 w-1/3" />
              <SkeletonBar className="h-3 w-1/2" />
            </div>
            <div className="flex gap-2">
              <SkeletonBar className="h-8 w-16" />
              <SkeletonBar className="h-8 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for a detail page (server detail, repo detail).
 * Two info cards stacked vertically.
 */
export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SkeletonBar className="h-8 w-8 rounded-lg" />
        <div className="flex-1 space-y-2">
          <SkeletonBar className="h-6 w-1/3" />
          <SkeletonBar className="h-4 w-1/4" />
        </div>
        <SkeletonBar className="h-9 w-20" />
      </div>
      {/* Info card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <SkeletonBar className="mb-4 h-5 w-1/4" />
        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonBar className="h-3 w-16" />
              <SkeletonBar className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
      {/* Table card */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <SkeletonBar className="h-5 w-1/5" />
        </div>
        <TableSkeleton rows={4} cols={4} />
      </div>
    </div>
  );
}

/**
 * Skeleton for stat cards (dashboard overview).
 * Renders `count` small stat card placeholders.
 */
export function StatCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-6"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <SkeletonBar className="h-3 w-20" />
              <SkeletonBar className="h-7 w-10" />
            </div>
            <SkeletonBar className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
