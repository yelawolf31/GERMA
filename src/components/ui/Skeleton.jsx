/**
 * Skeleton placeholder with a subtle shimmer (disabled for reduced motion).
 * Keeps the previous API: <Skeleton className="h-16 w-full" />
 */
export default function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`skeleton rounded-lg ${className}`} />
}

export function SkeletonList({ rows = 5, height = 'h-16' }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className={`${height} w-full`} />
      ))}
    </div>
  )
}
