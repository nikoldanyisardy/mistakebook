import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/supabase/server";

const SUBHEADLINE =
  "For business students: save every question you get wrong on quizzes, problem sets and exams, sort them by course, and practice them until they stick.";

export const metadata: Metadata = {
  title: "MistakeBook: your mistakes, mastered",
  description: SUBHEADLINE,
};

const STEPS = [
  { title: "Log it", text: "Type the question, course and correct answer in seconds." },
  { title: "Review it", text: "Pick a course and test yourself." },
  {
    title: "Master it",
    text: "Get it right twice in a row and it moves to Mastered.",
  },
];

export default async function Home() {
  const user = await getUser();

  return (
    <main className="landing">
      <section className="landing-hero">
        <div className="landing-hero-text">
          <h1>Your mistakes, mastered.</h1>
          <p className="landing-sub">{SUBHEADLINE}</p>
          {user ? (
            <Link href="/app" className="btn btn-primary btn-large">
              Go to my mistakes
            </Link>
          ) : (
            <Link href="/signup" className="btn btn-primary btn-large">
              Sign up free
            </Link>
          )}
        </div>
        <HeroIllustration />
      </section>

      <section className="landing-how" aria-labelledby="how-heading">
        <div className="landing-how-inner">
          <h2 id="how-heading">Miss it once. Master it for good.</h2>

          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="step">
                <span className="step-number" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Static preview of a mistake card; not interactive. */}
          <figure className="landing-example">
            <figcaption className="example-label">Example</figcaption>
            <div className="card mistake">
              <p className="mistake-what">
                What is the present value of a terminal value in year 5?
              </p>
              <div className="tags">
                <span className="tag tag-course">Corporate Finance</span>
                <span className="tag tag-type">Forgot formula</span>
              </div>
              <div className="correct-way">
                <span className="correct-label">Correct answer</span>
                <p>TV / (1 + r)^5</p>
              </div>
            </div>
          </figure>
        </div>
      </section>
    </main>
  );
}

// Decorative sample review card. Hidden from screen readers; nothing is clickable.
function HeroIllustration() {
  const options = [
    { letter: "A", text: "FIFO" },
    { letter: "B", text: "LIFO", correct: true },
    { letter: "C", text: "Weighted average" },
  ];

  return (
    <div className="hero-art" aria-hidden="true">
      <div className="hero-card">
        <p className="hero-card-label">Review · Financial Accounting</p>
        <p className="hero-card-question">
          Which inventory method is not permitted under IFRS?
        </p>
        <div className="hero-options">
          {options.map((o) => (
            <div
              key={o.letter}
              className={o.correct ? "hero-option is-correct" : "hero-option"}
            >
              <span className="mcq-letter">{o.letter}</span>
              <span>{o.text}</span>
              {o.correct && (
                <span className="mcq-result">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                  Correct
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="hero-pill">
        <span className="hero-pill-check">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        Mastered: 2 in a row
      </div>
    </div>
  );
}
