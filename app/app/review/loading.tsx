import { Bar, SkeletonPage, SkeletonTitle } from "@/components/Skeleton";

// Review: title and the course cards.
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonTitle />
      <div className="course-cards" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card skeleton-stack">
            <Bar width="65%" height={22} />
            <Bar width="40%" />
            <Bar width="100%" height={10} />
            <Bar width="50%" height={14} />
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
