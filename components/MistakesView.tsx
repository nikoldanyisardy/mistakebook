"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import MistakeTags from "@/components/MistakeTags";
import { createClient } from "@/lib/supabase/client";
import {
  courseNameOf,
  hasAnswer,
  MAX_QUESTION,
  OTHER,
  type Course,
  type Mistake,
} from "@/lib/mistakes";

const ALL = "__all__";
const OTHER_COURSE = "__other__";

export default function MistakesView({
  initialMistakes,
  courses,
  loadError,
  flash,
}: {
  initialMistakes: Mistake[];
  courses: Course[];
  loadError: string | null;
  flash: string | null;
}) {
  const router = useRouter();
  const [mistakes, setMistakes] = useState(initialMistakes);
  const [quickText, setQuickText] = useState("");
  const [adding, setAdding] = useState(false);
  const [courseFilter, setCourseFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [error, setError] = useState<string | null>(loadError);
  const [notice, setNotice] = useState<string | null>(flash);
  const quickRef = useRef<HTMLInputElement>(null);

  // Drop ?saved=… from the address bar so a reload doesn't repeat the message.
  useEffect(() => {
    if (flash) router.replace("/app", { scroll: false });
  }, [flash, router]);

  const courseName = (m: Mistake) => courseNameOf(courses, m.course_id);
  const usedTypes = [...new Set(mistakes.map((m) => m.type))].sort((a, b) =>
    a.localeCompare(b)
  );
  const hasOtherCourse = mistakes.some((m) => !m.course_id);

  const matchesFilters = (m: Mistake) =>
    (courseFilter === ALL ||
      (courseFilter === OTHER_COURSE ? !m.course_id : m.course_id === courseFilter)) &&
    (typeFilter === ALL || m.type === typeFilter);

  // One list, newest first, mastered and not-mastered mixed.
  const visible = mistakes.filter(matchesFilters);
  const filtersOn = courseFilter !== ALL || typeFilter !== ALL;

  function clearFilters() {
    setCourseFilter(ALL);
    setTypeFilter(ALL);
  }

  async function handleQuickAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const question = quickText.trim();
    if (!question) {
      setError("Type a question or topic first.");
      quickRef.current?.focus();
      return;
    }

    setAdding(true);
    // course_id and type use their defaults: "Other".
    const { data, error } = await createClient()
      .from("mistakes")
      .insert({ question })
      .select()
      .single();
    setAdding(false);

    if (error || !data) {
      setError(`Couldn't save your mistake: ${error?.message ?? "unknown error"}`);
      return;
    }
    const created = data as Mistake;
    setMistakes((prev) => [created, ...prev]);
    // Make sure the new mistake is visible even if filters would hide it.
    if (!matchesFilters(created)) clearFilters();
    setQuickText("");
    setNotice("Added. Add the answer whenever you're ready.");
    quickRef.current?.focus();
  }

  async function handleDelete(m: Mistake) {
    if (!window.confirm(`Delete "${m.question}"? This can't be undone.`)) return;
    setError(null);
    setNotice(null);
    const { error } = await createClient().from("mistakes").delete().eq("id", m.id);
    if (error) {
      setError(`Couldn't delete: ${error.message}`);
      return;
    }
    setMistakes((prev) => prev.filter((x) => x.id !== m.id));
  }

  async function handleReviewAgain(m: Mistake) {
    setError(null);
    setNotice(null);
    const { data, error } = await createClient()
      .from("mistakes")
      .update({ mastered: false, streak: 0 })
      .eq("id", m.id)
      .select()
      .single();
    if (error || !data) {
      setError(`Couldn't move it back: ${error?.message ?? "unknown error"}`);
      return;
    }
    setMistakes((prev) => prev.map((x) => (x.id === m.id ? (data as Mistake) : x)));
    setNotice("It's back in Review.");
  }

  function renderItem(m: Mistake) {
    return (
      <li key={m.id} className={m.mastered ? "card mistake mastered" : "card mistake"} data-testid="core-item">
        <p className="mistake-what">{m.question}</p>
        <MistakeTags mistake={m} courseName={courseName(m)} showMcq />

        {hasAnswer(m) ? (
          <details className="answer-details">
            <summary>Show answer</summary>
            <div className="correct-way">
              <span className="correct-label">Correct answer</span>
              <p>{m.correct_answer}</p>
              {m.explanation && (
                <>
                  <span className="correct-label explanation-label">Why</span>
                  <p>{m.explanation}</p>
                </>
              )}
            </div>
          </details>
        ) : (
          <Link href={`/app/new?edit=${m.id}`} className="add-answer">
            + Add answer
          </Link>
        )}

        <div className="item-actions">
          {m.mastered && (
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => handleReviewAgain(m)}
            >
              Review again
            </button>
          )}
          <Link href={`/app/new?edit=${m.id}`} className="btn btn-ghost btn-small">
            Edit
          </Link>
          <button
            type="button"
            className="btn btn-danger btn-small"
            onClick={() => handleDelete(m)}
          >
            Delete
          </button>
        </div>
      </li>
    );
  }

  return (
    <main className="container stack">
      <div className="page-title">
        <h1>My mistakes</h1>
        <p className="lead">
          Jot it down fast here, or{" "}
          <Link href="/app/new">log a mistake with the full form</Link>.
        </p>
      </div>

      <form className="card quick-add" onSubmit={handleQuickAdd} noValidate>
        <label htmlFor="quick-add" className="sr-only">
          Quick add
        </label>
        <input
          ref={quickRef}
          id="quick-add"
          type="text"
          maxLength={MAX_QUESTION}
          placeholder="Quick add: question or topic"
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          data-testid="core-input"
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={adding}
          data-testid="core-submit"
        >
          {adding ? "Adding…" : "Add"}
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

      {mistakes.length === 0 && !loadError && <EmptyState />}

      {mistakes.length > 0 && (
        <div className="filters" role="group" aria-label="Filter mistakes">
          <div className="field">
            <label htmlFor="filter-course">Course</label>
            <select
              id="filter-course"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value={ALL}>All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              {hasOtherCourse && <option value={OTHER_COURSE}>{OTHER}</option>}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-type">Type</label>
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value={ALL}>All types</option>
              {usedTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {filtersOn && (
            <button type="button" className="btn btn-ghost btn-small" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {mistakes.length > 0 && (
        <section aria-labelledby="list-heading" className="stack-sm">
          <div className="section-head">
            <h2 id="list-heading">
              All mistakes{" "}
              <span className="count">
                {filtersOn ? `${visible.length} of ${mistakes.length}` : mistakes.length}
              </span>
            </h2>
            <Link href="/app/review" className="btn btn-secondary btn-small">
              Start review
            </Link>
          </div>

          {visible.length > 0 ? (
            <ul className="mistake-list">{visible.map(renderItem)}</ul>
          ) : (
            <div className="card empty">
              <p>No mistakes match these filters.</p>
              <button type="button" className="btn btn-secondary btn-small" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="card empty empty-welcome">
      <h3>Your MistakeBook is empty, and that&apos;s a great place to start</h3>
      <p>
        Every time you get something wrong on a problem set, quiz or practice exam,
        log it here: the question, the course, what kind of mistake it was and the
        correct answer. Then use <strong>Review</strong> until you stop making it.
      </p>
      <div className="example">
        <span className="example-label">Example</span>
        <p className="mistake-what">What is the present value of the terminal value in year 5?</p>
        <div className="tags">
          <span className="tag">Corporate Finance</span>
          <span className="tag tag-type">Forgot formula</span>
        </div>
        <div className="correct-way">
          <span className="correct-label">Correct answer</span>
          <p>Discount it: TV / (1 + r)^5, using the same year as the last cash flow.</p>
        </div>
      </div>
      <Link href="/app/new" className="btn btn-primary">
        Log your first mistake
      </Link>
    </div>
  );
}
