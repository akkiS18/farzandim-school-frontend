"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, X, RotateCcw } from "lucide-react";

export interface SmartCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "week" | "single";
  allowModeSwitch?: boolean;
  selectedDate?: string; // "YYYY-MM-DD"
  selectedWeekStart?: string; // "YYYY-MM-DD" (Monday)
  onSelectWeek?: (weekStartStr: string, weekEndStr: string, label: string) => void;
  onSelectDate?: (dateStr: string) => void;
  title?: string;
  theme?: "teacher" | "admin" | "parent";
}

const MONTH_NAMES_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
];

const DAY_NAMES_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sha", "Ya"];

interface CalendarDayItem {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNum: number;
  monthType: "prev" | "current" | "next";
  isToday: boolean;
  weekIndex: number;
}

/** Helper: get Monday of a date */
export function getMondayOfDate(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Helper: format date YYYY-MM-DD */
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Helper: format Uz week label e.g. "28 Sentabr – 4 Oktabr" */
export function formatWeekRangeLabel(mon: Date, includeSunday = true): string {
  const end = new Date(mon);
  end.setDate(mon.getDate() + (includeSunday ? 6 : 5));

  const monDay = mon.getDate();
  const monMonth = MONTH_NAMES_UZ[mon.getMonth()];
  const endDay = end.getDate();
  const endMonth = MONTH_NAMES_UZ[end.getMonth()];

  if (mon.getMonth() === end.getMonth()) {
    return `${monDay} – ${endDay} ${monMonth}`;
  }
  return `${monDay} ${monMonth} – ${endDay} ${endMonth}`;
}

export default function SmartCalendarModal({
  isOpen,
  onClose,
  mode = "week",
  allowModeSwitch = false,
  selectedDate,
  selectedWeekStart,
  onSelectWeek,
  onSelectDate,
  title = "Haftani tanlash",
  theme = "admin",
}: SmartCalendarModalProps) {
  const isTeacherTheme = theme === "teacher";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [activeMode, setActiveMode] = useState<"single" | "week">(mode);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [hoveredWeekIdx, setHoveredWeekIdx] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveMode(mode);
      let targetDate = today;
      if (mode === "week" && selectedWeekStart) {
        targetDate = new Date(selectedWeekStart + "T00:00:00");
      } else if (selectedDate) {
        targetDate = new Date(selectedDate + "T00:00:00");
      }
      if (!isNaN(targetDate.getTime())) {
        setViewYear(targetDate.getFullYear());
        setViewMonth(targetDate.getMonth());
      }
      setShowMonthYearPicker(false);
      setHoveredWeekIdx(null);
    }
  }, [isOpen, selectedDate, selectedWeekStart, mode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const buildCalendarGrid = (): CalendarDayItem[][] => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const gridStart = new Date(firstDayOfMonth);
    gridStart.setDate(firstDayOfMonth.getDate() - startDayOfWeek);
    gridStart.setHours(0, 0, 0, 0);

    const weeks: CalendarDayItem[][] = [];
    const todayStr = formatDateISO(today);

    let curr = new Date(gridStart);
    for (let w = 0; w < 6; w++) {
      const weekDays: CalendarDayItem[] = [];
      for (let d = 0; d < 7; d++) {
        const dateCopy = new Date(curr);
        const dateStr = formatDateISO(dateCopy);

        let monthType: "prev" | "current" | "next" = "current";
        if (dateCopy.getMonth() < viewMonth || (viewMonth === 0 && dateCopy.getMonth() === 11 && dateCopy.getFullYear() < viewYear)) {
          monthType = "prev";
        } else if (dateCopy.getMonth() > viewMonth || (viewMonth === 11 && dateCopy.getMonth() === 0 && dateCopy.getFullYear() > viewYear)) {
          monthType = "next";
        }

        weekDays.push({
          date: dateCopy,
          dateStr,
          dayNum: dateCopy.getDate(),
          monthType,
          isToday: dateStr === todayStr,
          weekIndex: w,
        });

        curr.setDate(curr.getDate() + 1);
      }
      weeks.push(weekDays);
    }
    return weeks;
  };

  const weeksGrid = buildCalendarGrid();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToday = () => {
    const tMon = getMondayOfDate(today);
    const tMonStr = formatDateISO(tMon);
    const tSun = new Date(tMon);
    tSun.setDate(tMon.getDate() + 6);
    const tSunStr = formatDateISO(tSun);
    const label = formatWeekRangeLabel(tMon);

    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());

    if (activeMode === "week") {
      if (onSelectWeek) onSelectWeek(tMonStr, tSunStr, label);
      else if (onSelectDate) onSelectDate(tMonStr);
      onClose();
    } else {
      if (onSelectDate) onSelectDate(formatDateISO(today));
      onClose();
    }
  };

  const handleDayClick = (dayItem: CalendarDayItem) => {
    if (activeMode === "week") {
      const mon = getMondayOfDate(dayItem.date);
      const monStr = formatDateISO(mon);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const sunStr = formatDateISO(sun);
      const label = formatWeekRangeLabel(mon);

      if (onSelectWeek) {
        onSelectWeek(monStr, sunStr, label);
      } else if (onSelectDate) {
        onSelectDate(monStr);
      }
      onClose();
    } else {
      if (onSelectDate) {
        onSelectDate(dayItem.dateStr);
      }
      onClose();
    }
  };

  const isWeekSelected = (weekDays: CalendarDayItem[]): boolean => {
    if (activeMode !== "week") return false;
    const mon = getMondayOfDate(weekDays[0].date);
    const monStr = formatDateISO(mon);
    return monStr === selectedWeekStart || (selectedDate ? monStr === formatDateISO(getMondayOfDate(new Date(selectedDate + "T00:00:00"))) : false);
  };

  const isDaySelected = (dayItem: CalendarDayItem): boolean => {
    if (activeMode === "single" && selectedDate) {
      return dayItem.dateStr === selectedDate;
    }
    return false;
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
    >
      <div
        className={`w-full max-w-sm bg-white border ${
          isTeacherTheme ? "border-neutral-200 rounded-none shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-5" : "border-slate-200 rounded-none shadow-2xl p-5"
        } text-slate-800 flex flex-col relative select-none`}
      >
        {/* Header bar */}
        <div className={`flex items-center justify-between border-b ${isTeacherTheme ? "border-neutral-200 pb-3 mb-3.5" : "border-slate-100 pb-3 mb-3.5"}`}>
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 flex items-center justify-center ${
                isTeacherTheme
                  ? "rounded-none bg-slate-50 border border-neutral-200 text-[#A51C30]"
                  : "rounded-none bg-[#ECFCCA] text-[#65A30D]"
              }`}
            >
              <Calendar size={15} />
            </div>
            <h3 className={`text-sm font-bold ${isTeacherTheme ? "font-serif text-slate-900" : "text-slate-800"}`}>
              {title}
            </h3>
          </div>

          {allowModeSwitch && (
            <div className={`flex items-center p-0.5 ${isTeacherTheme ? "rounded-none bg-slate-100 border border-neutral-200" : "rounded-none bg-slate-100"}`}>
              <button
                type="button"
                onClick={() => setActiveMode("single")}
                className={`px-2.5 py-1 text-[10px] font-bold font-sans uppercase tracking-wider transition ${
                  isTeacherTheme ? "rounded-none" : "rounded-none"
                } ${
                  activeMode === "single"
                    ? isTeacherTheme
                      ? "bg-[#1E2B42] text-white"
                      : "bg-emerald-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Kunlik
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("week")}
                className={`px-2.5 py-1 text-[10px] font-bold font-sans uppercase tracking-wider transition ${
                  isTeacherTheme ? "rounded-none" : "rounded-none"
                } ${
                  activeMode === "week"
                    ? isTeacherTheme
                      ? "bg-[#1E2B42] text-white"
                      : "bg-emerald-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Haftalik
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`w-7 h-7 flex items-center justify-center transition text-slate-500 hover:text-slate-800 cursor-pointer ${
              isTeacherTheme ? "rounded-none border border-neutral-200 bg-slate-50 hover:bg-neutral-100" : "rounded-none bg-slate-100 hover:bg-slate-200"
            }`}
          >
            <X size={15} />
          </button>
        </div>

        {/* Month & Navigation Bar */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={handlePrevMonth}
            className={`w-8 h-8 flex items-center justify-center transition text-slate-700 cursor-pointer ${
              isTeacherTheme
                ? "rounded-none border border-neutral-200 bg-slate-50 hover:bg-slate-100"
                : "rounded-none border border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <ChevronLeft size={16} />
          </button>

          <span className={`text-sm font-bold ${isTeacherTheme ? "font-serif text-slate-900" : "text-slate-800"}`}>
            {MONTH_NAMES_UZ[viewMonth]} {viewYear}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className={`w-8 h-8 flex items-center justify-center transition text-slate-700 cursor-pointer ${
              isTeacherTheme
                ? "rounded-none border border-neutral-200 bg-slate-50 hover:bg-slate-100"
                : "rounded-none border border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day of Week Headers */}
        <div className={`grid grid-cols-7 text-center pb-1.5 mb-1.5 border-b ${isTeacherTheme ? "border-neutral-200" : "border-slate-100"}`}>
          {DAY_NAMES_SHORT.map((d, i) => (
            <span
              key={d}
              className={`text-[10px] font-bold font-sans uppercase tracking-wider ${
                i >= 5 ? (isTeacherTheme ? "text-[#A51C30]" : "text-red-500") : "text-slate-500"
              }`}
            >
              {d}
            </span>
          ))}
        </div>

        {/* 6-Week Grid Container */}
        <div className="flex flex-col gap-1 relative" onMouseLeave={() => setHoveredWeekIdx(null)}>
          {weeksGrid.map((weekDays, wIdx) => {
            const isHovered = activeMode === "week" && hoveredWeekIdx === wIdx;
            const isSelected = activeMode === "week" && isWeekSelected(weekDays);

            let weekBorderClass = "border border-transparent";
            let weekBgClass = "bg-transparent";

            if (isSelected) {
              weekBorderClass = isTeacherTheme ? "border border-[#A51C30]" : "border-2 border-[#D4F562]";
              weekBgClass = isTeacherTheme ? "bg-[#A51C30]/5" : "bg-[#ECFCCA]";
            } else if (isHovered) {
              weekBorderClass = isTeacherTheme ? "border border-slate-300" : "border-2 border-amber-400";
              weekBgClass = isTeacherTheme ? "bg-slate-50" : "bg-amber-50/50";
            }

            return (
              <div
                key={wIdx}
                onMouseEnter={() => activeMode === "week" && setHoveredWeekIdx(wIdx)}
                onClick={() => activeMode === "week" && handleDayClick(weekDays[0])}
                className={`grid grid-cols-7 gap-1 p-0.5 transition-all ${
                  isTeacherTheme ? "rounded-none" : "rounded-none"
                } ${weekBorderClass} ${weekBgClass} ${activeMode === "week" ? "cursor-pointer" : "cursor-default"}`}
              >
                {weekDays.map((dayItem) => {
                  const daySel = isDaySelected(dayItem);
                  const isPrev = dayItem.monthType === "prev";
                  const isNext = dayItem.monthType === "next";

                  let cellClass = "text-slate-800 font-semibold hover:bg-slate-100";

                  if (isPrev || isNext) {
                    cellClass = "text-slate-300 font-normal";
                  }

                  if (activeMode === "single" && daySel) {
                    cellClass = isTeacherTheme
                      ? "bg-[#A51C30] text-white font-bold shadow-xs"
                      : "bg-[#1D1E26] text-white font-bold shadow-xs";
                  } else if (dayItem.isToday) {
                    cellClass = isTeacherTheme
                      ? "border border-[#1E2B42] text-[#1E2B42] font-bold bg-slate-50"
                      : "bg-amber-100 text-amber-900 font-bold";
                  }

                  return (
                    <div
                      key={dayItem.dateStr}
                      onClick={(e) => {
                        if (activeMode === "single") {
                          e.stopPropagation();
                          handleDayClick(dayItem);
                        }
                      }}
                      className={`h-7.5 flex items-center justify-center text-xs transition-colors cursor-pointer ${
                        isTeacherTheme ? "rounded-none" : "rounded-none"
                      } ${cellClass}`}
                    >
                      {dayItem.dayNum}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Quick Month/Year Selector Overlay */}
          {showMonthYearPicker && (
            <div
              className={`absolute inset-0 bg-white p-4 z-20 flex flex-col justify-between border ${
                isTeacherTheme ? "border-neutral-200 rounded-none" : "border-slate-200 rounded-none"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className={`text-xs font-bold ${isTeacherTheme ? "font-sans uppercase tracking-wider text-slate-700" : "text-slate-800"}`}>
                  Oy va Yilni tanlang
                </span>
                <button
                  type="button"
                  onClick={() => setShowMonthYearPicker(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Years bar */}
              <div className="flex justify-center gap-1.5 my-2">
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setViewYear(y)}
                    className={`px-2.5 py-1 text-[11px] font-bold font-sans transition cursor-pointer ${
                      isTeacherTheme ? "rounded-none" : "rounded-none"
                    } ${
                      viewYear === y
                        ? isTeacherTheme
                          ? "bg-[#1E2B42] text-white"
                          : "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>

              {/* Months grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {MONTH_NAMES_UZ.map((mName, mIdx) => (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => {
                      setViewMonth(mIdx);
                      setShowMonthYearPicker(false);
                    }}
                    className={`p-2 text-[11px] font-bold font-sans transition cursor-pointer ${
                      isTeacherTheme ? "rounded-none" : "rounded-none"
                    } ${
                      viewMonth === mIdx
                        ? isTeacherTheme
                            ? "bg-[#A51C30] text-white"
                            : "bg-[#D4F562] text-[#1D1E26] font-bold"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100"
                    }`}
                  >
                    {mName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className={`flex items-center justify-between border-t ${isTeacherTheme ? "border-neutral-200 pt-3 mt-3" : "border-slate-100 pt-3 mt-3"}`}>
          <button
            type="button"
            onClick={() => setShowMonthYearPicker((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-sans uppercase tracking-wider transition cursor-pointer ${
              isTeacherTheme
                ? "rounded-none border border-neutral-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
                : "rounded-none border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <Calendar size={13} className={isTeacherTheme ? "text-[#A51C30]" : "text-[#1D1E26]"} />
            <span>{String(viewMonth + 1).padStart(2, "0")} / {viewYear}</span>
          </button>

          <button
            type="button"
            onClick={handleJumpToday}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold font-sans uppercase tracking-wider transition cursor-pointer ${
              isTeacherTheme
                ? "rounded-none border border-[#1E2B42] bg-[#1E2B42] hover:bg-[#141E2E] text-white"
                : "rounded-none border border-[#D4F562] bg-[#D4F562] hover:opacity-90 text-[#1D1E26] font-black"
            }`}
          >
            <RotateCcw size={13} />
            <span>Bugun</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Reusable Header Trigger Component */
export interface SmartCalendarTriggerProps {
  label: string;
  onOpenCalendar: () => void;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
}

export function SmartCalendarTrigger({
  label,
  onOpenCalendar,
  onPrevWeek,
  onNextWeek,
}: SmartCalendarTriggerProps) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", userSelect: "none" }}>
      {onPrevWeek && (
        <button
          type="button"
          onClick={onPrevWeek}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "0",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#475569",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
          title="Oldingi hafta"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <button
        type="button"
        onClick={onOpenCalendar}
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          color: "#1E293B",
          fontWeight: 800,
          fontSize: "13px",
          padding: "8px 18px",
          borderRadius: "0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          whiteSpace: "nowrap",
          transition: "all 0.15s ease",
        }}
      >
        <Calendar size={16} color="#1D1E26" />
        <span>{label}</span>
      </button>

      {onNextWeek && (
        <button
          type="button"
          onClick={onNextWeek}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "0",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#475569",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            transition: "all 0.15s ease",
          }}
          title="Keyingi hafta"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
