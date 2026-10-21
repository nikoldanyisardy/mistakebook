import { redirect } from "next/navigation";
import MistakesView from "@/components/MistakesView";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Course, Mistake } from "@/lib/mistakes";

export const metadata = { title: "My mistakes · MistakeBook" };

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await getUser();

  // Second check besides the proxy: never render /app for logged-out users.
  if (!user) redirect("/login");

  const supabase = await createClient();

  // RLS limits both queries to the user's own rows.
  const [mistakesRes, coursesRes] = await Promise.all([
    supabase.from("mistakes").select("*").order("created_at", { ascending: false }),
    supabase.from("courses").select("*").order("name"),
  ]);

  const loadError = mistakesRes.error ?? coursesRes.error;
  const { saved } = await searchParams;

  return (
    <MistakesView
      initialMistakes={(mistakesRes.data as Mistake[]) ?? []}
      courses={(coursesRes.data as Course[]) ?? []}
      loadError={loadError ? `Couldn't load your mistakes: ${loadError.message}` : null}
      flash={
        saved === "new" ? "Mistake saved." : saved === "updated" ? "Changes saved." : null
      }
    />
  );
}
