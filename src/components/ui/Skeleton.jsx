export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />
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
