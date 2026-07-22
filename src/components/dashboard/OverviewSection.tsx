import React, { useState, useEffect, useCallback } from "react";
import { ClassItem } from "./types";

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

interface DashboardStatsResponse {
  date: string;
  total_students: number;
  completely_absent_count: number;
  partially_absent_count: number;
  students: StudentAttendanceStat[];
}

interface OverviewSectionProps {
  token: string;
  API_URL: string;
  classes: ClassItem[];
}

export default function OverviewSection({
  token,
  API_URL,
  classes,
}: OverviewSectionProps) {
  // Get today's YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Filter States
  const [dateFilter, setDateFilter] = useState(getTodayDate());
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  // Data States
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Table Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "absent" | "partial" | "present">("all");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.append("date", dateFilter);
      if (selectedClassId) params.append("class_id", selectedClassId);
      if (selectedLevel) params.append("level", selectedLevel);

      const response = await fetch(`${API_URL}/api/schools/dashboard/stats?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Dashboard ma'lumotlarini yuklab bo'lmadi");
      }
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [API_URL, token, dateFilter, selectedClassId, selectedLevel]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Unique levels list from classes prop (1 to 11)
  const availableLevels = Array.from(
    new Set(classes.map((c) => c.level).filter((lvl): lvl is number => lvl !== undefined && lvl !== null))
  ).sort((a, b) => a - b);

  // Filter students for table
  const filteredStudents = (stats?.students || []).filter((st) => {
    const fullName = `${st.first_name} ${st.last_name} ${st.middle_name || ""}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || st.class_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && st.status === statusFilter;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-100 flex items-center gap-2">
            <span>📊</span> Maktab Davomati & Ko'rsatkichlar
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Maktabdagi o'quvchilar soni hamda kunlik darslarga qatnashuv dinamikasini kuzatib boring.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-zinc-900/80 border border-zinc-800 p-2 rounded-2xl backdrop-blur-xl">
          {/* Date Picker */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/60 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium">📅 Sana:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs text-zinc-100 outline-none font-mono cursor-pointer"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/60 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium">🏫 Sinf:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-transparent text-xs text-zinc-100 outline-none cursor-pointer"
            >
              <option value="" className="bg-zinc-900 text-zinc-100">Barchasi</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id} className="bg-zinc-900 text-zinc-100">
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/60 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-400 font-medium">🎓 Daraja:</span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-transparent text-xs text-zinc-100 outline-none cursor-pointer"
            >
              <option value="" className="bg-zinc-900 text-zinc-100">Barchasi</option>
              {availableLevels.length > 0 ? (
                availableLevels.map((lvl) => (
                  <option key={lvl} value={lvl} className="bg-zinc-900 text-zinc-100">
                    {lvl}-sinf
                  </option>
                ))
              ) : (
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => (
                  <option key={lvl} value={lvl} className="bg-zinc-900 text-zinc-100">
                    {lvl}-sinf
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchStats()}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition cursor-pointer"
            title="Yangilash"
          >
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-xs font-semibold rounded-2xl">
          {error}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Students */}
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900/90 via-zinc-900/50 to-blue-950/20 border border-blue-900/30 rounded-3xl p-6 shadow-xl backdrop-blur-xl group hover:border-blue-500/50 transition duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">
                Jami O'quvchilar
              </p>
              <h2 className="text-4xl font-extrabold text-zinc-100 mt-2 font-mono tracking-tight">
                {loading ? "..." : stats?.total_students || 0}
              </h2>
              <p className="text-[11px] text-zinc-500 mt-1">
                Tizimda ro'yxatga olingan umumiy o'quvchilar
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/10 group-hover:scale-110 transition duration-300">
              👥
            </div>
          </div>
        </div>

        {/* Card 2: Completely Absent Today */}
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900/90 via-zinc-900/50 to-red-950/20 border border-red-900/30 rounded-3xl p-6 shadow-xl backdrop-blur-xl group hover:border-red-500/50 transition duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">
                Bugun Umuman Kelmaganlar
              </p>
              <h2 className="text-4xl font-extrabold text-red-400 mt-2 font-mono tracking-tight">
                {loading ? "..." : stats?.completely_absent_count || 0}
              </h2>
              <p className="text-[11px] text-zinc-500 mt-1">
                Kun bo'yi umuman darslarga qatnashmaganlar
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-2xl shadow-lg shadow-red-500/10 group-hover:scale-110 transition duration-300">
              🚫
            </div>
          </div>
        </div>

        {/* Card 3: Partially Absent Today */}
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900/90 via-zinc-900/50 to-amber-950/20 border border-amber-900/30 rounded-3xl p-6 shadow-xl backdrop-blur-xl group hover:border-amber-500/50 transition duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                Ba'zi Darslarga Qatnashmaganlar
              </p>
              <h2 className="text-4xl font-extrabold text-amber-400 mt-2 font-mono tracking-tight">
                {loading ? "..." : stats?.partially_absent_count || 0}
              </h2>
              <p className="text-[11px] text-zinc-500 mt-1">
                Aholisi ayrim darslarga kirib, ba'zisiga kirmaganlar
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/10 group-hover:scale-110 transition duration-300">
              ⚠️
            </div>
          </div>
        </div>
      </div>

      {/* Student Attendance List Table */}
      <div className="bg-[#0d0d12]/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-zinc-100">Kunlik Davomat Ro'yxati</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tanlangan sana ({dateFilter}) bo'yicha har bir o'quvchining davomat holati
            </p>
          </div>

          {/* Status Filter Buttons & Search */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Status Filter Pills */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === "all" ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                Barchasi
              </button>
              <button
                onClick={() => setStatusFilter("absent")}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === "absent" ? "bg-red-950/80 text-red-300 border border-red-800/50" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                Kelmagan
              </button>
              <button
                onClick={() => setStatusFilter("partial")}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === "partial" ? "bg-amber-950/80 text-amber-300 border border-amber-800/50" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                Qisman
              </button>
              <button
                onClick={() => setStatusFilter("present")}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === "present" ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/50" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                To'liq
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="F.I.SH bo'yicha izlash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-100 px-3.5 py-2 rounded-xl outline-none focus:border-blue-500 w-48 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-800/60">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-950/80 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 font-mono">
              <tr>
                <th className="px-6 py-3.5">T/R</th>
                <th className="px-6 py-3.5">O'quvchi F.I.SH.</th>
                <th className="px-6 py-3.5">Sinf</th>
                <th className="px-6 py-3.5 text-center">Kelmagan Darslar</th>
                <th className="px-6 py-3.5 text-center">Qatnashgan Darslar</th>
                <th className="px-6 py-3.5 text-center">Davomat Holati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40 text-xs font-medium text-zinc-300 bg-zinc-900/20">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 font-mono">
                    Ma'lumotlar yuklanmoqda...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 font-mono italic">
                    O'quvchilar topilmadi.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => (
                  <tr key={st.student_id} className="hover:bg-zinc-900/50 transition">
                    <td className="px-6 py-3.5 text-zinc-500 font-mono">{idx + 1}</td>
                    <td className="px-6 py-3.5 font-bold text-zinc-100">
                      {st.last_name} {st.first_name} {st.middle_name || ""}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="bg-zinc-800/80 text-zinc-300 font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg border border-zinc-700/50">
                        {st.class_name}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center font-mono font-bold">
                      {st.absent_count > 0 ? (
                        <span className="text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/30">
                          {st.absent_count} ta dars
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center font-mono font-bold">
                      {st.present_or_tardy_count > 0 ? (
                        <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
                          {st.present_or_tardy_count} ta dars
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center whitespace-nowrap">
                      {st.status === "absent" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-950/60 text-red-400 border border-red-800/60 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          Umuman kelmagan
                        </span>
                      )}
                      {st.status === "partial" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/60 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Ba'zi darslarga qatnashmagan
                        </span>
                      )}
                      {st.status === "present" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          To'liq qatnashgan
                        </span>
                      )}
                      {st.status === "no_data" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-zinc-950 text-zinc-500 border border-zinc-800">
                          Ma'lumot kiritilmagan
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
