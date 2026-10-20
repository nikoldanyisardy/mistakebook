import Link from "next/link";
import { redirect } from "next/navigation";
import MistakeForm from "@/components/MistakeForm";
import { createClient } from "@/lib/supabase/server";
import { customTypesOf, type Course, type Mistake } from "@/lib/mistakes";

export const metadata = { title: "Log a mistake · MistakeBook" };

export default async function NewMistakePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { edit } = await searchParams;

  const [coursesRes, typesRes, editRes] = await Promise.all([
    supabase.from("courses").select("*").order("name"),
    supabase.from("mistakes").select("type"),
    edit
      ? supabase.from("mistakes").select("*").eq("id", edit).maybeSingle()
      : Promise.resolve(null),
  ]);

  const editing = (editRes?.data as Mistake | null) ?? null;

  if (edit && !editing) {
    return (
      <main className="container narrow-md stack">
        <h1>Mistake not found</h1>
        <div className="card empty">
          <p>This mistake doesn&apos;t exist anymore, or it isn&apos;t yours.</p>
          <Link href="/app" className="btn btn-primary">
            Back to my mistakes
          </Link>
        </div>
      </main>
    );
  }

  const loadError = coursesRes.error ?? typesRes.error ?? editRes?.error;

  return (
    <main className="container narrow-md stack">
      <div className="page-title">
        <h1>{editing ? "Edit mistake" : "Log a mistake"}</h1>
        <p className="lead">
          {editing
            ? "Update the details. Your review progress stays the same."
            : "Write it down while it's fresh, with the correct answer so you can review it later."}
        </p>
      </div>

      {loadError && (
        <p className="error" role="alert">
          Couldn&apos;t load your data: {loadError.message}
        </p>
      )}

      <section className="card">
        <MistakeForm
          // Fresh form state when switching between editing and logging a new one.
          key={editing?.id ?? "new"}
          initialCourses={(coursesRes.data as Course[]) ?? []}
          customTypes={customTypesOf(
            ((typesRes.data as { type: string }[]) ?? []).map((r) => r.type)
          )}
          editing={editing}
        />
      </section>
    </main>
  );
}
