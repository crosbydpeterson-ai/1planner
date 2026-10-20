// Shared helpers for the admin analytics dashboard.

export const CHART_COLORS = [
  "#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#14B8A6",
  "#A855F7", "#3B82F6", "#EAB308", "#10B981", "#F43F5E",
];

export const TOOLTIP_STYLE = {
  background: "#0f172a",
  border: "1px solid #334155",
  color: "#e2e8f0",
  borderRadius: "8px",
  fontSize: "12px",
};

export const AXIS_TICK = { fill: "#cbd5e1", fontSize: 12 };

export function formatNumber(n) {
  if (n == null || isNaN(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return String(n);
}

export function sumBy(arr, key) {
  return arr.reduce((acc, x) => acc + (Number(x?.[key]) || 0), 0);
}

export function getLastNDates(n) {
  const days = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function formatDayLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function countByDay(arr, key, days) {
  const map = Object.fromEntries(days.map((d) => [d, 0]));
  for (const x of arr || []) {
    const v = x?.[key];
    if (!v) continue;
    const k = String(v).slice(0, 10);
    if (map[k] != null) map[k] += 1;
  }
  return days.map((d) => map[d]);
}

// Group records into [{name, value}] by a key function.
export function groupCount(arr, keyFn, labelMap) {
  const m = {};
  for (const x of arr || []) {
    const raw = keyFn(x);
    const k = raw == null || raw === "" ? "—" : raw;
    m[k] = (m[k] || 0) + 1;
  }
  return Object.entries(m).map(([name, value]) => ({
    name: labelMap ? labelMap[name] || name : name,
    value,
  }));
}

// Bucket numeric values into labeled ranges.
export function bucketValues(values, buckets) {
  return buckets.map((b) => ({
    label: b.label,
    value: values.filter((v) => v >= b.min && (b.max == null ? true : v < b.max)).length,
  }));
}

export function avg(arr, key) {
  if (!arr.length) return 0;
  return Math.round((sumBy(arr, key) / arr.length) * 100) / 100;
}