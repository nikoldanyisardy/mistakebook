import { redirect } from "next/navigation";
import ProfileView from "@/components/ProfileView";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/lib/mistakes";

export const metadata = { title: "Profile · MistakeBook" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [coursesRes, mistakesRes] = await Promise.all([
    supabase.from("courses").select("*").order("name"),
    supabase.from("mistakes").select("course_id"),
  ]);

  // Number of mistakes per course.
  const counts: Record<string, number> = {};
  for (const { course_id } of (mistakesRes.data as { course_id: string | null }[]) ?? []) {
    if (course_id) counts[course_id] = (counts[course_id] ?? 0) + 1;
  }

  const loadError = coursesRes.error ?? mistakesRes.error;

  return (
    <ProfileView
      email={user.email ?? ""}
      initialCourses={(coursesRes.data as Course[]) ?? []}
      initialCounts={counts}
      loadError={loadError ? `Couldn't load your courses: ${loadError.message}` : null}
    />
  );
}
