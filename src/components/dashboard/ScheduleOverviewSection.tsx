"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ClassItem, ClassScheduleItem } from "./types";
import SmartCalendarModal, { SmartCalendarTrigger, getMondayOfDate, formatDateISO, formatWeekRangeLabel } from "@/components/SmartCalendarModal";

interface ScheduleOverviewSectionProps {
  classes: ClassItem[];
  token: string;
  API_URL: string;
  onEditSchedule: (cls: ClassItem) => void;
}

const DAY_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sha"];
const MAX_LESSONS = 8;

interface ClassScheduleMap {
  [classId: number]: ClassScheduleItem[];
}

export default function ScheduleOverviewSection({
  classes,
  token,
  API_URL,
  onEditSchedule,
}: ScheduleOverviewSectionProps) {
  const [schedules, setSchedules] = useState<ClassScheduleMap>({});
  const [loading, setLoading] = useState(false);
  const [lastClickTime, setLastClickTime] = useState<{ [id: number]: number }>({});

  const sortedClasses = [...classes].sort((a, b) => {
    const la = a.level ?? 0;
    const lb = b.level ?? 0;
    if (la !== lb) return la - lb;
    return a.name.localeCompare(b.name);
  });

  const [selectedWeekStart, setSelectedWeekStart] = useState(() => formatDateISO(getMondayOfDate(new Date())));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const fetchAllSchedules = useCallback(async (targetDate?: string) => {
    if (!classes.length || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const dateQuery = targetDate || selectedWeekStart || new Date().toISOString().split("T")[0];
    const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (sId) headers["X-School-ID"] = sId;

    const results: ClassScheduleMap = {};
    await Promise.all(
      classes.map(async (cls) => {
        try {
          const res = await fetch(
            `${API_URL}/api/schools/classes/${cls.id}/schedule?date=${dateQuery}`,
            { headers }
          );
          if (res.ok) {
            const data = await res.json();
            results[cls.id] = Array.isArray(data) ? data : [];
          } else {
            results[cls.id] = [];
          }
        } catch {
          results[cls.id] = [];
        }
      })
    );
    setSchedules(results);
    setLoading(false);
  }, [classes, token, API_URL, selectedWeekStart]);

  useEffect(() => {
    fetchAllSchedules();
  }, [fetchAllSchedules]);

  const handleCardClick = (cls: ClassItem) => {
    const now = Date.now();
    const last = lastClickTime[cls.id] || 0;
    if (now - last < 400) {
      // double click detected
      setLastClickTime({});
      onEditSchedule(cls);
    } else {
      setLastClickTime((prev) => ({ ...prev, [cls.id]: now }));
    }
  };

  const grouped: { level: number; classList: ClassItem[] }[] = [];
  for (const cls of sortedClasses) {
    const level = cls.level ?? 0;
    const existing = grouped.find((g) => g.level === level);
    if (existing) {
      existing.classList.push(cls);
    } else {
      grouped.push({ level, classList: [cls] });
    }
  }

  const getCellSubject = (classId: number, dayOfWeek: number, lessonNumber: number): string => {
    const schedule = schedules[classId] || [];
    const slot = schedule.find((s) => s.day_of_week === dayOfWeek && s.lesson_number === lessonNumber);
    return slot?.subject_name || "";
  };

  return (
    <div className="space-y-8 font-sans text-[#1D1E26]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1D1E26] tracking-tight">Dars Jadvali</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Barcha sinflarning haftalik dars jadvali — level bo&apos;yicha saralangan.{" "}
            <span className="font-bold text-[#1D1E26]">2 marta bosib</span> tahrirlashga o&apos;ting.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <SmartCalendarTrigger
            label={formatWeekRangeLabel(new Date(selectedWeekStart + "T00:00:00"))}
            onOpenCalendar={() => setIsCalendarOpen(true)}
            onPrevWeek={() => {
              const d = new Date(selectedWeekStart + "T00:00:00");
              d.setDate(d.getDate() - 7);
              const nextMon = formatDateISO(d);
              setSelectedWeekStart(nextMon);
              fetchAllSchedules(nextMon);
            }}
            onNextWeek={() => {
              const d = new Date(selectedWeekStart + "T00:00:00");
              d.setDate(d.getDate() + 7);
              const nextMon = formatDateISO(d);
              setSelectedWeekStart(nextMon);
              fetchAllSchedules(nextMon);
            }}
          />

          <button
            onClick={() => fetchAllSchedules(selectedWeekStart)}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Yangilash
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Jadvallar yuklanmoqda...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <p className="text-slate-400 text-sm font-medium">Hali birorta sinf yaratilmagan.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ level, classList }) => (
            <div key={level}>
              {/* Level heading */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#D4F562] text-[#1D1E26] flex items-center justify-center text-xs font-black shadow-sm">
                  {level || "?"}
                </div>
                <h2 className="text-sm font-black text-[#1D1E26]">
                  {level ? `${level}-sinf darajasi` : "Daraja belgilanmagan"}
                </h2>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400 font-mono">{classList.length} sinf</span>
              </div>

              {/* Card grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {classList.map((cls) => {
                  const clsSchedule = schedules[cls.id] || [];
                  const hasSchedule = clsSchedule.length > 0;

                  // Determine which lesson rows actually have content
                  const usedLessons = Array.from({ length: MAX_LESSONS }, (_, i) => i + 1).filter((lessonNum) =>
                    [1, 2, 3, 4, 5, 6].some((d) => getCellSubject(cls.id, d, lessonNum) !== "")
                  );

                  return (
                    <div
                      key={cls.id}
                      onClick={() => handleCardClick(cls)}
                      title="2 marta bosib tahrirlang"
                      className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs cursor-pointer hover:border-[#D4F562] hover:shadow-md hover:scale-[1.01] transition-all duration-200 select-none group"
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                        <span className="text-sm font-black text-[#1D1E26]">{cls.name}</span>
                        {hasSchedule ? (
                          <span className="text-[10px] font-bold bg-[#ECFCCA] text-[#65A30D] px-2 py-0.5 rounded-lg">
                            ✓ Jadval bor
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg">
                            Jadval yo&apos;q
                          </span>
                        )}
                      </div>

                      {/* Mini grid */}
                      {hasSchedule ? (
                        <div className="p-3">
                          <table className="w-full text-[10px] border-collapse">
                            <thead>
                              <tr>
                                <th className="text-left text-[9px] font-mono text-slate-300 pb-1 pr-1 w-4">#</th>
                                {DAY_SHORT.map((d, idx) => (
                                  <th key={idx} className="text-center font-extrabold text-slate-400 pb-1 px-0.5">
                                    {d}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {usedLessons.map((lessonNum) => (
                                <tr key={lessonNum} className="border-t border-slate-50">
                                  <td className="text-[9px] font-mono text-slate-300 pr-1 py-0.5">
                                    {lessonNum}
                                  </td>
                                  {[1, 2, 3, 4, 5, 6].map((day) => {
                                    const subj = getCellSubject(cls.id, day, lessonNum);
                                    return (
                                      <td key={day} className="text-center py-0.5 px-0.5">
                                        {subj ? (
                                          <span
                                            className="inline-block bg-[#E0F2FE] text-[#0284C7] rounded px-1 py-0.5 text-[9px] font-bold leading-tight max-w-[38px] truncate"
                                            title={subj}
                                          >
                                            {subj.length > 4 ? subj.slice(0, 4) + "…" : subj}
                                          </span>
                                        ) : (
                                          <span className="inline-block w-4 h-3 rounded bg-slate-50/80" />
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="text-[9px] text-slate-300 font-mono text-right mt-1.5 pt-1 border-t border-slate-50">
                            2× bosib tahrirlang
                          </p>
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2">
                            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium">Jadval belgilanmagan</p>
                          <p className="text-[10px] text-slate-300 mt-0.5">2 marta bosib qo&apos;shing</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <SmartCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        mode="week"
        selectedWeekStart={selectedWeekStart}
        onSelectWeek={(monStr) => {
          setSelectedWeekStart(monStr);
          fetchAllSchedules(monStr);
        }}
        title="Jadval haftasini tanlash"
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[#E0F2FE]" /> Fan nomi
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[#ECFCCA]" /> Jadval mavjud
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-slate-100" /> Jadval yo&apos;q
        </span>
        <span className="ml-auto hidden sm:block">
          Du · Se · Ch · Pa · Ju · Sha = hafta kunlari
        </span>
      </div>
    </div>
  );
}
