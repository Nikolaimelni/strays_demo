export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-sm bg-sunken ${className}`} />
);

export const ListingCardSkeleton = () => (
  <div className="flex items-start gap-4">
    <Skeleton className="aspect-[4/3] w-28 shrink-0 sm:w-32" />
    <div className="flex-1 space-y-2.5 py-1">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-3 w-full" />
    </div>
  </div>
);
