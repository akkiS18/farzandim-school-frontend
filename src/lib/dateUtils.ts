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

/**
 * Converts an Excel cell value (serial number, Date object, DD.MM.YYYY, YYYY-MM-DD, etc.)
 * into a normalized YYYY-MM-DD string, avoiding 4-digit years and phone numbers.
 */
export function formatExcelDateCell(val: unknown, isDate1904 = false): string {
  if (val === null || val === undefined) return "";
  if (val instanceof Date && !isNaN(val.getTime())) {
    return formatLocalDate(val);
  }

  const str = String(val).trim();
  if (str === "" || str === "-") return str;

  if (typeof val === "number" || /^\d{5}(\.\d+)?$/.test(str)) {
    const num = typeof val === "number" ? val : Number(str);
    if (Number.isFinite(num) && num >= 10000 && num <= 100000) {
      const baseUtc = isDate1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
      const days = Math.floor(num + 1e-7);
      const d = new Date(baseUtc + days * 86400000);
      if (!isNaN(d.getTime())) {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
    }
  }

  const dmyMatch = str.match(/^(\d{1,2})[./,-](\d{1,2})[./,-](\d{4})$/);
  if (dmyMatch) {
    const p1 = Number(dmyMatch[1]);
    const p2 = Number(dmyMatch[2]);
    const year = dmyMatch[3];
    let month: number;
    let day: number;
    if (p2 > 12 && p1 <= 12) {
      month = p1;
      day = p2;
    } else {
      day = p1;
      month = p2;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const ymdMatch = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:[T\s].*)?$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return str.endsWith(".0") ? str.slice(0, -2) : str;
}
