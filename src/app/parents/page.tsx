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
  if (type === "MASTERY") return "📚 O'zlashtirish";
  if (type === "BEHAVIOR") return "🧠 Xulqi";
  if (type === "ATTENDANCE") return "⏰ Davomat";
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
   Main Component
───────────────────────────────────────── */
export default function ParentDashboard() {
  const router = useRouter();

  // Bottom navigation state: "home" | "settings"
  const [activeTab, setActiveTab] = useState<"home" | "settings">("home");

  // Home view sub-tabs: "diary" | "dynamics" | "announcements" | "menu" | "balance"
  const [activeSubTab, setActiveSubTab] = useState<"diary" | "dynamics" | "announcements" | "menu" | "balance">("diary");

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
      fetchParentInfo(savedToken, parsedUser.id, savedSchoolId);
      fetchLinkedChildren(savedToken, parsedUser.id, savedSchoolId);
      fetchGradingSystems(savedToken, savedSchoolId);
    } catch {
      router.push("/login");
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
      if (response.ok) setGrades(Array.isArray(data) ? data : []);
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
      }
    }
  }, [selectedChildId, selectedMenuDate, activeSubTab, token]);

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

  const handleLogout = () => {
    localStorage.removeItem("school_token");
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

  // Calculate day-by-day rows for active week
  const daysOfWeek = [0, 1, 2, 3, 4, 5].map((dayIdx) => {
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
      const grade = dayGrades.find((g) => g.subject_name === subject);
      return {
        subjectName: subject,
        grade,
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
          <span style={{ fontSize: "24px" }}>⚠️</span>
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
              <span style={{ fontSize: "24px" }}>🔔</span>
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

        /* App container expanding on desktop screens */
        .app-container {
          max-width: 480px;
          transition: max-width 0.3s ease;
        }
        @media (min-width: 768px) {
          .app-container {
            max-width: 960px !important;
          }
        }

        /* 3x2 Grid for PC, 2x3 for Android */
        .diary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (min-width: 768px) {
          .diary-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
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

      {/* Viewport wrapper (max-width: 480px, responsive to 960px on PC) */}
      <div
        className="app-container"
        style={{
          width: "100%",
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
            {/* Child card selector */}
            {children.length > 1 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                  marginBottom: "24px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                {children.map((child) => {
                  const isSelected = selectedChildId === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChildId(child.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "16px",
                        borderRadius: "16px",
                        border: isSelected ? `2px solid ${ACCENT}` : "1px solid #E5E7EB",
                        backgroundColor: isSelected ? ACCENT_LIGHT : "#FFFFFF",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                        boxShadow: isSelected ? "0 4px 12px rgba(79,70,229,0.08)" : "0 1px 3px rgba(0,0,0,0.02)",
                        outline: "none",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "12px",
                          backgroundColor: isSelected ? ACCENT : "#F3F4F6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          transition: "all 0.2s ease",
                        }}
                      >
                        👦
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: isSelected ? ACCENT : TEXT_DARK,
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {child.first_name} {child.last_name}
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            fontWeight: 500,
                            color: isSelected ? "#6366F1" : TEXT_MUTED,
                            margin: "2px 0 0 0",
                          }}
                        >
                          {child.class_name} sinfi
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Child Profile Summary Card */}
            {selectedChild && (
              <div
                style={{
                  background: "linear-gradient(135deg, #4F46E5 0%, #312E81 100%)",
                  borderRadius: "20px",
                  padding: "20px",
                  color: "#FFFFFF",
                  marginBottom: "20px",
                  boxShadow: "0 10px 25px rgba(79, 70, 229, 0.25)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Decorative blob */}
                <div
                  style={{
                    position: "absolute",
                    top: "-20%",
                    right: "-10%",
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                  }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>
                      {selectedChild.first_name} {selectedChild.last_name}
                    </h2>
                    <p style={{ fontSize: "12px", color: "#E0E7FF", margin: "4px 0 0 0", fontWeight: 500 }}>
                      Sinf: {selectedChild.class_name}
                    </p>
                  </div>
                  
                  {/* Balance Badge */}
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "10px", textTransform: "uppercase", color: "#C7D2FE", display: "block" }}>
                      Balans
                    </span>
                    <span
                      style={{
                        fontSize: "18px",
                        fontWeight: 900,
                        color: (selectedChild.balance || 0) >= 0 ? "#34D399" : "#F87171",
                        display: "block",
                      }}
                    >
                      {new Intl.NumberFormat("uz-UZ").format(selectedChild.balance || 0)} UZS
                    </span>
                    {nextChargeData && (
                      <span
                        style={{
                          fontSize: "9px",
                          color: "#C7D2FE",
                          display: "block",
                          marginTop: "4px",
                          opacity: 0.9,
                          fontWeight: 500,
                        }}
                      >
                        To'lov: {new Date(nextChargeData.charge_date).toLocaleDateString("uz-UZ")} ({new Intl.NumberFormat("uz-UZ").format(nextChargeData.amount)} UZS)
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginTop: "16px",
                    borderTop: "1px solid rgba(255,255,255,0.15)",
                    paddingTop: "12px",
                    fontSize: "11px",
                  }}
                >
                  <div>
                    <span style={{ color: "#C7D2FE", display: "block" }}>Tug'ilgan kuni:</span>
                    <span style={{ fontWeight: 600 }}>
                      {selectedChild.birthdate
                        ? new Date(selectedChild.birthdate).toLocaleDateString("uz-UZ")
                        : "Kiritilmagan"}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#C7D2FE", display: "block" }}>Guvohnoma (INA):</span>
                    <span style={{ fontWeight: 600, fontFamily: "monospace" }}>
                      {selectedChild.ina || "Kiritilmagan"}
                    </span>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ color: "#C7D2FE", display: "block" }}>Manzil:</span>
                    <span style={{ fontWeight: 600 }}>{selectedChild.address || "Kiritilmagan"}</span>
                  </div>
                </div>

                {/* Edit profile button */}
                <button
                  onClick={() => {
                    setEditingStudentId(selectedChild.id);
                    setEditAddress(selectedChild.address || "");
                    setEditBirthDate(selectedChild.birthdate ? selectedChild.birthdate.split("T")[0] : "");
                    setEditINA(selectedChild.ina || "");
                    setShowEditStudentModal(true);
                  }}
                  style={{
                    marginTop: "14px",
                    width: "100%",
                    padding: "8px",
                    backgroundColor: "rgba(255,255,255,0.15)",
                    border: "none",
                    borderRadius: "10px",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "11px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  📝 Ma'lumotlarni tahrirlash
                </button>
              </div>
            )}

            {renderWarningAlerts()}

            {/* Sub-tab Navigation */}
            <div
              className="scrollbar-hidden"
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
                📓 Kundalik
              </button>
              <button
                className={`sub-tab-btn${activeSubTab === "dynamics" ? " active" : ""}`}
                onClick={() => setActiveSubTab("dynamics")}
                style={{ flexShrink: 0, paddingLeft: "12px", paddingRight: "12px" }}
              >
                📈 Dinamika
              </button>
              <button
                className={`sub-tab-btn${activeSubTab === "announcements" ? " active" : ""}`}
                onClick={() => setActiveSubTab("announcements")}
                style={{ flexShrink: 0, paddingLeft: "12px", paddingRight: "12px" }}
              >
                📢 E&apos;lonlar
              </button>
              <button
                className={`sub-tab-btn${activeSubTab === "menu" ? " active" : ""}`}
                onClick={() => setActiveSubTab("menu")}
                style={{ flexShrink: 0, paddingLeft: "12px", paddingRight: "12px" }}
              >
                🍽️ Taomnoma
              </button>
              <button
                className={`sub-tab-btn${activeSubTab === "balance" ? " active" : ""}`}
                onClick={() => setActiveSubTab("balance")}
                style={{ flexShrink: 0, paddingLeft: "12px", paddingRight: "12px" }}
              >
                💳 Balans
              </button>
            </div>

            {/* Sub-tab: DIARY (Kundalik) */}
            {activeSubTab === "diary" && (
              <div>
                {/* Week Navigation Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#F4EFE6",
                    border: "1px solid #D8D3C9",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    marginBottom: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <button
                    onClick={handlePrevWeek}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: ACCENT,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    ⬅️ Oldingi hafta
                  </button>

                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      color: TEXT_DARK,
                    }}
                  >
                    📅 {weekLabel(currentWeekStart)}
                  </span>

                  <button
                    onClick={handleNextWeek}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: ACCENT,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    Keyingi hafta ➡️
                  </button>
                </div>

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
                        ✍️ Kundalikni tasdiqlash (Ota-ona imzosi)
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
                    <span style={{ fontSize: "24px", display: "block", marginBottom: "8px" }}>📊</span>
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
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              {/* Grade Type Select */}
                              <select
                                value={filter.type}
                                onChange={(e) => setChartFilters(prev => ({
                                  ...prev,
                                  [subject]: { ...filter, type: e.target.value }
                                }))}
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 600,
                                  color: TEXT_DARK,
                                  backgroundColor: "#F3F4F6",
                                  border: "1px solid #E5E7EB",
                                  borderRadius: "6px",
                                  padding: "3px 6px",
                                  outline: "none",
                                  cursor: "pointer"
                                }}
                              >
                                {uniqueGradeTypes.map(t => (
                                  <option key={t} value={t}>{getGradeTypeDisplayName(t)}</option>
                                ))}
                              </select>

                              {/* Category Select - only shown for MASTERY */}
                              {filter.type === "MASTERY" && (
                                <select
                                  value={filter.category}
                                  onChange={(e) => setChartFilters(prev => ({
                                    ...prev,
                                    [subject]: { ...filter, category: e.target.value }
                                  }))}
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 600,
                                    color: TEXT_DARK,
                                    backgroundColor: "#F3F4F6",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: "6px",
                                    padding: "3px 6px",
                                    outline: "none",
                                    cursor: "pointer"
                                  }}
                                >
                                  <option value="DAILY">📅 Kundalik</option>
                                  <option value="QUARTERLY_EXAM">🏆 Choraklik</option>
                                  <option value="SEMESTER_EXAM">🎓 Imtihon</option>
                                </select>
                              )}

                              {/* Grading System Select - only shown for MASTERY */}
                              {filter.type === "MASTERY" && (
                                <select
                                  value={filter.gradingSystemId}
                                  onChange={(e) => setChartFilters(prev => ({
                                    ...prev,
                                    [subject]: { ...filter, gradingSystemId: e.target.value }
                                  }))}
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 600,
                                    color: TEXT_DARK,
                                    backgroundColor: "#F3F4F6",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: "6px",
                                    padding: "3px 6px",
                                    outline: "none",
                                    cursor: "pointer"
                                  }}
                                >
                                  <option value="ALL">📐 Barcha tizimlar</option>
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
                                📊 {points.length === 1 
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
            {/* Sub-tab: MENU (Taomnoma) */}
            {activeSubTab === "menu" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Week Navigation Controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <button
                    onClick={() => {
                      handlePrevWeek();
                      const d = new Date(selectedMenuDate);
                      d.setDate(d.getDate() - 7);
                      setSelectedMenuDate(d.toISOString().split("T")[0]);
                    }}
                    style={{
                      background: "none",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: TEXT_DARK,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      transition: "all 0.15s",
                    }}
                    className="hover:bg-gray-50 active:scale-95"
                  >
                    ◀ Oldingi hafta
                  </button>
                  <span style={{ fontSize: "11px", fontWeight: 850, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    📅 {weekLabel(currentWeekStart)}
                  </span>
                  <button
                    onClick={() => {
                      handleNextWeek();
                      const d = new Date(selectedMenuDate);
                      d.setDate(d.getDate() + 7);
                      setSelectedMenuDate(d.toISOString().split("T")[0]);
                    }}
                    style={{
                      background: "none",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: TEXT_DARK,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      transition: "all 0.15s",
                    }}
                    className="hover:bg-gray-50 active:scale-95"
                  >
                    Keyingi hafta ▶
                  </button>
                </div>

                {/* Day selector pills for the current week */}
                <div
                  style={{
                    display: "flex",
                    overflowX: "auto",
                    gap: "8px",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #F3F4F6",
                    scrollbarWidth: "none",
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
                          flexShrink: 0,
                          padding: "8px 12px",
                          borderRadius: "10px",
                          border: isSelected ? `1.5px solid ${ACCENT}` : "1px solid #E5E7EB",
                          backgroundColor: isSelected ? ACCENT_LIGHT : "white",
                          color: isSelected ? ACCENT : TEXT_DARK,
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {fmtDayName(dateStr)} ({fmtDate(dateStr)})
                      </button>
                    );
                  })}
                </div>

                {menuLoading ? (
                  <div style={{ textAlign: "center", padding: "32px", color: TEXT_MUTED }}>
                    Yuklanmoqda...
                  </div>
                ) : menuData && menuData.meals ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div
                      style={{
                        backgroundColor: "#FFFBEB",
                        border: "1px solid #FDE68A",
                        borderRadius: "14px",
                        padding: "16px",
                        boxShadow: "0 2px 8px rgba(245, 158, 11, 0.05)",
                      }}
                    >
                      <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#92400E", marginBottom: "12px" }}>
                        🍽️ {fmtDayName(selectedMenuDate)} Taomnomasi
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {Object.entries(menuData.meals).map(([mealType, description]: [string, any]) => {
                          const emoji = mealType.toLowerCase().includes("breakfast") ? "🍳" :
                                        mealType.toLowerCase().includes("lunch") ? "🍲" : "🍎";
                          const label = mealType.toLowerCase().includes("breakfast") ? "Nonushta" :
                                        mealType.toLowerCase().includes("lunch") ? "Tushlik" : "Meva / Shirinlik";
                          return (
                            <div
                              key={mealType}
                              style={{
                                display: "flex",
                                gap: "12px",
                                borderBottom: "1px solid #FEF3C7",
                                paddingBottom: "10px",
                              }}
                            >
                              <div style={{ fontSize: "20px" }}>{emoji}</div>
                              <div>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#B45309", display: "block" }}>
                                  {label}
                                </span>
                                <span style={{ fontSize: "13px", color: "#78350F", fontWeight: 500 }}>
                                  {description}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
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
                    📭 Ushbu kunda taomnoma belgilanmagan.
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
                      {(selectedChild.balance || 0) >= 0 ? "🟢" : "🔴"}
                    </div>
                  </div>
                )}

                <div className="section-title">🕒 To'lovlar va Xarajatlar Tarixi</div>

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
                    💸 Hali hech qanday to'lovlar amalga oshirilmagan.
                  </div>
                )}
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
                    Pasport: <span style={{ fontWeight: 500, fontFamily: "monospace" }}>{userInfo.passport || "Kiritilmagan"}</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                    Roli: <span style={{ fontWeight: 500 }}>Vasiy (Ota-ona)</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditPassport(userInfo.passport || "");
                    setShowEditParentModal(true);
                  }}
                  style={{
                    marginTop: "12px",
                    width: "100%",
                    padding: "8px",
                    backgroundColor: ACCENT_LIGHT,
                    border: `1px solid ${ACCENT_MID}`,
                    borderRadius: "10px",
                    color: ACCENT,
                    fontWeight: 700,
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  Pasport ma'lumotini tahrirlash
                </button>
              </div>
            )}

            {/* Student child profile card */}
            {children.length > 0 && (
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
                  O&apos;quvchilar Ma&apos;lumotlari
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {children.map((child, index) => (
                    <div
                      key={child.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        borderBottom: index === children.length - 1 ? "none" : "1px solid #F3F4F6",
                        paddingBottom: index === children.length - 1 ? "0" : "12px"
                      }}
                    >
                      <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                        F.I.SH: <span style={{ fontWeight: 500 }}>{child.first_name} {child.last_name}</span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                        Sinf: <span style={{ fontWeight: 500 }}>{child.class_name}</span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                        Manzil: <span style={{ fontWeight: 500 }}>{child.address || "Kiritilmagan"}</span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                        Tug'ilgan sana: <span style={{ fontWeight: 500 }}>{child.birthdate ? child.birthdate.split("T")[0] : "Kiritilmagan"}</span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                        Guvohnoma (INA): <span style={{ fontWeight: 500, fontFamily: "monospace" }}>{child.ina || "Kiritilmagan"}</span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                        Balans: <span style={{ fontWeight: 600, color: (child.balance || 0) >= 0 ? "#10B981" : "#EF4444" }}>{new Intl.NumberFormat("uz-UZ").format(child.balance || 0)} UZS</span>
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
                          padding: "8px",
                          backgroundColor: ACCENT_LIGHT,
                          border: `1px solid ${ACCENT_MID}`,
                          borderRadius: "10px",
                          color: ACCENT,
                          fontWeight: 700,
                          fontSize: "11px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        className="active:scale-95"
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
                  ⚠️ {editError}
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
                        🗺️ Xaritadan tanlash
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
                  ⚠️ {editParentError}
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
      </div>
    </div>
  );
}
