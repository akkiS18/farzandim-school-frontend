import React, { useState, useMemo, useEffect } from "react";
import { StudentAttendanceStat } from "./types";

interface AttendanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  dayName?: string;
  students: StudentAttendanceStat[];
  loading?: boolean;
}

export default function AttendanceDetailModal({
  isOpen,
  onClose,
  dateStr,
  dayName,
  students,
  loading = false,
}: AttendanceDetailModalProps) {
  const [filterTab, setFilterTab] = useState<"problematic" | "absent" | "tardy" | "partial" | "all">("problematic");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // ESC key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset page to 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTab, searchQuery, dateStr]);

  const formatUzbekDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      const months = [
        "Yanvar",
        "Fevral",
        "Mart",
        "Aprel",
        "May",
        "Iyun",
        "Iyul",
        "Avgust",
        "Sentabr",
        "Oktabr",
        "Noyabr",
        "Dekabr",
      ];
      return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`;
    } catch {
      return dStr;
    }
  };

  // Counts
  const absentStudents = useMemo(() => students.filter((s) => s.status === "absent"), [students]);
  const tardyStudents = useMemo(() => students.filter((s) => s.status === "tardy" || (s.tardy_count && s.tardy_count > 0)), [students]);
  const partialStudents = useMemo(() => students.filter((s) => s.status === "partial"), [students]);
  
  // Problematic: completely absent, tardy, or partial
  const problematicStudents = useMemo(
    () => students.filter((s) => s.status === "absent" || s.status === "partial" || s.status === "tardy" || (s.tardy_count && s.tardy_count > 0)),
    [students]
  );

  const filteredList = useMemo(() => {
    let list = students;
    if (filterTab === "problematic") {
      list = problematicStudents;
    } else if (filterTab === "absent") {
      list = absentStudents;
    } else if (filterTab === "tardy") {
      list = tardyStudents;
    } else if (filterTab === "partial") {
      list = partialStudents;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          `${s.first_name} ${s.last_name} ${s.middle_name || ""}`.toLowerCase().includes(q) ||
          s.class_name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [students, filterTab, searchQuery, problematicStudents, absentStudents, tardyStudents, partialStudents]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Smart Pagination grouping helper (1 2 3 ... 10)
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

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D4F562] text-[#1D1E26] flex items-center justify-center font-black text-xl shadow-xs">
              📊
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1D1E26]">
                Davomat Tafsilotlari {dayName ? `(${dayName})` : ""}
              </h3>
              <p className="text-xs font-mono text-slate-500 font-bold mt-0.5">
                📅 {formatUzbekDate(dateStr)} ({dateStr})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl flex items-center justify-center transition cursor-pointer"
            title="Yopish (ESC)"
          >
            ✕
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="p-6 bg-white space-y-5 border-b border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setFilterTab("problematic")}
              className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                filterTab === "problematic"
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-800"
              }`}
            >
              <p className="text-[10px] font-extrabold uppercase opacity-70">Jami Muammolilar</p>
              <p className="text-xl font-black mt-1 font-mono">{problematicStudents.length} ta</p>
            </div>

            <div
              onClick={() => setFilterTab("absent")}
              className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                filterTab === "absent"
                  ? "bg-red-500 text-white border-red-500 shadow-md"
                  : "bg-red-50 border-red-100 hover:bg-red-100 text-red-700"
              }`}
            >
              <p className="text-[10px] font-extrabold uppercase opacity-80">🔴 Kirmaganlar</p>
              <p className="text-xl font-black mt-1 font-mono">{absentStudents.length} ta</p>
            </div>

            <div
              onClick={() => setFilterTab("tardy")}
              className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                filterTab === "tardy"
                  ? "bg-amber-500 text-white border-amber-500 shadow-md"
                  : "bg-amber-50 border-amber-100 hover:bg-amber-100 text-amber-700"
              }`}
            >
              <p className="text-[10px] font-extrabold uppercase opacity-80">🟡 Kech qolganlar</p>
              <p className="text-xl font-black mt-1 font-mono">{tardyStudents.length} ta</p>
            </div>

            <div
              onClick={() => setFilterTab("partial")}
              className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                filterTab === "partial"
                  ? "bg-orange-500 text-white border-orange-500 shadow-md"
                  : "bg-orange-50 border-orange-100 hover:bg-orange-100 text-orange-700"
              }`}
            >
              <p className="text-[10px] font-extrabold uppercase opacity-80">🟠 Qisman kirmagan</p>
              <p className="text-xl font-black mt-1 font-mono">{partialStudents.length} ta</p>
            </div>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center overflow-x-auto bg-slate-100 p-1 rounded-2xl text-xs font-bold shrink-0">
              <button
                onClick={() => setFilterTab("problematic")}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  filterTab === "problematic" ? "bg-white text-[#1D1E26] shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Muammolilar ({problematicStudents.length})
              </button>
              <button
                onClick={() => setFilterTab("absent")}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  filterTab === "absent" ? "bg-red-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Kirmaganlar ({absentStudents.length})
              </button>
              <button
                onClick={() => setFilterTab("tardy")}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  filterTab === "tardy" ? "bg-amber-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Kech qolganlar ({tardyStudents.length})
              </button>
              <button
                onClick={() => setFilterTab("partial")}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  filterTab === "partial" ? "bg-orange-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Qisman ({partialStudents.length})
              </button>
              <button
                onClick={() => setFilterTab("all")}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  filterTab === "all" ? "bg-white text-[#1D1E26] shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Barchasi ({students.length})
              </button>
            </div>

            <input
              type="text"
              placeholder="O'quvchi F.I.SH yoki Sinf..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium px-3.5 py-2 rounded-xl outline-none focus:ring-2 focus:ring-[#D4F562] w-full sm:w-56"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-medium text-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D1E26] mx-auto mb-3"></div>
              Ma'lumotlar yuklanmoqda...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="text-3xl">🎉</div>
              <h4 className="text-sm font-extrabold text-[#1D1E26]">Hech qanday o'quvchi topilmadi</h4>
              <p className="text-xs text-slate-400 font-medium">
                {filterTab === "problematic" || filterTab === "absent" || filterTab === "tardy"
                  ? "Ushbu tanlangan kunda hech qanday muammoli yoki kelmagan o'quvchilar ro'yxatga olinmagan."
                  : "Qidiruv natijasiga mos keluvchi o'quvchi topilmadi."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                    <tr>
                      <th className="px-4 py-3.5">T/R</th>
                      <th className="px-4 py-3.5">O'quvchi F.I.SH.</th>
                      <th className="px-4 py-3.5">Sinf</th>
                      <th className="px-4 py-3.5 text-center">Kirmagan Darslar</th>
                      <th className="px-4 py-3.5 text-center">Kech Qolgan Darslar</th>
                      <th className="px-4 py-3.5 text-center">Holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {paginatedList.map((st, idx) => {
                      const absoluteIndex = (currentPage - 1) * pageSize + idx + 1;
                      const isAbsent = st.status === "absent";
                      const isTardy = st.status === "tardy" || (st.tardy_count && st.tardy_count > 0 && st.absent_count === 0);
                      const isPartial = st.status === "partial";
                      const isPresent = st.status === "present";

                      return (
                        <tr key={st.student_id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 text-slate-400 font-mono text-[11px] font-bold">{absoluteIndex}</td>
                          <td className="px-4 py-3 font-bold text-[#1D1E26]">
                            {st.last_name} {st.first_name} {st.middle_name || ""}
                          </td>
                          <td className="px-4 py-3 font-mono font-extrabold text-slate-600">{st.class_name}</td>
                          <td className="px-4 py-3 text-center font-mono">
                            {st.absent_count > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-black text-[11px]">
                                {st.absent_count} ta dars
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            {st.tardy_count && st.tardy_count > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-black text-[11px]">
                                {st.tardy_count} ta dars
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isAbsent ? (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-red-500 text-white shadow-xs inline-flex items-center gap-1">
                                🔴 Kirmagan
                              </span>
                            ) : isTardy ? (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs inline-flex items-center gap-1">
                                🟡 Kech qolgan
                              </span>
                            ) : isPartial ? (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-orange-500 text-white shadow-xs inline-flex items-center gap-1">
                                🟠 Qisman kirmagan
                              </span>
                            ) : isPresent ? (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-xs inline-flex items-center gap-1">
                                🟢 Kelgan
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                Ma'lumot yo'q
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-slate-500 font-medium">
                    Jami {filteredList.length} ta o'quvchidan { (currentPage - 1) * pageSize + 1 }-{ Math.min(currentPage * pageSize, filteredList.length) } ko'rsatilmoqda
                  </p>
                  <div className="flex items-center space-x-1 font-mono text-xs font-bold">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-40 transition cursor-pointer"
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
                          className={`w-8 h-8 rounded-xl transition cursor-pointer font-bold ${
                            currentPage === pageNum
                              ? "bg-[#D4F562] text-[#1D1E26] shadow-xs font-black"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-40 transition cursor-pointer"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
