import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "App · EdTech App" };

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Second check besides the proxy: never render /app for logged-out users.
  if (!user) redirect("/login");

  return (
    <main className="container">
      <h1>Welcome</h1>
      <p className="lead">You are logged in as {user.email}.</p>
      <div className="card">
        {/* The main feature (core-input, core-submit, core-item) goes here. */}
        <p>The main feature will appear here.</p>
      </div>
    </main>
  );
}
