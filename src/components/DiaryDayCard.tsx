import React from "react";

export interface GradeItem {
  id: number;
  student_id: number;
  student_name?: string;
  subject_name: string;
  teacher_name: string;
  value: string;
  numeric_value?: number;
  grade_date: string;
  status: string;
  approved_by_parent: boolean;
  grade_type?: string;
}

export interface DiarySubjectRow {
  subjectName: string;
  grade?: GradeItem;
  grades?: GradeItem[];
  masteryGrade?: GradeItem;
  behaviorGrade?: GradeItem;
  attendanceGrade?: GradeItem;
}

interface DiaryDayCardProps {
  dayLabel: string;
  rows: DiarySubjectRow[];
  onApprove: (id: number) => void;
  approvingId: number | null;
  onGradeDoubleClick?: (grade: GradeItem) => void;
}

function getNumericVal(value?: string, numericValue?: number): number | null {
  if (numericValue !== undefined && numericValue !== null) return numericValue;
  if (!value) return null;
  const v = parseFloat(value);
  return isNaN(v) ? null : v;
}

function getMasteryStyle(val: number | null) {
  if (val === null) return { bg: "#F1F5F9", text: "#64748B", border: "#E2E8F0" };
  if (val >= 4.5) return { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC" };
  if (val >= 3.5) return { bg: "#DBEAFE", text: "#1D4ED8", border: "#93C5FD" };
  if (val >= 2.5) return { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" };
  return { bg: "#FEE2E2", text: "#B91C1C", border: "#FCA5A5" };
}

function getAttendanceStyle(val: string) {
  if (val === "+" || val.toLowerCase() === "bor") {
    return { bg: "#CCFBF1", text: "#0F766E", border: "#99F6E4", label: "Bor" };
  }
  if (val === "k" || val.toLowerCase() === "kechikdi") {
    return { bg: "#FEF9C3", text: "#A16207", border: "#FDE047", label: "Kechikdi" };
  }
  if (val === "-" || val.toLowerCase() === "kelmadi") {
    return { bg: "#FEE2E2", text: "#DC2626", border: "#FCA5A5", label: "Kelmadi" };
  }
  return { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0", label: val };
}

export default function DiaryDayCard({
  dayLabel,
  rows,
  onApprove,
  approvingId,
  onGradeDoubleClick,
}: DiaryDayCardProps) {
  // Pad rows to 6 for standard daily schedule layout
  const paddedRows = [...rows];
  while (paddedRows.length < 6) {
    paddedRows.push({ subjectName: "" });
  }

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          backgroundColor: "#F8FAFC",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#00A389",
            }}
          />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 800,
              color: "#1E293B",
              letterSpacing: "0.4px",
              textTransform: "uppercase",
            }}
          >
            {dayLabel}
          </span>
        </div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "#94A3B8",
            backgroundColor: "#EDF2F7",
            padding: "3px 10px",
            borderRadius: "999px",
          }}
        >
          {rows.filter((r) => r.subjectName).length} dars
        </span>
      </div>

      {/* Card Rows */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {paddedRows.map((row, idx) => {
          // Resolve grades for this row
          let masteryGr: GradeItem | undefined = row.masteryGrade;
          let behaviorGr: GradeItem | undefined = row.behaviorGrade;
          let attendanceGr: GradeItem | undefined = row.attendanceGrade;

          if (row.grades && row.grades.length > 0) {
            for (const g of row.grades) {
              if (g.grade_type === "ATTENDANCE" && !attendanceGr) attendanceGr = g;
              else if (g.grade_type === "BEHAVIOR" && !behaviorGr) behaviorGr = g;
              else if (!masteryGr) masteryGr = g;
            }
          } else if (row.grade) {
            if (row.grade.grade_type === "ATTENDANCE") attendanceGr = row.grade;
            else if (row.grade.grade_type === "BEHAVIOR") behaviorGr = row.grade;
            else masteryGr = row.grade;
          }

          // Check approval state across present grades
          const presentGrades = [masteryGr, behaviorGr, attendanceGr].filter(Boolean) as GradeItem[];
          const pendingGrade = presentGrades.find((g) => !g.approved_by_parent);
          const isFullyApproved = presentGrades.length > 0 && presentGrades.every((g) => g.approved_by_parent);

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom: idx === paddedRows.length - 1 ? "none" : "1px solid #F1F5F9",
                backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFBFD",
                minHeight: "48px",
              }}
            >
              {/* Left Column: Lesson Number & Subject Name */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: row.subjectName ? "#EEF2FF" : "#F1F5F9",
                    color: row.subjectName ? "#4F46E5" : "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </span>

                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: row.subjectName ? 650 : 400,
                    color: row.subjectName ? "#1E293B" : "#CBD5E1",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {row.subjectName || "—"}
                </span>
              </div>

              {/* Right Column: 3 Grade Badges & Approval Action */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                {/* 1. Mastery Grade Badge */}
                {masteryGr ? (
                  (() => {
                    const numVal = getNumericVal(masteryGr.value, masteryGr.numeric_value);
                    const style = getMasteryStyle(numVal);
                    return (
                      <div
                        onDoubleClick={() => onGradeDoubleClick && onGradeDoubleClick(masteryGr!)}
                        style={{
                          minWidth: "28px",
                          height: "28px",
                          padding: "0 8px",
                          borderRadius: "8px",
                          backgroundColor: style.bg,
                          color: style.text,
                          border: `1px solid ${style.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        }}
                        title={`O'zlashtirish: ${masteryGr.value} (Izoh yozish uchun 2 marta bosing)`}
                      >
                        {masteryGr.value}
                      </div>
                    );
                  })()
                ) : null}

                {/* 2. Behavior Grade Badge */}
                {behaviorGr ? (
                  <div
                    onDoubleClick={() => onGradeDoubleClick && onGradeDoubleClick(behaviorGr!)}
                    style={{
                      minWidth: "28px",
                      height: "28px",
                      padding: "0 8px",
                      borderRadius: "8px",
                      backgroundColor: "#F3E8FF",
                      color: "#6B21A8",
                      border: "1px solid #D8B4FE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}
                    title={`Xulqi: ${behaviorGr.value} (Izoh yozish uchun 2 marta bosing)`}
                  >
                    ★ {behaviorGr.value}
                  </div>
                ) : null}

                {/* 3. Attendance Badge */}
                {attendanceGr ? (
                  (() => {
                    const style = getAttendanceStyle(attendanceGr.value);
                    return (
                      <div
                        onDoubleClick={() => onGradeDoubleClick && onGradeDoubleClick(attendanceGr!)}
                        style={{
                          height: "28px",
                          padding: "0 8px",
                          borderRadius: "8px",
                          backgroundColor: style.bg,
                          color: style.text,
                          border: `1px solid ${style.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 750,
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        }}
                        title={`Davomat: ${style.label} (Izoh yozish uchun 2 marta bosing)`}
                      >
                        {attendanceGr.value}
                      </div>
                    );
                  })()
                ) : null}

                {/* Parent Approval Button / Status */}
                {pendingGrade ? (
                  <button
                    onClick={() => onApprove(pendingGrade.id)}
                    disabled={approvingId === pendingGrade.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFFFFF",
                      backgroundColor: "#00A389",
                      border: "none",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      height: "28px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      gap: "4px",
                      boxShadow: "0 2px 6px rgba(0,163,137,0.25)",
                      transition: "all 0.15s ease",
                    }}
                    title="Baholarni tasdiqlash (Ko'rdim)"
                  >
                    {approvingId === pendingGrade.id ? (
                      <span
                        style={{
                          width: "12px",
                          height: "12px",
                          border: "2px solid white",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                          stroke="currentColor"
                          style={{ width: "13px", height: "13px" }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Ko'rdim</span>
                      </>
                    )}
                  </button>
                ) : isFullyApproved ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      backgroundColor: "#ECFDF5",
                    }}
                    title="Tasdiqlangan (Ota-ona ko'rgan)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="#10B981"
                      style={{ width: "15px", height: "15px" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l4 4L16 6" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l4 4L21 6" />
                    </svg>
                  </div>
                ) : null}

                {/* Empty dash indicator if no grades at all for this row */}
                {presentGrades.length === 0 && row.subjectName && (
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      border: "1px dashed #CBD5E1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      color: "#94A3B8",
                    }}
                  >
                    -
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
