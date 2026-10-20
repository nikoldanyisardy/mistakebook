"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      data-testid="logout"
      className="btn btn-ghost btn-small"
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? "Logging out…" : "Log out"}
    </button>
  );
}
