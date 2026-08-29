/**
 * Date utilities for handling local dates without UTC timezone shift bugs.
 */

export function formatLocalDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateString(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  if (dateStr.includes("T")) {
    return dateStr.split("T")[0];
  }
  if (dateStr.includes(" ")) {
    return dateStr.split(" ")[0];
  }
  return dateStr;
}

export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const clean = parseDateString(dateStr);
  const parts = clean.split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(dateStr);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}
