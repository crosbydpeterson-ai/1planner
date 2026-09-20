import { base44 } from '@/api/base44Client';

// Default teacher names used to seed the Teacher entity on first load.
// Once seeded, the admin owns this list and can add/rename/remove freely.
const DEFAULT_TEACHERS = {
  math: ['Best', 'Libbey', 'Hannan', 'Paulson', 'Admin'],
  reading: ['Riener', 'Libbey', 'Hannan', 'Paulson', 'Admin'],
};

let seedingPromise = null;

/**
 * Load all Teacher records, seeding the default set on first run.
 * Returns the full list sorted by sortOrder.
 */
export async function loadAndSeedTeachers() {
  let all = await base44.entities.Teacher.list('sortOrder');
  if (all.length === 0) {
    if (!seedingPromise) {
      seedingPromise = (async () => {
        const records = [];
        Object.entries(DEFAULT_TEACHERS).forEach(([subject, names]) => {
          names.forEach((name, i) => {
            records.push({ name, subject, isActive: true, sortOrder: i });
          });
        });
        await base44.entities.Teacher.bulkCreate(records);
      })();
    }
    await seedingPromise;
    all = await base44.entities.Teacher.list('sortOrder');
  }
  return all;
}

/**
 * Group a flat teacher list into { all, math, reading }.
 */
export function groupTeachers(all) {
  return {
    all: all || [],
    math: (all || []).filter((t) => t.subject === 'math'),
    reading: (all || []).filter((t) => t.subject === 'reading'),
  };
}

/**
 * Resolve a teacher ID to its display name.
 * Falls back to the raw id if the teacher is not found.
 */
export function getTeacherName(teachers, id) {
  if (!id) return '';
  if (!teachers || !teachers.all) return id;
  const t = teachers.all.find((x) => x.id === id);
  return t ? t.name : id;
}