export type Course = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type Mistake = {
  id: string;
  user_id: string;
  question: string;
  course_id: string | null; // null means "Other"
  type: string;
  is_mcq: boolean;
  options: string[] | null;
  correct_answer: string | null;
  explanation: string | null;
  streak: number;
  mastered: boolean;
  created_at: string;
  updated_at: string;
};

export const OTHER = "Other";

export const PRESET_TYPES = [
  "Concept",
  "Calculation",
  "Misread question / careless mistake",
  "Forgot formula",
];

// Two "Got it" answers in a row move a mistake to Mastered.
export const MASTERED_AT_STREAK = 2;

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;

export const MAX_QUESTION = 500;
export const MAX_ANSWER = 2000;
export const MAX_EXPLANATION = 2000;
export const MAX_COURSE_NAME = 80;
export const MAX_TYPE = 60;

export function hasAnswer(m: Mistake) {
  return Boolean(m.correct_answer?.trim());
}

export function courseNameOf(courses: Course[], courseId: string | null) {
  if (!courseId) return OTHER;
  return courses.find((c) => c.id === courseId)?.name ?? OTHER;
}

export function sortCourses(courses: Course[]) {
  return [...courses].sort((a, b) => a.name.localeCompare(b.name));
}

// Types this user created themselves (anything that isn't a preset or "Other").
export function customTypesOf(types: string[]) {
  const taken = new Set([...PRESET_TYPES, OTHER].map((t) => t.toLowerCase()));
  const seen = new Map<string, string>();
  for (const t of types) {
    const key = t.toLowerCase();
    if (t && !taken.has(key) && !seen.has(key)) seen.set(key, t);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

// Lowest streak first, then the ones untouched the longest.
export function byReviewOrder(a: Mistake, b: Mistake) {
  return (
    a.streak - b.streak ||
    a.updated_at.localeCompare(b.updated_at) ||
    a.created_at.localeCompare(b.created_at)
  );
}

// Checks a course name typed by the user; returns an error message or null.
export function courseNameError(name: string, courses: Course[], exceptId?: string) {
  const trimmed = name.trim();
  if (!trimmed) return "Please enter a course name.";
  if (trimmed.toLowerCase() === OTHER.toLowerCase()) {
    return `"${OTHER}" is reserved for mistakes without a course.`;
  }
  const clash = courses.find(
    (c) => c.id !== exceptId && c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (clash) return `You already have a course called "${clash.name}".`;
  return null;
}
