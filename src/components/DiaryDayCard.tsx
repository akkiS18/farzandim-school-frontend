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
}

export interface DiarySubjectRow {
  subjectName: string;
  grade?: GradeItem;
}

interface DiaryDayCardProps {
  dayLabel: string;
  rows: DiarySubjectRow[];
  onApprove: (id: number) => void;
  approvingId: number | null;
}

function getNumericVal(value?: string, numericValue?: number): number | null {
  if (numericValue !== undefined) return numericValue;
  if (!value) return null;
  const v = parseFloat(value);
  return isNaN(v) ? null : v;
}

function gradeColor(val: number | null): string {
  if (val === null) return "#6B7280";
  if (val >= 4.5) return "#16A34A"; // green
  if (val >= 3.5) return "#2563EB"; // blue
  if (val >= 2.5) return "#D97706"; // amber
  return "#DC2626"; // red
}

function gradeBg(val: number | null): string {
  if (val === null) return "#F3F4F6";
  if (val >= 4.5) return "#F0FDF4";
  if (val >= 3.5) return "#EFF6FF";
  if (val >= 2.5) return "#FFFBEB";
  return "#FEF2F2";
}

function gradeBorder(val: number | null): string {
  if (val === null) return "#E5E7EB";
  if (val >= 4.5) return "#BBF7D0";
  if (val >= 3.5) return "#BFDBFE";
  if (val >= 2.5) return "#FDE68A";
  return "#FECACA";
}

export default function DiaryDayCard({
  dayLabel,
  rows,
  onApprove,
  approvingId,
}: DiaryDayCardProps) {
  // Pad rows to exactly 6 to represent a standard 6-lesson school day layout
  const paddedRows = [...rows];
  while (paddedRows.length < 6) {
    paddedRows.push({ subjectName: "" });
  }

  return (
    <div
      style={{
        backgroundColor: "#FCFBF7", // Cream paper background
        borderRadius: "12px",
        border: "1px solid #D8D3C9", // Soft vintage border
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Card Header (Day Label) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          backgroundColor: "#F4EFE6", // Slightly darker warm tone for header
          borderBottom: "1.5px solid #D8D3C9",
        }}
      >
        {/* Little decorative vintage ribbon */}
        <div
          style={{
            width: "4px",
            height: "14px",
            backgroundColor: "#EF4444", // margin red highlight
            borderRadius: "2px",
          }}
        />
        <span
          style={{
            fontSize: "12px",
            fontWeight: 800,
            color: "#4A3E3D", // Warm text
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {dayLabel}
        </span>
      </div>

      {/* Card Rows (ruled paper texture) */}
      <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Red page margin line running vertically */}
        <div
          style={{
            position: "absolute",
            left: "35px",
            top: 0,
            bottom: 0,
            width: "1.5px",
            backgroundColor: "#EF4444",
            opacity: 0.4,
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {paddedRows.map((row, idx) => {
          const gr = row.grade;
          const numVal = gr ? getNumericVal(gr.value, gr.numeric_value) : null;
          const isApproved = gr ? gr.approved_by_parent : false;

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: "36px", // Fixed height for lined diary lines
                borderBottom: idx === paddedRows.length - 1 ? "none" : "1px solid #E0E7FF", // lined paper line
                position: "relative",
                backgroundColor: "transparent",
              }}
            >
              {/* Left Column: Lesson Number & Subject Name */}
              <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, height: "100%" }}>
                {/* Lesson number on the left of red line */}
                <div
                  style={{
                    width: "35px",
                    textAlign: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#A79E92",
                    zIndex: 10,
                  }}
                >
                  {idx + 1}
                </div>

                {/* Subject name on the right of red line */}
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 650,
                    color: "#374151",
                    paddingLeft: "10px",
                    zIndex: 10,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {row.subjectName}
                </span>
              </div>

              {/* Right Column: Grade Cell & Approval Button */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  paddingRight: "10px",
                  zIndex: 10,
                  flexShrink: 0,
                }}
              >
                {gr && (
                  <>
                    {!isApproved ? (
                      <button
                        onClick={() => onApprove(gr.id)}
                        disabled={approvingId === gr.id}
                        style={{
                          fontSize: "8.5px",
                          fontWeight: 700,
                          color: "#4F46E5",
                          backgroundColor: "#EEF2FF",
                          border: "1px solid #C7D2FE",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          cursor: "pointer",
                          fontFamily: "'Roboto', sans-serif",
                          boxShadow: "0 1px 2px rgba(79,70,229,0.05)",
                        }}
                      >
                        {approvingId === gr.id ? "..." : "Ko'rdim"}
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: "8.5px",
                          fontWeight: 600,
                          color: "#9CA3AF",
                          fontFamily: "sans-serif",
                        }}
                      >
                        Ko'rildi
                      </span>
                    )}
                  </>
                )}

                {/* Square Grade Box (always visible, empty if no grade) */}
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "12px",
                    color: gr ? gradeColor(numVal) : "transparent",
                    backgroundColor: gr ? gradeBg(numVal) : "transparent",
                    border: gr ? `1.5px solid ${gradeBorder(numVal)}` : "1px dashed #D1C7BD",
                    fontFamily: "monospace",
                    boxShadow: gr ? "inset 0 1px 1px rgba(0,0,0,0.02)" : "none",
                  }}
                >
                  {gr ? gr.value : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
