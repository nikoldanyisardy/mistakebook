"use client";

import Link from "next/link";
import { useState } from "react";
import MistakeTags from "@/components/MistakeTags";
import { createClient } from "@/lib/supabase/client";
import {
  byReviewOrder,
  courseNameOf,
  hasAnswer,
  MASTERED_AT_STREAK,
  OTHER,
  type Course,
  type Mistake,
} from "@/lib/mistakes";

const ALL = "__all__";
const OTHER_COURSE = "__other__";

type Session = {
  key: string;
  label: string;
  ids: string[]; // fixed at the start, so each mistake is shown once
  index: number;
  right: number;
  answered: number;
};

function inSelection(m: Mistake, key: string) {
  if (key === ALL) return true;
  if (key === OTHER_COURSE) return !m.course_id;
  return m.course_id === key;
}

export default function ReviewView({
  initialMistakes,
  courses,
  loadError,
}: {
  initialMistakes: Mistake[];
  courses: Course[];
  loadError: string | null;
}) {
  const [mistakes, setMistakes] = useState(initialMistakes);
  const [session, setSession] = useState<Session | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  // A wrong multiple-choice pick is saved as "Still shaky" right away.
  const [autoShaky, setAutoShaky] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(loadError);
  const [message, setMessage] = useState<string | null>(null);

  function resetCard() {
    setRevealed(false);
    setPicked(null);
    setAutoShaky(false);
  }

  function start(key: string, label: string) {
    const ids = mistakes
      .filter((m) => !m.mastered && inSelection(m, key))
      .sort(byReviewOrder)
      .map((m) => m.id);
    setSession({ key, label, ids, index: 0, right: 0, answered: 0 });
    setError(null);
    setMessage(null);
    resetCard();
  }

  function leave() {
    setSession(null);
    setError(null);
    setMessage(null);
    resetCard();
  }

  // Saves one answer; returns true when it worked.
  async function record(m: Mistake, gotIt: boolean) {
    setSaving(true);
    setError(null);
    const streak = gotIt ? m.streak + 1 : 0;
    const mastered = streak >= MASTERED_AT_STREAK;
    const { data, error } = await createClient()
      .from("mistakes")
      .update({ streak, mastered })
      .eq("id", m.id)
      .select()
      .single();
    setSaving(false);
    if (error || !data) {
      setError(`Couldn't save your answer: ${error?.message ?? "unknown error"}`);
      return false;
    }
    setMistakes((prev) => prev.map((x) => (x.id === m.id ? (data as Mistake) : x)));
    setSession((s) =>
      s && { ...s, answered: s.answered + 1, right: s.right + (gotIt ? 1 : 0) }
    );
    setMessage(
      mastered
        ? "Mastered! That one is out of review now."
        : gotIt
          ? `Nice. ${MASTERED_AT_STREAK - streak} more "Got it" in a row to master it.`
          : null
    );
    return true;
  }

  function next() {
    setSession((s) => s && { ...s, index: s.index + 1 });
    resetCard();
  }

  async function answer(m: Mistake, gotIt: boolean) {
    if (await record(m, gotIt)) next();
  }

  async function pick(m: Mistake, i: number) {
    if (picked !== null) return;
    setPicked(i);
    setMessage(null);
    if (m.options?.[i] !== m.correct_answer) {
      setAutoShaky(true);
      await record(m, false);
    }
  }

  if (!session) {
    return (
      <Picker
        mistakes={mistakes}
        courses={courses}
        error={error}
        onStart={start}
      />
    );
  }

  const current = mistakes.find((m) => m.id === session.ids[session.index]);

  if (!current) {
    return (
      <main className="container narrow-md stack">
        <div className="card empty review-done">
          <h1>Session complete</h1>
          <p className="score">
            You got <strong>{session.right}</strong> right out of{" "}
            <strong>{session.answered}</strong>.
          </p>
          <p>
            {session.answered > 0 && session.right === session.answered
              ? "A perfect round. Well done!"
              : "Every review makes the next one easier. Keep going!"}
          </p>
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={leave}>
              Review another course
            </button>
            <Link href="/app" className="btn btn-ghost">
              My mistakes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const mcqReady =
    current.is_mcq &&
    current.options &&
    hasAnswer(current) &&
    current.options.includes(current.correct_answer!);
  const noAnswer = !hasAnswer(current) || (current.is_mcq && !mcqReady);
  const showAnswer = mcqReady ? picked !== null : revealed;
  const showGrading = noAnswer || (mcqReady ? picked !== null && !autoShaky : revealed);

  return (
    <main className="container narrow-md stack">
      <div className="session-head">
        <button type="button" className="btn btn-ghost btn-small" onClick={leave}>
          ← Choose another course
        </button>
        <p className="review-progress">
          {session.label} · {session.index + 1} of {session.ids.length}
        </p>
      </div>

      <div aria-live="polite">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && !error && <p className="notice">{message}</p>}
      </div>

      <article className="card review-card" aria-labelledby="review-question">
        <h1 id="review-question" className="review-what">
          {current.question}
        </h1>
        <MistakeTags mistake={current} courseName={courseNameOf(courses, current.course_id)} />

        {noAnswer ? (
          <div className="correct-way correct-missing">
            <p>No answer saved.</p>
            <Link href={`/app/new?edit=${current.id}`} className="btn btn-secondary btn-small">
              Add an answer
            </Link>
          </div>
        ) : mcqReady ? (
          <ul className="mcq-options" aria-label="Options">
            {current.options!.map((opt, i) => {
              const isCorrect = opt === current.correct_answer;
              const state =
                picked === null
                  ? ""
                  : isCorrect
                    ? " is-correct"
                    : picked === i
                      ? " is-wrong"
                      : " is-dimmed";
              return (
                <li key={i}>
                  <button
                    type="button"
                    className={`mcq-option${state}`}
                    onClick={() => pick(current, i)}
                    disabled={picked !== null || saving}
                    aria-pressed={picked === i}
                  >
                    <span className="mcq-letter" aria-hidden="true">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                    {picked !== null && isCorrect && (
                      <span className="mcq-result">
                        <CheckIcon /> Correct
                      </span>
                    )}
                    {picked === i && !isCorrect && (
                      <span className="mcq-result">
                        <XIcon /> Your pick
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : !revealed ? (
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => setRevealed(true)}
          >
            Reveal answer
          </button>
        ) : (
          <div className="correct-way">
            <span className="correct-label">Correct answer</span>
            <p>{current.correct_answer}</p>
          </div>
        )}

        {showAnswer && current.explanation && (
          <div className="correct-way explanation">
            <span className="correct-label explanation-label">Why</span>
            <p>{current.explanation}</p>
          </div>
        )}

        {autoShaky && (
          <div className="auto-shaky">
            <p>Not quite. This one counts as &ldquo;Still shaky&rdquo;.</p>
            <button type="button" className="btn btn-primary btn-block" onClick={next} disabled={saving}>
              Next
            </button>
          </div>
        )}

        {showGrading && (
          <div className="review-actions">
            <button
              type="button"
              className="btn btn-shaky"
              onClick={() => answer(current, false)}
              disabled={saving}
            >
              Still shaky
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => answer(current, true)}
              disabled={saving}
            >
              Got it
            </button>
          </div>
        )}
      </article>
    </main>
  );
}

function Picker({
  mistakes,
  courses,
  error,
  onStart,
}: {
  mistakes: Mistake[];
  courses: Course[];
  error: string | null;
  onStart: (key: string, label: string) => void;
}) {
  const groups = [
    { key: ALL, label: "All courses" },
    ...courses.map((c) => ({ key: c.id, label: c.name })),
    ...(mistakes.some((m) => !m.course_id) ? [{ key: OTHER_COURSE, label: OTHER }] : []),
  ];

  return (
    <main className="container stack">
      <div className="page-title">
        <h1>What do you want to review today?</h1>
        <p className="lead">
          Pick a course. Two &ldquo;Got it&rdquo; in a row and a mistake is mastered.
        </p>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {mistakes.length === 0 ? (
        <div className="card empty">
          <h2>Nothing to review yet</h2>
          <p>Log a few mistakes first, then come back here to review them.</p>
          <Link href="/app/new" className="btn btn-primary">
            Log a mistake
          </Link>
        </div>
      ) : (
        <ul className="course-cards">
          {groups.map(({ key, label }) => {
            const inGroup = mistakes.filter((m) => inSelection(m, key));
            const total = inGroup.length;
            const masteredCount = inGroup.filter((m) => m.mastered).length;
            const left = total - masteredCount;
            const pct = total ? Math.round((masteredCount / total) * 100) : 0;
            const canStart = left > 0;

            return (
              <li key={key}>
                <button
                  type="button"
                  className={key === ALL ? "course-card course-card-all" : "course-card"}
                  onClick={() => onStart(key, label)}
                  disabled={!canStart}
                >
                  <span className="course-card-name">{label}</span>
                  <span className={total === 0 ? "course-card-status is-empty" : "course-card-status"}>
                    {total === 0
                      ? "No mistakes yet"
                      : left === 0
                        ? "All mastered"
                        : `${left} to review`}
                  </span>
                  <span className="progress" aria-hidden="true">
                    <span className="progress-fill" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="course-card-meta">
                    {masteredCount} of {total} mastered
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
