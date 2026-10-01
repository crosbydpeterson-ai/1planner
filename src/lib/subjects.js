import { base44 } from '@/api/base44Client';

// Built-in subjects that always exist alongside custom ones.
// These use the same slugs the app already hardcodes for math/reading.
export const BUILTIN_SUBJECTS = [
  { slug: 'math', name: 'Math', emoji: '🧮', color: '#6366f1', isBuiltin: true, sortOrder: 0 },
  { slug: 'reading', name: 'Reading', emoji: '📚', color: '#10b981', isBuiltin: true, sortOrder: 1 },
];

let cache = null;
let loadPromise = null;

/**
 * Load all Subject entities (custom subjects managed by admins).
 * Returns a map keyed by slug.
 */
export async function loadSubjects() {
  if (cache) return cache;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const all = await base44.entities.Subject.list('sortOrder');
      const map = {};
      all.forEach((s) => {
        map[s.slug] = { ...s, isBuiltin: false };
      });
      cache = map;
      return map;
    } catch (e) {
      console.error('Failed to load subjects', e);
      return {};
    }
  })();
  const result = await loadPromise;
  loadPromise = null;
  return result;
}

/**
 * Get the full list of subjects (built-in + custom), sorted by sortOrder.
 * Each item: { slug, name, emoji, color, isBuiltin, isActive, sortOrder, id? }
 */
export async function getAllSubjects() {
  const custom = await loadSubjects();
  const merged = {};
  // Built-ins first
  BUILTIN_SUBJECTS.forEach((s) => {
    merged[s.slug] = { ...s, isActive: true };
  });
  // Custom subjects override/extend
  Object.values(custom).forEach((s) => {
    merged[s.slug] = s;
  });
  return Object.values(merged).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

/**
 * Get only active subjects for student-facing UIs.
 */
export async function getActiveSubjects() {
  const all = await getAllSubjects();
  return all.filter((s) => s.isActive !== false);
}

/**
 * Look up a subject by slug.
 */
export async function getSubjectBySlug(slug) {
  if (!slug) return null;
  const builtin = BUILTIN_SUBJECTS.find((s) => s.slug === slug);
  if (builtin) return { ...builtin, isActive: true };
  const custom = await loadSubjects();
  return custom[slug] || null;
}

/**
 * Resolve a subject slug to its display name.
 */
export async function getSubjectName(slug) {
  const s = await getSubjectBySlug(slug);
  return s?.name || slug;
}

/**
 * Check if a subject slug is a custom (non-builtin) subject.
 */
export function isCustomSubject(slug) {
  if (!slug) return false;
  return !BUILTIN_SUBJECTS.some((s) => s.slug === slug);
}

/**
 * Invalidate the cache so the next call re-fetches.
 */
export function invalidateSubjects() {
  cache = null;
}