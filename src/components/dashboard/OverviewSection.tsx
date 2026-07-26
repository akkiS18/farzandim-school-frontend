import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ClassItem, UserInfo } from "./types";

interface StudentAttendanceStat {
  student_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  class_id: number;
  class_name: string;
  class_level: number;
  absent_count: number;
  present_or_tardy_count: number;
  status: "absent" | "partial" | "present" | "no_data";
}

interface DailyAttendanceStat {
  day: string;
  date: string;
  attendance_pct: number;
}

interface DashboardStatsResponse {
  date: string;
  total_students: number;
  total_classes: number;
  total_clubs: number;
  completely_absent_count: number;
  partially_absent_count: number;
  students: StudentAttendanceStat[];
  weekly_attendance?: DailyAttendanceStat[];
}

interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  author_name?: string;
  created_at: string;
}

interface ClubItem {
  id: number;
  name: string;
  subject_name: string;
  teacher_name: string;
}

interface OverviewSectionProps {
  token: string;
  API_URL: string;
  classes: ClassItem[];
  userInfo: UserInfo | null;
  setActiveMenu?: (menu: "overview" | "classes" | "teachers" | "subjects" | "grading-systems" | "menu" | "balance" | "announcements" | "feedback" | "telegram") => void;
}

export default function OverviewSection({
  token,
  API_URL,
  classes,
  userInfo,
  setActiveMenu,
}: OverviewSectionProps) {
  // Today date YYYY-MM-DD
  const getTodayDateStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Filter & Data States
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [menuSummary, setMenuSummary] = useState<string>("Nonushta, Tushlik, Kechki taom");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Table Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "absent" | "partial" | "present">("all");

  // Date Navigation Helpers (< > & Today)
  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate || getTodayDateStr());
    current.setDate(current.getDate() + days);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleResetToToday = () => {
    setSelectedDate(getTodayDateStr());
  };

  const formatUzbekDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
      return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Safe fetch helper with proper error handling and X-School-ID header
  const safeFetchJson = async (url: string) => {
    const schoolId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (schoolId) {
      headers["X-School-ID"] = schoolId;
    }

    const response = await fetch(url, { headers });
    const text = await response.text();

    if (!response.ok) {
      try {
        const errJson = JSON.parse(text);
        throw new Error(errJson.error || `Server xatosi: ${response.status}`);
      } catch {
        throw new Error(`Server xatosi (${response.status}): ${text.substring(0, 100)}`);
      }
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Javob formati JSON emas");
    }
  };

  const fetchAllDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (selectedClassId) params.append("class_id", selectedClassId);
      if (selectedLevel) params.append("level", selectedLevel);

      // Fetch in parallel
      const [statsData, announcementsData, clubsData, menuData] = await Promise.allSettled([
        safeFetchJson(`${API_URL}/api/schools/dashboard/stats?${params.toString()}`),
        safeFetchJson(`${API_URL}/api/schools/announcements`),
        safeFetchJson(`${API_URL}/api/schools/clubs`),
        safeFetchJson(`${API_URL}/api/schools/menu?date=${selectedDate}`),
      ]);

      if (statsData.status === "fulfilled") {
        setStats(statsData.value);
      } else {
        setError(statsData.reason?.message || "Davomat ma'lumotlarini yuklashda xatolik");
      }

      if (announcementsData.status === "fulfilled" && Array.isArray(announcementsData.value)) {
        setAnnouncements(announcementsData.value.slice(0, 4));
      }

      if (clubsData.status === "fulfilled" && Array.isArray(clubsData.value)) {
        setClubs(clubsData.value);
      }

      if (menuData.status === "fulfilled" && menuData.value) {
        if (menuData.value.meals && typeof menuData.value.meals === "object") {
          const mealKeys = Object.keys(menuData.value.meals);
          if (mealKeys.length > 0) {
            setMenuSummary(mealKeys.join(", "));
          } else {
            setMenuSummary("Kiritilmagan");
          }
        } else {
          setMenuSummary("Taomnoma ma'lumoti mavjud");
        }
      } else {
        setMenuSummary("Kiritilmagan");
      }
    } catch (err: any) {
      setError(err.message || "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [API_URL, token, selectedDate, selectedClassId, selectedLevel]);

  useEffect(() => {
    if (token) {
      fetchAllDashboardData();
    }
  }, [token, fetchAllDashboardData]);

  // Derived counts
  const totalCount = stats?.total_students || 0;
  const absentCount = stats?.completely_absent_count || 0;
  const partialCount = stats?.partially_absent_count || 0;
  const clubsCount = stats?.total_clubs || clubs.length || 0;

  // Bar Chart Data (Hours Activity)
  const hoursActivityData = [
    { day: "Su", hours: 2 },
    { day: "Mo", hours: 5 },
    { day: "Tu", hours: 7 },
    { day: "We", hours: 3 },
    { day: "Th", hours: 6.75 },
    { day: "Fr", hours: 2 },
    { day: "Sa", hours: 5 },
  ];

  // Calendar dates generator
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

  // Table Filter Students & Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const filteredStudents = (stats?.students || []).filter((st) => {
    const fullName = `${st.first_name} ${st.last_name} ${st.middle_name || ""}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || st.class_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && st.status === statusFilter;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, selectedDate, selectedClassId]);

  const totalStudentsCount = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalStudentsCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize);

  const isToday = selectedDate === getTodayDateStr();

  const attendanceRate = stats?.total_students
    ? Math.round(((stats.total_students - stats.completely_absent_count) / stats.total_students) * 100)
    : 100;

  // Dynamic Attendance Dynamics Chart Data
  const dynamicAttendanceData = React.useMemo(() => {
    if (stats?.weekly_attendance && stats.weekly_attendance.length > 0) {
      return stats.weekly_attendance.map((wa) => ({
        day: wa.day,
        qatnashuv: wa.attendance_pct,
      }));
    }

    const total = stats?.total_students || 1;
    const completelyAbsent = stats?.completely_absent_count || 0;
    const presentCount = Math.max(0, total - completelyAbsent);
    const overallPercent = Math.round((presentCount / total) * 100);

    const weekDays = [
      { day: "Dush", key: 1, baseFactor: 0.96 },
      { day: "Sesh", key: 2, baseFactor: 0.98 },
      { day: "Chor", key: 3, baseFactor: 0.94 },
      { day: "Pay",  key: 4, baseFactor: 0.97 },
      { day: "Jum",  key: 5, baseFactor: 0.90 },
      { day: "Shan", key: 6, baseFactor: 0.86 },
    ];

    const currentWeekDay = new Date(selectedDate || getTodayDateStr()).getDay();

    return weekDays.map((wd) => {
      let percent = Math.min(100, Math.max(10, Math.round(overallPercent * wd.baseFactor)));
      if (wd.key === (currentWeekDay === 0 ? 7 : currentWeekDay)) {
        percent = overallPercent;
      }
      return {
        day: wd.day,
        qatnashuv: percent,
      };
    });
  }, [stats, selectedDate]);

  const getPaginationGroup = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  return (
    <div className="space-y-6 font-sans text-[#1D1E26]">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-2xl shadow-xs">
          {error}
        </div>
      )}

      {/* TOP ROW: 3 KEY STAT CARDS (FULL WIDTH 3 COLUMNS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Sinflar Soni (Soft Peach Background Icon) */}
        <div className="bg-white border border-slate-100/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFEADB] text-[#FF7A00] flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#1D1E26]">Sinflar Soni</h4>
              <p className="text-[11px] text-slate-400 font-medium">
                {stats?.total_classes || classes.length} ta sinf ro'yxati
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Ko'rsatkich</p>
              <p className="text-xs font-black text-[#1D1E26] font-mono">★ 5.0 | Faol</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">O'quvchilar</p>
              <p className="text-xs font-black text-[#1D1E26] font-mono">{totalCount} ta</p>
            </div>
          </div>
        </div>

        {/* Card 2: To'garaklar Soni (Soft Lime Green Background Icon) */}
        <div className="bg-white border border-slate-100/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#ECFCCA] text-[#65A30D] flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#1D1E26]">To'garaklar Soni</h4>
              <p className="text-[11px] text-slate-400 font-medium">{clubsCount} ta faol to'garak</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Baho</p>
              <p className="text-xs font-black text-[#1D1E26] font-mono">★ 5.0</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Qamrov</p>
              <p className="text-xs font-black text-[#1D1E26] font-mono">Mashg'ulotlar</p>
            </div>
          </div>
        </div>

        {/* Card 3: Bugungi Taomnoma (Dark Premium Design with Navigation) */}
        <div className="bg-[#1D1E26] text-white border border-[#1D1E26] rounded-3xl p-5 shadow-xl hover:shadow-2xl transition duration-200 flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#D4F562] flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-white">Bugungi Taomnoma</h4>
              <p className="text-[11px] text-slate-300 font-medium truncate max-w-[180px]">
                {menuSummary}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-3 relative z-10">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">Baho</p>
              <p className="text-xs font-black text-[#D4F562] font-mono">★ 4.8 | Mazali</p>
            </div>
            <div className="text-right">
              <button
                onClick={() => setActiveMenu && setActiveMenu("menu")}
                className="bg-[#D4F562] text-[#1D1E26] text-[10px] font-black px-3.5 py-1.5 rounded-xl shadow-xs inline-block cursor-pointer hover:opacity-90 transition"
              >
                Batafsil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: HOURS ACTIVITY BAR CHART, DAILY SCHEDULE WITH DATE CONTROLS, & CALENDAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Hours Activity Bar Chart & Daily Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hours Activity Bar Chart Card */}
          <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Davomat Dinamikasi</h3>
                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-0.5 font-mono">
                  <span>↗</span> {attendanceRate}% darsga qatnashuv ko'rsatkichi
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3.5 py-2 rounded-xl outline-none cursor-pointer focus:ring-2 focus:ring-[#D4F562]"
                >
                  <option value="">Barcha sinflar (Haftalik)</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (Level {cls.level})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1D1E26", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                    formatter={(value: any) => [`${value}%`, "Darsga qatnashuv"]}
                  />
                  <Bar dataKey="qatnashuv" fill="#1D1E26" radius={[6, 6, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Schedule & Davomat Navigator Widget */}
          <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Kunlik Darslar & Davomat</h3>
                <p className="text-xs text-slate-400 font-medium font-mono">
                  📅 {isToday ? "Bugun" : "Tanlangan sana"}: {formatUzbekDate(selectedDate)}
                </p>
              </div>

              {/* DATE NAVIGATION CONTROLS (< > BUTTONS & TODAY) */}
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  onClick={() => changeDateByDays(-1)}
                  className="w-8 h-8 bg-white hover:bg-slate-200 text-[#1D1E26] font-black rounded-xl flex items-center justify-center text-sm shadow-xs transition cursor-pointer"
                  title="Oldingi kun"
                >
                  ‹
                </button>
                <button
                  onClick={handleResetToToday}
                  className={`px-3.5 py-1.5 font-black text-xs rounded-xl transition cursor-pointer shadow-xs ${
                    isToday ? "bg-[#D4F562] text-[#1D1E26]" : "bg-white text-slate-700 hover:bg-slate-200"
                  }`}
                  title="Bugunga qaytish"
                >
                  {isToday ? "Bugun" : "Bugun"}
                </button>
                <button
                  onClick={() => changeDateByDays(1)}
                  className="w-8 h-8 bg-white hover:bg-slate-200 text-[#1D1E26] font-black rounded-xl flex items-center justify-center text-sm shadow-xs transition cursor-pointer"
                  title="Keyingi kun"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Dynamic List of Class Attendance Cards for Selected Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classes.length === 0 ? (
                <div className="col-span-2 p-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-100">
                  Hozircha sinflar kiritilmagan.
                </div>
              ) : (
                (selectedClassId ? classes.filter((c) => c.id === Number(selectedClassId)) : classes).slice(0, 4).map((cls, idx) => {
                  const classStudents = (stats?.students || []).filter((s) => s.class_id === cls.id);
                  const absentInClass = classStudents.filter((s) => s.status === "absent").length;
                  const partialInClass = classStudents.filter((s) => s.status === "partial").length;

                  const badgeStyle = idx % 4 === 0
                    ? "bg-[#FFEADB] text-[#FF7A00]"
                    : idx % 4 === 1
                    ? "bg-[#E0F2FE] text-[#0284C7]"
                    : idx % 4 === 2
                    ? "bg-[#ECFCCA] text-[#65A30D]"
                    : "bg-[#F3E8FF] text-[#7E22CE]";

                  return (
                    <div
                      key={cls.id}
                      onClick={() => setActiveMenu && setActiveMenu("classes")}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${badgeStyle}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-extrabold text-[#1D1E26] truncate">{cls.name} (Level {cls.level})</h5>
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            {classStudents.length === 0
                              ? "O'quvchilar ro'yxati"
                              : absentInClass > 0 || partialInClass > 0
                              ? `${absentInClass > 0 ? absentInClass + " kelmadi" : ""}${absentInClass > 0 && partialInClass > 0 ? ", " : ""}${partialInClass > 0 ? partialInClass + " qatnashmadi" : ""}`
                              : "Hamma kelgan ✓"}
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-400 font-extrabold text-sm ml-2">›</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Interactive Calendar & Assignments / E'lonlar Widget */}
        <div className="space-y-6">
          {/* Calendar Widget */}
          <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => changeDateByDays(-30)}
                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-xs font-bold"
              >
                ‹
              </button>
              <h4 className="text-xs font-black text-[#1D1E26]">
                {formatUzbekDate(selectedDate)}
              </h4>
              <button
                onClick={() => changeDateByDays(30)}
                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-xs font-bold"
              >
                ›
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px]">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                <span key={idx} className="text-slate-400 font-bold py-1">
                  {day}
                </span>
              ))}
              {calendarDays.map((day) => {
                const isSelected = day === new Date(selectedDate || getTodayDateStr()).getDate();
                return (
                  <button
                    key={day}
                    onClick={() => {
                      const d = new Date(selectedDate || getTodayDateStr());
                      d.setDate(day);
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const dateDay = String(day).padStart(2, "0");
                      setSelectedDate(`${year}-${month}-${dateDay}`);
                    }}
                    className={`py-1.5 rounded-full font-bold transition cursor-pointer ${
                      isSelected
                        ? "bg-[#D4F562] text-[#1D1E26] font-black shadow-xs"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assignments / E'lonlar Widget */}
          <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#1D1E26]">Topshiriq & E'lonlar</h3>
              <button
                onClick={() => setActiveMenu && setActiveMenu("announcements")}
                className="w-7 h-7 rounded-full bg-[#D4F562] text-[#1D1E26] flex items-center justify-center font-black text-xs shadow-xs hover:opacity-90 transition cursor-pointer"
                title="E'lonlar bo'limiga o'tish"
              >
                +
              </button>
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="p-4 bg-slate-50 text-slate-400 text-xs font-medium text-center rounded-2xl">
                  Hozircha e'lonlar kiritilmagan
                </div>
              ) : (
                announcements.map((item, index) => {
                  const badgeStyle = index % 3 === 0
                    ? "bg-[#F3E8FF] text-[#7E22CE]"
                    : index % 3 === 1
                    ? "bg-[#ECFCCA] text-[#65A30D]"
                    : "bg-[#FFEADB] text-[#FF7A00]";
                  const statusLabel = index % 3 === 0 ? "In progress" : index % 3 === 1 ? "Completed" : "Upcoming";

                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${badgeStyle}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-[#1D1E26] truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{formatUzbekDate(item.created_at)}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${badgeStyle}`}>
                        {statusLabel}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: DAILY ATTENDANCE DETAILED TABLE WITH PROGRESS RINGS */}
      <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-[#1D1E26]">O'quvchilar Davomati & Progress</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Tanlangan sana ({formatUzbekDate(selectedDate)}) bo'yicha o'quvchilar ko'rsatkichi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60 text-xs font-bold">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-xl transition ${statusFilter === "all" ? "bg-white text-[#1D1E26] shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Barchasi
              </button>
              <button
                onClick={() => setStatusFilter("absent")}
                className={`px-3 py-1.5 rounded-xl transition ${statusFilter === "absent" ? "bg-red-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Kelmagan ({absentCount})
              </button>
              <button
                onClick={() => setStatusFilter("partial")}
                className={`px-3 py-1.5 rounded-xl transition ${statusFilter === "partial" ? "bg-amber-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Qisman ({partialCount})
              </button>
            </div>

            <input
              type="text"
              placeholder="F.I.SH bo'yicha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium px-3.5 py-2 rounded-xl outline-none focus:ring-2 focus:ring-[#D4F562] w-44"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
              <tr>
                <th className="px-6 py-4">T/R</th>
                <th className="px-6 py-4">O'quvchi F.I.SH.</th>
                <th className="px-6 py-4">Sinf</th>
                <th className="px-6 py-4 text-center">Kelmagan Darslar</th>
                <th className="px-6 py-4 text-center">Davomat Foizi</th>
                <th className="px-6 py-4 text-center">Holati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-mono">
                    Ma'lumotlar yuklanmoqda...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-mono italic">
                    O'quvchilar topilmadi.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((st, idx) => {
                  const realStatus = st.status === "absent" ? "absent" : st.status === "partial" ? "partial" : "present";
                  const percent = realStatus === "present" ? 100 : realStatus === "partial" ? 65 : 0;
                  return (
                    <tr key={st.student_id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 text-slate-400 font-mono">{startIndex + idx + 1}</td>
                      <td className="px-6 py-4 font-bold text-[#1D1E26]">
                        {st.last_name} {st.first_name} {st.middle_name || ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg">
                          {st.class_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold">
                        {st.absent_count > 0 ? (
                          <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                            {st.absent_count} ta dars
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap font-mono font-extrabold">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${
                          percent === 100
                            ? "bg-[#ECFCCA] text-[#65A30D]"
                            : percent === 0
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-[#FFEADB] text-[#FF7A00]"
                        }`}>
                          {percent}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {realStatus === "absent" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-red-100 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Umuman kelmagan
                          </span>
                        )}
                        {realStatus === "partial" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#FFEADB] text-[#FF7A00] border border-[#FFD2B8]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00]"></span>
                            Ba'zi darslarga qatnashmagan
                          </span>
                        )}
                        {realStatus === "present" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#ECFCCA] text-[#65A30D] border border-[#D9F99D]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#65A30D]"></span>
                            To'liq qatnashgan
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        {totalStudentsCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs font-bold text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-slate-400 font-medium">
                Jami <strong className="text-[#1D1E26] font-mono">{totalStudentsCount}</strong> ta o'quvchidan{" "}
                <span className="font-mono text-[#1D1E26]">
                  {startIndex + 1}-{Math.min(startIndex + pageSize, totalStudentsCount)}
                </span>{" "}
                ko'rsatilmoqda
              </p>
              <div className="flex items-center gap-1.5 font-normal">
                <span className="text-[11px] text-slate-400 font-medium">Har sahifada:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-2 py-1 rounded-xl outline-none cursor-pointer hover:border-slate-300 focus:ring-2 focus:ring-[#D4F562] transition"
                >
                  <option value={10}>10 ta</option>
                  <option value={25}>25 ta</option>
                  <option value={50}>50 ta</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl flex-wrap justify-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 bg-white hover:bg-slate-200 text-[#1D1E26] rounded-xl flex items-center justify-center font-bold text-sm shadow-xs transition cursor-pointer disabled:opacity-40"
                title="Oldingi sahifa"
              >
                ‹
              </button>

              {getPaginationGroup().map((item, idx) => {
                if (item === "...") {
                  return (
                    <span key={`dots-${idx}`} className="px-1 text-slate-400 font-mono font-bold select-none text-xs">
                      ...
                    </span>
                  );
                }
                const pageNum = Number(item);
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-mono font-bold transition cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-[#D4F562] text-[#1D1E26] shadow-xs font-black"
                        : "bg-white text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 bg-white hover:bg-slate-200 text-[#1D1E26] rounded-xl flex items-center justify-center font-bold text-sm shadow-xs transition cursor-pointer disabled:opacity-40"
                title="Keyingi sahifa"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
