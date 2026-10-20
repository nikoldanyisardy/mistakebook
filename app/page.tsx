import Link from "next/link";

// Placeholder landing page: replace the copy once the app idea is decided.
export default function Home() {
  return (
    <main className="container hero">
      <h1>Your EdTech app is coming soon</h1>
      <p className="lead">
        A short description of what the app does will go here.
      </p>
      <p className="audience">
        <strong>Who it is for:</strong> students and teachers (placeholder).
      </p>
      <Link href="/signup" className="btn btn-primary btn-large">
        Sign up
      </Link>
    </main>
  );
}
