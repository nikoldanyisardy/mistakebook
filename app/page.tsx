import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="landing">
      <section className="container landing-hero">
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
      </section>

      <section className="container landing-how" aria-labelledby="how-heading">
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
              <span className="tag">Corporate Finance</span>
              <span className="tag tag-type">Forgot formula</span>
            </div>
            <div className="correct-way">
              <span className="correct-label">Correct answer</span>
              <p>TV / (1 + r)^5</p>
            </div>
          </div>
        </figure>
      </section>
    </main>
  );
}
