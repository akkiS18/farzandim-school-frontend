"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar, X, Check, RotateCcw } from "lucide-react";

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
  weekIndex: number; // 0 to 5
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
  title = "Sana tanlash",
}: SmartCalendarModalProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Active viewing Mode ("single" | "week")
  const [activeMode, setActiveMode] = useState<"single" | "week">(mode);

  // Active viewing Month/Year
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Quick Month/Year Selector Overlay
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

  // Hovered week row for week-mode visual oval outline
  const [hoveredWeekIdx, setHoveredWeekIdx] = useState<number | null>(null);

  // Reset view to selected date / week start when opened
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

  // Esc key listener
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

  // Build 6 weeks x 7 days grid (42 days)
  const buildCalendarGrid = (): CalendarDayItem[][] => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    let startDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon...
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // 0=Mon, 6=Sun

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

  // Navigation handlers
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

  // Jump to Today
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

  // Selection handler
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

  // Active selected week check
  const isWeekSelected = (weekDays: CalendarDayItem[]): boolean => {
    if (activeMode !== "week") return false;
    const mon = getMondayOfDate(weekDays[0].date);
    const monStr = formatDateISO(mon);
    return monStr === selectedWeekStart || (selectedDate ? monStr === formatDateISO(getMondayOfDate(new Date(selectedDate + "T00:00:00"))) : false);
  };

  // Active selected single day check
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn"
    >
      <div className="w-full max-w-sm bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xl text-[#1D1E26] flex flex-col relative overflow-hidden select-none">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#5B50EC]" />
            <h3 className="text-sm font-black text-[#1D1E26] tracking-tight">{title}</h3>
          </div>

          {/* Mode Switcher Tabs (Only if allowModeSwitch is true) */}
          {allowModeSwitch && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveMode("single")}
                className={`px-2 py-0.5 text-[10px] font-black rounded-lg transition cursor-pointer ${
                  activeMode === "single"
                    ? "bg-[#5B50EC] text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📅 Kunlik
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("week")}
                className={`px-2 py-0.5 text-[10px] font-black rounded-lg transition cursor-pointer ${
                  activeMode === "week"
                    ? "bg-red-500 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🗓 Haftalik
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month & Navigation Bar */}
        <div className="flex items-center justify-between px-1 py-1.5 mb-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 text-slate-600 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-black text-[#1D1E26]">
            {MONTH_NAMES_UZ[viewMonth]} {viewYear}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 text-slate-600 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day of Week Headers (Du, Se, Ch...) */}
        <div className="grid grid-cols-7 gap-1 text-center py-1 mb-1 border-b border-slate-100">
          {DAY_NAMES_SHORT.map((d, i) => (
            <span
              key={d}
              className={`text-[10px] font-extrabold uppercase font-mono ${
                i >= 5 ? "text-red-400" : "text-slate-400"
              }`}
            >
              {d}
            </span>
          ))}
        </div>

        {/* 6-Week Grid Container */}
        <div className="space-y-1 relative" onMouseLeave={() => setHoveredWeekIdx(null)}>
          {weeksGrid.map((weekDays, wIdx) => {
            const isHovered = activeMode === "week" && hoveredWeekIdx === wIdx;
            const isSelected = activeMode === "week" && isWeekSelected(weekDays);

            // Guaranteed Red Oval Outline Style for Week Mode
            let weekRowStyle: React.CSSProperties = {
              transition: "all 0.15s ease",
              borderRadius: "16px",
              padding: "2px",
            };

            if (isSelected) {
              weekRowStyle = {
                ...weekRowStyle,
                border: "2.5px solid #5B50EC",
                backgroundColor: "rgba(91, 80, 236, 0.15)",
                boxShadow: "0 2px 8px rgba(91, 80, 236, 0.2)",
              };
            } else if (isHovered) {
              weekRowStyle = {
                ...weekRowStyle,
                border: "2.5px solid #EF4444", // RED OVAL OUTLINE EXACTLY LIKE SKETCH!
                backgroundColor: "rgba(239, 68, 68, 0.14)",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
                transform: "scale(1.02)",
              };
            }

            return (
              <div
                key={wIdx}
                onMouseEnter={() => activeMode === "week" && setHoveredWeekIdx(wIdx)}
                onClick={() => activeMode === "week" && handleDayClick(weekDays[0])}
                style={weekRowStyle}
                className={`grid grid-cols-7 gap-1 relative ${
                  activeMode === "week" ? "cursor-pointer" : ""
                }`}
              >
                {weekDays.map((dayItem) => {
                  const daySel = isDaySelected(dayItem);
                  const isPrev = dayItem.monthType === "prev";
                  const isNext = dayItem.monthType === "next";

                  let dayCellClasses = "h-8 rounded-xl flex items-center justify-center text-xs font-bold font-mono transition-all duration-150 transform select-none cursor-pointer ";

                  if (activeMode === "single") {
                    if (daySel) {
                      dayCellClasses += "bg-[#5B50EC] text-white ring-2 ring-[#5B50EC] shadow-md scale-105";
                    } else if (dayItem.isToday) {
                      dayCellClasses += "ring-2 ring-[#D4F562] bg-[#D4F562]/30 text-[#1D1E26] font-black hover:bg-[#5B50EC] hover:text-white hover:ring-[#5B50EC] hover:scale-110 hover:shadow-md hover:z-10";
                    } else if (isPrev) {
                      dayCellClasses += "text-emerald-500/70 hover:bg-[#5B50EC] hover:text-white hover:scale-110 hover:shadow-md hover:z-10";
                    } else if (isNext) {
                      dayCellClasses += "text-indigo-400/70 hover:bg-[#5B50EC] hover:text-white hover:scale-110 hover:shadow-md hover:z-10";
                    } else {
                      dayCellClasses += "text-slate-800 hover:bg-[#5B50EC] hover:text-white hover:scale-110 hover:shadow-md hover:z-10";
                    }
                  } else {
                    // Week Mode: individual days do NOT have single-day hover/selected circles
                    if (dayItem.isToday) {
                      dayCellClasses += "ring-1 ring-[#5B50EC] text-[#5B50EC] font-black";
                    } else if (isPrev) {
                      dayCellClasses += "text-emerald-500/70 font-semibold";
                    } else if (isNext) {
                      dayCellClasses += "text-indigo-400/70 font-semibold";
                    } else {
                      dayCellClasses += "text-slate-800 font-bold";
                    }
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
                      className={dayCellClasses}
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
            <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-2xl p-4 z-20 flex flex-col justify-between animate-fadeIn border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-xs font-black text-[#1D1E26]">Oy va Yilni Tanlang</span>
                <button
                  type="button"
                  onClick={() => setShowMonthYearPicker(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Years bar */}
              <div className="flex items-center justify-center space-x-2 py-1">
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setViewYear(y)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      viewYear === y
                        ? "bg-[#1D1E26] text-[#D4F562]"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>

              {/* Months grid */}
              <div className="grid grid-cols-3 gap-2 py-2">
                {MONTH_NAMES_UZ.map((mName, mIdx) => (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => {
                      setViewMonth(mIdx);
                      setShowMonthYearPicker(false);
                    }}
                    className={`p-2 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
                      viewMonth === mIdx
                        ? "bg-[#5B50EC] text-white"
                        : "bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {mName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer controls (sketched 09/2026 button & today button) */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
          {/* MM/YYYY Button (Sketched red pill button) */}
          <button
            type="button"
            onClick={() => setShowMonthYearPicker((prev) => !prev)}
            className="flex items-center space-x-1.5 border-2 border-red-500 text-red-600 bg-red-50/50 hover:bg-red-500 hover:text-white px-3.5 py-1.5 rounded-2xl text-xs font-black font-mono transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95"
          >
            <span>
              {String(viewMonth + 1).padStart(2, "0")}/{viewYear}
            </span>
          </button>

          {/* Today Button (Sketched blue pill button) */}
          <button
            type="button"
            onClick={handleJumpToday}
            className="flex items-center space-x-1.5 border-2 border-[#5B50EC] text-[#5B50EC] bg-[#5B50EC]/10 hover:bg-[#5B50EC] hover:text-white px-4 py-1.5 rounded-2xl text-xs font-black font-mono transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Bugun (today)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Reusable Header Trigger Component [ ← ] [ 28 Sentabr – 4 Oktabr ] [ → ] */
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
    <div className="flex items-center space-x-2 select-none">
      {onPrevWeek && (
        <button
          type="button"
          onClick={onPrevWeek}
          className="w-8 h-8 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold transition cursor-pointer shadow-xs"
          title="Oldingi hafta"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      <button
        type="button"
        onClick={onOpenCalendar}
        className="bg-white border-2 border-[#5B50EC]/30 hover:border-[#5B50EC] text-[#1D1E26] font-black text-xs px-4 py-2 rounded-2xl shadow-xs transition cursor-pointer flex items-center space-x-2 group"
      >
        <Calendar className="w-4 h-4 text-[#5B50EC] group-hover:scale-110 transition-transform" />
        <span>{label}</span>
      </button>

      {onNextWeek && (
        <button
          type="button"
          onClick={onNextWeek}
          className="w-8 h-8 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold transition cursor-pointer shadow-xs"
          title="Keyingi hafta"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
