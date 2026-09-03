"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ClassItem, ClassScheduleItem } from "./types";
import SmartCalendarModal, { SmartCalendarTrigger, formatWeekRangeLabel } from "@/components/SmartCalendarModal";
import { Calendar, RefreshCw, X, Upload, Plus } from "lucide-react";
import ScheduleImportSection from "./ScheduleImportSection";
import { addDays, formatLocalDate } from "@/lib/dateUtils";

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

interface PeriodInfo {
  key: string;
  startDate: string;
  endDate: string;
  periodNumber: number;
}

interface ClassCardData {
  cls: ClassItem;
  period?: PeriodInfo;
  scheduleItems: ClassScheduleItem[];
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

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const formatSelectedDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    const days = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
    const months = [
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
      "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ];
    return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()} (${days[d.getDay()]})`;
  };

  const sortedClasses = [...classes].sort((a, b) => {
    const la = a.level ?? 0;
    const lb = b.level ?? 0;
    if (la !== lb) return la - lb;
    return a.name.localeCompare(b.name);
  });

  const fetchAllSchedules = useCallback(async (targetDate?: string | null) => {
    if (!classes.length || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (sId) headers["X-School-ID"] = sId;

    const results: ClassScheduleMap = {};
    await Promise.all(
      classes.map(async (cls) => {
        try {
          const url = targetDate
            ? `${API_URL}/api/schools/classes/${cls.id}/schedule?date=${targetDate}`
            : `${API_URL}/api/schools/classes/${cls.id}/schedule`;
          const res = await fetch(url, { headers });
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
  }, [classes, token, API_URL]);

  useEffect(() => {
    fetchAllSchedules(selectedDate);
  }, [fetchAllSchedules, selectedDate]);

  const handleCardClick = (cls: ClassItem) => {
    const now = Date.now();
    const last = lastClickTime[cls.id] || 0;
    if (now - last < 400) {
      setLastClickTime({});
      onEditSchedule(cls);
    } else {
      setLastClickTime((prev) => ({ ...prev, [cls.id]: now }));
    }
  };

  // Build card data list (one card per class schedule period)
  const cardDataList: ClassCardData[] = [];
  sortedClasses.forEach((cls) => {
    const items = schedules[cls.id] || [];
    if (items.length === 0) {
      cardDataList.push({ cls, period: undefined, scheduleItems: [] });
    } else {
      // Find distinct periods
      const uniqueKeys: string[] = [];
      const periodList: { key: string; startDate: string; endDate: string }[] = [];
      items.forEach((item) => {
        const sDate = item.start_date || "";
        const eDate = item.end_date || "";
        const key = `${sDate}_${eDate}`;
        if (!uniqueKeys.includes(key)) {
          uniqueKeys.push(key);
          periodList.push({ key, startDate: sDate, endDate: eDate });
        }
      });
      // Sort periods ascending by start_date
      periodList.sort((a, b) => a.startDate.localeCompare(b.startDate));

      periodList.forEach((p, idx) => {
        const periodItems = items.filter(
          (item) => (item.start_date || "") === p.startDate && (item.end_date || "") === p.endDate
        );
        cardDataList.push({
          cls,
          period: { key: p.key, startDate: p.startDate, endDate: p.endDate, periodNumber: idx + 1 },
          scheduleItems: periodItems,
        });
      });
    }
  });

  // Group cards by level
  const grouped: { level: number; cardList: ClassCardData[] }[] = [];
  for (const card of cardDataList) {
    const level = card.cls.level ?? 0;
    const existing = grouped.find((g) => g.level === level);
    if (existing) {
      existing.cardList.push(card);
    } else {
      grouped.push({ level, cardList: [card] });
    }
  }

  const getCellSubject = (items: ClassScheduleItem[], dayOfWeek: number, lessonNumber: number): string => {
    const slot = items.find((s) => s.day_of_week === dayOfWeek && s.lesson_number === lessonNumber);
    return slot?.subject_name || "";
  };

  return (
    <div className="space-y-6 font-sans text-[#1D1E26]">
      {/* ── Unified Header ── */}
      <div className="bg-white border border-slate-100/80 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        

        <div className="flex items-center flex-wrap gap-2.5">
          <SmartCalendarTrigger
            label={
              selectedDate
                ? formatSelectedDateLabel(selectedDate)
                : "Sana tanlanmagan (Barchasi)"
            }
            onOpenCalendar={() => setIsCalendarOpen(true)}
            onPrevWeek={() => {
              const base = selectedDate || formatLocalDate(new Date());
              setSelectedDate(addDays(base, -1));
            }}
            onNextWeek={() => {
              const base = selectedDate || formatLocalDate(new Date());
              setSelectedDate(addDays(base, 1));
            }}
          />

          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              title="Sana filtrini tozalash (Barchasini ko'rsatish)"
              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-extrabold text-xs py-2 px-3 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Sana filtrini tozalash</span>
            </button>
          )}

          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 bg-[#1D1E26] hover:bg-slate-800 text-[#D4F562] font-extrabold text-xs py-2.5 px-4 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Excel Orqali Yoppasiga Yuklash</span>
          </button>

          <button
            onClick={() => fetchAllSchedules(selectedDate)}
            disabled={loading}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#1D1E26] font-extrabold text-xs py-2.5 px-3.5 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-8 h-8 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium font-mono">Jadvallar yuklanmoqda...</p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm font-medium">Sinflar topilmadi.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ level, cardList }) => (
            <div key={level} className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-extrabold bg-[#1D1E26] text-[#D4F562] px-2.5 py-1 font-mono">
                  {level > 0 ? `${level}-SINF` : "SINFSIZ"}
                </span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cardList.map(({ cls, period, scheduleItems }, idx) => {
                  const hasSchedule = scheduleItems.length > 0;
                  const usedLessons = Array.from(
                    new Set(scheduleItems.map((s) => s.lesson_number))
                  ).sort((a, b) => a - b);

                  return (
                    <div
                      key={period ? `${cls.id}_${period.key}` : `${cls.id}_none_${idx}`}
                      onClick={() => handleCardClick(cls)}
                      title="2 marta bosib tahrirlang"
                      className="bg-white border border-slate-100/80 hover:border-[#1D1E26] overflow-hidden shadow-xs cursor-pointer hover:shadow-md transition duration-200 select-none group flex flex-col justify-between"
                    >
                      <div>
                        {/* Card header */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 flex-wrap gap-1">
                          <span className="text-sm font-extrabold text-[#1D1E26]">{cls.name}</span>
                          {period ? (
                            <span className="text-[10px] font-extrabold bg-[#1D1E26] text-[#D4F562] px-2 py-0.5 font-mono">
                              {period.periodNumber}-chorak ({period.startDate})
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 font-mono">
                              Jadval yo&apos;q
                            </span>
                          )}
                        </div>

                        {/* Period dates sub-bar */}
                        {period && (
                          <div className="px-4 py-1.5 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span>Davr:</span>
                            <span>{period.startDate} — {period.endDate}</span>
                          </div>
                        )}

                        {/* Mini grid */}
                        {hasSchedule ? (
                          <div className="p-3">
                            <table className="w-full text-[10px] border-collapse">
                              <thead>
                                <tr>
                                  <th className="text-left text-[9px] font-mono text-slate-300 pb-1 pr-1 w-4">#</th>
                                  {DAY_SHORT.map((d, idx) => (
                                    <th key={idx} className="text-center font-extrabold text-slate-400 pb-1 px-0.5 font-mono">
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
                                      const subj = getCellSubject(scheduleItems, day, lessonNum);
                                      return (
                                        <td key={day} className="text-center py-0.5 px-0.5">
                                          {subj ? (
                                            <span
                                              className="inline-block bg-slate-100 text-[#1D1E26] px-1 py-0.5 text-[9px] font-bold leading-tight max-w-[38px] truncate"
                                              title={subj}
                                            >
                                              {subj.length > 4 ? subj.slice(0, 4) + "…" : subj}
                                            </span>
                                          ) : (
                                            <span className="inline-block w-4 h-3 bg-slate-50/80" />
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <p className="text-xs text-slate-400 font-medium">Bu sinf uchun jadval yaratilmagan.</p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsImportOpen(true);
                              }}
                              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1D1E26] hover:bg-slate-800 text-[#D4F562] text-xs font-extrabold transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Dars jadvalini yaratish</span>
                            </button>
                          </div>
                        )}
                      </div>
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
        mode="single"
        title="Sanani tanlash"
        theme="admin"
        selectedDate={selectedDate || undefined}
        onSelectDate={(dateStr) => {
          setSelectedDate(dateStr);
          setIsCalendarOpen(false);
        }}
      />

      <ScheduleImportSection
        token={token}
        API_URL={API_URL}
        classes={classes}
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => fetchAllSchedules(selectedDate)}
      />
    </div>
  );
}
