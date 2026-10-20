"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  courseNameError,
  MAX_ANSWER,
  MAX_COURSE_NAME,
  MAX_EXPLANATION,
  MAX_OPTIONS,
  MAX_QUESTION,
  MAX_TYPE,
  MIN_OPTIONS,
  OTHER,
  PRESET_TYPES,
  sortCourses,
  type Course,
  type Mistake,
} from "@/lib/mistakes";

const OTHER_COURSE = "";
const ADD_COURSE = "__add__";
const CUSTOM_TYPE = "__custom__";

type Props = {
  initialCourses: Course[];
  customTypes: string[];
  editing: Mistake | null;
};

function initialTypeChoice(editing: Mistake | null, allTypes: string[]) {
  // Quick-added mistakes have type "Other": make the user pick a real one.
  if (!editing || editing.type === OTHER) return "";
  return allTypes.includes(editing.type) ? editing.type : "";
}

export default function MistakeForm({ initialCourses, customTypes, editing }: Props) {
  const router = useRouter();
  const allTypes = [...PRESET_TYPES, ...customTypes];

  const [courses, setCourses] = useState(initialCourses);
  const [question, setQuestion] = useState(editing?.question ?? "");
  const [courseId, setCourseId] = useState(editing?.course_id ?? OTHER_COURSE);
  const [newCourse, setNewCourse] = useState("");
  const [courseError, setCourseError] = useState<string | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);
  const [typeChoice, setTypeChoice] = useState(initialTypeChoice(editing, allTypes));
  const [customType, setCustomType] = useState("");
  const [isMcq, setIsMcq] = useState(editing?.is_mcq ?? false);
  const [options, setOptions] = useState<string[]>(
    editing?.is_mcq && editing.options ? editing.options : ["", ""]
  );
  const [correctIndex, setCorrectIndex] = useState<number | null>(() => {
    if (!editing?.is_mcq || !editing.options) return null;
    const i = editing.options.indexOf(editing.correct_answer ?? "");
    return i >= 0 ? i : null;
  });
  const [answer, setAnswer] = useState(
    editing && !editing.is_mcq ? (editing.correct_answer ?? "") : ""
  );
  const [explanation, setExplanation] = useState(editing?.explanation ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addingCourse = courseId === ADD_COURSE;

  async function handleAddCourse() {
    const problem = courseNameError(newCourse, courses);
    if (problem) {
      setCourseError(problem);
      return;
    }
    setSavingCourse(true);
    setCourseError(null);
    const { data, error } = await createClient()
      .from("courses")
      .insert({ name: newCourse.trim() })
      .select()
      .single();
    setSavingCourse(false);
    if (error || !data) {
      setCourseError(`Couldn't add the course: ${error?.message ?? "unknown error"}`);
      return;
    }
    const created = data as Course;
    setCourses((prev) => sortCourses([...prev, created]));
    setCourseId(created.id);
    setNewCourse("");
  }

  function cancelAddCourse() {
    setCourseId(OTHER_COURSE);
    setNewCourse("");
    setCourseError(null);
  }

  function updateOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, j) => (j === i ? value : o)));
  }

  function removeOption(i: number) {
    setOptions((prev) => prev.filter((_, j) => j !== i));
    setCorrectIndex((prev) =>
      prev === null || prev === i ? null : prev > i ? prev - 1 : prev
    );
  }

  function resolveType(): string | null {
    if (typeChoice !== CUSTOM_TYPE) return typeChoice || null;
    const name = customType.trim();
    if (!name) return null;
    // Reuse an existing type if the name matches one (ignoring case).
    return allTypes.find((t) => t.toLowerCase() === name.toLowerCase()) ?? name;
  }

  function validate() {
    if (!question.trim()) return "Please enter the question or topic.";
    if (addingCourse) return "Save the new course first, or pick another one.";
    if (!typeChoice) return "Please choose a type.";
    if (!resolveType()) return "Please name your type, or pick another one.";
    if (isMcq) {
      const trimmed = options.map((o) => o.trim());
      if (trimmed.some((o) => !o)) return "Fill in every option, or remove the empty ones.";
      if (new Set(trimmed.map((o) => o.toLowerCase())).size !== trimmed.length) {
        return "Two options are the same. Make each option different.";
      }
      if (correctIndex === null) return "Mark which option is correct.";
    } else if (!answer.trim()) {
      return "Please enter the correct answer.";
    }
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);

    const trimmedOptions = options.map((o) => o.trim());
    const values = {
      question: question.trim(),
      course_id: courseId || null,
      type: resolveType()!,
      is_mcq: isMcq,
      options: isMcq ? trimmedOptions : null,
      correct_answer: isMcq ? trimmedOptions[correctIndex!] : answer.trim(),
      explanation: explanation.trim() || null,
    };

    const supabase = createClient();
    const { error } = editing
      ? await supabase.from("mistakes").update(values).eq("id", editing.id)
      : await supabase.from("mistakes").insert(values);

    if (error) {
      setSaving(false);
      setError(`Couldn't save: ${error.message}`);
      return;
    }
    router.push(editing ? "/app?saved=updated" : "/app?saved=new");
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="question">Question / topic</label>
        <input
          id="question"
          type="text"
          required
          maxLength={MAX_QUESTION}
          placeholder="e.g. Present value of the terminal value"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="course">Course</label>
        <select
          id="course"
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setCourseError(null);
          }}
        >
          <option value={OTHER_COURSE}>{OTHER}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={ADD_COURSE}>+ Add course</option>
        </select>
      </div>

      {addingCourse && (
        <div className="inline-add">
          <label htmlFor="new-course">New course name</label>
          <div className="inline-row">
            <input
              id="new-course"
              type="text"
              maxLength={MAX_COURSE_NAME}
              placeholder="e.g. Corporate Finance"
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              onKeyDown={(e) => {
                // Enter adds the course instead of submitting the whole form.
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCourse();
                }
              }}
              autoFocus
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddCourse}
              disabled={savingCourse}
            >
              {savingCourse ? "Adding…" : "Add"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={cancelAddCourse}>
              Cancel
            </button>
          </div>
          {courseError && (
            <p className="error" role="alert">
              {courseError}
            </p>
          )}
          <p className="hint">The course is saved to your profile.</p>
        </div>
      )}

      <div className="field">
        <label htmlFor="type">Type</label>
        <select id="type" value={typeChoice} onChange={(e) => setTypeChoice(e.target.value)}>
          <option value="" disabled>
            Choose a type
          </option>
          {allTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          <option value={CUSTOM_TYPE}>Other (create your own)</option>
        </select>
      </div>

      {typeChoice === CUSTOM_TYPE && (
        <div className="field">
          <label htmlFor="custom-type">Name your type</label>
          <input
            id="custom-type"
            type="text"
            maxLength={MAX_TYPE}
            placeholder="e.g. Units mix-up"
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <label className="toggle">
        <input
          type="checkbox"
          role="switch"
          checked={isMcq}
          onChange={(e) => setIsMcq(e.target.checked)}
        />
        <span className="toggle-track" aria-hidden="true">
          <span className="toggle-thumb" />
        </span>
        <span className="toggle-label">Multiple choice?</span>
      </label>

      {isMcq ? (
        <fieldset className="options">
          <legend>Options (select the correct one)</legend>
          {options.map((opt, i) => (
            <div className="option-row" key={i}>
              <input
                type="radio"
                name="correct-option"
                id={`correct-${i}`}
                checked={correctIndex === i}
                onChange={() => setCorrectIndex(i)}
                aria-label={`Option ${i + 1} is correct`}
              />
              <input
                type="text"
                maxLength={MAX_ANSWER}
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                aria-label={`Option ${i + 1}`}
              />
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => removeOption(i)}
                disabled={options.length <= MIN_OPTIONS}
                aria-label={`Remove option ${i + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
          {options.length < MAX_OPTIONS && (
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setOptions((prev) => [...prev, ""])}
            >
              + Add option
            </button>
          )}
        </fieldset>
      ) : (
        <div className="field">
          <label htmlFor="answer">Correct answer</label>
          <textarea
            id="answer"
            rows={3}
            maxLength={MAX_ANSWER}
            placeholder="The right answer, in your own words"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>
      )}

      <div className="field">
        <label htmlFor="explanation">
          Why / explanation <span className="optional">(optional)</span>
        </label>
        <textarea
          id="explanation"
          rows={3}
          maxLength={MAX_EXPLANATION}
          placeholder="Why it's right, or how to avoid the mistake next time"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save changes" : "Save mistake"}
        </button>
        <Link href="/app" className="btn btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
