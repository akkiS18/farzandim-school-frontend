"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// Import modular components
import BottomNavigation from "../../components/BottomNavigation";
import DiaryDayCard from "../../components/DiaryDayCard";
import SmartCalendarModal, { SmartCalendarTrigger } from "../../components/SmartCalendarModal";
import CustomDialogModal from "../../components/CustomDialogModal";
import dynamic from "next/dynamic";
const MapPicker = dynamic(() => import("../../components/MapPicker"), { ssr: false });

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
  passport?: string;
  telegram_id?: string;
}

interface StudentChild {
  id: number;
  first_name: string;
  last_name: string;
  class_id: number;
  class_name: string;
  address?: string;
  birthdate?: string;
  ina?: string;
  balance?: number;
}

interface GradeItem {
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
  grade_category?: string;
  grading_system_id?: number;
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

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fmtDate(dateStr: string) {
  const d = parseLocalDate(dateStr);
  return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]}`;
}

function fmtDayName(dateStr: string) {
  const d = parseLocalDate(dateStr);
  return UZ_DAYS[d.getDay()];
}

function getNumericVal(g: GradeItem): number | null {
  if (g.grade_type === "ATTENDANCE") {
    if (g.value === "+") return 1;
    if (g.value === "k") return 0.5;
    if (g.value === "-") return 0;
    return null;
  }
  const v = g.numeric_value !== undefined ? g.numeric_value : parseFloat(g.value);
  return isNaN(v) ? null : v;
}

/** Returns the ISO date string of the Monday of a given date */
function weekStart(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return toLocalDateStr(mon);
}

function getDayDate(mondayStr: string, dayIndex: number): string {
  const d = parseLocalDate(mondayStr);
  d.setDate(d.getDate() + dayIndex);
  return toLocalDateStr(d);
}

function weekLabel(key: string): string {
  const mon = parseLocalDate(key);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return `${mon.getDate()} ${UZ_MONTHS[mon.getMonth()]} — ${sun.getDate()} ${UZ_MONTHS[sun.getMonth()]}`;
}

function getDefaultDate(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const schoolStart = new Date(currentYear, 8, 1); // Sept 1st
  if (now < schoolStart) {
    return `${currentYear}-09-01`;
  }
  return toLocalDateStr(now);
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

function getGradeTypeDisplayName(type: string): string {
  if (type === "MASTERY") return "O'zlashtirish";
  if (type === "BEHAVIOR") return "Xulqi";
  if (type === "ATTENDANCE") return "Davomat";
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function getYAxisConfig(points: { value: number }[], gradingSystemId: string, gradingSystemsList: any[], gradeType?: string) {
  if (gradeType === "ATTENDANCE") {
    return { domain: [0, 1], ticks: [0, 0.5, 1] };
  }
  if (gradeType === "BEHAVIOR") {
    return { domain: [-5, 5], ticks: [-5, -3, 0, 3, 5] };
  }

  let min = 1;
  let max = 5;
  
  if (gradingSystemId !== "ALL" && gradingSystemId !== "NONE") {
    const gs = gradingSystemsList.find(sys => sys.id === Number(gradingSystemId));
    if (gs) {
      if (gs.min_value !== undefined && gs.min_value !== null) min = gs.min_value;
      if (gs.max_value !== undefined && gs.max_value !== null) max = gs.max_value;
    }
  } else {
    // Fallback: calculate from points min/max
    if (points.length > 0) {
      const values = points.map(p => p.value);
      const pMin = Math.min(...values);
      const pMax = Math.max(...values);
      min = Math.floor(pMin);
      max = Math.ceil(pMax);
      if (min === max) {
        min = Math.max(0, min - 1);
        max = max + 1;
      }
    }
  }

  // Generate ticks
  const ticks: number[] = [];
  if (max - min <= 10) {
    for (let i = min; i <= max; i++) {
      ticks.push(i);
    }
  } else {
    const step = Math.ceil((max - min) / 5);
    for (let i = min; i <= max; i += step) {
      ticks.push(i);
    }
    if (ticks.length === 0 || ticks[ticks.length - 1] < max) {
      ticks.push(max);
    }
  }

  return { domain: [min, max], ticks };
}

/* ─────────────────────────────────────────
   Custom Tooltip for Recharts
 ───────────────────────────────────────── */
function CustomTooltip({ active, payload, label, gradeType }: any) {
  if (active && payload && payload.length) {
    let displayVal = payload[0].value;
    if (gradeType === "ATTENDANCE") {
      if (payload[0].value === 1) displayVal = "Bor (+)";
      else if (payload[0].value === 0.5) displayVal = "Kechikdi (k)";
      else if (payload[0].value === 0) displayVal = "Kelmagan (-)";
    }
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
        <p style={{ fontWeight: 700, color: ACCENT }}>
          {gradeType === "ATTENDANCE" ? "Davomat" : "Baho"}: {displayVal}
        </p>
      </div>
    );
  }
  return null;
}

/* ─────────────────────────────────────────
   Standardized Tab Icons
───────────────────────────────────────── */
const TabIconDiary = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: size, height: size, flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const TabIconDynamics = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: size, height: size, flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

const TabIconAnnouncements = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: size, height: size, flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const TabIconMenu = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: size, height: size, flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v7M10 4v7M7 8h3M7 11a3 3 0 003 3v6M17 4v16M17 4a4 4 0 00-4 4v3h4" />
  </svg>
);

const TabIconBalance = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: size, height: size, flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5A2.25 2.25 0 0122.5 6.75v10.5a2.25 2.25 0 01-2.25 2.25H3.75a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 013.75 4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

const TabIconComments = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: size, height: size, flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const TabIconClubs = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: size, height: size, flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

const TabIconBooks = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: size, height: size, flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
  </svg>
);

const TabIconSettings = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: size, height: size, flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z" />
  </svg>
);

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function ParentDashboard() {
  const router = useRouter();

  // Bottom navigation state: "home" | "settings"
  const [activeTab, setActiveTab] = useState<"home" | "settings">("home");

  // Home view sub-tabs: "diary" | "dynamics" | "announcements" | "menu" | "balance" | "comments" | "clubs" | "books"
  const [activeSubTab, setActiveSubTab] = useState<"diary" | "dynamics" | "announcements" | "menu" | "balance" | "comments" | "clubs" | "books">("diary");

  // Extracurricular Clubs States for parents
  const [clubs, setClubs] = useState<any[]>([]);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [joinRequestLoading, setJoinRequestLoading] = useState<number | null>(null);

  const fetchClubs = async (authToken: string, childId: number) => {
    setClubsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/clubs?student_id=${childId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        setClubs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching clubs:", err);
    } finally {
      setClubsLoading(false);
    }
  };

  // Books States for parents
  const [parentBooks, setParentBooks] = useState<any[]>([]);
  const [parentBooksLoading, setParentBooksLoading] = useState(false);

  const fetchParentBooks = async (authToken: string, sId: string, childLvl?: number) => {
    setParentBooksLoading(true);
    try {
      const query = childLvl ? `?level=${childLvl}` : "";
      const response = await fetch(`${API_URL}/api/schools/books${query}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "X-School-ID": sId,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setParentBooks(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching books:", err);
    } finally {
      setParentBooksLoading(false);
    }
  };

  const handleRequestJoinClub = async (clubId: number) => {
    if (!selectedChildId) return;
    setJoinRequestLoading(clubId);
    try {
      const response = await fetch(`${API_URL}/api/schools/clubs/${clubId}/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ student_id: Number(selectedChildId) }),
      });
      if (response.ok) {
        fetchClubs(token, Number(selectedChildId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJoinRequestLoading(null);
    }
  };

  const handleCancelClubRequest = async (clubId: number) => {
    if (!selectedChildId) return;
    setDialogState({
      isOpen: true,
      type: "danger",
      title: "To'garak so'rovini bekor qilish",
      message: "Haqiqatan ham so'rovni bekor qilmoqchimisiz yoki to'garakdan chiqmoqchimisiz?",
      confirmText: "Ha, bekor qilish",
      cancelText: "Yo'q, qolsin",
      onConfirm: async () => {
        setDialogState((prev) => ({ ...prev, isOpen: false }));
        setJoinRequestLoading(clubId);
        try {
          const response = await fetch(`${API_URL}/api/schools/clubs/${clubId}/cancel-request`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ student_id: Number(selectedChildId) }),
          });
          if (response.ok) {
            fetchClubs(token, Number(selectedChildId));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setJoinRequestLoading(null);
        }
      },
    });
  };

  // Auth
  const [token, setToken] = useState("");
  const [schoolId, setSchoolId] = useState("");

  // Telegram Configuration
  const [telegramConfig, setTelegramConfig] = useState<{ bot_username: string; has_token: boolean } | null>(null);

  const fetchTelegramConfig = async (authToken: string, sId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/schools/telegram/config`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "X-School-ID": sId,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setTelegramConfig(data);
      }
    } catch (err) {
      console.error("Error fetching telegram config:", err);
    }
  };
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Children
  const [children, setChildren] = useState<StudentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | "">("");

  // Grades
  const [isSmartCalendarOpen, setIsSmartCalendarOpen] = useState(false);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState<number | null>(null);
  const [approveAllLoading, setApproveAllLoading] = useState<string | null>(null);
  const [gradingSystemsList, setGradingSystemsList] = useState<any[]>([]);
  const [chartFilters, setChartFilters] = useState<{
    [subject: string]: {
      type: string;
      category: string;
      gradingSystemId: string;
    }
  }>({});

  // Diary navigation and schedule states
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => {
    return weekStart(getDefaultDate());
  });
  const [schedule, setSchedule] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Menu states
  const [selectedMenuDate, setSelectedMenuDate] = useState<string>(() => toLocalDateStr(new Date()));
  const [menuData, setMenuData] = useState<any>(null);
  const [menuLoading, setMenuLoading] = useState(false);

  // Balance history states
  const [balanceHistory, setBalanceHistory] = useState<any[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [nextChargeData, setNextChargeData] = useState<{ amount: number; charge_date: string } | null>(null);
  const [nextChargeLoading, setNextChargeLoading] = useState(false);

  const fetchNextCharge = async (childId: number) => {
    setNextChargeLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/students/${childId}/next-charge`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data) {
        setNextChargeData({
          amount: parseFloat(data.amount || 0),
          charge_date: data.charge_date,
        });
      } else {
        setNextChargeData(null);
      }
    } catch {
      setNextChargeData(null);
    } finally {
      setNextChargeLoading(false);
    }
  };

  // Mobile drawer menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Logout & Custom Dialog Modal States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type?: "alert" | "confirm" | "danger";
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Edit profile states
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editAddress, setEditAddress] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editINA, setEditINA] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [showEditParentModal, setShowEditParentModal] = useState(false);
  const [editPassport, setEditPassport] = useState("");
  const [editParentSaving, setEditParentSaving] = useState(false);
  const [editParentError, setEditParentError] = useState("");

  // Double-click comments state
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentTargetType, setCommentTargetType] = useState<"GRADE" | "MENU" | null>(null);
  const [selectedCommentGrade, setSelectedCommentGrade] = useState<any>(null);
  const [selectedCommentMenuDate, setSelectedCommentMenuDate] = useState<string>("");
  const [selectedCommentMealLabel, setSelectedCommentMealLabel] = useState<string>("");
  const [commentText, setCommentText] = useState("");
  const [commentSubmitLoading, setCommentSubmitLoading] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentSuccess, setCommentSuccess] = useState("");

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchChatMessages = async (targetTypeStr: string, targetIdOrDate: any, parentIdVal?: number) => {
    setChatLoading(true);
    try {
      let url = "";
      if (targetTypeStr === "GRADE") {
        url = `${API_URL}/api/schools/grades/${targetIdOrDate}/comments`;
      } else {
        const parentIdParam = parentIdVal || userInfo?.id || "";
        url = `${API_URL}/api/schools/menu/comments?menu_date=${targetIdOrDate}&parent_id=${parentIdParam}`;
      }
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-School-ID": schoolId || "",
        },
      });
      const data = await response.json();
      if (response.ok) {
        setChatMessages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching chat:", err);
    } finally {
      setChatLoading(false);
    }
  };

  const [feedbackFeed, setFeedbackFeed] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  interface ChatThread {
    key: string;
    type: "GRADE" | "MENU";
    grade_id?: number;
    parent_id: number;
    menu_date?: string;
    author_name: string;
    subject_name?: string;
    grade_value?: string;
    student_name?: string;
    class_name?: string;
    messages: any[];
    representative: any;
  }

  const buildThreads = (items: any[]): ChatThread[] => {
    const map = new Map<string, ChatThread>();

    for (const item of items) {
      let key: string;
      if (item.type === "GRADE") {
        key = `GRADE-${item.grade_id}`;
      } else {
        const d = item.menu_date ? item.menu_date.split("T")[0] : "unknown";
        key = `MENU-${item.parent_id}-${d}`;
      }

      if (!map.has(key)) {
        map.set(key, {
          key,
          type: item.type,
          grade_id: item.grade_id,
          parent_id: item.parent_id,
          menu_date: item.menu_date,
          author_name: item.author_name,
          subject_name: item.subject_name,
          grade_value: item.grade_value,
          student_name: item.student_name,
          class_name: item.class_name,
          messages: [],
          representative: item,
        });
      }
      map.get(key)!.messages.push(item);
    }

    for (const thread of map.values()) {
      thread.messages.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      thread.representative = thread.messages[thread.messages.length - 1];
    }

    return [...map.values()].sort((a, b) =>
      new Date(b.representative.created_at).getTime() - new Date(a.representative.created_at).getTime()
    );
  };

  const fetchFeedbackFeed = async () => {
    setFeedbackLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/comments/feed`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-School-ID": schoolId || "",
        },
      });
      const data = await response.json();
      if (response.ok) {
        setFeedbackFeed(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching comments feed:", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleGradeDoubleClick = (grade: any) => {
    setSelectedCommentGrade(grade);
    setCommentTargetType("GRADE");
    setCommentText("");
    setCommentError("");
    setCommentSuccess("");
    setCommentModalOpen(true);
    fetchChatMessages("GRADE", grade.id);
  };

  const handleMenuDoubleClick = (dateStr: string, mealLabel: string) => {
    setSelectedCommentMenuDate(dateStr);
    setSelectedCommentMealLabel(mealLabel);
    setCommentTargetType("MENU");
    setCommentText("");
    setCommentError("");
    setCommentSuccess("");
    setCommentModalOpen(true);
    fetchChatMessages("MENU", dateStr, userInfo?.id);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setCommentError("Komment matni bo'sh bo'lishi mumkin emas");
      return;
    }

    setCommentSubmitLoading(true);
    setCommentError("");
    setCommentSuccess("");

    try {
      let url = "";
      let body = {};

      if (commentTargetType === "GRADE") {
        url = `${API_URL}/api/schools/grades/${selectedCommentGrade.id}/comments`;
        body = { content: commentText.trim() };
      } else {
        url = `${API_URL}/api/schools/menu/comments`;
        body = {
          menu_date: selectedCommentMenuDate,
          content: commentText.trim(),
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-School-ID": schoolId || "",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok) {
        setCommentText("");
        if (commentTargetType === "GRADE") {
          fetchChatMessages("GRADE", selectedCommentGrade.id);
        } else {
          fetchChatMessages("MENU", selectedCommentMenuDate, userInfo?.id);
        }
      } else {
        setCommentError(data.error || "Xatolik yuz berdi");
      }
    } catch {
      setCommentError("Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setCommentSubmitLoading(false);
    }
  };

  // Announcements (dynamic API data)
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);

  const fetchAnnouncements = async (authToken: string, currentSchoolId: string) => {
    setAnnouncementsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/announcements`, {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          "X-School-ID": currentSchoolId
        },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          is_poll: item.is_poll,
          poll_options: item.poll_options,
          date: new Date(item.created_at).toLocaleDateString("uz-UZ", {
            day: "numeric",
            month: "long",
            year: "numeric"
          }),
          author: item.author_name || "Maktab Ma'muriyati",
        }));
        setAnnouncements(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const handleVoteParentPoll = async (annId: number, optionId: number) => {
    try {
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || schoolId || "" : schoolId || "";
      const response = await fetch(`${API_URL}/api/schools/announcements/${annId}/vote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-School-ID": sId,
        },
        body: JSON.stringify({ option_id: optionId }),
      });

      if (response.ok) {
        fetchAnnouncements(token, sId);
      } else {
        const data = await response.json();
        setDialogState({
          isOpen: true,
          type: "alert",
          title: "Xatolik",
          message: data.error || "Ovoz berishda xatolik",
          confirmText: "OK",
          onConfirm: () => setDialogState((prev) => ({ ...prev, isOpen: false })),
        });
      }
    } catch {
      setDialogState({
        isOpen: true,
        type: "alert",
        title: "Tarmoq xatoligi",
        message: "Server bilan bog'lanishda xatolik",
        confirmText: "OK",
        onConfirm: () => setDialogState((prev) => ({ ...prev, isOpen: false })),
      });
    }
  };

  /* ── Auth & initial load ── */
  useEffect(() => {
    const savedToken = localStorage.getItem("school_token");
    const savedSchoolId = localStorage.getItem("school_id");
    const savedUserStr = localStorage.getItem("school_user");

    if (!savedToken || !savedSchoolId || !savedUserStr) {
      router.replace("/login");
      return;
    }

    setToken(savedToken);
    setSchoolId(savedSchoolId);
    try {
      const parsedUser = JSON.parse(savedUserStr);
      if (parsedUser.role !== "PARENT") {
        if (parsedUser.role === "ADMIN" || parsedUser.role === "SUPER_ADMIN") {
          router.replace("/dashboard");
        } else if (parsedUser.role === "MAIN_TEACHER" || parsedUser.role === "SUBJECT_TEACHER") {
          router.replace("/teacher");
        } else {
          router.replace("/login");
        }
        return;
      }
      setUserInfo(parsedUser);
      fetchParentInfo(savedToken, parsedUser.id, savedSchoolId);
      fetchLinkedChildren(savedToken, parsedUser.id, savedSchoolId);
      fetchGradingSystems(savedToken, savedSchoolId);
      fetchAnnouncements(savedToken, savedSchoolId);
      fetchTelegramConfig(savedToken, savedSchoolId);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const fetchGradingSystems = async (authToken: string, currentSchoolId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/schools/grading-systems`, {
        headers: { Authorization: `Bearer ${authToken}`, "X-School-ID": currentSchoolId },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setGradingSystemsList(data);
      }
    } catch (err) {
      console.error("Failed to fetch grading systems:", err);
    }
  };

  const fetchParentInfo = async (
    authToken: string,
    parentId: number,
    currentSchoolId: string
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/schools/parents/${parentId}`, {
        headers: { Authorization: `Bearer ${authToken}`, "X-School-ID": currentSchoolId },
      });
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
        localStorage.setItem("school_user", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Failed to fetch parent info:", err);
    }
  };

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
          address: u.address || "",
          birthdate: u.birthdate || "",
          ina: u.ina || "",
          balance: u.balance || 0,
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

  // Get a representative day of the week (Wednesday) to fetch schedule for that week
  const getRepresentativeWeekDate = (mondayStr: string): string => {
    const d = parseLocalDate(mondayStr);
    d.setDate(d.getDate() + 2); // Wednesday
    return toLocalDateStr(d);
  };

  /* ── Fetch grades and schedule when child or week changes ── */
  useEffect(() => {
    if (selectedChildId && token) {
      fetchChildGrades();
      const child = children.find((c) => c.id === selectedChildId);
      if (child && child.class_id) {
        fetchClassSchedule(child.class_id, getRepresentativeWeekDate(currentWeekStart));
      }
      fetchNextCharge(Number(selectedChildId));
    } else {
      setGrades([]);
      setSchedule([]);
      setNextChargeData(null);
    }
  }, [selectedChildId, currentWeekStart, token, children]);

  const fetchClassSchedule = async (classId: number, dateStr: string) => {
    setScheduleLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/classes/${classId}/schedule?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setSchedule(data);
      }
    } catch {
      /* noop */
    } finally {
      setScheduleLoading(false);
    }
  };

  const handlePrevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d.toISOString().split("T")[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d.toISOString().split("T")[0]);
  };

  const fetchChildGrades = async () => {
    setGradesLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/grades?student_id=${selectedChildId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setGrades(Array.isArray(data) ? data.filter((g: any) => g.lesson_number && g.lesson_number > 0) : []);
    } catch {
      /* noop */
    } finally {
      setGradesLoading(false);
    }
  };

  const fetchBalanceHistory = async (childId: number) => {
    setBalanceLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/students/${childId}/balance/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setBalanceHistory(data);
      }
    } catch {
      /* noop */
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchMenu = async (dateStr: string) => {
    setMenuLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/schools/menu?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setMenuData(data);
      }
    } catch {
      /* noop */
    } finally {
      setMenuLoading(false);
    }
  };

  const handleUpdateStudentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId) return;
    setEditSaving(true);
    setEditError("");

    const child = children.find(c => c.id === editingStudentId);
    if (!child) return;

    try {
      const response = await fetch(`${API_URL}/api/schools/students/${editingStudentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: child.first_name,
          last_name: child.last_name,
          address: editAddress,
          birthdate: editBirthDate,
          ina: editINA,
        }),
      });

      const resData = await response.json();
      if (response.ok) {
        setChildren(prev =>
          prev.map(c =>
            c.id === editingStudentId
              ? { ...c, address: editAddress, birthdate: editBirthDate, ina: editINA }
              : c
          )
        );
        setShowEditStudentModal(false);
      } else {
        setEditError(resData.error || "Tahrirlashda xatolik yuz berdi");
      }
    } catch (err: any) {
      setEditError(err.message || "Serverga bog'lanishda xatolik");
    } finally {
      setEditSaving(false);
    }
  };

  const handleUpdateParentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo) return;
    setEditParentSaving(true);
    setEditParentError("");

    try {
      const response = await fetch(`${API_URL}/api/schools/parents/${userInfo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: userInfo.first_name,
          last_name: userInfo.last_name,
          passport: editPassport,
          phone: userInfo.phone || "",
        }),
      });

      const resData = await response.json();
      if (response.ok) {
        const updatedUser = { ...userInfo, passport: editPassport };
        setUserInfo(updatedUser);
        localStorage.setItem("school_user", JSON.stringify(updatedUser));
        setShowEditParentModal(false);
      } else {
        setEditParentError(resData.error || "Tahrirlashda xatolik yuz berdi");
      }
    } catch (err: any) {
      setEditParentError(err.message || "Serverga bog'lanishda xatolik");
    } finally {
      setEditParentSaving(false);
    }
  };

  useEffect(() => {
    if (selectedChildId && token) {
      if (activeSubTab === "balance") {
        fetchBalanceHistory(selectedChildId);
      } else if (activeSubTab === "menu") {
        fetchMenu(selectedMenuDate);
      } else if (activeSubTab === "comments") {
        fetchFeedbackFeed();
      } else if (activeSubTab === "clubs") {
        fetchClubs(token, Number(selectedChildId));
      } else if (activeSubTab === "books") {
        fetchParentBooks(token, schoolId);
      }
    }
  }, [selectedChildId, selectedMenuDate, activeSubTab, token, schoolId]);

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
      (g) => !g.approved_by_parent
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

  const promptLogout = () => {
    setShowLogoutModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("school_token");
    localStorage.removeItem("school_refresh_token");
    localStorage.removeItem("school_id");
    localStorage.removeItem("school_user");
    router.push("/login");
  };

  /* ── Derived data ── */
  const selectedChild = children.find((c) => c.id === selectedChildId);



  // Filter selected child's grades to avoid mixing data
  const selectedChildGrades = grades.filter((g) => {
    if (!selectedChild) return false;
    const childFullName = `${selectedChild.first_name} ${selectedChild.last_name}`.toLowerCase().trim();
    return g.student_name ? g.student_name.toLowerCase().trim() === childFullName : true;
  });

  // Check if Saturday (dayIdx 5, day_of_week 6) has any schedule lessons or grades
  const hasSaturdayContent = (() => {
    const satSchedule = schedule.filter((item: any) => item.day_of_week === 6);
    const satDateStr = getDayDate(currentWeekStart, 5);
    const satGrades = selectedChildGrades.filter((g) => g.grade_date.split("T")[0] === satDateStr);
    return satSchedule.length > 0 || satGrades.length > 0;
  })();

  const activeDayIndices = hasSaturdayContent ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4];

  // Calculate day-by-day rows for active week
  const daysOfWeek = activeDayIndices.map((dayIdx) => {
    const dayDateStr = getDayDate(currentWeekStart, dayIdx);
    const dayName = UZ_DAYS[parseLocalDate(dayDateStr).getDay()];
    const dayLabel = `${dayName}, ${fmtDate(dayDateStr)}`;

    // 1. Get schedule for this day from backend
    const daySchedule = schedule.filter((item: any) => item.day_of_week === dayIdx + 1);
    let subjects = daySchedule.map((item: any) => item.subject_name);



    // 2. Get child's grades for this calendar day
    const dayGrades = selectedChildGrades.filter(
      (g) => g.grade_date.split("T")[0] === dayDateStr
    );

    // 3. Ensure all graded subjects are present in the list (even if not in schedule)
    const subjectsSet = new Set(subjects);
    for (const g of dayGrades) {
      if (!subjectsSet.has(g.subject_name)) {
        subjects.push(g.subject_name);
        subjectsSet.add(g.subject_name);
      }
    }

    // 4. Map to DiaryDayCard row format
    const rows = subjects.map((subject) => {
      const allSubjectGrades = dayGrades.filter((g) => g.subject_name === subject);
      return {
        subjectName: subject,
        grade: allSubjectGrades[0],
        grades: allSubjectGrades,
      };
    });

    return {
      dayLabel,
      rows,
    };
  });

  // Active week grades for the selected child (used for signature & approve all)
  const activeWeekGrades = selectedChildGrades.filter(
    (g) => weekStart(g.grade_date) === currentWeekStart
  );

  const activeWeekPending = activeWeekGrades.filter(
    (g) => !g.approved_by_parent
  );

  const isTeacherSigned = activeWeekGrades.length > 0 && activeWeekGrades.every(g => g.status === 'approved');

  const isWeekLoading = approveAllLoading === currentWeekStart;

  // Group selected child's grades by week (compatibility fallback)
  const gradesByWeek: { weekKey: string; label: string; items: GradeItem[] }[] = (() => {
    const map = new Map<string, GradeItem[]>();
    for (const g of selectedChildGrades) {
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
  const gradesBySubject = selectedChildGrades.reduce<{ [s: string]: GradeItem[] }>((acc, g) => {
    if (!acc[g.subject_name]) acc[g.subject_name] = [];
    acc[g.subject_name].push(g);
    return acc;
  }, {});



  const pendingTotal = selectedChildGrades.filter(
    (g) => !g.approved_by_parent
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

  // Helper to determine active alerts
  const renderWarningAlerts = () => {
    if (!selectedChild) return null;

    const balance = selectedChild.balance || 0;

    // Check RED alert first (balance < 0)
    if (balance < 0) {
      return (
        <div
          style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "20px",
            color: "#B91C1C",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
          }}
        >
          
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: "13px" }}>To'lov bo'yicha qarzdorlik!</h4>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.9 }}>
              Diqqat! Farzandingiz balansida qarzdorlik mavjud ({new Intl.NumberFormat("uz-UZ").format(balance)} UZS). Iltimos, balansni to'ldiring.
            </p>
          </div>
        </div>
      );
    }

    // Check YELLOW alert
    if (nextChargeData && nextChargeData.amount > 0) {
      try {
        const nextChargeDate = parseLocalDate(nextChargeData.charge_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        nextChargeDate.setHours(0, 0, 0, 0);

        const diffTime = nextChargeDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (balance < nextChargeData.amount && diffDays >= 0 && diffDays <= 5) {
          return (
            <div
              style={{
                backgroundColor: "#FFFBEB",
                border: "1px solid #FCD34D",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "20px",
                color: "#B45309",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
              }}
            >
              
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: "13px" }}>Kutilayotgan to'lov eslatmasi</h4>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.9 }}>
                  Eslatma: Yaqin kunlarda ({nextChargeDate.toLocaleDateString("uz-UZ")}) farzandingiz uchun {new Intl.NumberFormat("uz-UZ").format(nextChargeData.amount)} UZS miqdorida to'lov rejalashtirilgan. Balansni to'ldirib qo'yishingizni tavsiya etamiz.
                </p>
              </div>
            </div>
          );
        }
      } catch (e) {
        console.error("Alert calculation error", e);
      }
    }

    return null;
  };

  /* ──────────────────────────────────────
     Main render (Mobile-First Frame)
  ─────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#EFF3F0",
        fontFamily: "'Roboto', sans-serif",
        color: "#1E293B",
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
          background: #CBD5E1;
          border-radius: 999px;
        }

        .sidebar-column {
          width: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin: 16px 0 16px 16px;
          position: sticky;
          top: 16px;
          z-index: 50;
          flex-shrink: 0;
          height: calc(100vh - 32px);
        }

        @media (max-width: 767px) {
          .sidebar-column {
            display: none !important;
          }
          .top-subtab-bar {
            display: none !important;
          }
          .mobile-brand-logo {
            display: flex !important;
          }
        }

        .mobile-brand-logo {
          display: none;
        }

        .sidebar-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background-color: transparent;
          color: #64748B;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sidebar-btn:hover {
          background-color: #F1F5F9;
          color: #0F172A;
        }
        .sidebar-btn.active {
          background-color: #F5C542 !important;
          color: #0F172A !important;
          box-shadow: 0 4px 12px rgba(245, 197, 66, 0.35);
        }

        .diary-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (min-width: 768px) {
          .diary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (min-width: 1200px) {
          .diary-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        .sub-tab-btn {
          padding: 8px 16px;
          border-radius: 999px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          font-family: 'Roboto', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .sub-tab-btn.active {
          background: #00A389;
          border-color: #00A389;
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(0,163,137,0.25);
        }
      `}</style>

      {/* Modern Dashboard Wrapper */}
      <div style={{ display: "flex", width: "100%", maxWidth: "1500px", margin: "0 auto", minHeight: "100vh" }}>
        
        {/* ── LEFT VERTICAL SIDEBAR COLUMN ── */}
        <aside className="sidebar-column">
          {/* 1. Standalone Site Brand Logo (outside cards) */}
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #00A389 0%, #0F766E 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 900,
              fontSize: "20px",
              boxShadow: "0 4px 14px rgba(0,163,137,0.35)",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onClick={() => { setActiveTab("home"); setActiveSubTab("diary"); }}
            title="Online Jurnal"
          >
            ✦
          </div>

          {/* 2. Top Navigation Tabs Card */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "22px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              padding: "8px 4px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* 1. Kundalik */}
            <button
              className={`sidebar-btn${activeTab === "home" && activeSubTab === "diary" ? " active" : ""}`}
              onClick={() => { setActiveTab("home"); setActiveSubTab("diary"); }}
              title="Kundalik"
            >
              <TabIconDiary size={20} />
            </button>

            {/* 2. Dinamika */}
            <button
              className={`sidebar-btn${activeTab === "home" && activeSubTab === "dynamics" ? " active" : ""}`}
              onClick={() => { setActiveTab("home"); setActiveSubTab("dynamics"); }}
              title="Dinamika"
            >
              <TabIconDynamics size={20} />
            </button>

            {/* 3. E'lonlar */}
            <button
              className={`sidebar-btn${activeTab === "home" && activeSubTab === "announcements" ? " active" : ""}`}
              onClick={() => { setActiveTab("home"); setActiveSubTab("announcements"); }}
              title="E'lonlar"
            >
              <TabIconAnnouncements size={20} />
            </button>

            {/* 4. Taomnoma */}
            <button
              className={`sidebar-btn${activeTab === "home" && activeSubTab === "menu" ? " active" : ""}`}
              onClick={() => { setActiveTab("home"); setActiveSubTab("menu"); }}
              title="Taomnoma"
            >
              <TabIconMenu size={20} />
            </button>

            {/* 5. Balans */}
            <button
              className={`sidebar-btn${activeTab === "home" && activeSubTab === "balance" ? " active" : ""}`}
              onClick={() => { setActiveTab("home"); setActiveSubTab("balance"); }}
              title="Balans"
            >
              <TabIconBalance size={20} />
            </button>

            {/* 6. Murojaatlar */}
            <button
              className={`sidebar-btn${activeTab === "home" && activeSubTab === "comments" ? " active" : ""}`}
              onClick={() => { setActiveTab("home"); setActiveSubTab("comments"); }}
              title="Murojaatlar"
            >
              <TabIconComments size={20} />
            </button>

            {/* 7. To'garaklar */}
            <button
              className={`sidebar-btn${activeTab === "home" && activeSubTab === "clubs" ? " active" : ""}`}
              onClick={() => { setActiveTab("home"); setActiveSubTab("clubs"); }}
              title="To'garaklar"
            >
              <TabIconClubs size={20} />
            </button>

            {/* 8. Kitobxonlik */}
            <button
              className={`sidebar-btn${activeTab === "home" && activeSubTab === "books" ? " active" : ""}`}
              onClick={() => { setActiveTab("home"); setActiveSubTab("books"); }}
              title="Kitobxonlik"
            >
              <TabIconBooks size={20} />
            </button>
          </div>

          {/* 3. Bottom Settings & Logout Card */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              padding: "8px 4px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              alignItems: "center",
              width: "100%",
              marginTop: "auto",
            }}
          >
            {/* Sozlamalar */}
            <button
              className={`sidebar-btn${activeTab === "settings" ? " active" : ""}`}
              onClick={() => setActiveTab("settings")}
              title="Sozlamalar"
            >
              <TabIconSettings size={20} />
            </button>

            {/* Chiqish (Logout) */}
            <button
              className="sidebar-btn"
              onClick={promptLogout}
              title="Tizimdan chiqish"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <main style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "16px", minWidth: 0, paddingBottom: "80px" }}>
          
          {/* ── TOP HEADER ROW (Mobile Logo + Balance Card + Child Switcher + Profile Pill) ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            {/* Left: Mobile Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Mobile Brand Site Logo & Menu Trigger */}
              <button
                type="button"
                className="mobile-brand-logo"
                onClick={() => setIsMobileMenuOpen(true)}
                style={{
                  display: "none",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #00A389 0%, #0F766E 100%)",
                  border: "none",
                  color: "white",
                  fontWeight: 900,
                  fontSize: "14px",
                  boxShadow: "0 4px 12px rgba(0,163,137,0.35)",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "transform 0.15s ease",
                }}
                title="Menyu"
              >
                <span style={{ fontSize: "16px" }}>✦</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>

            {/* Right: Floating Compact Card for Notification Bell & Profile Pill */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "999px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                padding: "4px 8px 4px 10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginLeft: "auto",
              }}
            >
              {/* Notification Bell */}
              <button
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748B",
                  transition: "all 0.15s ease",
                }}
                title="E'lonlar va bildirishnomalar"
                onClick={() => { setActiveTab("home"); setActiveSubTab("announcements"); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "17px", height: "17px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </button>

              <div style={{ width: "1px", height: "20px", backgroundColor: "#E2E8F0" }} />

              {/* Profile Pill */}
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 4px",
                }}
                title="Profil sozlamalari"
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "#00A389",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0,163,137,0.3)",
                  }}
                >
                  {userInfo?.first_name ? userInfo.first_name.charAt(0).toUpperCase() : "O"}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "12px", fontWeight: 750, color: "#1E293B", lineHeight: 1.2 }}>
                    {userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : "Ota-ona"}
                  </div>
                  <div style={{ fontSize: "10px", color: "#00A389", fontWeight: 600 }}>
                    Ota-ona
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#64748B" style={{ width: "12px", height: "12px", marginLeft: "2px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
          </div>

        {/* ── MAIN TAB: HOME ── */}
        {activeTab === "home" && (
          <div style={{ padding: "16px" }}>
            {/* Child & Balance Selector Cards */}
            {children.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                {children.map((child) => {
                  const isSelected = selectedChildId === child.id;
                  const balance = child.balance || 0;

                  // Status determination
                  let isRed = balance < 0;
                  let isYellow = false;

                  if (!isRed && nextChargeData && nextChargeData.amount > 0) {
                    try {
                      const nextChargeDate = parseLocalDate(nextChargeData.charge_date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      nextChargeDate.setHours(0, 0, 0, 0);
                      const diffTime = nextChargeDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      if (balance < nextChargeData.amount && diffDays >= 0 && diffDays <= 5) {
                        isYellow = true;
                      }
                    } catch (e) {}
                  }

                  let bg = "#FFFFFF";
                  let borderColor = "#E5E7EB";
                  let statusLabel = "Faol";
                  let statusColor = "#059669";
                  let iconBg = "#F3F4F6";

                  if (isRed) {
                    bg = isSelected ? "#FEF2F2" : "#FFF5F5";
                    borderColor = isSelected ? "#EF4444" : "#FECACA";
                    statusLabel = "Qarzdorlik";
                    statusColor = "#DC2626";
                    iconBg = "#FEE2E2";
                  } else if (isYellow) {
                    bg = isSelected ? "#FFFBEB" : "#FEFCE8";
                    borderColor = isSelected ? "#F59E0B" : "#FDE68A";
                    statusLabel = "To'lov yaqin";
                    statusColor = "#D97706";
                    iconBg = "#FEF3C7";
                  } else if (isSelected) {
                    bg = ACCENT_LIGHT;
                    borderColor = ACCENT;
                    iconBg = "#E0E7FF";
                  }

                  return (
                    <div
                      key={child.id}
                      onClick={() => setSelectedChildId(child.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "16px",
                        border: `2px solid ${borderColor}`,
                        backgroundColor: bg,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.02)",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "12px",
                            backgroundColor: iconBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                            flexShrink: 0,
                          }}
                        >
                          👦
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 800,
                              color: isSelected ? (isRed ? "#991B1B" : isYellow ? "#92400E" : ACCENT) : TEXT_DARK,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {child.first_name} {child.last_name}
                          </div>
                          <div style={{ fontSize: "10px", fontWeight: 600, color: TEXT_MUTED, marginTop: "1px" }}>
                            {child.class_name} sinfi
                          </div>
                        </div>
                      </div>

                      {/* Right side: Balance & Status */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 900,
                            color: isRed ? "#DC2626" : isYellow ? "#D97706" : "#059669",
                          }}
                        >
                          {balance > 0 ? "+" : ""}{new Intl.NumberFormat("uz-UZ").format(balance)} so&apos;m
                        </div>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: "9px",
                            fontWeight: 800,
                            color: statusColor,
                            marginTop: "2px",
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sub-tab Navigation */}
            <div
              className="top-subtab-bar scrollbar-hidden"
              style={{
                display: "flex",
                borderBottom: "1px solid #E5E7EB",
                marginBottom: "20px",
                overflowX: "auto",
                whiteSpace: "nowrap",
                msOverflowStyle: "none",
                scrollbarWidth: "none",
                gap: "8px",
              }}
            >
              <button
                className={`sub-tab-btn${activeSubTab === "diary" ? " active" : ""}`}
                onClick={() => setActiveSubTab("diary")}
                style={{ flexShrink: 0, paddingLeft: "12px", paddingRight: "12px" }}
              >
                <TabIconDiary size={15} />
                Kundalik
              </button>
              <button
                className={`sub-tab-btn${activeSubTab === "dynamics" ? " active" : ""}`}
                onClick={() => setActiveSubTab("dynamics")}
                style={{ flexShrink: 0, paddingLeft: "12px", paddingRight: "12px" }}
              >
                <TabIconDynamics size={15} />
                Dinamika
              </button>
              <button
                className={`sub-tab-btn${activeSubTab === "announcements" ? " active" : ""}`}
                onClick={() => setActiveSubTab("announcements")}
                style={{ flexShrink: 0, paddingLeft: "12px", paddingRight: "12px" }}
              >
                <TabIconAnnouncements size={15} />
                E&apos;lonlar
              </button>
              <button
                className={`sub-tab-btn${activeSubTab === "menu" ? " active" : ""}`}
                onClick={() => setActiveSubTab("menu")}
                style={{ flexShrink: 0, paddingLeft: "12px", paddingRight: "12px" }}
              >
                <TabIconMenu size={15} />
                Taomnoma
              </button>
              <button
                className={`sub-tab-btn${activeSubTab === "balance" ? " active" : ""}`}
                onClick={() => setActiveSubTab("balance")}
                style={{ flexShrink: 0, paddingLeft: "12px", paddingRight: "12px" }}
              >
                <TabIconBalance size={15} />
                Balans
              </button>
              <button
                className={`sub-tab-btn${activeSubTab === "comments" ? " active" : ""}`}
                onClick={() => setActiveSubTab("comments")}
                style={{ flexShrink: 0, paddingLeft: "12px", paddingRight: "12px" }}
              >
                <TabIconComments size={15} />
                Murojaatlar
              </button>
              <button
                className={`sub-tab-btn${activeSubTab === "clubs" ? " active" : ""}`}
                onClick={() => setActiveSubTab("clubs")}
                style={{ flexShrink: 0, paddingLeft: "12px", paddingRight: "12px" }}
              >
                <TabIconClubs size={15} />
                To'garaklar
              </button>
              <button
                className={`sub-tab-btn${activeSubTab === "books" ? " active" : ""}`}
                onClick={() => setActiveSubTab("books")}
                style={{ flexShrink: 0, paddingLeft: "12px", paddingRight: "12px" }}
              >
                <TabIconBooks size={15} />
                Kitobxonlik
              </button>
            </div>

            {/* Sub-tab: DIARY (Kundalik) */}
            {activeSubTab === "diary" && (
              <div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                  <SmartCalendarTrigger
                    label={weekLabel(currentWeekStart)}
                    onOpenCalendar={() => setIsSmartCalendarOpen(true)}
                    onPrevWeek={handlePrevWeek}
                    onNextWeek={handleNextWeek}
                  />
                </div>

                <SmartCalendarModal
                  isOpen={isSmartCalendarOpen}
                  onClose={() => setIsSmartCalendarOpen(false)}
                  mode="week"
                  selectedWeekStart={currentWeekStart}
                  onSelectWeek={(monStr) => {
                    setCurrentWeekStart(monStr);
                  }}
                  title="Haftani tanlash"
                />

                {gradesLoading || scheduleLoading ? (
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
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* The 6-Day Grid: 3x2 on desktop, 2x3 on mobile */}
                    <div className="diary-grid">
                      {daysOfWeek.map((dayData, idx) => (
                        <DiaryDayCard
                          key={idx}
                          dayLabel={dayData.dayLabel}
                          rows={dayData.rows}
                          onApprove={handleParentApprove}
                          approvingId={approveLoading}
                          onGradeDoubleClick={handleGradeDoubleClick}
                        />
                      ))}
                    </div>

                    {/* Skeuomorphic Parent Signature Section */}
                    <div
                      style={{
                        backgroundColor: "#FCFBF7",
                        border: "1px solid #D8D3C9",
                        borderRadius: "12px",
                        padding: "16px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#4A3E3D",
                          borderBottom: "1.5px solid #EAE5DB",
                          paddingBottom: "8px",
                          marginBottom: "4px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: "13px", height: "13px", marginRight: "5px", display: "inline-block", verticalAlign: "middle" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 20.013a4.5 4.5 0 01-1.897 1.13l-3.82.85.85-3.82a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                        Kundalikni tasdiqlash (Ota-ona imzosi)
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "16px",
                        }}
                      >
                        {/* Left Signee */}
                        <div style={{ flex: 1, minWidth: "150px" }}>
                          <span style={{ fontSize: "11px", color: TEXT_MUTED, display: "block" }}>
                            Sinf rahbari imzosi:
                          </span>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: isTeacherSigned ? "#10B981" : "#EF4444",
                              fontFamily: "monospace",
                              display: "block",
                              marginTop: "4px",
                              borderBottom: "1px dashed #D1C7BD",
                              paddingBottom: "4px",
                            }}
                          >
                            {isTeacherSigned ? "✓ Imzolangan" : "✗ Imzolanmagan"}
                          </span>
                        </div>

                        {/* Right Signee */}
                        <div style={{ flex: 1, minWidth: "150px" }}>
                          <span style={{ fontSize: "11px", color: TEXT_MUTED, display: "block" }}>
                            Ota-ona imzosi:
                          </span>
                          <div style={{ marginTop: "4px" }}>
                            {activeWeekGrades.length === 0 ? (
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 650,
                                  color: TEXT_MUTED,
                                  fontFamily: "monospace",
                                  display: "block",
                                  borderBottom: "1px dashed #D1C7BD",
                                  paddingBottom: "4px",
                                }}
                              >
                                Baholar kiritilmagan
                              </span>
                            ) : activeWeekPending.length > 0 ? (
                              <button
                                onClick={() => handleApproveAll(currentWeekStart, activeWeekGrades)}
                                disabled={isWeekLoading}
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "white",
                                  backgroundColor: ACCENT,
                                  border: "none",
                                  borderRadius: "6px",
                                  padding: "6px 12px",
                                  cursor: "pointer",
                                  width: "100%",
                                  fontFamily: "'Roboto', sans-serif",
                                  boxShadow: "0 2px 4px rgba(79,70,229,0.2)",
                                }}
                              >
                                {isWeekLoading ? "..." : "Hammasini ko'rdim (Imzo chekish)"}
                              </button>
                            ) : (
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: ACCENT,
                                  fontFamily: "monospace",
                                  display: "block",
                                  borderBottom: "1px dashed #D1C7BD",
                                  paddingBottom: "4px",
                                }}
                              >
                                ✓ Imzolandi (Hammasi ko'rildi)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab: DYNAMICS (Dinamika) */}
            {activeSubTab === "dynamics" && (
              <div>
                {Object.keys(gradesBySubject).length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 16px",
                      border: "1px dashed #E5E7EB",
                      borderRadius: "14px",
                      color: TEXT_MUTED,
                    }}
                  >
                    
                    <span style={{ fontSize: "12px" }}>Grafik chizish uchun baholar yetarli emas.</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {Object.entries(gradesBySubject).map(([subject, allGrades]) => {
                      const filter = chartFilters[subject] || { type: "MASTERY", category: "DAILY", gradingSystemId: "ALL" };
                      const safeSubjectId = subject.replace(/[^a-zA-Z0-9]/g, "_");
                      
                      // 1. Sort grades chronologically
                      const sorted = [...allGrades].sort(
                        (a, b) => new Date(a.grade_date).getTime() - new Date(b.grade_date).getTime()
                      );

                      // 2. Filter grades based on type, category, and grading system
                      const filteredGrades = sorted.filter(g => {
                        // Grade Type Filter
                        if (g.grade_type !== filter.type) return false;

                        // Mastery extra filters
                        if (filter.type === "MASTERY") {
                          if (g.grade_category !== filter.category) return false;
                          if (filter.gradingSystemId !== "ALL") {
                            if (filter.gradingSystemId === "NONE") {
                              if (g.grading_system_id !== null && g.grading_system_id !== undefined) return false;
                            } else {
                              if (g.grading_system_id !== Number(filter.gradingSystemId)) return false;
                            }
                          }
                        }
                        return true;
                      });

                      // 3. Map to chart points
                      const points = filteredGrades
                        .map((g) => {
                          const val = getNumericVal(g);
                          return val !== null
                            ? { date: fmtDate(g.grade_date), value: val }
                            : null;
                        })
                        .filter(Boolean) as { date: string; value: number }[];

                      // 4. Calculate average of filtered points
                      const hasPoints = points.length > 0;
                      const avg = hasPoints ? points.reduce((s, p) => s + p.value, 0) / points.length : 0;

                      // 5. Get dynamic Y-axis bounds and ticks
                      const yAxisConfig = getYAxisConfig(points, filter.gradingSystemId, gradingSystemsList, filter.type);

                      // 6. Get unique grading systems and types used
                      const uniqueGsIds = Array.from(new Set(allGrades.map(g => g.grading_system_id).filter(Boolean)));
                      const hasNoneGradingSystem = allGrades.some(g => !g.grading_system_id);
                      
                      const uniqueGradeTypes = Array.from(new Set([
                        "MASTERY",
                        "BEHAVIOR",
                        "ATTENDANCE",
                        ...allGrades.map(g => g.grade_type).filter((x): x is string => !!x)
                      ]));

                      return (
                        <div key={subject}>
                          {/* Subject Header with Dropdowns */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                              marginBottom: "8px",
                            }}
                          >
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
                              {hasPoints && (
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
                                  {filter.type === "ATTENDANCE" 
                                    ? `Ishtirok: ${(avg * 100).toFixed(0)}%` 
                                    : `O'rtacha: ${avg.toFixed(2)}`}
                                </span>
                              )}
                            </div>

                            {/* Dropdowns Row */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                              {/* Grade Type Select Wrapper */}
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "1px 6px" }}>
                                {filter.type === "MASTERY" && (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke={TEXT_MUTED} style={{ width: "11px", height: "11px" }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                  </svg>
                                )}
                                {filter.type === "BEHAVIOR" && (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke={TEXT_MUTED} style={{ width: "11px", height: "11px" }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                                {filter.type === "ATTENDANCE" && (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke={TEXT_MUTED} style={{ width: "11px", height: "11px" }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                                <select
                                  value={filter.type}
                                  onChange={(e) => setChartFilters(prev => ({
                                    ...prev,
                                    [subject]: { ...filter, type: e.target.value }
                                  }))}
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 650,
                                    color: TEXT_DARK,
                                    backgroundColor: "transparent",
                                    border: "none",
                                    outline: "none",
                                    cursor: "pointer",
                                    padding: "2px 0",
                                  }}
                                >
                                  {uniqueGradeTypes.map(t => (
                                    <option key={t} value={t}>{getGradeTypeDisplayName(t)}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Category Select - only shown for MASTERY */}
                              {filter.type === "MASTERY" && (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "1px 6px" }}>
                                  {filter.category === "DAILY" && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke={TEXT_MUTED} style={{ width: "11px", height: "11px" }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                  )}
                                  {filter.category === "QUARTERLY_EXAM" && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke={TEXT_MUTED} style={{ width: "11px", height: "11px" }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-6.75a1.125 1.125 0 01-1.125-1.125V15m10.125 0V9.75c0-.621-.503-1.125-1.125-1.125h-6.75A1.125 1.125 0 017.5 9.75V15m9-11.25A1.875 1.875 0 1115 5.25m-3-1.875A1.875 1.875 0 119 5.25" />
                                    </svg>
                                  )}
                                  {filter.category === "SEMESTER_EXAM" && (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke={TEXT_MUTED} style={{ width: "11px", height: "11px" }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M22.25 9.375a.375.375 0 100-.75.375.375 0 000 .75z" />
                                    </svg>
                                  )}
                                  <select
                                    value={filter.category}
                                    onChange={(e) => setChartFilters(prev => ({
                                      ...prev,
                                      [subject]: { ...filter, category: e.target.value }
                                    }))}
                                    style={{
                                      fontSize: "9px",
                                      fontWeight: 650,
                                      color: TEXT_DARK,
                                      backgroundColor: "transparent",
                                      border: "none",
                                      outline: "none",
                                      cursor: "pointer",
                                      padding: "2px 0",
                                    }}
                                  >
                                    <option value="DAILY">Kundalik</option>
                                    <option value="QUARTERLY_EXAM">Choraklik</option>
                                    <option value="SEMESTER_EXAM">Imtihon</option>
                                  </select>
                                </div>
                              )}

                              {/* Grading System Select - only shown for MASTERY */}
                              {filter.type === "MASTERY" && (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "1px 6px" }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke={TEXT_MUTED} style={{ width: "11px", height: "11px" }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-1.305-3.579l-1.416-.85a3 3 0 00-4.024 1.042l-.458.765a3 3 0 001.043 4.023l1.416.85a3 3 0 004.024-1.042l.72-1.204zM14.47 7.878a3 3 0 001.305 3.579l1.416.85a3 3 0 004.024-1.042l.458-.765a3 3 0 00-1.043-4.023l-1.416-.85a3 3 0 00-4.024 1.042l-.72 1.204zM14.075 14.075l-4.15-4.15" />
                                  </svg>
                                  <select
                                    value={filter.gradingSystemId}
                                    onChange={(e) => setChartFilters(prev => ({
                                      ...prev,
                                      [subject]: { ...filter, gradingSystemId: e.target.value }
                                    }))}
                                    style={{
                                      fontSize: "9px",
                                      fontWeight: 650,
                                      color: TEXT_DARK,
                                      backgroundColor: "transparent",
                                      border: "none",
                                      outline: "none",
                                      cursor: "pointer",
                                      padding: "2px 0",
                                    }}
                                  >
                                    <option value="ALL">Barcha tizimlar</option>
                                    {uniqueGsIds.map(gsId => {
                                      const gsName = gradingSystemsList.find(gs => gs.id === gsId)?.name || `Tizim #${gsId}`;
                                      return (
                                        <option key={gsId} value={gsId}>{gsName}</option>
                                      );
                                    })}
                                    {hasNoneGradingSystem && (
                                      <option value="NONE">Tizimsiz baholar</option>
                                    )}
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Chart Container */}
                          <div
                            style={{
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #E5E7EB",
                              borderRadius: "14px",
                              padding: "12px 6px 6px 6px",
                              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                              minHeight: "140px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            {points.length >= 2 ? (
                              <ResponsiveContainer width="100%" height={140}>
                                <AreaChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: -24 }}>
                                  <defs>
                                    <linearGradient id={`colorGrad-${safeSubjectId}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={ACCENT} stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor={ACCENT} stopOpacity={0.0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                  <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 9, fill: TEXT_MUTED }}
                                    axisLine={false}
                                    tickLine={false}
                                  />
                                  <YAxis
                                    domain={yAxisConfig.domain}
                                    ticks={yAxisConfig.ticks}
                                    tick={{ fontSize: 9, fill: TEXT_MUTED }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => {
                                      if (filter.type === "ATTENDANCE") {
                                        if (val === 1) return "+";
                                        if (val === 0.5) return "k";
                                        if (val === 0) return "-";
                                      }
                                      return val;
                                    }}
                                  />
                                  <Tooltip content={<CustomTooltip gradeType={filter.type} />} />
                                  <ReferenceLine
                                    y={avg}
                                    stroke={ACCENT}
                                    strokeDasharray="4 4"
                                    strokeOpacity={0.4}
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={ACCENT}
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill={`url(#colorGrad-${safeSubjectId})`}
                                    dot={{ r: 4, fill: "white", stroke: ACCENT, strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: ACCENT, stroke: "white", strokeWidth: 2 }}
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            ) : (
                              <div style={{ textAlign: "center", padding: "16px", color: TEXT_MUTED, fontSize: "11px" }}>
                                {points.length === 1 
                                  ? `${filter.type === "ATTENDANCE" ? (points[0].value === 1 ? "Bor (+)" : points[0].value === 0.5 ? "Kechikdi (k)" : "Kelmagan (-)") : `Baho: ${points[0].value}`} (grafik uchun kamida 2 ta nuqta kerak)` 
                                  : "Ushbu filtr bo'yicha ma'lumotlar mavjud emas"}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab: ANNOUNCEMENTS (E'lonlar) */}
            {activeSubTab === "announcements" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {announcementsLoading ? (
                  <div style={{ textAlign: "center", padding: "32px", color: TEXT_MUTED, fontSize: "12px" }}>
                    E'lonlar yuklanmoqda...
                  </div>
                ) : announcements.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      backgroundColor: "#F9FAFB",
                      borderRadius: "14px",
                      border: "1px dashed #E5E7EB",
                      color: TEXT_MUTED,
                      fontSize: "12px",
                    }}
                  >
                    Hali hech qanday e'lonlar chop etilmagan.
                  </div>
                ) : (
                  announcements.map((ann: any) => {
                    const totalVotes = ann.poll_options
                      ? ann.poll_options.reduce((sum: number, opt: any) => sum + opt.vote_count, 0)
                      : 0;

                    return (
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
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                            {ann.title}
                          </div>
                          {ann.is_poll && (
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "#4F46E5", backgroundColor: "#EEF2FF", padding: "2px 6px", borderRadius: "6px" }}>
                              So'rovnoma
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: "11px", color: "#4B5563", lineHeight: 1.5, marginBottom: "8px" }}>
                          {ann.content}
                        </div>

                        {/* Interactive Poll options for Parents */}
                        {ann.is_poll && ann.poll_options && ann.poll_options.length > 0 && (
                          <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#F9FAFB", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 700, color: TEXT_MUTED }}>
                              <span>Ovoz bering:</span>
                              <span>Jami: {totalVotes} ovoz</span>
                            </div>
                            {ann.poll_options.map((opt: any) => {
                              const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleVoteParentPoll(ann.id, opt.id)}
                                  style={{
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "8px 10px",
                                    borderRadius: "8px",
                                    border: opt.user_voted ? "1px solid #C7D2FE" : "1px solid #E5E7EB",
                                    backgroundColor: opt.user_voted ? "#EEF2FF" : "#FFFFFF",
                                    position: "relative",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                  }}
                                >
                                  {/* Progress bar fill */}
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      bottom: 0,
                                      width: `${pct}%`,
                                      backgroundColor: opt.user_voted ? "#C7D2FE" : "#ECFCCA",
                                      opacity: 0.6,
                                      transition: "width 0.3s ease",
                                    }}
                                  />
                                  <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", fontWeight: 600, color: TEXT_DARK }}>
                                    <span>
                                      {opt.user_voted && <strong style={{ color: ACCENT, marginRight: "4px" }}>✓</strong>}
                                      {opt.option_text}
                                    </span>
                                    <span style={{ fontSize: "10px", color: TEXT_MUTED }}>
                                      {pct}% ({opt.vote_count})
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "9px",
                            color: TEXT_MUTED,
                            borderTop: "1px solid #F3F4F6",
                            paddingTop: "6px",
                            marginTop: "8px",
                          }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: "10px", height: "10px" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            {ann.author}
                          </span>
                          <span>{ann.date}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
            {/* Sub-tab: MENU (Taomnoma) */}
            {activeSubTab === "menu" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Centered Date Controls (matching Kundalik style) */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
                  <SmartCalendarTrigger
                    label={`${fmtDayName(selectedMenuDate)}, ${fmtDate(selectedMenuDate)}`}
                    onOpenCalendar={() => setIsSmartCalendarOpen(true)}
                    onPrevWeek={() => {
                      const d = parseLocalDate(selectedMenuDate);
                      d.setDate(d.getDate() - 1);
                      setSelectedMenuDate(toLocalDateStr(d));
                    }}
                    onNextWeek={() => {
                      const d = parseLocalDate(selectedMenuDate);
                      d.setDate(d.getDate() + 1);
                      setSelectedMenuDate(toLocalDateStr(d));
                    }}
                  />
                </div>

                {/* Week Day selector pills */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    gap: "6px",
                    overflowX: "auto",
                    paddingBottom: "8px",
                    paddingLeft: "4px",
                    paddingRight: "4px",
                    scrollbarWidth: "none",
                    width: "100%",
                  }}
                  className="scrollbar-hidden"
                >
                  {[0, 1, 2, 3, 4, 5].map((dayOffset) => {
                    const dateStr = getDayDate(currentWeekStart, dayOffset);
                    const isSelected = selectedMenuDate === dateStr;
                    return (
                      <button
                        key={dayOffset}
                        onClick={() => setSelectedMenuDate(dateStr)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "999px",
                          border: isSelected ? "2px solid #00A389" : "1px solid #E2E8F0",
                          backgroundColor: isSelected ? "#ECFDF5" : "#FFFFFF",
                          color: isSelected ? "#0F766E" : "#64748B",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmtDayName(dateStr).slice(0, 2)} ({parseLocalDate(dateStr).getDate()})
                      </button>
                    );
                  })}
                </div>

                {menuLoading ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#94A3B8" }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        border: "2px solid #CBD5E1",
                        borderTopColor: "#00A389",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 12px",
                      }}
                    />
                    Taomnoma yuklanmoqda...
                  </div>
                ) : menuData && menuData.meals && Object.keys(menuData.meals).length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                    {Object.entries(menuData.meals).map(([mealType, description]: [string, any]) => {
                      const isBreakfast = mealType.toLowerCase().includes("breakfast");
                      const isLunch = mealType.toLowerCase().includes("lunch");
                      
                      const emoji = isBreakfast ? "🍳" : isLunch ? "🍲" : "🍎";
                      const label = isBreakfast ? "Nonushta" : isLunch ? "Tushlik" : "Kechki ovqat / Meva";
                      
                      const badgeBg = isBreakfast ? "#FEF3C7" : isLunch ? "#CCFBF1" : "#FCE7F3";
                      const badgeColor = isBreakfast ? "#B45309" : isLunch ? "#0F766E" : "#9D174D";
                      const badgeBorder = isBreakfast ? "#FDE68A" : isLunch ? "#99F6E4" : "#FBCFE8";

                      return (
                        <div
                          key={mealType}
                          onDoubleClick={() => handleMenuDoubleClick(selectedMenuDate, label)}
                          style={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "20px",
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          title="Izoh qoldirish uchun 2 marta bosing"
                        >
                          {/* Card Header */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "6px 14px",
                                borderRadius: "999px",
                                backgroundColor: badgeBg,
                                color: badgeColor,
                                border: `1px solid ${badgeBorder}`,
                                fontSize: "12px",
                                fontWeight: 800,
                              }}
                            >
                              <span>{emoji}</span>
                              <span>{label}</span>
                            </div>

                            <span
                              style={{
                                fontSize: "11px",
                                color: "#94A3B8",
                                fontWeight: 600,
                              }}
                            >
                              Izoh yozish
                            </span>
                          </div>

                          {/* Description Body */}
                          <div style={{ fontSize: "13px", color: "#334155", fontWeight: 500, lineHeight: 1.6 }}>
                            {String(description).split("\n").map((line, i) => (
                              <p key={i} style={{ margin: "2px 0" }}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "48px 20px",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "20px",
                      border: "1px dashed #CBD5E1",
                      color: "#64748B",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    Ushbu kunda taomnoma belgilanmagan.
                  </div>
                )}
              </div>
            )}

            {/* Sub-tab: BALANCE (Balans va To'lovlar) */}
            {activeSubTab === "balance" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Premium Balance Card */}
                {selectedChild && (
                  <div
                    style={{
                      backgroundColor: (selectedChild.balance || 0) >= 0 ? "#ECFDF5" : "#FEF2F2",
                      border: `1.5px solid ${(selectedChild.balance || 0) >= 0 ? "#A7F3D0" : "#FEE2E2"}`,
                      borderRadius: "16px",
                      padding: "18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: (selectedChild.balance || 0) >= 0 ? "#047857" : "#B91C1C",
                          textTransform: "uppercase",
                        }}
                      >
                        Joriy balans holati
                      </span>
                      <h3
                        style={{
                          fontSize: "22px",
                          fontWeight: 900,
                          color: (selectedChild.balance || 0) >= 0 ? "#065F46" : "#991B1B",
                          margin: "4px 0 0 0",
                        }}
                      >
                        {new Intl.NumberFormat("uz-UZ").format(selectedChild.balance || 0)} UZS
                      </h3>
                    </div>
                    <div style={{ fontSize: "28px" }}>
                      {(selectedChild.balance || 0) >= 0 ? "" : ""}
                    </div>
                  </div>
                )}

                <div className="section-title">To'lovlar va Xarajatlar Tarixi</div>

                {balanceLoading ? (
                  <div style={{ textAlign: "center", padding: "32px", color: TEXT_MUTED }}>
                    Tarix yuklanmoqda...
                  </div>
                ) : balanceHistory.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {balanceHistory.map((tx) => {
                      const isPayment = tx.type === "PAYMENT";
                      return (
                        <div
                          key={tx.id}
                          style={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "12px",
                            border: "1px solid #E5E7EB",
                            padding: "12px 14px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                          }}
                        >
                          <div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK, display: "block" }}>
                              {tx.description || (isPayment ? "Hisobni to'ldirish" : "Maktab xarajati")}
                            </span>
                            <span style={{ fontSize: "10px", color: TEXT_MUTED, display: "block", marginTop: "2px" }}>
                              {new Date(tx.created_at).toLocaleDateString("uz-UZ")} {new Date(tx.created_at).toLocaleTimeString("uz-UZ", {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 800,
                              color: isPayment ? "#10B981" : "#EF4444",
                            }}
                          >
                            {isPayment ? "+" : "-"}
                            {new Intl.NumberFormat("uz-UZ").format(Math.abs(tx.amount))} UZS
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      backgroundColor: "#F9FAFB",
                      borderRadius: "14px",
                      border: "1px dashed #E5E7EB",
                      color: TEXT_MUTED,
                      fontSize: "12px",
                    }}
                  >
                    Hali hech qanday to'lovlar amalga oshirilmagan.
                  </div>
                )}
              </div>
            )}

            {activeSubTab === "comments" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {feedbackLoading ? (
                  <div style={{ textAlign: "center", padding: "32px", color: TEXT_MUTED, fontSize: "12px" }}>
                    Yuklanmoqda...
                  </div>
                ) : feedbackFeed.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      backgroundColor: "#F9FAFB",
                      borderRadius: "14px",
                      border: "1px dashed #E5E7EB",
                      color: TEXT_MUTED,
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "32px", height: "32px", color: "#00A389" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                      </svg>
                      <span>Hozircha hech qanday fikr-mulohazalar yubormagansiz.</span>
                    </div>
                  </div>
                ) : (
                  buildThreads(feedbackFeed).map((thread) => {
                    const isGrade = thread.type === "GRADE";
                    const rep = thread.representative;
                    return (
                      <div
                        key={thread.key}
                        style={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderLeft: "4px solid #4F46E5",
                          borderRadius: "16px",
                          padding: "16px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          if (isGrade) {
                            setSelectedCommentGrade({ id: thread.grade_id, subject_name: thread.subject_name, value: thread.grade_value });
                            setCommentTargetType("GRADE");
                            setCommentText("");
                            setCommentError("");
                            setCommentSuccess("");
                            setCommentModalOpen(true);
                            fetchChatMessages("GRADE", thread.grade_id);
                          } else {
                            const dateOnly = thread.menu_date ? thread.menu_date.split("T")[0] : "";
                            setSelectedCommentMenuDate(dateOnly);
                            setSelectedCommentMealLabel("Tushlik");
                            setCommentTargetType("MENU");
                            setCommentText("");
                            setCommentError("");
                            setCommentSuccess("");
                            setCommentModalOpen(true);
                            fetchChatMessages("MENU", dateOnly, userInfo?.id);
                          }
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: "1px solid #F3F4F6",
                            paddingBottom: "8px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: isGrade ? "#4F46E5" : "#D97706",
                                backgroundColor: isGrade ? "#EEF2FF" : "#FEF3C7",
                                padding: "2px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              {isGrade ? "Bahoga izoh" : "Taomnomaga izoh"}
                            </span>
                            {thread.messages.length > 1 && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  color: "#4F46E5",
                                  backgroundColor: "#EEF2FF",
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  fontFamily: "monospace",
                                }}
                              >
                                {thread.messages.length} ta xabar
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: "10px", color: TEXT_MUTED, fontFamily: "monospace" }}>
                            {new Date(rep.created_at).toLocaleDateString("uz-UZ")} {new Date(rep.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        {isGrade ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              backgroundColor: "#F9FAFB",
                              padding: "10px",
                              borderRadius: "8px",
                              border: "1px solid #F3F4F6",
                            }}
                          >
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                backgroundColor: "#ECFDF5",
                                border: "1px solid #A7F3D0",
                                color: "#065F46",
                                fontWeight: 800,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "monospace",
                                fontSize: "14px",
                              }}
                            >
                              {thread.grade_value || "-"}
                            </div>
                            <div>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: TEXT_DARK, display: "block" }}>
                                {thread.subject_name}
                              </span>
                              <span style={{ fontSize: "10px", color: TEXT_MUTED }}>
                                O&apos;quvchi: <b>{thread.student_name}</b> ({thread.class_name})
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              backgroundColor: "#F9FAFB",
                              padding: "10px",
                              borderRadius: "8px",
                              border: "1px solid #F3F4F6",
                              fontSize: "11px",
                              color: TEXT_DARK,
                              fontWeight: 650,
                            }}
                          >
                            Taomnoma kuni: {new Date(thread.menu_date || "").toLocaleDateString("uz-UZ", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </div>
                        )}

                        <div
                          style={{
                            fontSize: "12px",
                            color: TEXT_DARK,
                            backgroundColor: "#F9FAFB",
                            padding: "10px",
                            borderRadius: "8px",
                            border: "1px solid #F3F4F6",
                            fontStyle: "italic",
                            lineHeight: "1.4",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>&ldquo;{rep.content}&rdquo;</span>
                          <span style={{ fontSize: "10px", color: "#4F46E5", fontWeight: 700, fontStyle: "normal" }}>
                            Chatni ochish &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Sub-tab: CLUBS (To'garaklar) */}
            {activeSubTab === "clubs" && (() => {
              // Helper function to check time clash inside render scope
              const checkTimeClash = (targetClub: any) => {
                if (!targetClub.schedules || targetClub.schedules.length === 0) return null;
                
                // Find all clubs this child is already registered or requested
                const registeredClubs = clubs.filter(c => 
                  c.id !== targetClub.id && 
                  c.students && 
                  c.students.length > 0 && 
                  (c.students[0].status === "APPROVED" || c.students[0].status === "PENDING")
                );

                for (const regClub of registeredClubs) {
                  if (!regClub.schedules) continue;
                  for (const targetSch of targetClub.schedules) {
                    for (const regSch of regClub.schedules) {
                      if (targetSch.day_of_week === regSch.day_of_week) {
                        // Check time overlap
                        if (targetSch.start_time < regSch.end_time && regSch.start_time < targetSch.end_time) {
                          const days = ["", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
                          return {
                            clubName: regClub.name,
                            dayName: days[targetSch.day_of_week],
                            timeRange: `${regSch.start_time} - ${regSch.end_time}`
                          };
                        }
                      }
                    }
                  }
                }
                return null;
              };

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div
                    style={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "16px",
                      padding: "16px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      color: TEXT_DARK,
                    }}
                  >
                    <h3 style={{ fontSize: "14px", fontWeight: 800, margin: 0, display: "flex", alignItems: "center" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: "15px", height: "15px", marginRight: "6px", color: ACCENT }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                      </svg>
                      Farzandingiz uchun To'garaklar
                    </h3>
                    <p style={{ fontSize: "10px", color: TEXT_MUTED, margin: "4px 0 0 0" }}>
                      Farzandingiz qatnashishi mumkin bo'lgan darsdan tashqari to'garaklar va ularning jadvallari.
                    </p>
                  </div>

                  {clubsLoading ? (
                    <div style={{ textAlign: "center", padding: "32px", color: TEXT_MUTED, fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <span style={{ width: "12px", height: "12px", border: "2px solid #4F46E5", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
                      Yuklanmoqda...
                    </div>
                  ) : clubs.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "32px",
                        backgroundColor: "#F9FAFB",
                        borderRadius: "14px",
                        border: "1px dashed #E5E7EB",
                        color: TEXT_MUTED,
                        fontSize: "12px",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "24px", height: "24px", color: TEXT_MUTED }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707" />
                        </svg>
                        <span>Hozircha ushbu sinf uchun to'garaklar tashkil qilinmagan.</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {clubs.map((club) => {
                        const studentEnrollment = club.students && club.students.length > 0 ? club.students[0] : null;
                        const status = studentEnrollment ? studentEnrollment.status : null;
                        const clash = checkTimeClash(club);

                        return (
                          <div
                            key={club.id}
                            style={{
                              backgroundColor: "white",
                              border: "1px solid #E5E7EB",
                              borderRadius: "16px",
                              padding: "16px",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                              <div>
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 800,
                                    color: "#4F46E5",
                                    backgroundColor: "#EEF2FF",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {club.subject_name}
                                </span>
                                <h4 style={{ fontSize: "13px", fontWeight: 800, color: TEXT_DARK, margin: "6px 0 2px 0" }}>
                                  {club.name}
                                </h4>
                                <p style={{ fontSize: "10px", color: TEXT_MUTED, margin: 0 }}>
                                  Mas'ul o'qituvchi: <b>{club.teacher_name}</b>
                                </p>
                              </div>

                              <div>
                                {status === "APPROVED" ? (
                                  <button
                                    type="button"
                                    disabled={joinRequestLoading === club.id}
                                    onClick={() => handleCancelClubRequest(club.id)}
                                    style={{
                                      border: "1px solid #A7F3D0",
                                      backgroundColor: "#ECFDF5",
                                      color: "#065F46",
                                      fontWeight: 700,
                                      fontSize: "10px",
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    A'zo (Chiqish)
                                  </button>
                                ) : status === "PENDING" ? (
                                  <button
                                    type="button"
                                    disabled={joinRequestLoading === club.id}
                                    onClick={() => handleCancelClubRequest(club.id)}
                                    style={{
                                      border: "1px solid #FEF3C7",
                                      backgroundColor: "#FFFBEB",
                                      color: "#B45309",
                                      fontWeight: 700,
                                      fontSize: "10px",
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Kutilmoqda (Bekor qilish)
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={joinRequestLoading === club.id}
                                    onClick={() => handleRequestJoinClub(club.id)}
                                    style={{
                                      border: "none",
                                      backgroundColor: "#4F46E5",
                                      color: "white",
                                      fontWeight: 700,
                                      fontSize: "10px",
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Qatnashish so'rovi
                                  </button>
                                )}
                              </div>
                            </div>

                            {clash && (
                              <div
                                style={{
                                  backgroundColor: "#FFFBEB",
                                  border: "1px solid #FDE68A",
                                  color: "#B45309",
                                  padding: "8px 12px",
                                  borderRadius: "10px",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#B45309" style={{ width: "13px", height: "13px", flexShrink: 0 }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                <span>Diqqat! Ushbu to'garak dars vaqti farzandingiz yozilgan "{clash.clubName}" ({clash.dayName}: {clash.timeRange}) to'garagi dars vaqtiga to'g'ri kelib qoladi (ustma-ust tushadi).</span>
                              </div>
                            )}

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <span style={{ fontSize: "9px", fontWeight: 800, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.5px", display: "inline-flex", alignItems: "center" }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: "10px", height: "10px", marginRight: "4px" }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                                Dars Jadvali
                              </span>
                              {(!club.schedules || club.schedules.length === 0) ? (
                                <span style={{ fontSize: "11px", color: TEXT_MUTED, fontStyle: "italic" }}>Dars vaqti belgilanmagan</span>
                              ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                                  {club.schedules.map((sch: any) => {
                                    const days = ["", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
                                    return (
                                      <div
                                        key={sch.id}
                                        style={{
                                          backgroundColor: "#F9FAFB",
                                          border: "1px solid #E5E7EB",
                                          padding: "8px",
                                          borderRadius: "10px",
                                          fontSize: "11px",
                                        }}
                                      >
                                        <b style={{ color: TEXT_DARK }}>{days[sch.day_of_week]}</b>
                                        <span style={{ display: "block", fontSize: "10px", color: TEXT_MUTED, marginTop: "2px" }}>
                                          {sch.start_time} - {sch.end_time}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Sub-tab: BOOKS (Kitobxonlik / Elektron Kutubxona) */}
            {activeSubTab === "books" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: TEXT_DARK, margin: 0 }}>
                      Elektron Kutubxona
                    </h3>
                    <p style={{ fontSize: "12px", color: TEXT_MUTED, margin: "2px 0 0 0" }}>
                      {selectedChild ? `${selectedChild.first_name} uchun tavsiya etilgan kitoblar` : "Maktab o'quvchilari uchun tavsiya etilgan kitoblar"}
                    </p>
                  </div>
                </div>

                {parentBooksLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px", backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E5E7EB" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: `3px solid ${ACCENT_MID}`, borderTopColor: ACCENT, animation: "spin 0.8s linear infinite" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: TEXT_MUTED, marginTop: "12px" }}>Kitoblar yuklanmoqda...</span>
                  </div>
                ) : parentBooks.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px", backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E5E7EB", textAlign: "center" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "16px", backgroundColor: ACCENT_LIGHT, color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", fontSize: "24px" }}>
                      📚
                    </div>
                    <h4 style={{ fontSize: "15px", fontWeight: 700, color: TEXT_DARK, margin: 0 }}>Kitoblar topilmadi</h4>
                    <p style={{ fontSize: "12px", color: TEXT_MUTED, margin: "4px 0 0 0", maxWidth: "320px" }}>
                      Hozircha tavsiya etilgan elektron kitoblar mavjud emas.
                    </p>
                  </div>
                ) : (
                  <div className="diary-grid">
                    {parentBooks.map((b: any) => {
                      const rawLink = (b.download_link || b.file_url || "").trim();
                      const bookFullUrl = rawLink ? (rawLink.startsWith("http://") || rawLink.startsWith("https://") ? rawLink : `${API_URL}${rawLink}`) : "";
                      const coverFullUrl = b.cover_url ? (b.cover_url.startsWith("http://") || b.cover_url.startsWith("https://") ? b.cover_url : `${API_URL}${b.cover_url}`) : "";

                      return (
                        <div
                          key={b.id}
                          style={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "16px",
                            border: "1px solid #E5E7EB",
                            overflow: "hidden",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          {/* Cover header */}
                          <div style={{ height: "160px", backgroundColor: "#1D1E26", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {coverFullUrl ? (
                              <img src={coverFullUrl} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1D1E26 0%, #374151 100%)", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#D4F562", color: "#1D1E26", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "16px" }}>
                                  📚
                                </div>
                                <div>
                                  <p style={{ color: "#FFFFFF", fontSize: "12px", fontWeight: 800, margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                    {b.title}
                                  </p>
                                  {b.author && (
                                    <p style={{ color: "#9CA3AF", fontSize: "10px", fontWeight: 600, margin: "2px 0 0 0" }}>
                                      {b.author}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 10 }}>
                              <span style={{ backgroundColor: "#ECFCCA", color: "#1D1E26", border: "1px solid #BEF264", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "6px" }}>
                                {b.target_levels && b.target_levels.length > 0 ? `${b.target_levels.join(", ")}-sinf` : "Barcha sinflar"}
                              </span>
                            </div>
                          </div>

                          {/* Body */}
                          <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                              <h4 style={{ fontSize: "14px", fontWeight: 800, color: TEXT_DARK, margin: 0, lineHeight: 1.3 }}>
                                {b.title}
                              </h4>
                              {b.author && (
                                <p style={{ fontSize: "11px", fontWeight: 700, color: ACCENT, margin: "4px 0 0 0" }}>
                                  {b.author}
                                </p>
                              )}
                              {b.description && (
                                <p style={{ fontSize: "11px", color: TEXT_MUTED, margin: "8px 0 0 0", lineHeight: 1.4 }}>
                                  {b.description}
                                </p>
                              )}
                            </div>

                            {(bookFullUrl || b.location_in_school) && (
                              <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                {bookFullUrl ? (
                                  <a
                                    href={bookFullUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      backgroundColor: ACCENT,
                                      color: "#FFFFFF",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      padding: "8px 14px",
                                      borderRadius: "10px",
                                      textDecoration: "none",
                                      boxShadow: "0 2px 6px rgba(79,70,229,0.2)",
                                    }}
                                  >
                                    <span>Yuklab olish / O'qish (PDF)</span>
                                    {b.file_size && <span style={{ opacity: 0.8, fontSize: "10px" }}>({b.file_size})</span>}
                                  </a>
                                ) : b.location_in_school ? (
                                  <span style={{ fontSize: "11px", color: TEXT_MUTED, fontWeight: 600 }}>
                                    📍 Kutubxonada: {b.location_in_school}
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── MAIN TAB: SETTINGS ── */}
        {activeTab === "settings" && (
          <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#1E293B" }}>Tizim Sozlamalari</div>

            {/* User Profile Card */}
            {userInfo && (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "24px",
                  padding: "24px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#00A389",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                  }}
                >
                  FOYDALANUVCHI PROFILI
                </span>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                  {/* Ism Field */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: "#F8FAFC", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#ECFDF5", color: "#00A389" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>F.I.SH.</div>
                      <div style={{ fontSize: "13px", fontWeight: 750, color: "#1E293B" }}>{userInfo.first_name} {userInfo.last_name}</div>
                    </div>
                  </div>

                  {/* Telefon Field */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: "#F8FAFC", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#EFF6FF", color: "#2563EB" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.502-5.127-3.805-6.63-6.63l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Telefon raqam</div>
                      <div style={{ fontSize: "13px", fontWeight: 750, color: "#1E293B", fontFamily: "monospace" }}>{userInfo.phone || "+998908000002"}</div>
                    </div>
                  </div>

                  {/* Pasport Field */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: "#F8FAFC", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#FEF3C7", color: "#D97706" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Pasport seriya</div>
                      <div style={{ fontSize: "13px", fontWeight: 750, color: "#1E293B", fontFamily: "monospace" }}>{userInfo.passport || "Kiritilmagan"}</div>
                    </div>
                  </div>

                  {/* Roli Field */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: "#F8FAFC", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#F5F3FF", color: "#7C3AED" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Roli</div>
                      <div style={{ fontSize: "13px", fontWeight: 750, color: "#1E293B" }}>Vasiy (Ota-ona)</div>
                    </div>
                  </div>

                  {/* Telegram Bot Field */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: "#F8FAFC", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "10px", backgroundColor: userInfo.telegram_id ? "#ECFDF5" : "#FEF2F2", color: userInfo.telegram_id ? "#16A34A" : "#DC2626" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 18.661a1 1 0 01-.225-.67c.03-.083.06-.168.086-.254a6.437 6.437 0 00.32-1.921c0-.445-.193-.863-.526-1.156C3.03 13.75 2.25 11.25 2.25 8.25 2.25 5.25 3.03 2.75 5.065 1.761a6.437 6.437 0 00.32-1.921A1 1 0 015.61.51c.026-.086.056-.17.086-.254a5.97 5.97 0 012.87 2.428A9.764 9.764 0 0112 3.75c4.97 0 9 3.694 9 8.25z" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Telegram Xabarnoma</div>
                      <div style={{ fontSize: "13px", fontWeight: 750 }}>
                        {userInfo.telegram_id ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#16A34A" }}>
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#16A34A" }}></span>
                            Ulangan
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#DC2626" }}>
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#DC2626" }}></span>
                            Ulanmagan
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditPassport(userInfo.passport || "");
                    setShowEditParentModal(true);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    backgroundColor: "#ECFDF5",
                    border: "1px solid #A7F3D0",
                    borderRadius: "14px",
                    color: "#0F766E",
                    fontWeight: 800,
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  Pasport ma'lumotini tahrirlash
                </button>

                {!userInfo.telegram_id && (
                  <div
                    style={{
                      backgroundColor: "#F0FDFA",
                      border: "1px solid #CCFBF1",
                      borderRadius: "16px",
                      padding: "16px",
                      fontSize: "12px",
                      color: "#0F766E",
                      lineHeight: 1.6,
                    }}
                  >
                    <b style={{ color: "#0F766E", display: "block", marginBottom: "6px" }}>
                      Telegram Bildirishnomalari:
                    </b>
                    {telegramConfig?.has_token ? (
                      <div>
                        Farzandlaringiz baholari va maktab e'lonlarini Telegramda olishingiz mumkin. Buning uchun:
                        <ol style={{ paddingLeft: "18px", marginTop: "6px", margin: "6px 0 0 0" }}>
                          <li>1. Telegramda <a href={`https://t.me/${telegramConfig.bot_username}`} target="_blank" rel="noopener noreferrer" style={{ color: "#00A389", fontWeight: 800, textDecoration: "underline" }}>@{telegramConfig.bot_username}</a> botiga kiring.</li>
                          <li>2. Botga <b>/start</b> buyrug'ini yuboring.</li>
                          <li>3. Telefon raqamingiz (<b>{userInfo.phone || "tizimdagi telefon raqam"}</b>) va shaxsiy parolingizni kiritib tizimga kiring.</li>
                        </ol>
                      </div>
                    ) : (
                      <span style={{ color: "#B45309", fontWeight: 600 }}>
                        Maktab ma'muriyati shaxsiy Telegram botni hali sozlamagan. Sozlangandan so'ng, bu yerda bot havolasi ko'rinadi.
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Student child profile card */}
            {children.length > 0 && (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "24px",
                  padding: "24px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#00A389",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                  }}
                >
                  O&apos;QUVCHILAR MA&apos;LUMOTLARI
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {children.map((child, index) => (
                    <div
                      key={child.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        borderBottom: index === children.length - 1 ? "none" : "1px solid #F1F5F9",
                        paddingBottom: index === children.length - 1 ? "0" : "16px"
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                        {/* F.I.SH */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", backgroundColor: "#F8FAFC", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "#ECFDF5", color: "#00A389" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: "14px", height: "14px" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M22.25 9.375a.375.375 0 100-.75.375.375 0 000 .75z" />
                            </svg>
                          </div>
                          <div>
                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>F.I.SH.</div>
                            <div style={{ fontSize: "12px", fontWeight: 750, color: "#1E293B" }}>{child.first_name} {child.last_name}</div>
                          </div>
                        </div>

                        {/* Sinf */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", backgroundColor: "#F8FAFC", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "#ECFDF5", color: "#059669" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: "14px", height: "14px" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.68 0-5.302.2-7.862.582V21M3 21h18" />
                            </svg>
                          </div>
                          <div>
                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Sinf</div>
                            <div style={{ fontSize: "12px", fontWeight: 750, color: "#1E293B" }}>{child.class_name}</div>
                          </div>
                        </div>

                        {/* Manzil */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", backgroundColor: "#F8FAFC", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "#FFF1F2", color: "#E11D48" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: "14px", height: "14px" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
                            </svg>
                          </div>
                          <div>
                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Manzil</div>
                            <div style={{ fontSize: "12px", fontWeight: 750, color: "#1E293B" }}>{child.address || "Kiritilmagan"}</div>
                          </div>
                        </div>

                        {/* Tug'ilgan sana */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", backgroundColor: "#F8FAFC", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "#FEF3C7", color: "#D97706" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: "14px", height: "14px" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                          </div>
                          <div>
                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Tug'ilgan sana</div>
                            <div style={{ fontSize: "12px", fontWeight: 750, color: "#1E293B" }}>{child.birthdate ? child.birthdate.split("T")[0] : "Kiritilmagan"}</div>
                          </div>
                        </div>

                        {/* Guvohnoma */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", backgroundColor: "#F8FAFC", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "#EFF6FF", color: "#2563EB" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: "14px", height: "14px" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                          </div>
                          <div>
                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Guvohnoma (INA)</div>
                            <div style={{ fontSize: "12px", fontWeight: 750, color: "#1E293B", fontFamily: "monospace" }}>{child.ina || "Kiritilmagan"}</div>
                          </div>
                        </div>

                        {/* Balans */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", backgroundColor: "#F8FAFC", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "8px", backgroundColor: (child.balance || 0) >= 0 ? "#ECFDF5" : "#FEF2F2", color: (child.balance || 0) >= 0 ? "#16A34A" : "#DC2626" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: "14px", height: "14px" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.214.172a2.25 2.25 0 003.11-.168L12 15M9 7.818l.214-.172a2.25 2.25 0 013.11.168L12 9" />
                            </svg>
                          </div>
                          <div>
                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Balans</div>
                            <div style={{ fontSize: "12px", fontWeight: 850, color: (child.balance || 0) >= 0 ? "#16A34A" : "#DC2626" }}>{new Intl.NumberFormat("uz-UZ").format(child.balance || 0)} UZS</div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingStudentId(child.id);
                          setEditAddress(child.address || "");
                          setEditBirthDate(child.birthdate ? child.birthdate.split("T")[0] : "");
                          setEditINA(child.ina || "");
                          setEditError("");
                          setShowMapPicker(false);
                          setShowEditStudentModal(true);
                        }}
                        style={{
                          marginTop: "8px",
                          width: "100%",
                          padding: "10px",
                          backgroundColor: "#ECFDF5",
                          border: "1px solid #A7F3D0",
                          borderRadius: "12px",
                          color: "#0F766E",
                          fontWeight: 800,
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        Farzand ma'lumotlarini tahrirlash
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={promptLogout}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FEE2E2",
                borderRadius: "16px",
                color: "#991B1B",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(220,38,38,0.06)",
                transition: "all 0.15s ease",
              }}
            >
              Tizimdan chiqish
            </button>
          </div>
        )}
        </main>

        {/* ── MOBILE SIDE NAVIGATION DRAWER (Slide-over menu on small screens) ── */}
        {isMobileMenuOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.55)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 2000,
              display: "flex",
            }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              style={{
                width: "290px",
                height: "100%",
                backgroundColor: "#FFFFFF",
                boxShadow: "8px 0 32px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                padding: "20px",
                gap: "16px",
                zIndex: 2001,
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #00A389 0%, #0F766E 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 900,
                      fontSize: "16px",
                      boxShadow: "0 4px 10px rgba(0,163,137,0.3)",
                    }}
                  >
                    ✦
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#1E293B" }}>Online Jurnal</div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Ota-ona Portali</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "#F1F5F9",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748B",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ height: "1px", backgroundColor: "#E2E8F0" }} />

              {/* Navigation Items List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                {[
                  { id: "diary", isSettings: false, label: "Kundalik", icon: <TabIconDiary /> },
                  { id: "dynamics", isSettings: false, label: "Dinamika", icon: <TabIconDynamics /> },
                  { id: "announcements", isSettings: false, label: "E'lonlar", icon: <TabIconAnnouncements /> },
                  { id: "menu", isSettings: false, label: "Taomnoma", icon: <TabIconMenu /> },
                  { id: "balance", isSettings: false, label: "Balans", icon: <TabIconBalance /> },
                  { id: "comments", isSettings: false, label: "Murojaatlar", icon: <TabIconComments /> },
                  { id: "clubs", isSettings: false, label: "To'garaklar", icon: <TabIconClubs /> },
                  { id: "books", isSettings: false, label: "Kitobxonlik", icon: <TabIconBooks /> },
                  { id: "settings", isSettings: true, label: "Sozlamalar", icon: <TabIconSettings /> },
                ].map((item) => {
                  const isActive = item.isSettings ? activeTab === "settings" : (activeTab === "home" && activeSubTab === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.isSettings) {
                          setActiveTab("settings");
                        } else {
                          setActiveTab("home");
                          setActiveSubTab(item.id as any);
                        }
                        setIsMobileMenuOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 14px",
                        borderRadius: "14px",
                        border: "none",
                        backgroundColor: isActive ? "#F5C542" : "transparent",
                        color: isActive ? "#0F172A" : "#475569",
                        fontWeight: isActive ? 800 : 600,
                        fontSize: "13px",
                        cursor: "pointer",
                        boxShadow: isActive ? "0 4px 12px rgba(245, 197, 66, 0.35)" : "none",
                        transition: "all 0.15s ease",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <div style={{ width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ height: "1px", backgroundColor: "#E2E8F0" }} />

              {/* Logout Button */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FEE2E2",
                  borderRadius: "14px",
                  color: "#991B1B",
                  fontWeight: 800,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Tizimdan chiqish
              </button>
            </div>
          </div>
        )}

        {/* EDIT STUDENT PROFILE MODAL */}
        {showEditStudentModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "16px",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "20px",
                width: "100%",
                maxWidth: "400px",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: TEXT_DARK, marginBottom: "16px" }}>
                O'quvchi ma'lumotlarini yangilash
              </h3>
              {editError && (
                <div style={{ color: "#EF4444", fontSize: "12px", marginBottom: "12px", fontWeight: 600 }}>
                  {editError}
                </div>
              )}
              {showMapPicker ? (
                <MapPicker
                  initialAddress={editAddress}
                  onSelectAddress={(addr) => setEditAddress(addr)}
                  onClose={() => setShowMapPicker(false)}
                />
              ) : (
                <form onSubmit={handleUpdateStudentProfile}>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: TEXT_MUTED }}>
                        Manzil
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        style={{
                          background: "none",
                          border: "none",
                          color: ACCENT,
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          textDecoration: "underline",
                          padding: 0
                        }}
                      >
                        Xaritadan tanlash
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                        fontSize: "13px",
                        color: TEXT_DARK,
                      }}
                      placeholder="Masalan: Toshkent sh., Chilonzor 6-daha"
                    />
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: TEXT_MUTED, display: "block", marginBottom: "4px" }}>
                      Tug'ilgan sana
                    </label>
                    <input
                      type="date"
                      value={editBirthDate}
                      onChange={(e) => setEditBirthDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                        fontSize: "13px",
                        color: TEXT_DARK,
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: TEXT_MUTED, display: "block", marginBottom: "4px" }}>
                      Guvohnoma (INA)
                    </label>
                    <input
                      type="text"
                      value={editINA}
                      onChange={(e) => setEditINA(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                        fontSize: "13px",
                        color: TEXT_DARK,
                        fontFamily: "monospace",
                      }}
                      placeholder="Masalan: I-TV No 123456"
                    />
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setShowEditStudentModal(false)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        backgroundColor: "#F3F4F6",
                        border: "none",
                        borderRadius: "8px",
                        color: TEXT_DARK,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={editSaving}
                      style={{
                        flex: 1,
                        padding: "10px",
                        backgroundColor: ACCENT,
                        border: "none",
                        borderRadius: "8px",
                        color: "white",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {editSaving ? "Saqlanmoqda..." : "Saqlash"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* EDIT PARENT PROFILE MODAL */}
        {showEditParentModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "16px",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "20px",
                width: "100%",
                maxWidth: "400px",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: TEXT_DARK, marginBottom: "16px" }}>
                Pasport ma'lumotlarini yangilash
              </h3>
              {editParentError && (
                <div style={{ color: "#EF4444", fontSize: "12px", marginBottom: "12px", fontWeight: 600 }}>
                  {editParentError}
                </div>
              )}
              <form onSubmit={handleUpdateParentProfile}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: TEXT_MUTED, display: "block", marginBottom: "4px" }}>
                    Pasport seriyasi va raqami
                  </label>
                  <input
                    type="text"
                    value={editPassport}
                    onChange={(e) => setEditPassport(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #E5E7EB",
                      fontSize: "13px",
                      color: TEXT_DARK,
                      textTransform: "uppercase",
                      fontFamily: "monospace",
                    }}
                    placeholder="Masalan: AA1234567"
                  />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowEditParentModal(false)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      backgroundColor: "#F3F4F6",
                      border: "none",
                      borderRadius: "8px",
                      color: TEXT_DARK,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={editParentSaving}
                    style={{
                      flex: 1,
                      padding: "10px",
                      backgroundColor: ACCENT,
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {editParentSaving ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Comment Writing Modal */}
        {commentModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "16px",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "20px",
                width: "100%",
                maxWidth: "450px",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                maxHeight: "90vh",
              }}
            >
              <div style={{ display: "flex", justifySelf: "stretch", justifyContent: "between", alignItems: "start", marginBottom: "8px" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: TEXT_DARK, marginBottom: "4px" }}>
                    Muhokama (Chat)
                  </h3>
                  <p style={{ fontSize: "11px", color: TEXT_MUTED, lineHeight: "1.4" }}>
                    {commentTargetType === "GRADE" ? (
                      <>
                        <b>{selectedCommentGrade?.subject_name}</b> ({selectedCommentGrade?.value} baho)
                      </>
                    ) : (
                      <>
                        <b>{selectedCommentMenuDate}</b> ({selectedCommentMealLabel}) taomnomasi
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCommentModalOpen(false)}
                  style={{
                    border: "none",
                    background: "none",
                    fontSize: "20px",
                    color: TEXT_MUTED,
                    cursor: "pointer",
                    padding: "0 4px",
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Chat Messages Section */}
              <div
                style={{
                  maxHeight: "320px",
                  minHeight: "150px",
                  overflowY: "auto",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "12px",
                  marginBottom: "16px",
                  backgroundColor: "#F9FAFB",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  flex: 1,
                }}
              >
                {chatLoading && chatMessages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px", color: TEXT_MUTED, fontSize: "12px" }}>
                    <div style={{ width: "20px", height: "20px", border: "2px solid #E5E7EB", borderTopColor: ACCENT, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
                    Yuklanmoqda...
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px", color: TEXT_MUTED, fontSize: "12px", fontStyle: "italic" }}>
                    Hozircha xabarlar yo'q. Birinchi bo'lib fikringizni yozing!
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => {
                    const isMyMessage = msg.author_id === userInfo?.id;
                    return (
                      <div
                        key={msg.id || idx}
                        style={{
                          alignSelf: isMyMessage ? "flex-end" : "flex-start",
                          maxWidth: "80%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        {!isMyMessage && (
                          <span style={{ fontSize: "9px", color: TEXT_MUTED, marginBottom: "2px", fontWeight: 700 }}>
                            {msg.author_name} ({msg.role === "ADMIN" ? "Admin" : "O'qituvchi"})
                          </span>
                        )}
                        <div
                          style={{
                            backgroundColor: isMyMessage ? ACCENT : "#E5E7EB",
                            color: isMyMessage ? "white" : TEXT_DARK,
                            borderRadius: "12px",
                            padding: "8px 12px",
                            fontSize: "12px",
                            fontWeight: 500,
                            lineHeight: "1.4",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          }}
                        >
                          {msg.content}
                        </div>
                        <span
                          style={{
                            fontSize: "8px",
                            color: TEXT_MUTED,
                            marginTop: "2px",
                            alignSelf: isMyMessage ? "flex-end" : "flex-start",
                            fontFamily: "monospace",
                          }}
                        >
                          {new Date(msg.created_at).toLocaleTimeString("uz-UZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {commentError && (
                <div style={{ color: "#EF4444", fontSize: "12px", marginBottom: "12px", fontWeight: 600 }}>
                  {commentError}
                </div>
              )}

              <form onSubmit={handleCommentSubmit} style={{ display: "flex", gap: "8px", alignItems: "end" }}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={2}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    fontSize: "13px",
                    color: TEXT_DARK,
                    resize: "none",
                    outline: "none",
                  }}
                  placeholder="Xabar yozing..."
                />
                <button
                  type="submit"
                  disabled={commentSubmitLoading}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: ACCENT,
                    border: "none",
                    borderRadius: "10px",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "13px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {commentSubmitLoading ? "..." : "Yuborish"}
                </button>
              </form>
            </div>
          </div>
        )}
        {/* LOGOUT CONFIRMATION MODAL */}
        <CustomDialogModal
          isOpen={showLogoutModal}
          type="danger"
          title="Tizimdan chiqish"
          message="Haqiqatan ham ota-ona portalidan chiqmoqchimisiz?"
          confirmText="Ha, chiqish"
          cancelText="Bekor qilish"
          onConfirm={() => {
            setShowLogoutModal(false);
            handleLogout();
          }}
          onCancel={() => setShowLogoutModal(false)}
        />

        {/* GENERIC CONFIRM / ALERT MODAL */}
        <CustomDialogModal
          isOpen={dialogState.isOpen}
          type={dialogState.type}
          title={dialogState.title}
          message={dialogState.message}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          onConfirm={dialogState.onConfirm}
          onCancel={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
}
