// Grade 5 and Grade 6 share this app. Anything saved before grades existed has
// no grade on it, so a missing grade is read as Grade 6 — that keeps the
// original sixth-grade experience exactly as it was.

export const DEFAULT_GRADE = '6';

export const GRADE_OPTIONS = [
  { value: '5', label: 'Grade 5' },
  { value: '6', label: 'Grade 6' },
];

// An assignment can also be shared with both grades.
export const ASSIGNMENT_GRADE_OPTIONS = [
  { value: '5', label: 'Grade 5' },
  { value: '6', label: 'Grade 6' },
  { value: 'both', label: 'Both grades' },
];

export function normalizeGrade(grade) {
  return String(grade) === '5' ? '5' : DEFAULT_GRADE;
}

export function gradeLabel(grade) {
  return grade === 'both' ? 'Both grades' : `Grade ${normalizeGrade(grade)}`;
}

// A teacher belongs to one grade. No grade on the record means Grade 6.
export function teacherMatchesGrade(teacher, grade) {
  if (!teacher) return false;
  return normalizeGrade(teacher.grade) === normalizeGrade(grade);
}

// Active teachers of one grade, for a subject list.
export function teachersForGrade(list, grade) {
  return (list || []).filter((t) => t.isActive !== false && teacherMatchesGrade(t, grade));
}

// An assignment is visible to a grade when it is set to that grade or to both.
export function assignmentMatchesGrade(assignment, grade) {
  if (assignment?.grade === 'both') return true;
  return normalizeGrade(assignment?.grade) === normalizeGrade(grade);
}