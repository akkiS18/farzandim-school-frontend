import React, { useState, useEffect, useRef } from "react";
import { useDialog } from "../../hooks/useDialog";
import CustomDialogModal from "../CustomDialogModal";
import { Trash2, Calendar, Plus, X, ChevronLeft, ChevronRight, FileSpreadsheet, Upload, Download, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { ClassItem, UserInfo } from "./types";
import { formatLocalDate } from "@/lib/dateUtils";

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
  const { dialogState, showAlert } = useDialog();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal State - Add
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [holidayName, setHolidayName] = useState("");
  const [targetType, setTargetType] = useState<"all" | "levels" | "classes">("all");
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [conflictData, setConflictData] = useState<any | null>(null);

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const isSelecting = useRef(false);
  const selectMode = useRef<"add" | "remove">("add");

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Excel Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported_count: number;
    failed_count: number;
    errors: { row: number; error: string }[];
  } | null>(null);
  const [importError, setImportError] = useState("");

  // ESC key listener for all modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showAddModal) setShowAddModal(false);
        if (showImportModal) {
          setShowImportModal(false);
          setImportFile(null);
          setImportResult(null);
          setImportError("");
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showAddModal, showImportModal]);

  const fetchHolidays = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/schools/holidays`, {
        headers: { Authorization: `Bearer ${token}` },
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

  const handleSaveHoliday = async (e?: React.FormEvent, forceOverwrite: boolean = false) => {
    if (e) e.preventDefault();
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

    let errorMessages: string[] = [];
    let foundConflict: any = null;

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
            force_overwrite: forceOverwrite,
          }),
        });
        if (!response.ok) {
          const resData = await response.json().catch(() => ({}));
          if (response.status === 409 && resData.has_existing_grades) {
            foundConflict = resData;
          } else {
            errorMessages.push(resData.error || `${dateStr} sanasini saqlashda xatolik`);
          }
        }
      } catch {
        errorMessages.push(`${dateStr} sanasini saqlashda xatolik`);
      }
    }

    setActionLoading(false);

    if (foundConflict) {
      setConflictData(foundConflict);
    } else if (errorMessages.length > 0) {
      setActionError(errorMessages.join("; "));
    } else {
      setConflictData(null);
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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchHolidays();
      } else {
        const data = await response.json();
        showAlert(data.error || "O'chirishda xatolik yuz berdi");
      }
    } catch {
      showAlert("Server bilan bog'lanishda xatolik");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${API_URL}/api/schools/import/template/holidays`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Shablonni yuklab bo'lmadi");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bayramlar_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      showAlert(err instanceof Error ? err.message : "Shablonni yuklab bo'lmadi");
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImportLoading(true);
    setImportError("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const response = await fetch(`${API_URL}/api/schools/import/holidays`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Yuklashda xatolik");
      setImportResult(data);
      if (data.imported_count > 0) fetchHolidays();
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Yuklashda xatolik");
    } finally {
      setImportLoading(false);
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

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const buildCalendarDays = () => {
    const firstOfMonth = new Date(calYear, calMonth, 1);
    let startDow = firstOfMonth.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;
    const start = new Date(calYear, calMonth, 1 - startDow);

    const days: { dateStr: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];
    const todayStr = formatLocalDate(new Date());
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const dateStr = formatLocalDate(d);
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
            Maktab, sinflar yoki levellar uchun dam olish kunlarini belgilash. Ushbu kunlarda dars jadvali to&apos;xtatiladi.
          </p>
        </div>

        {userInfo?.role === "ADMIN" && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              title="Excel orqali yuklash"
              onClick={() => {
                setShowImportModal(true);
                setImportFile(null);
                setImportResult(null);
                setImportError("");
              }}
              className="w-9 h-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs flex items-center justify-center transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              title="Bayram kuni qo'shish"
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
              className="w-9 h-9 bg-[#D4F562] text-[#1D1E26] rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
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
                      <td className="px-6 py-4 font-mono font-bold text-[#1D1E26]">{dateStr}</td>
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
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg max-h-[90vh] bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] flex flex-col overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-[#1D1E26]">Yangi Dam Olish Kuni Belgilash</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Belgilangan kuni mos sinflarda darslar o&apos;tilmaydi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer shrink-0"
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
                {/* Calendar */}
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
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-black text-[#1D1E26]">{MONTH_NAMES[calMonth]} {calYear}</span>
                      <button type="button" onClick={nextMonth} className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 border-b border-slate-100">
                      {DAY_NAMES.map((d) => (
                        <div key={d} className="py-2 text-center text-[10px] font-extrabold text-slate-400 font-mono">{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 p-2 gap-1">
                      {calDays.map(({ dateStr, day, isCurrentMonth, isToday }) => {
                        const isSelected = selectedDates.includes(dateStr);
                        return (
                          <div
                            key={dateStr}
                            onMouseDown={() => handleDayMouseDown(dateStr)}
                            onMouseEnter={() => handleDayMouseEnter(dateStr)}
                            className={`h-8 w-full flex items-center justify-center rounded-xl text-xs font-bold transition cursor-pointer ${
                              isSelected
                                ? "bg-[#1D1E26] text-[#D4F562] ring-2 ring-[#D4F562]/50"
                                : isToday
                                  ? "ring-2 ring-[#D4F562] text-[#1D1E26] bg-[#D4F562]/10"
                                  : isCurrentMonth
                                    ? "text-slate-700 hover:bg-slate-100"
                                    : "text-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>

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

                {/* Holiday name */}
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

                {/* Scope */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-2">Qamrov Turi</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["all", "levels", "classes"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setTargetType(type)}
                        className={`p-3 rounded-2xl border text-xs font-bold transition text-center cursor-pointer ${
                          targetType === type
                            ? "bg-[#D4F562] border-lime-300 text-[#1D1E26] shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {type === "all" ? "Butun Maktab" : type === "levels" ? "Levellar Boyicha" : "Sinflar Boyicha"}
                      </button>
                    ))}
                  </div>
                </div>

                {targetType === "levels" && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
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

                {targetType === "classes" && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
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

      {/* Modal: Conflict Confirmation */}
      {conflictData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Mavjud Baholar Topildi</h3>
            </div>
            
            <p className="text-xs text-slate-600 font-medium leading-relaxed bg-rose-50/70 p-4 rounded-2xl border border-rose-100">
              {conflictData.error}
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500 font-mono">
              ⚡ Ushbu dam olish kuni tasdiqlansa, tanlangan sanadagi {conflictData.grade_count} ta baho arxivlanadi va dam olish kuni belgilanadi.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConflictData(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleSaveHoliday(undefined, true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {actionLoading ? "Saqlanmoqda..." : "Baholarni arxivlash va Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Excel Import */}
      {showImportModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowImportModal(false);
              setImportFile(null);
              setImportResult(null);
              setImportError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1D1E26] flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Excel orqali Bayramlarni Yuklash
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Bir vaqtda ko&apos;p bayram kunlarini Excel orqali qo&apos;shing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportResult(null);
                  setImportError("");
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold py-3 rounded-2xl transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Excel shablonini yuklab olish
            </button>

            {importError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {importError}
              </div>
            )}

            {importResult ? (
              <>
                <div className={`p-4 rounded-2xl border text-xs font-semibold space-y-2 ${importResult.imported_count > 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{importResult.imported_count} ta bayram muvaffaqiyatli yuklandi</span>
                  </div>
                  {importResult.failed_count > 0 && (
                    <div className="text-red-600 mt-1">
                      {importResult.failed_count} ta qator xato:
                      <ul className="mt-1 space-y-0.5 list-disc list-inside">
                        {importResult.errors.slice(0, 5).map((e, i) => (
                          <li key={i}>Qator {e.row}: {e.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFile(null);
                      setImportResult(null);
                      setImportError("");
                    }}
                    className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
                  >
                    Yopish
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleImportSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">
                    Excel fayl tanlang (.xlsx)
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition ${
                      importFile ? "border-[#D4F562] bg-[#D4F562]/5" : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                    {importFile ? (
                      <p className="text-xs font-bold text-[#1D1E26]">{importFile.name}</p>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium">Faylni bu yerga tashlang yoki bosing</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setShowImportModal(false); setImportFile(null); setImportError(""); }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={!importFile || importLoading}
                    className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-5 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                  >
                    {importLoading ? "Yuklanmoqda..." : "Yuklash"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Custom Dialog Modal */}
      <CustomDialogModal
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </div>
  );
}
