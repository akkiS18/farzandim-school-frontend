"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// Import modular components
import BottomNavigation from "../../components/BottomNavigation";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  school_id: string;
  phone?: string;
  email?: string;
}

interface StudentChild {
  id: number;
  first_name: string;
  last_name: string;
  class_id: number;
  class_name: string;
}

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

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  author: string;
}

/* ─────────────────────────────────────────
   Constants & helpers
───────────────────────────────────────── */
const ACCENT = "#4F46E5"; // Indigo-600
const ACCENT_LIGHT = "#EEF2FF"; // Indigo-50
const ACCENT_MID = "#C7D2FE"; // Indigo-200
const TEXT_DARK = "#374151"; // Gray-700
const TEXT_MUTED = "#9CA3AF"; // Gray-400
const BG_LIGHT = "#F3F4F6"; // Gray-100

const UZ_DAYS: Record<number, string> = {
  0: "Yakshanba",
  1: "Dushanba",
  2: "Seshanba",
  3: "Chorshanba",
  4: "Payshanba",
  5: "Juma",
  6: "Shanba",
};

const UZ_MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]}`;
}

function fmtDayName(dateStr: string) {
  const d = new Date(dateStr);
  return UZ_DAYS[d.getDay()];
}

function getNumericVal(g: GradeItem): number | null {
  const v = g.numeric_value !== undefined ? g.numeric_value : parseFloat(g.value);
  return isNaN(v) ? null : v;
}

/** Returns the ISO date string of the Monday of a given date */
function weekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon.toISOString().split("T")[0];
}

function weekLabel(key: string): string {
  const mon = new Date(key);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return `${mon.getDate()} ${UZ_MONTHS[mon.getMonth()]} — ${sun.getDate()} ${UZ_MONTHS[sun.getMonth()]}`;
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

/* ─────────────────────────────────────────
   Custom Tooltip for Recharts
───────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "white",
          border: `1px solid ${ACCENT_MID}`,
          borderRadius: 10,
          padding: "8px 14px",
          fontFamily: "'Roboto', sans-serif",
          fontSize: 12,
          color: TEXT_DARK,
          boxShadow: "0 4px 16px rgba(79,70,229,0.10)",
        }}
      >
        <p style={{ color: TEXT_MUTED, marginBottom: 2, fontSize: 10 }}>{label}</p>
        <p style={{ fontWeight: 700, color: ACCENT }}>Baho: {payload[0].value}</p>
      </div>
    );
  }
  return null;
}

/* ─────────────────────────────────────────
   Diary Row - Lined notebook style
───────────────────────────────────────── */
interface DiaryRowProps {
  grade: GradeItem;
  onApprove: (id: number) => void;
  approving: boolean;
}

function DiaryRow({ grade, onApprove, approving }: DiaryRowProps) {
  const num = getNumericVal(grade);
  const color = gradeColor(num);
  const bg = gradeBg(num);
  const border = gradeBorder(num);
  const isApproved = grade.status === "approved" || grade.approved_by_parent;
  const dayName = fmtDayName(grade.grade_date);
  const dateStr = fmtDate(grade.grade_date);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 16px",
        borderBottom: "1px dashed #E5E7EB",
        background: "transparent",
        position: "relative",
      }}
    >
      {/* Left date gutter – like a diary margin */}
      <div
        style={{
          width: "64px",
          minWidth: "64px",
          textAlign: "center",
          paddingRight: "8px",
          borderRight: `2px solid ${ACCENT_LIGHT}`,
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: ACCENT, lineHeight: 1.2 }}>
          {dateStr}
        </div>
        <div style={{ fontSize: "9px", color: TEXT_MUTED, marginTop: "2px" }}>
          {dayName}
        </div>
      </div>

      {/* Subject info */}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: "12px", zIndex: 10 }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: TEXT_DARK, lineHeight: 1.3 }}>
          {grade.subject_name}
        </div>
        <div style={{ fontSize: "10px", color: TEXT_MUTED, marginTop: "2px" }}>
          {grade.teacher_name}
        </div>
      </div>

      {/* Approval badge */}
      <div style={{ flexShrink: 0, zIndex: 10 }}>
        {isApproved ? (
          <span
            style={{
              fontSize: "9px",
              fontWeight: 700,
              color: "#9CA3AF",
              background: "#F3F4F6",
              borderRadius: "999px",
              padding: "2px 8px",
            }}
          >
            Ko'rildi
          </span>
        ) : (
          <button
            onClick={() => onApprove(grade.id)}
            disabled={approving}
            style={{
              fontSize: "9px",
              fontWeight: 700,
              color: ACCENT,
              background: ACCENT_LIGHT,
              border: `1px solid ${ACCENT_MID}`,
              borderRadius: "8px",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            {approving ? "..." : "Ko'rdim"}
          </button>
        )}
      </div>

      {/* Grade badge */}
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "14px",
          color: color,
          background: bg,
          border: `1.5px solid ${border}`,
          fontFamily: "monospace",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {grade.value}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function ParentDashboard() {
  const router = useRouter();

  // Bottom navigation state: "home" | "settings"
  const [activeTab, setActiveTab] = useState<"home" | "settings">("home");

  // Home view sub-tabs: "diary" | "dynamics" | "announcements"
  const [activeSubTab, setActiveSubTab] = useState<"diary" | "dynamics" | "announcements">("diary");

  // Auth
  const [token, setToken] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Children
  const [children, setChildren] = useState<StudentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | "">("");

  // Grades
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState<number | null>(null);
  const [approveAllLoading, setApproveAllLoading] = useState<string | null>(null);

  // Announcements (static demo data)
  const [announcements] = useState<Announcement[]>([
    {
      id: 1,
      title: "Chorak yakuni va ota-onalar majlisi",
      content:
        "Joriy chorak yakunlanishi munosabati bilan barcha ota-onalar uchun juma kuni soat 17:00 da umumiy majlis bo'lib o'tadi. Farzandingiz kundaligini tekshirib kelishingiz so'raladi.",
      date: new Date().toLocaleDateString("uz-UZ"),
      author: "Maktab Ma'muriyati",
    },
    {
      id: 2,
      title: "Matematika fanidan qo'shimcha to'garak",
      content:
        "Shanba kunlari soat 10:00 da o'quvchilar uchun matematika fanidan bepul olimpiadaga tayyorgarlik darslari boshlanmoqda.",
      date: new Date(Date.now() - 86400000).toLocaleDateString("uz-UZ"),
      author: "Matematika o'qituvchisi",
    },
    {
      id: 3,
      title: "Maktab uniformasi haqida eslatma",
      content:
        "Barcha o'quvchilar dushanbadan boshlab maktab formasida kelishi shart. Batafsil ma'lumot uchun sinf rahbariga murojaat qiling.",
      date: new Date(Date.now() - 2 * 86400000).toLocaleDateString("uz-UZ"),
      author: "Direktor o'rinbosari",
    },
  ]);

  /* ── Auth & initial load ── */
  useEffect(() => {
    const savedToken = localStorage.getItem("school_token");
    const savedSchoolId = localStorage.getItem("school_id");
    const savedUserStr = localStorage.getItem("school_user");

    if (!savedToken || !savedSchoolId || !savedUserStr) {
      router.push("/login");
      return;
    }

    setToken(savedToken);
    setSchoolId(savedSchoolId);
    try {
      const parsedUser = JSON.parse(savedUserStr);
      if (parsedUser.role !== "PARENT" && parsedUser.role !== "ADMIN") {
        router.push("/login");
        return;
      }
      setUserInfo(parsedUser);
      fetchLinkedChildren(savedToken, parsedUser.id, savedSchoolId);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const fetchLinkedChildren = async (
    authToken: string,
    _parentId: number,
    currentSchoolId: string
  ) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/users?role=STUDENT`, {
        headers: { Authorization: `Bearer ${authToken}`, "X-School-ID": currentSchoolId },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        const childrenList: StudentChild[] = data.map((u: any) => ({
          id: u.student_id || u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          class_id: u.class_id || 0,
          class_name: u.class_name || "Noma'lum sinf",
        }));
        setChildren(childrenList);
        if (childrenList.length > 0) setSelectedChildId(childrenList[0].id);
      }
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  /* ── Fetch grades when child changes ── */
  useEffect(() => {
    if (selectedChildId && token) {
      fetchChildGrades();
    } else {
      setGrades([]);
    }
  }, [selectedChildId, token]);

  const fetchChildGrades = async () => {
    setGradesLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/grades?student_id=${selectedChildId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setGrades(Array.isArray(data) ? data : []);
    } catch {
      /* noop */
    } finally {
      setGradesLoading(false);
    }
  };

  /* ── Approval handlers ── */
  const handleParentApprove = async (gradeId: number) => {
    setApproveLoading(gradeId);
    try {
      const response = await fetch(`${API_URL}/api/schools/grades/${gradeId}/parent-approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setGrades((prev) =>
          prev.map((g) => (g.id === gradeId ? { ...g, approved_by_parent: true } : g))
        );
      }
    } catch {
      /* noop */
    } finally {
      setApproveLoading(null);
    }
  };

  const handleApproveAll = async (weekKey: string, weekGrades: GradeItem[]) => {
    const pending = weekGrades.filter(
      (g) => !g.approved_by_parent && g.status !== "approved"
    );
    if (pending.length === 0) return;
    setApproveAllLoading(weekKey);
    try {
      await Promise.all(
        pending.map((g) =>
          fetch(`${API_URL}/api/schools/grades/${g.id}/parent-approve`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      const approvedIds = new Set(pending.map((g) => g.id));
      setGrades((prev) =>
        prev.map((g) => (approvedIds.has(g.id) ? { ...g, approved_by_parent: true } : g))
      );
    } catch {
      /* noop */
    } finally {
      setApproveAllLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("school_token");
    localStorage.removeItem("school_id");
    localStorage.removeItem("school_user");
    router.push("/login");
  };

  /* ── Derived data ── */
  const selectedChild = children.find((c) => c.id === selectedChildId);

  // Group selected child's grades by week
  const gradesByWeek: { weekKey: string; label: string; items: GradeItem[] }[] = (() => {
    const map = new Map<string, GradeItem[]>();
    for (const g of grades) {
      const k = weekStart(g.grade_date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(g);
    }
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([k, items]) => ({
        weekKey: k,
        label: weekLabel(k),
        items: [...items].sort(
          (a, b) => new Date(a.grade_date).getTime() - new Date(b.grade_date).getTime()
        ),
      }));
  })();

  // By subject (for dynamics chart)
  const gradesBySubject = grades.reduce<{ [s: string]: GradeItem[] }>((acc, g) => {
    if (!acc[g.subject_name]) acc[g.subject_name] = [];
    acc[g.subject_name].push(g);
    return acc;
  }, {});

  // Chart data per subject
  const chartDataPerSubject = Object.entries(gradesBySubject)
    .map(([subject, items]) => {
      const sorted = [...items].sort(
        (a, b) => new Date(a.grade_date).getTime() - new Date(b.grade_date).getTime()
      );
      const points = sorted
        .map((g) => {
          const val = getNumericVal(g);
          return val !== null
            ? { date: fmtDate(g.grade_date), value: val }
            : null;
        })
        .filter(Boolean) as { date: string; value: number }[];

      if (points.length < 2) return null;
      const avg = points.reduce((s, p) => s + p.value, 0) / points.length;
      return { subject, points, avg };
    })
    .filter(Boolean) as { subject: string; points: { date: string; value: number }[]; avg: number }[];

  const pendingTotal = grades.filter(
    (g) => !g.approved_by_parent && g.status !== "approved"
  ).length;

  /* ──────────────────────────────────────
     Loading screen
  ─────────────────────────────────────── */
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG_LIGHT,
          fontFamily: "'Roboto', sans-serif",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `3px solid ${ACCENT_MID}`,
            borderTopColor: ACCENT,
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ──────────────────────────────────────
     Main render (Mobile-First Frame)
  ─────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F3F4F6",
        fontFamily: "'Roboto', sans-serif",
        color: TEXT_DARK,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {/* CSS Rules */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* Scrollbar styles */
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: #F1F1F1;
        }
        ::-webkit-scrollbar-thumb {
          background: #C7D2FE;
          border-radius: 999px;
        }

        .child-pill {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid #E5E7EB;
          background: white;
          font-family: 'Roboto', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: ${TEXT_DARK};
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .child-pill.selected {
          background: ${ACCENT};
          border-color: ${ACCENT};
          color: white;
          box-shadow: 0 2px 8px rgba(79,70,229,0.2);
        }

        .section-title {
          font-size: 11px;
          font-weight: 750;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 12px;
        }

        /* Lined diary paper texture */
        .diary-paper {
          background: #FFFEF7;
          background-image:
            repeating-linear-gradient(
              transparent,
              transparent 31px,
              #E0E7FF 31px,
              #E0E7FF 32px
            );
          border-left: 4px solid #C7D2FE;
          position: relative;
        }

        .diary-paper::before {
          content: '';
          position: absolute;
          left: 80px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: #FCA5A5;
          opacity: 0.4;
          pointer-events: none;
        }

        /* Sub-tab navigation */
        .sub-tab-btn {
          flex: 1;
          padding: 10px 0;
          border: none;
          background: transparent;
          font-family: 'Roboto', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: ${TEXT_MUTED};
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s;
          text-align: center;
        }
        .sub-tab-btn.active {
          color: ${ACCENT};
          border-bottom: 2px solid ${ACCENT};
          font-weight: 755;
        }
      `}</style>

      {/* Mobile viewport wrapper (max-width: 480px) */}
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#FFFFFF",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          paddingBottom: "80px", // space for bottom navigation bar
          boxShadow: "0 0 20px rgba(0,0,0,0.03)",
          borderLeft: "1px solid #E5E7EB",
          borderRight: "1px solid #E5E7EB",
        }}
      >
        {/* ── TOP COMPACT HEADER ── */}
        <header
          style={{
            height: "56px",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "sticky",
            top: 0,
            backgroundColor: "#FFFFFF",
            zIndex: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: `linear-gradient(135deg, ${ACCENT} 0%, #7C3AED 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 900,
                fontSize: "11px",
              }}
            >
              OJ
            </div>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: TEXT_DARK,
                letterSpacing: "-0.3px",
              }}
            >
              Online Jurnal
            </span>
          </div>
        </header>

        {/* ── MAIN TAB: HOME ── */}
        {activeTab === "home" && (
          <div style={{ padding: "16px" }}>
            {/* Child pills selector */}
            {children.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  overflowX: "auto",
                  paddingBottom: "12px",
                  marginBottom: "12px",
                  borderBottom: "1px solid #F3F4F6",
                }}
              >
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`child-pill${selectedChildId === child.id ? " selected" : ""}`}
                  >
                    👦 {child.first_name} ({child.class_name})
                  </button>
                ))}
              </div>
            )}

            {/* Sub-tab Navigation (Kundalik, Dinamika, E'lonlar) */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #E5E7EB",
                marginBottom: "20px",
              }}
            >
              <button
                className={`sub-tab-btn${activeSubTab === "diary" ? " active" : ""}`}
                onClick={() => setActiveSubTab("diary")}
              >
                📓 Kundalik
              </button>
              <button
                className={`sub-tab-btn${activeSubTab === "dynamics" ? " active" : ""}`}
                onClick={() => setActiveSubTab("dynamics")}
              >
                📈 Dinamika
              </button>
              <button
                className={`sub-tab-btn${activeSubTab === "announcements" ? " active" : ""}`}
                onClick={() => setActiveSubTab("announcements")}
              >
                📢 E&apos;lonlar
              </button>
            </div>

            {/* Sub-tab: DIARY (Kundalik) */}
            {activeSubTab === "diary" && (
              <div>
                {gradesLoading ? (
                  <div style={{ textAlign: "center", padding: "32px", color: TEXT_MUTED }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        border: `2px solid ${ACCENT_MID}`,
                        borderTopColor: ACCENT,
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 8px",
                      }}
                    />
                    Yuklanmoqda...
                  </div>
                ) : gradesByWeek.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 16px",
                      border: "1px dashed #E5E7EB",
                      borderRadius: "14px",
                      color: TEXT_MUTED,
                    }}
                  >
                    <span style={{ fontSize: "24px", display: "block", marginBottom: "8px" }}>📭</span>
                    <span style={{ fontSize: "12px" }}>Baholar hali qo&apos;yilmagan.</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {gradesByWeek.map(({ weekKey, label, items }) => {
                      const weekPending = items.filter(
                        (g) => !g.approved_by_parent && g.status !== "approved"
                      );
                      const isWeekLoading = approveAllLoading === weekKey;

                      return (
                        <div
                          key={weekKey}
                          style={{
                            border: "1px solid #E5E7EB",
                            borderRadius: "16px",
                            overflow: "hidden",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
                          }}
                        >
                          {/* Week header */}
                          <div
                            style={{
                              background: `linear-gradient(90deg, ${ACCENT_LIGHT} 0%, white 100%)`,
                              borderBottom: `1.5px solid ${ACCENT_MID}`,
                              padding: "10px 16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: ACCENT,
                                letterSpacing: "0.2px",
                              }}
                            >
                              📅 {label}
                            </span>

                            {weekPending.length > 0 ? (
                              <button
                                onClick={() => handleApproveAll(weekKey, items)}
                                disabled={isWeekLoading}
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 700,
                                  color: ACCENT,
                                  backgroundColor: "white",
                                  border: `1.5px solid ${ACCENT_MID}`,
                                  borderRadius: "6px",
                                  padding: "3px 8px",
                                  cursor: "pointer",
                                }}
                              >
                                {isWeekLoading ? "..." : "✓ Hammasini tasdiqlash"}
                              </button>
                            ) : (
                              <span style={{ fontSize: "9px", color: "#10B981", fontWeight: 700 }}>
                                ✓ Tasdiqlangan
                              </span>
                            )}
                          </div>

                          {/* Skeuomorphic diary paper section */}
                          <div className="diary-paper">
                            {items.map((gr) => (
                              <DiaryRow
                                key={gr.id}
                                grade={gr}
                                onApprove={handleParentApprove}
                                approving={approveLoading === gr.id}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab: DYNAMICS (Dinamika) */}
            {activeSubTab === "dynamics" && (
              <div>
                {chartDataPerSubject.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 16px",
                      border: "1px dashed #E5E7EB",
                      borderRadius: "14px",
                      color: TEXT_MUTED,
                    }}
                  >
                    <span style={{ fontSize: "24px", display: "block", marginBottom: "8px" }}>📊</span>
                    <span style={{ fontSize: "12px" }}>Grafik chizish uchun baholar yetarli emas.</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {chartDataPerSubject.map(({ subject, points, avg }) => (
                      <div key={subject}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                          }}
                        >
                          <span style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                            {subject}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: ACCENT,
                              background: ACCENT_LIGHT,
                              border: `1.5px solid ${ACCENT_MID}`,
                              borderRadius: "6px",
                              padding: "2px 8px",
                            }}
                          >
                            O&apos;rtacha: {avg.toFixed(2)}
                          </span>
                        </div>

                        <div
                          style={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E5E7EB",
                            borderRadius: "14px",
                            padding: "12px 6px 6px 6px",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                          }}
                        >
                          <ResponsiveContainer width="100%" height={140}>
                            <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: -24 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 9, fill: TEXT_MUTED }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                domain={[1, 5]}
                                ticks={[1, 2, 3, 4, 5]}
                                tick={{ fontSize: 9, fill: TEXT_MUTED }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <ReferenceLine
                                y={avg}
                                stroke={ACCENT}
                                strokeDasharray="4 4"
                                strokeOpacity={0.4}
                              />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke={ACCENT}
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: "white", stroke: ACCENT, strokeWidth: 2 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab: ANNOUNCEMENTS (E'lonlar) */}
            {activeSubTab === "announcements" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                      padding: "12px 14px",
                      borderLeft: `4px solid ${ACCENT}`,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK, marginBottom: "4px" }}>
                      {ann.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "#4B5563", lineHeight: 1.5, marginBottom: "8px" }}>
                      {ann.content}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "9px",
                        color: TEXT_MUTED,
                        borderTop: "1px solid #F3F4F6",
                        paddingTop: "6px",
                      }}
                    >
                      <span>✍️ {ann.author}</span>
                      <span>{ann.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MAIN TAB: SETTINGS ── */}
        {activeTab === "settings" && (
          <div style={{ padding: "16px" }}>
            <div className="section-title">⚙️ Tizim Sozlamalari</div>

            {/* User Profile Card */}
            {userInfo && (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom: "16px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 750,
                    color: ACCENT,
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Foydalanuvchi Profili
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                    Ism: <span style={{ fontWeight: 500 }}>{userInfo.first_name} {userInfo.last_name}</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                    Telefon: <span style={{ fontWeight: 500, fontFamily: "monospace" }}>{userInfo.phone || "+998908000002"}</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                    Roli: <span style={{ fontWeight: 500 }}>Vasiy (Ota-ona)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Student child profile card */}
            {selectedChild && (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom: "24px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 750,
                    color: ACCENT,
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  O&apos;quvchi Ma&apos;lumotlari
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                    F.I.SH: <span style={{ fontWeight: 500 }}>{selectedChild.first_name} {selectedChild.last_name}</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                    Sinf: <span style={{ fontWeight: 500 }}>{selectedChild.class_name}</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                    Maktab ID: <span style={{ fontWeight: 500, fontFamily: "monospace" }}>{schoolId}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FEE2E2",
                borderRadius: "12px",
                color: "#EF4444",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s ease",
              }}
            >
              Chiqish (Tizimdan ketish)
            </button>
          </div>
        )}

        {/* Bottom Navigation Component */}
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
