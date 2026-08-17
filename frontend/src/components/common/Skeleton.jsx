export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

export function BookCardSkeleton() {
  return (
    <div className="flex flex-col bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
      <div className="w-full aspect-[2/3] rounded-lg skeleton mb-space-sm" />
      <Skeleton className="h-5 w-3/4 mb-1" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-1.5 w-full rounded-full" />
    </div>
  )
}

export function HomeHeroSkeleton() {
  return (
    <div className="bg-surface-container rounded-xl p-space-lg shadow-sm">
      <div className="flex gap-space-lg">
        <div className="w-36 aspect-[2/3] rounded-lg skeleton shrink-0" />
        <div className="flex-1 space-y-space-sm">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full rounded-lg mt-space-md" />
          <Skeleton className="h-1.5 w-full rounded-full mt-space-md" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function AnnotationSkeleton() {
  return (
    <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
      <div className="flex gap-space-md">
        <div className="w-11 h-11 rounded-full skeleton shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-16 w-full rounded-lg mt-space-sm" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  )
}

// Alias for backward compatibility
export { AnnotationSkeleton as AnnotationCardSkeleton }
