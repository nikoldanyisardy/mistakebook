"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  courseNameError,
  MAX_COURSE_NAME,
  OTHER,
  sortCourses,
  type Course,
} from "@/lib/mistakes";

export default function ProfileView({
  email,
  initialCourses,
  initialCounts,
  loadError,
}: {
  email: string;
  initialCourses: Course[];
  initialCounts: Record<string, number>;
  loadError: string | null;
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [counts, setCounts] = useState(initialCounts);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [deleting, setDeleting] = useState<Course | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(loadError);
  const [notice, setNotice] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (deleting && !dialog.open) dialog.showModal();
    if (!deleting && dialog.open) dialog.close();
  }, [deleting]);

  function reset() {
    setError(null);
    setNotice(null);
  }

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
    const problem = courseNameError(newName, courses);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    const { data, error } = await createClient()
      .from("courses")
      .insert({ name: newName.trim() })
      .select()
      .single();
    setBusy(false);
    if (error || !data) {
      setError(`Couldn't add the course: ${error?.message ?? "unknown error"}`);
      return;
    }
    setCourses((prev) => sortCourses([...prev, data as Course]));
    setNewName("");
    setNotice(`Added "${(data as Course).name}".`);
  }

  function startRename(c: Course) {
    reset();
    setRenamingId(c.id);
    setRenameText(c.name);
  }

  async function handleRename(e: FormEvent<HTMLFormElement>, c: Course) {
    e.preventDefault();
    reset();
    if (renameText.trim() === c.name) {
      setRenamingId(null);
      return;
    }
    const problem = courseNameError(renameText, courses, c.id);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    const { data, error } = await createClient()
      .from("courses")
      .update({ name: renameText.trim() })
      .eq("id", c.id)
      .select()
      .single();
    setBusy(false);
    if (error || !data) {
      setError(`Couldn't rename: ${error?.message ?? "unknown error"}`);
      return;
    }
    setCourses((prev) => sortCourses(prev.map((x) => (x.id === c.id ? (data as Course) : x))));
    setRenamingId(null);
    setNotice("Course renamed.");
  }

  async function deleteCourse(c: Course, alsoDeleteMistakes: boolean) {
    reset();
    setBusy(true);
    const supabase = createClient();
    const count = counts[c.id] ?? 0;

    if (alsoDeleteMistakes && count > 0) {
      const { error } = await supabase.from("mistakes").delete().eq("course_id", c.id);
      if (error) {
        setBusy(false);
        setDeleting(null);
        setError(`Couldn't delete the mistakes: ${error.message}`);
        return;
      }
    }
    // Any mistakes still linked move to "Other" automatically (database rule).
    const { error } = await supabase.from("courses").delete().eq("id", c.id);
    setBusy(false);
    setDeleting(null);
    if (error) {
      setError(`Couldn't delete the course: ${error.message}`);
      return;
    }
    setCourses((prev) => prev.filter((x) => x.id !== c.id));
    setCounts((prev) => {
      const next = { ...prev };
      delete next[c.id];
      return next;
    });
    setNotice(
      count === 0
        ? `Deleted "${c.name}".`
        : alsoDeleteMistakes
          ? `Deleted "${c.name}" and its ${plural(count)}.`
          : `Deleted "${c.name}". Its ${plural(count)} moved to ${OTHER}.`
    );
  }

  const deletingCount = deleting ? (counts[deleting.id] ?? 0) : 0;

  return (
    <main className="container narrow-md stack">
      <div className="page-title">
        <h1>Profile</h1>
      </div>

      <section className="card" aria-labelledby="account-heading">
        <h2 id="account-heading">Account</h2>
        <p className="profile-email">
          <span className="muted">Email</span>
          <strong>{email}</strong>
        </p>
      </section>

      <section className="card stack-sm" aria-labelledby="courses-heading">
        <h2 id="courses-heading">My courses</h2>

        <form className="inline-row" onSubmit={handleAdd} noValidate>
          <label htmlFor="add-course" className="sr-only">
            New course name
          </label>
          <input
            id="add-course"
            type="text"
            maxLength={MAX_COURSE_NAME}
            placeholder="Add a course, e.g. Statistics"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Add
          </button>
        </form>

        <div aria-live="polite">
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {notice && !error && <p className="notice">{notice}</p>}
        </div>

        {courses.length === 0 ? (
          <p className="muted">
            No courses yet. Add the courses you&apos;re taking so you can sort your
            mistakes by course. Mistakes without a course go under &ldquo;{OTHER}&rdquo;.
          </p>
        ) : (
          <ul className="course-list">
            {courses.map((c) => (
              <li key={c.id} className="course-row">
                {renamingId === c.id ? (
                  <form className="inline-row" onSubmit={(e) => handleRename(e, c)} noValidate>
                    <label htmlFor={`rename-${c.id}`} className="sr-only">
                      New name for {c.name}
                    </label>
                    <input
                      id={`rename-${c.id}`}
                      type="text"
                      maxLength={MAX_COURSE_NAME}
                      value={renameText}
                      onChange={(e) => setRenameText(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      onClick={() => setRenamingId(null)}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="course-info">
                      <span className="course-name">{c.name}</span>
                      <span className="muted">{plural(counts[c.id] ?? 0)}</span>
                    </div>
                    <div className="course-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        onClick={() => startRename(c)}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        onClick={() => {
                          reset();
                          setDeleting(c);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <dialog
        ref={dialogRef}
        className="dialog"
        aria-labelledby="delete-title"
        onClose={() => setDeleting(null)}
      >
        {deleting && (
          <div className="stack-sm">
            {deletingCount > 0 ? (
              <>
                <h2 id="delete-title">
                  What should happen to the {deletingCount}{" "}
                  {deletingCount === 1 ? "mistake" : "mistakes"} in {deleting.name}?
                </h2>
                <p className="muted">The course itself will be deleted either way.</p>
                <div className="dialog-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => deleteCourse(deleting, false)}
                    disabled={busy}
                  >
                    Move to {OTHER}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => deleteCourse(deleting, true)}
                    disabled={busy}
                  >
                    Delete them
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setDeleting(null)}
                    disabled={busy}
                    autoFocus
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="delete-title">Delete the course {deleting.name}?</h2>
                <p className="muted">It has no mistakes.</p>
                <div className="dialog-actions">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => deleteCourse(deleting, false)}
                    disabled={busy}
                  >
                    Delete course
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setDeleting(null)}
                    disabled={busy}
                    autoFocus
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </dialog>
    </main>
  );
}

function plural(n: number) {
  return `${n} ${n === 1 ? "mistake" : "mistakes"}`;
}
