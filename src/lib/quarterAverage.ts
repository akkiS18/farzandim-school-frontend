/**
 * Quarter Average Calculation Algorithm for Farzandim Kundalik
 * 
 * Rules:
 * 1. Grades on a 5-point scale (or value <= 5) are multiplied by 20 to normalize to a 100-point scale.
 * 2. Grades already on a 100-point scale (value > 5) remain as is.
 * 3. Attendance (+, -, k, nb) and Behavior (-1, -2) marks are excluded.
 * 4. Only grades within the active quarter period (start_date to end_date) are counted.
 * 5. Returns both 100-point scale and 5-point scale averages.
 */

export interface QuarterPeriod {
  start_date: string;
  end_date: string;
  name?: string;
}

export interface StudentQuarterStats {
  studentId: number;
  totalGradesCount: number;
  average100: number; // e.g. 88.5
  rounded100: number; // e.g. 89
  average5: number;   // e.g. 4.4
  rounded5: number;   // e.g. 4 or 5
  hasGrades: boolean;
  gradesList: Array<{
    date: string;
    raw: string | number;
    normalized: number;
    gradeType: string;
  }>;
}

/**
 * Normalizes a grade value to a 100-point scale.
 * - Value <= 5: multiplied by 20 (e.g. 5 -> 100, 4 -> 80, 3 -> 60, 2 -> 40, 1 -> 20).
 * - Value > 5: kept as is (clamped between 0 and 100).
 * - Non-numeric or attendance values return null.
 */
export function normalizeGradeTo100(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  if (str === "" || str === "+" || str === "-" || str === "k" || str === "nb" || str === "—") {
    return null;
  }
  const num = parseFloat(str.replace(",", "."));
  if (isNaN(num)) return null;

  // 5-point scale: multiply by 20
  if (num <= 5) {
    return Math.max(0, Math.min(100, num * 20));
  }

  // Already 100-point scale
  return Math.max(0, Math.min(100, num));
}

/**
 * Converts a 100-point scale average to a 5-point scale grade:
 * 86 - 100 => 5 (A'lo)
 * 71 - 85  => 4 (Yaxshi)
 * 56 - 70  => 3 (Qoniqarli)
 * 0 - 55   => 2 (Qoniqarsiz)
 */
export function convert100To5Grade(avg100: number): number {
  if (avg100 >= 86) return 5;
  if (avg100 >= 71) return 4;
  if (avg100 >= 56) return 3;
  return 2;
}

/**
 * Calculates quarterly statistics and averages for all students in a class for the selected subject.
 */
export function calculateStudentsQuarterStats(
  students: Array<{ id: number }>,
  subjectId: number | string | null,
  allGrades: any[],
  quarterPeriod: { start_date?: string; end_date?: string } | null,
  journalDate?: string
): Map<number, StudentQuarterStats> {
  const result = new Map<number, StudentQuarterStats>();
  if (!subjectId || !students || students.length === 0) {
    return result;
  }

  const subIdNum = Number(subjectId);

  // Determine period boundaries
  let startDate = quarterPeriod?.start_date || "";
  let endDate = quarterPeriod?.end_date || "";

  // If no explicit quarter period was passed, use fallback: 90 days before journalDate
  if (!startDate && journalDate) {
    try {
      const jDate = new Date(journalDate);
      const startObj = new Date(jDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      startDate = startObj.toISOString().split("T")[0];
      endDate = journalDate;
    } catch {
      // keep empty
    }
  }

  students.forEach((st) => {
    const studentGrades = (allGrades || []).filter((g) => {
      if (g.student_id !== st.id || g.subject_id !== subIdNum) return false;

      // Exclude attendance and behavior marks
      if (g.grade_type === "ATTENDANCE" || g.grade_type === "BEHAVIOR") return false;

      // Exclude existing quarterly or semester exam records so they don't skew the daily average
      if (g.grade_category === "QUARTERLY_EXAM" || g.grade_category === "SEMESTER_EXAM") return false;

      const gDate = g.grade_date
        ? typeof g.grade_date === "string"
          ? g.grade_date.split("T")[0]
          : new Date(g.grade_date).toISOString().split("T")[0]
        : "";

      if (startDate && gDate && gDate < startDate) return false;
      if (endDate && gDate && gDate > endDate) return false;

      return true;
    });

    let sum = 0;
    let count = 0;
    const gradesList: StudentQuarterStats["gradesList"] = [];

    studentGrades.forEach((g) => {
      const normalized = normalizeGradeTo100(g.value);
      if (normalized !== null) {
        sum += normalized;
        count++;
        const gDate = g.grade_date
          ? typeof g.grade_date === "string"
            ? g.grade_date.split("T")[0]
            : new Date(g.grade_date).toISOString().split("T")[0]
          : "";
        gradesList.push({
          date: gDate,
          raw: g.value,
          normalized,
          gradeType: g.grade_type || "DAILY",
        });
      }
    });

    if (count > 0) {
      const avg100 = sum / count;
      const rounded100 = Math.round(avg100);
      const average5 = Math.round((avg100 / 20) * 10) / 10;
      const rounded5 = convert100To5Grade(rounded100);

      result.set(st.id, {
        studentId: st.id,
        totalGradesCount: count,
        average100: Math.round(avg100 * 10) / 10,
        rounded100,
        average5,
        rounded5,
        hasGrades: true,
        gradesList,
      });
    } else {
      result.set(st.id, {
        studentId: st.id,
        totalGradesCount: 0,
        average100: 0,
        rounded100: 0,
        average5: 0,
        rounded5: 0,
        hasGrades: false,
        gradesList: [],
      });
    }
  });

  return result;
}

