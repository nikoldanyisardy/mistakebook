"use client";

import { useState } from "react";

// Posts to /auth/logout, which signs out and redirects to "/" in one round
// trip. The label changes the moment the button is pressed.
export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  return (
    <form action="/auth/logout" method="post" onSubmit={() => setLoading(true)}>
      <button
        type="submit"
        data-testid="logout"
        className="btn btn-ghost btn-small"
        aria-disabled={loading}
      >
        {loading ? "Logging out…" : "Log out"}
      </button>
    </form>
  );
}
