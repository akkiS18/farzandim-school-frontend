import React, { useState, useEffect, useRef } from "react";
import { Trash2, Calendar, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ClassItem, UserInfo } from "./types";

interface HolidayItem {
  id: number;
  holiday_date: string;
  name: string;
  target_levels?: number[];
  target_classes?: number[];
  created_at: string;
}

interface HolidaysSectionProps {
  token: string;
  API_URL: string;
  userInfo: UserInfo | null;
  classes: ClassItem[];
}

const MONTH_NAMES = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];
const DAY_NAMES = ["Du", "Se", "Ch", "Pa", "Ju", "Sha", "Ya"];

export default function HolidaysSection({
  token,
  API_URL,
  userInfo,
  classes,
}: HolidaysSectionProps) {
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]); // YYYY-MM-DD[]
  const [holidayName, setHolidayName] = useState("");
  const [targetType, setTargetType] = useState<"all" | "levels" | "classes">("all");
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed
  const isSelecting = useRef(false);
  const selectMode = useRef<"add" | "remove">("add"); // whether dragging adds or removes

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchHolidays = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/schools/holidays`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setHolidays(Array.isArray(data) ? data : []);
      } else {
        setError(data.error || "Bayram kunlarini yuklab bo'lmadi");
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [token]);

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDates.length === 0 || !holidayName.trim()) {
      setActionError("Kamida bitta sana va bayram nomini kiritish majburiy");
      return;
    }
    setActionLoading(true);
    setActionError("");

    let payloadLevels: number[] = [];
    let payloadClasses: number[] = [];
    if (targetType === "levels") payloadLevels = selectedLevels;
    else if (targetType === "classes") payloadClasses = selectedClasses;

    let failedDates: string[] = [];
    for (const dateStr of selectedDates) {
      try {
        const response = await fetch(`${API_URL}/api/schools/holidays`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            holiday_date: dateStr,
            name: holidayName.trim(),
            target_levels: payloadLevels,
            target_classes: payloadClasses,
          }),
        });
        if (!response.ok) failedDates.push(dateStr);
      } catch {
        failedDates.push(dateStr);
      }
    }

    setActionLoading(false);
    if (failedDates.length > 0) {
      setActionError(`Quyidagi sanalarni saqlashda xatolik: ${failedDates.join(", ")}`);
    } else {
      setShowAddModal(false);
      setSelectedDates([]);
      setHolidayName("");
      setTargetType("all");
      setSelectedLevels([]);
      setSelectedClasses([]);
      fetchHolidays();
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!token) return;
    setDeletingId(id);
    try {
      const response = await fetch(`${API_URL}/api/schools/holidays/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchHolidays();
      } else {
        const data = await response.json();
        alert(data.error || "O'chirishda xatolik yuz berdi");
      }
    } catch {
      alert("Server bilan bog'lanishda xatolik");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleLevel = (lvl: number) => {
    setSelectedLevels((prev) =>
      prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]
    );
  };

  const toggleClass = (clsId: number) => {
    setSelectedClasses((prev) =>
      prev.includes(clsId) ? prev.filter((c) => c !== clsId) : [...prev, clsId]
    );
  };

  const toggleDate = (dateStr: string) => {
    setSelectedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
  };

  // Calendar helpers
  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  /** Returns an array of {dateStr, day, isCurrentMonth} for the 6-week grid */
  const buildCalendarDays = () => {
    const firstOfMonth = new Date(calYear, calMonth, 1);
    // Monday-based week: getDay() returns 0=Sun,1=Mon,...
    let startDow = firstOfMonth.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // convert to 0=Mon
    const start = new Date(firstOfMonth);
    start.setDate(start.getDate() - startDow);

    const days: { dateStr: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split("T")[0];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        dateStr,
        day: d.getDate(),
        isCurrentMonth: d.getMonth() === calMonth,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  };

  const calDays = buildCalendarDays();

  const handleDayMouseDown = (dateStr: string) => {
    isSelecting.current = true;
    const alreadySelected = selectedDates.includes(dateStr);
    selectMode.current = alreadySelected ? "remove" : "add";
    toggleDate(dateStr);
  };

  const handleDayMouseEnter = (dateStr: string) => {
    if (!isSelecting.current) return;
    setSelectedDates((prev) => {
      if (selectMode.current === "add") {
        return prev.includes(dateStr) ? prev : [...prev, dateStr];
      } else {
        return prev.filter((d) => d !== dateStr);
      }
    });
  };

  const handleMouseUp = () => { isSelecting.current = false; };

  // Available unique class levels
  const availableLevels = Array.from(
    new Set(classes.map((c) => c.level).filter((l): l is number => typeof l === "number"))
  ).sort((a, b) => a - b);

  return (
    <div className="space-[#1D1E26] space-y-6 animate-fadeIn font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white border border-slate-100/80 p-6 rounded-3xl shadow-xs">
        <div>
          <h2 className="text-xl font-black text-[#1D1E26] tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#1D1E26]" />
            Dam Olish Kunlari (Bayramlar)
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Maktab, sinflar yoki levellar uchun dam olish kunlarini belgilash. Ushbu kunlarda dars jadvali to'xtatiladi.
          </p>
        </div>

        {userInfo?.role === "ADMIN" && (
          <button
            onClick={() => {
              setSelectedDates([]);
              setHolidayName("");
              setTargetType("all");
              setSelectedLevels([]);
              setSelectedClasses([]);
              setActionError("");
              setCalYear(new Date().getFullYear());
              setCalMonth(new Date().getMonth());
              setShowAddModal(true);
            }}
            className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-5 rounded-2xl shadow-xs hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            + Bayram kuni qo&apos;shish
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">
          {error}
        </div>
      )}

      {/* List Table */}
      <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-7 h-7 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : holidays.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <p className="text-slate-400 text-xs font-medium">Hozircha dam olish kunlari belgilanmagan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
                <tr>
                  <th className="px-6 py-4">Sana</th>
                  <th className="px-6 py-4">Bayram / Sabab</th>
                  <th className="px-6 py-4">Qamrov (Target)</th>
                  {userInfo?.role === "ADMIN" && <th className="px-6 py-4 text-right">Amallar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                {holidays.map((h) => {
                  const dateStr = h.holiday_date ? h.holiday_date.split("T")[0] : "-";
                  const hasLevels = h.target_levels && h.target_levels.length > 0;
                  const hasClasses = h.target_classes && h.target_classes.length > 0;

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-mono font-bold text-[#1D1E26]">
                        {dateStr}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{h.name}</td>
                      <td className="px-6 py-4">
                        {!hasLevels && !hasClasses ? (
                          <span className="bg-[#ECFCCA] text-[#65A30D] font-extrabold text-[11px] px-2.5 py-1 rounded-lg">
                            Butun maktab uchun
                          </span>
                        ) : hasLevels ? (
                          <span className="bg-blue-50 text-blue-700 font-extrabold text-[11px] px-2.5 py-1 rounded-lg">
                            Levellar: {h.target_levels?.join(", ")}-sinflar
                          </span>
                        ) : (
                          <span className="bg-purple-50 text-purple-700 font-extrabold text-[11px] px-2.5 py-1 rounded-lg">
                            Sinflar: {classes.filter((c) => typeof c.id === "number" && h.target_classes?.includes(c.id)).map((c) => c.name).join(", ")}
                          </span>
                        )}
                      </td>
                      {userInfo?.role === "ADMIN" && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteHoliday(h.id)}
                            disabled={deletingId === h.id}
                            title="O'chirish"
                            className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Holiday */}
      {showAddModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg max-h-[90vh] bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] flex flex-col overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Yangi Dam Olish Kuni Belgilash</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Belgilangan kuni mos sinflarda darslar o'tilmaydi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 space-y-4">
              {actionError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleSaveHoliday} className="space-y-5">

                {/* ── Inline Multi-Date Calendar ── */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-2">
                    Sanalarni tanlang *
                    {selectedDates.length > 0 && (
                      <span className="ml-2 normal-case text-[#1D1E26] bg-[#D4F562] px-2 py-0.5 rounded-lg">
                        {selectedDates.length} kun belgilandi
                      </span>
                    )}
                  </label>

                  <div
                    className="select-none border border-slate-200 rounded-2xl overflow-hidden bg-white"
                    onMouseLeave={handleMouseUp}
                    onMouseUp={handleMouseUp}
                  >
                    {/* Calendar nav */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={prevMonth}
                        className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-black text-[#1D1E26]">
                        {MONTH_NAMES[calMonth]} {calYear}
                      </span>
                      <button
                        type="button"
                        onClick={nextMonth}
                        className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Day-of-week headers */}
                    <div className="grid grid-cols-7 border-b border-slate-100">
                      {DAY_NAMES.map((d) => (
                        <div key={d} className="py-2 text-center text-[10px] font-extrabold text-slate-400 font-mono">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 p-2 gap-1">
                      {calDays.map(({ dateStr, day, isCurrentMonth, isToday }) => {
                        const isSelected = selectedDates.includes(dateStr);
                        return (
                          <div
                            key={dateStr}
                            onMouseDown={() => handleDayMouseDown(dateStr)}
                            onMouseEnter={() => handleDayMouseEnter(dateStr)}
                            className={`
                              h-8 w-full flex items-center justify-center rounded-xl text-xs font-bold transition cursor-pointer
                              ${isSelected
                                ? "bg-[#1D1E26] text-[#D4F562] ring-2 ring-[#D4F562]/50"
                                : isToday
                                  ? "ring-2 ring-[#D4F562] text-[#1D1E26] bg-[#D4F562]/10"
                                  : isCurrentMonth
                                    ? "text-slate-700 hover:bg-slate-100"
                                    : "text-slate-300 hover:bg-slate-50"
                              }
                            `}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>

                    {/* Selected dates summary */}
                    {selectedDates.length > 0 && (
                      <div className="px-3 pb-3">
                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                          {[...selectedDates].sort().map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => toggleDate(d)}
                              className="flex items-center gap-1 bg-[#D4F562] text-[#1D1E26] text-[10px] font-extrabold px-2 py-1 rounded-lg hover:bg-red-100 hover:text-red-600 transition cursor-pointer"
                            >
                              {d}
                              <X className="w-2.5 h-2.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bayram nomi */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Bayram / Sabab Nomi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mustaqillik kuni"
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] font-bold"
                  />
                </div>

                {/* Scope Selection */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-2">Qamrov Turi (Target Scope)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetType("all")}
                      className={`p-3 rounded-2xl border text-xs font-bold transition text-center cursor-pointer ${
                        targetType === "all"
                          ? "bg-[#D4F562] border-lime-300 text-[#1D1E26] shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Butun Maktab
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetType("levels")}
                      className={`p-3 rounded-2xl border text-xs font-bold transition text-center cursor-pointer ${
                        targetType === "levels"
                          ? "bg-[#D4F562] border-lime-300 text-[#1D1E26] shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Levellar Boyicha
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetType("classes")}
                      className={`p-3 rounded-2xl border text-xs font-bold transition text-center cursor-pointer ${
                        targetType === "classes"
                          ? "bg-[#D4F562] border-lime-300 text-[#1D1E26] shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Sinflar Boyicha
                    </button>
                  </div>
                </div>

                {/* Level Selection Checkboxes */}
                {targetType === "levels" && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-2">Levellarni tanlang</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(availableLevels.length > 0 ? availableLevels : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => toggleLevel(lvl)}
                          className={`p-2 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                            selectedLevels.includes(lvl)
                              ? "bg-[#1D1E26] text-[#D4F562] border-[#1D1E26]"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {lvl}-sinflar
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Class Selection Checkboxes */}
                {targetType === "classes" && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-2">Sinflarni tanlang</label>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      {classes.map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => toggleClass(cls.id)}
                          className={`p-2 rounded-xl text-xs font-extrabold border transition cursor-pointer truncate ${
                            selectedClasses.includes(cls.id)
                              ? "bg-[#1D1E26] text-[#D4F562] border-[#1D1E26]"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {cls.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
