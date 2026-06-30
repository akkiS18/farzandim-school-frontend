import React from "react";

interface GradeItem {
  id: number;
  student_id: number;
  subject_name: string;
  teacher_name: string;
  value: string;
  numeric_value?: number;
  grade_date: string;
  status: string;
  approved_by_parent: boolean;
}

interface DiaryDayCardProps {
  dayLabel: string;
  grades: GradeItem[];
  onApprove: (id: number) => void;
  approvingId: number | null;
}

function getMockHomework(subjectName: string, id: number): string {
  const tasks: Record<string, string[]> = {
    Matematika: [
      "5.2-mavzu bo'yicha 12-15-misollarni yechish",
      "Kvadrat tenglamalar mavzusini takrorlash",
      "Darslikdan 114-118-betlardagi masalalarni bajarish",
      "O'tilgan mavzuni takrorlash va nazorat ishiga tayyorgarlik"
    ],
    Fizika: [
      "Nyuton qonunlariga doir 3 ta masala yechish",
      "Laboratoriya ishi hisobotini yozib kelish",
      "Mavzu: Mexanik harakat. Konspekt tayyorlash",
      "Elektromagnit maydonlar bo'yicha testlarni yechish"
    ],
    Kimyo: [
      "Mendelyev davriy jadvalining birinchi 20 ta elementini yodlash",
      "Kimyoviy reaksiyalarni tenglashtirish (darslikdan 4-mashq)",
      "Mavzu bo'yicha konspekt yozish va tayyorlanish"
    ],
    Biologiya: [
      "O'simliklar hujayrasi tuzilishini rasmda chizib kelish",
      "Darslikning 82-85-betlarini o'qib, savollarga javob yozish",
      "Mavzu yuzasidan taqdimot tayyorlash"
    ],
    Tarix: [
      "Amir Temur davlati tuzilishi haqida ma'lumot to'plash",
      "12-bobni to'liq o'qish va konspekt qilish",
      "Tarixiy sanalarni takrorlash va eslab qolish"
    ],
    Adabiyot: [
      "Alisher Navoiy g'azallaridan birini yodlash",
      "O'tilgan asar bo'yicha qisqacha insho yozish",
      "Darslikdagi 34-betdagi savollarga yozma javob tayyorlash"
    ],
    Ingliz: [
      "Present Perfect Tense mavzusiga 10 ta gap yozish",
      "Yangi 15 ta so'zni lug'at daftariga yozib yodlash",
      "Darslikdan Unit 5 matnini o'qib, tarjima qilish"
    ],
    "Ona tili": [
      "124-mashqni daftarga yozib bajarish",
      "Ega va kesim kelishuvi mavzusini o'qish",
      "Murakkab gaplar bo'yicha 5 ta misol yozish"
    ]
  };

  // Find match
  const key = Object.keys(tasks).find(k => subjectName.toLowerCase().includes(k.toLowerCase())) || "";
  const list = tasks[key] || [
    "Mavzu bo'yicha topshiriqlarni bajarish",
    "Darslikdagi o'tilgan bobni o'qib kelish",
    "Konspekt yozish va mavzuni takrorlash"
  ];
  return list[id % list.length];
}

function getNumericVal(g: GradeItem): number | null {
  const v = g.numeric_value !== undefined ? g.numeric_value : parseFloat(g.value);
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
  grades,
  onApprove,
  approvingId,
}: DiaryDayCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.03)",
        overflow: "hidden",
        marginBottom: "16px",
      }}
    >
      {/* Card Header (Day Label) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          backgroundColor: "#F9FAFB",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        {/* Red page margin indicator */}
        <div
          style={{
            width: "3px",
            height: "16px",
            backgroundColor: "#EF4444",
            borderRadius: "999px",
          }}
        />
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#374151",
          }}
        >
          {dayLabel}
        </span>
      </div>

      {/* Card Rows */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {grades.map((gr, idx) => {
          const numVal = getNumericVal(gr);
          const isApproved = gr.status === "approved" || gr.approved_by_parent;
          const homework = getMockHomework(gr.subject_name, gr.id);

          return (
            <div
              key={gr.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: idx === grades.length - 1 ? "none" : "1px solid #F3F4F6", // lined diary paper simulation
                gap: "12px",
              }}
            >
              {/* Left Column: Subject & Homework */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 650,
                    color: "#374151",
                    display: "block",
                  }}
                >
                  {gr.subject_name}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#9CA3AF",
                    display: "block",
                    marginTop: "3px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  ✏️ Uy vazifasi: {homework}
                </span>
              </div>

              {/* Right Column: Parent Approval Button & Grade Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                }}
              >
                {!isApproved ? (
                  <button
                    onClick={() => onApprove(gr.id)}
                    disabled={approvingId === gr.id}
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "#4F46E5",
                      backgroundColor: "#EEF2FF",
                      border: "1px solid #C7D2FE",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontFamily: "'Roboto', sans-serif",
                    }}
                  >
                    {approvingId === gr.id ? "..." : "Ko'rdim"}
                  </button>
                ) : (
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      color: "#9CA3AF",
                      fontFamily: "monospace",
                    }}
                  >
                    Ko'rildi
                  </span>
                )}

                {/* Grade Badge */}
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "13px",
                    color: gradeColor(numVal),
                    backgroundColor: gradeBg(numVal),
                    border: `1.5px solid ${gradeBorder(numVal)}`,
                    fontFamily: "monospace",
                  }}
                >
                  {gr.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
