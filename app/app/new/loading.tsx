import { Bar, SkeletonPage, SkeletonTitle } from "@/components/Skeleton";

// Log a mistake: title and the form fields.
export default function Loading() {
  return (
    <SkeletonPage narrow>
      <SkeletonTitle />
      <div className="card skeleton-stack skeleton-form" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton-stack">
            <Bar width="120px" height={14} />
            <Bar width="100%" height={48} />
          </div>
        ))}
        <Bar width="180px" height={32} />
        <div className="skeleton-stack">
          <Bar width="140px" height={14} />
          <Bar width="100%" height={88} />
        </div>
        <Bar width="160px" height={48} />
      </div>
    </SkeletonPage>
  );
}
