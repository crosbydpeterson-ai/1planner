import { base44 } from '@/api/base44Client';

const DEFAULT_COLORS = [
  '#7c3aed', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6',
  '#f97316', '#84cc16',
];

/**
 * Fetch all SpinWheelPreset records (non-archived).
 */
export async function fetchAllWheelPresets() {
  try {
    const page = await base44.entities.SpinWheelPreset.filter(
      { status: { $ne: 'archived' } },
      { sort: '-created_date', limit: 1000 }
    );
    return page.items || [];
  } catch (e) {
    console.error('Failed to fetch wheel presets', e);
    return [];
  }
}

/**
 * Check if a scheduled wheel is currently within its active window.
 * Handles followSeasonDates by using the season's dates if enabled.
 */
function isWheelLive(preset, now, seasons) {
  if (preset.status === 'active') return true;
  if (preset.status !== 'scheduled') return false;

  let start = preset.startDate ? new Date(preset.startDate) : null;
  let end = preset.endDate ? new Date(preset.endDate) : null;

  // If following season dates, use the season's date range
  if (preset.followSeasonDates && preset.seasonId && seasons) {
    const season = seasons.find(s => s.id === preset.seasonId);
    if (season) {
      // Season dates are date-only strings (YYYY-MM-DD), interpreted as Chicago dates
      start = season.startDate ? new Date(season.startDate + 'T00:00:00') : start;
      end = season.endDate ? new Date(season.endDate + 'T23:59:59') : end;
    }
  }

  if (!start || !end) return false;
  return now >= start && now <= end;
}

/**
 * Resolve the applicable wheel for a given destination ('daily' or 'bonus').
 *
 * @param {string} destination - 'daily' or 'bonus'
 * @param {Array} [seasons] - Optional pre-fetched seasons for followSeasonDates
 * @returns {{ wheel: object|null, source: string, conflict: boolean, conflictingWheels: Array }}
 *   source: 'scheduled' | 'active' | 'fallback' | 'none'
 *   conflict: true if multiple wheels are live for the same destination
 */
export async function resolveActiveWheel(destination, seasons) {
  const presets = await fetchAllWheelPresets();
  if (presets.length === 0) return { wheel: null, source: 'none', conflict: false, conflictingWheels: [] };

  if (!seasons) {
    try {
      seasons = await base44.entities.Season.list();
    } catch {
      seasons = [];
    }
  }

  const now = new Date();

  // Find all live wheels matching this destination
  const live = presets.filter(p =>
    (p.destination === destination || p.destination === 'both') &&
    isWheelLive(p, now, seasons)
  );

  if (live.length > 1) {
    // Conflict — multiple wheels live for the same destination
    // Prefer non-fallback wheels, then the most recently created
    const nonFallback = live.filter(p => !p.isFallback);
    if (nonFallback.length === 1) {
      return { wheel: nonFallback[0], source: nonFallback[0].status === 'scheduled' ? 'scheduled' : 'active', conflict: false, conflictingWheels: [] };
    }
    return { wheel: live[0], source: 'conflict', conflict: true, conflictingWheels: live };
  }

  if (live.length === 1) {
    const w = live[0];
    return { wheel: w, source: w.status === 'scheduled' ? 'scheduled' : 'active', conflict: false, conflictingWheels: [] };
  }

  // No live wheel — try fallback
  const fallback = presets.find(p =>
    p.isFallback &&
    (p.destination === destination || p.destination === 'both') &&
    p.status === 'active'
  );
  if (fallback) {
    return { wheel: fallback, source: 'fallback', conflict: false, conflictingWheels: [] };
  }

  return { wheel: null, source: 'none', conflict: false, conflictingWheels: [] };
}

/**
 * Detect scheduling conflicts for a given destination.
 * Returns an array of conflicting preset pairs.
 */
export function detectConflicts(presets, destination, excludeId) {
  const relevant = presets.filter(p =>
    p.id !== excludeId &&
    (p.destination === destination || p.destination === 'both') &&
    (p.status === 'active' || p.status === 'scheduled')
  );
  const conflicts = [];

  for (let i = 0; i < relevant.length; i++) {
    for (let j = i + 1; j < relevant.length; j++) {
      const a = relevant[i];
      const b = relevant[j];
      // Active wheels always conflict with each other
      if (a.status === 'active' && b.status === 'active') {
        conflicts.push({ a, b, reason: 'Both are active' });
      }
      // Active conflicts with scheduled (if scheduled is in range)
      else if (a.status === 'active' && b.status === 'scheduled' && b.startDate && b.endDate) {
        conflicts.push({ a, b, reason: 'Active wheel overlaps scheduled wheel' });
      }
      else if (b.status === 'active' && a.status === 'scheduled' && a.startDate && a.endDate) {
        conflicts.push({ a, b, reason: 'Active wheel overlaps scheduled wheel' });
      }
      // Two scheduled wheels with overlapping date ranges
      else if (a.status === 'scheduled' && b.status === 'scheduled' &&
               a.startDate && a.endDate && b.startDate && b.endDate) {
        const aStart = new Date(a.startDate), aEnd = new Date(a.endDate);
        const bStart = new Date(b.startDate), bEnd = new Date(b.endDate);
        if (aStart <= bEnd && bStart <= aEnd) {
          conflicts.push({ a, b, reason: 'Schedules overlap' });
        }
      }
    }
  }
  return conflicts;
}

/**
 * Validate a wheel preset before saving.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateWheel(form, allPetIds, allThemeIds, allSongIds, allPlaylistIds) {
  const errors = [];

  if (!form.name || !form.name.trim()) {
    errors.push('Name is required');
  }

  if (!form.prizes || form.prizes.length === 0) {
    errors.push('At least one prize is required');
  } else {
    const totalWeight = form.prizes.reduce((s, p) => s + Math.max(0, Number(p.weight) || 0), 0);
    if (totalWeight <= 0) {
      errors.push('Total weight must be positive');
    }

    form.prizes.forEach((p, i) => {
      if (!p.type) errors.push(`Prize ${i + 1}: type is required`);
      if ((p.type === 'xp' || p.type === 'coins') && (!p.amount || Number(p.amount) <= 0)) {
        errors.push(`Prize ${i + 1}: amount must be positive for ${p.type}`);
      }
      if (p.type === 'pet' && p.value && allPetIds && !allPetIds.includes(p.value)) {
        errors.push(`Prize ${i + 1}: pet "${p.value}" does not exist`);
      }
      if (p.type === 'theme' && p.value && allThemeIds && !allThemeIds.includes(p.value)) {
        errors.push(`Prize ${i + 1}: theme "${p.value}" does not exist`);
      }
      if (p.type === 'song' && p.value && allSongIds && !allSongIds.includes(p.value)) {
        errors.push(`Prize ${i + 1}: song "${p.value}" does not exist`);
      }
      if (p.type === 'playlist' && p.value && allPlaylistIds && !allPlaylistIds.includes(p.value)) {
        errors.push(`Prize ${i + 1}: playlist "${p.value}" does not exist`);
      }
    });
  }

  if (form.status === 'scheduled') {
    if (!form.startDate || !form.endDate) {
      errors.push('Scheduled wheels need start and end dates');
    } else {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (start >= end) {
        errors.push('End date must be after start date');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Timezone helpers (America/Chicago) ───

/**
 * Convert a datetime-local string (YYYY-MM-DDTHH:MM) interpreted as
 * America/Chicago time to an ISO timestamp.
 */
export function chicagoLocalToISO(localStr) {
  if (!localStr) return null;
  try {
    const [date, time] = localStr.split('T');
    const [y, m, d] = date.split('-').map(Number);
    const [h, min] = time.split(':').map(Number);

    // Create a tentative UTC date from the input parts
    const tentative = new Date(Date.UTC(y, m - 1, d, h, min));

    // Format tentative in Chicago to find the offset
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const parts = fmt.formatToParts(tentative);
    const p = {};
    parts.forEach(pt => { if (pt.type !== 'literal') p[pt.type] = pt.value; });

    const chicagoAsUTC = Date.UTC(
      parseInt(p.year), parseInt(p.month) - 1, parseInt(p.day),
      parseInt(p.hour) % 24, parseInt(p.minute)
    );

    const offsetMs = tentative.getTime() - chicagoAsUTC;
    const realUTC = new Date(tentative.getTime() + offsetMs);
    return realUTC.toISOString();
  } catch {
    return null;
  }
}

/**
 * Convert an ISO timestamp to a datetime-local string (YYYY-MM-DDTHH:MM)
 * in America/Chicago timezone.
 */
export function isoToChicagoLocal(isoStr) {
  if (!isoStr) return '';
  try {
    const date = new Date(isoStr);
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const parts = fmt.formatToParts(date);
    const p = {};
    parts.forEach(pt => { if (pt.type !== 'literal') p[pt.type] = pt.value; });
    return `${p.year}-${p.month}-${p.day}T${String(parseInt(p.hour) % 24).padStart(2, '0')}:${p.minute}`;
  } catch {
    return '';
  }
}

/**
 * Format an ISO timestamp for display in America/Chicago with timezone label.
 */
export function formatChicagoDateTime(isoStr) {
  if (!isoStr) return '';
  try {
    const date = new Date(isoStr);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
      timeZoneName: 'short',
    });
  } catch {
    return '';
  }
}

/**
 * Get the status label for display.
 */
export function getWheelStatusLabel(preset, seasons) {
  if (preset.status === 'archived') return 'Archived';
  if (preset.status === 'stored') return 'Stored';
  if (preset.status === 'draft') return 'Draft';

  if (preset.status === 'active') {
    return preset.isFallback ? 'Active (Fallback)' : 'Active';
  }

  if (preset.status === 'scheduled') {
    const now = new Date();
    const start = preset.startDate ? new Date(preset.startDate) : null;
    const end = preset.endDate ? new Date(preset.endDate) : null;
    if (start && now < start) return 'Scheduled (Upcoming)';
    if (end && now > end) return 'Scheduled (Expired)';
    if (start && end && now >= start && now <= end) return 'Scheduled (Live)';
    return 'Scheduled';
  }

  return preset.status;
}

/**
 * Migrate an existing wheel config (from AppSetting) into a SpinWheelPreset.
 * Creates a fallback preset without changing prizes or weights.
 */
export async function migrateExistingWheelConfig(existingWheel, createdBy) {
  if (!existingWheel || !existingWheel.prizes || existingWheel.prizes.length === 0) return null;

  const prizes = existingWheel.prizes.map(p => ({
    type: p.type || 'xp',
    amount: p.amount || 0,
    value: p.value || '',
    label: p.label || '',
    icon: p.icon || '',
    color: p.color || '',
    weight: p.weight || 1,
  }));

  const preset = await base44.entities.SpinWheelPreset.create({
    name: 'Default Wheel',
    description: 'Migrated from existing wheel configuration',
    colors: DEFAULT_COLORS,
    prizes,
    status: 'active',
    destination: 'both',
    isFallback: true,
    version: 1,
    createdBy: createdBy || 'system',
  });

  return preset;
}

export { DEFAULT_COLORS };