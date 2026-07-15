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
import DiaryDayCard from "../../components/DiaryDayCard";

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

  // Edit profile states
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
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
    } else {
      setGrades([]);
      setSchedule([]);
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

  // Predefined default weekly subjects for school diary fallback
  const DEFAULT_WEEKLY_SUBJECTS: Record<number, string[]> = {
    1: ["Ona tili", "Matematika", "Fizika", "Ingliz tili", "Tarix"], // Monday
    2: ["Kimyo", "Biologiya", "Geografiya", "Adabiyot", "Matematika"], // Tuesday
    3: ["Fizika", "Ona tili", "Jismoniy tarbiya", "Tarix", "Ingliz tili"], // Wednesday
    4: ["Matematika", "Kimyo", "Biologiya", "Informatika", "Adabiyot"], // Thursday
    5: ["Geografiya", "Ona tili", "Tarix", "Ingliz tili", "Tasviriy san'at"], // Friday
    6: ["Matematika", "Fizika", "Kimyo", "Tarbiya", "Jismoniy tarbiya"], // Saturday
  };

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

    // If no database schedule, fall back to realistic defaults
    if (subjects.length === 0) {
      subjects = [...(DEFAULT_WEEKLY_SUBJECTS[dayIdx + 1] || [])];
    }

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
            {/* Sub-tab: MENU (Taomnoma) */}
            {activeSubTab === "menu" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                        Tug'ilgan sana: <span style={{ fontWeight: 500 }}>{child.birthdate ? new Date(child.birthdate).toLocaleDateString("uz-UZ") : "Kiritilmagan"}</span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                        Guvohnoma (INA): <span style={{ fontWeight: 500, fontFamily: "monospace" }}>{child.ina || "Kiritilmagan"}</span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                        Balans: <span style={{ fontWeight: 600, color: (child.balance || 0) >= 0 ? "#10B981" : "#EF4444" }}>{new Intl.NumberFormat("uz-UZ").format(child.balance || 0)} UZS</span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT_DARK }}>
                        Maktab ID: <span style={{ fontWeight: 500, fontFamily: "monospace" }}>{schoolId}</span>
                      </div>
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
              <form onSubmit={handleUpdateStudentProfile}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: TEXT_MUTED, display: "block", marginBottom: "4px" }}>
                    Manzil
                  </label>
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
