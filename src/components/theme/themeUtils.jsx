/**
 * Utility to extract a usable hex color from a value that could be
 * a plain hex color OR a CSS gradient string.
 * Used wherever we need a single color (e.g. SVG fills, opacity overlays).
 */
export function extractHex(value) {
  if (!value) return '#6366f1';
  // If it's already a plain hex color
  if (/^#[0-9a-fA-F]{3,8}$/.test(value.trim())) return value.trim();
  // Extract the first hex from a gradient string
  const match = value.match(/#[0-9a-fA-F]{3,8}/);
  return match ? match[0] : '#6366f1';
}

/**
 * Check if a color value is a gradient string.
 */
export function isGradient(value) {
  if (!value) return false;
  return /gradient/i.test(value);
}

/**
 * Apply a color value as a CSS style object.
 * Returns { backgroundColor } for hex or { background } for gradients.
 */
export function colorStyle(value, property = 'background') {
  if (!value) return {};
  if (isGradient(value)) {
    return { [property]: value };
  }
  return { [property === 'background' ? 'backgroundColor' : property]: value };
}