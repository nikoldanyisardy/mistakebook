import { Bar, SkeletonPage, SkeletonTitle } from "@/components/Skeleton";

// Profile: account card and the course list.
export default function Loading() {
  return (
    <SkeletonPage narrow>
      <SkeletonTitle withLead={false} />
      <div className="card skeleton-stack" aria-hidden="true">
        <Bar width="30%" height={22} />
        <Bar width="60%" />
      </div>
      <div className="card skeleton-stack" aria-hidden="true">
        <Bar width="40%" height={22} />
        <div className="skeleton-row">
          <Bar width="100%" height={48} />
          <Bar width="80px" height={48} />
        </div>
        <Bar width="55%" />
        <Bar width="45%" />
      </div>
    </SkeletonPage>
  );
}
