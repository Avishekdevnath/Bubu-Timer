export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-stone-100 rounded-xl ${className}`} />
}

export function SkeletonRows({ count = 3, height = 'h-16' }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={`${height} w-full rounded-2xl`} />
      ))}
    </div>
  )
}
