import { redirect } from "next/navigation";
import ReviewView from "@/components/ReviewView";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Course, Mistake } from "@/lib/mistakes";

export const metadata = { title: "Review · MistakeBook" };

export default async function ReviewPage() {
  const user = await getUser();

  if (!user) redirect("/login");

  const supabase = await createClient();

  // All mistakes, mastered ones too: the course cards show mastered / total.
  const [mistakesRes, coursesRes] = await Promise.all([
    supabase.from("mistakes").select("*"),
    supabase.from("courses").select("*").order("name"),
  ]);

  const loadError = mistakesRes.error ?? coursesRes.error;

  return (
    <ReviewView
      initialMistakes={(mistakesRes.data as Mistake[]) ?? []}
      courses={(coursesRes.data as Course[]) ?? []}
      loadError={loadError ? `Couldn't load your mistakes: ${loadError.message}` : null}
    />
  );
}
