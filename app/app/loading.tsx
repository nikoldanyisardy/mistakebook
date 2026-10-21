import { Bar, SkeletonCard, SkeletonPage, SkeletonTitle } from "@/components/Skeleton";

// My mistakes: title, quick add, filters, list.
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonTitle />
      <div className="card skeleton-row" aria-hidden="true">
        <Bar width="100%" height={48} />
        <Bar width="80px" height={48} />
      </div>
      <div className="skeleton-row" aria-hidden="true">
        <Bar width="50%" height={48} />
        <Bar width="50%" height={48} />
      </div>
      <div className="stack-sm">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </SkeletonPage>
  );
}
