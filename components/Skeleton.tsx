// Placeholder shapes shown by the loading.tsx files while a page loads.

export function SkeletonPage({
  narrow = false,
  children,
}: {
  narrow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main
      className={narrow ? "container narrow-md stack" : "container stack"}
      aria-busy="true"
    >
      <p className="sr-only" role="status">
        Loading…
      </p>
      {children}
    </main>
  );
}

export function Bar({ width, height = 16 }: { width: string; height?: number }) {
  return <span className="skeleton" style={{ width, height }} aria-hidden="true" />;
}

export function SkeletonTitle({ withLead = true }: { withLead?: boolean }) {
  return (
    <div className="skeleton-stack" aria-hidden="true">
      <Bar width="45%" height={36} />
      {withLead && <Bar width="75%" />}
    </div>
  );
}

export function SkeletonCard({ lines = 2, tall = false }: { lines?: number; tall?: boolean }) {
  return (
    <div className="card skeleton-stack" aria-hidden="true">
      <Bar width="70%" height={tall ? 24 : 20} />
      <div className="skeleton-row">
        <Bar width="110px" height={24} />
        <Bar width="90px" height={24} />
      </div>
      {Array.from({ length: lines - 1 }, (_, i) => (
        <Bar key={i} width={i % 2 ? "40%" : "55%"} />
      ))}
    </div>
  );
}
