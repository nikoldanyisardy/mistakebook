import { MASTERED_AT_STREAK, OTHER, type Mistake } from "@/lib/mistakes";

// Course, type and progress tags. "Other" means "not set", so it gets no tag.
export default function MistakeTags({
  mistake: m,
  courseName,
  showMcq = false,
}: {
  mistake: Mistake;
  courseName: string;
  showMcq?: boolean;
}) {
  const tags = [
    courseName !== OTHER && (
      <span key="course" className="tag tag-course">
        {courseName}
      </span>
    ),
    m.type !== OTHER && (
      <span key="type" className="tag tag-type">
        {m.type}
      </span>
    ),
    showMcq && m.is_mcq && (
      <span key="mcq" className="tag tag-mcq">
        Multiple choice
      </span>
    ),
    m.mastered && (
      <span key="mastered" className="tag tag-mastered">
        Mastered
      </span>
    ),
    !m.mastered && m.streak > 0 && (
      <span key="streak" className="tag tag-streak">
        Got it {m.streak}/{MASTERED_AT_STREAK}
      </span>
    ),
  ].filter(Boolean);

  if (tags.length === 0) return null;
  return <div className="tags">{tags}</div>;
}
