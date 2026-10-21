// All /app pages share the soft lilac-white background.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-bg">{children}</div>;
}
