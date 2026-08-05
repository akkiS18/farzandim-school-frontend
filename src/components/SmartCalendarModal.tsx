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
}: SmartCalendarModalProps) {
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "24px",
          padding: "20px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12)",
          color: "#1E293B",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          userSelect: "none",
        }}
      >
        {/* Header bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "12px", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "#ECFDF5", color: "#00A389", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={16} />
            </div>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#1E293B", margin: 0 }}>{title}</h3>
          </div>

          {allowModeSwitch && (
            <div style={{ display: "flex", alignItems: "center", backgroundColor: "#F1F5F9", padding: "2px", borderRadius: "10px" }}>
              <button
                type="button"
                onClick={() => setActiveMode("single")}
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 700,
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: activeMode === "single" ? "#00A389" : "transparent",
                  color: activeMode === "single" ? "#FFFFFF" : "#64748B",
                  cursor: "pointer",
                }}
              >
                Kunlik
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("week")}
                style={{
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 700,
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: activeMode === "week" ? "#00A389" : "transparent",
                  color: activeMode === "week" ? "#FFFFFF" : "#64748B",
                  cursor: "pointer",
                }}
              >
                Haftalik
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "#F1F5F9",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748B",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Month & Navigation Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={18} />
          </button>

          <span style={{ fontSize: "14px", fontWeight: 800, color: "#1E293B" }}>
            {MONTH_NAMES_UZ[viewMonth]} {viewYear}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day of Week Headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", paddingBottom: "6px", marginBottom: "6px", borderBottom: "1px solid #F1F5F9" }}>
          {DAY_NAMES_SHORT.map((d, i) => (
            <span
              key={d}
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: i >= 5 ? "#EF4444" : "#94A3B8",
              }}
            >
              {d}
            </span>
          ))}
        </div>

        {/* 6-Week Grid Container */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", position: "relative" }} onMouseLeave={() => setHoveredWeekIdx(null)}>
          {weeksGrid.map((weekDays, wIdx) => {
            const isHovered = activeMode === "week" && hoveredWeekIdx === wIdx;
            const isSelected = activeMode === "week" && isWeekSelected(weekDays);

            let weekRowStyle: React.CSSProperties = {
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "4px",
              borderRadius: "12px",
              padding: "3px",
              transition: "all 0.15s ease",
              cursor: activeMode === "week" ? "pointer" : "default",
            };

            if (isSelected) {
              weekRowStyle = {
                ...weekRowStyle,
                border: "2px solid #00A389",
                backgroundColor: "#ECFDF5",
              };
            } else if (isHovered) {
              weekRowStyle = {
                ...weekRowStyle,
                border: "2px solid #F5C542",
                backgroundColor: "#FEFCE8",
              };
            } else {
              weekRowStyle = {
                ...weekRowStyle,
                border: "2px solid transparent",
              };
            }

            return (
              <div
                key={wIdx}
                onMouseEnter={() => activeMode === "week" && setHoveredWeekIdx(wIdx)}
                onClick={() => activeMode === "week" && handleDayClick(weekDays[0])}
                style={weekRowStyle}
              >
                {weekDays.map((dayItem) => {
                  const daySel = isDaySelected(dayItem);
                  const isPrev = dayItem.monthType === "prev";
                  const isNext = dayItem.monthType === "next";

                  let cellBg = "transparent";
                  let cellColor = "#1E293B";
                  let cellWeight = 700;

                  if (isPrev || isNext) {
                    cellColor = "#CBD5E1";
                    cellWeight = 500;
                  }

                  if (activeMode === "single" && daySel) {
                    cellBg = "#00A389";
                    cellColor = "#FFFFFF";
                  } else if (dayItem.isToday) {
                    cellBg = "#FEF3C7";
                    cellColor = "#B45309";
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
                      style={{
                        height: "32px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: cellWeight,
                        color: cellColor,
                        backgroundColor: cellBg,
                        cursor: "pointer",
                      }}
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
            <div style={{ position: "absolute", inset: 0, backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "16px", zIndex: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#1E293B" }}>Oy va Yilni tanlang</span>
                <button
                  type="button"
                  onClick={() => setShowMonthYearPicker(false)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Years bar */}
              <div style={{ display: "flex", justifyContent: "center", gap: "6px", margin: "8px 0" }}>
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setViewYear(y)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: 800,
                      border: "none",
                      backgroundColor: viewYear === y ? "#1E293B" : "#F1F5F9",
                      color: viewYear === y ? "#FFFFFF" : "#475569",
                      cursor: "pointer",
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>

              {/* Months grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                {MONTH_NAMES_UZ.map((mName, mIdx) => (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => {
                      setViewMonth(mIdx);
                      setShowMonthYearPicker(false);
                    }}
                    style={{
                      padding: "8px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      border: "none",
                      backgroundColor: viewMonth === mIdx ? "#00A389" : "#F8FAFC",
                      color: viewMonth === mIdx ? "#FFFFFF" : "#334155",
                      cursor: "pointer",
                    }}
                  >
                    {mName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #F1F5F9", paddingTop: "12px", marginTop: "12px" }}>
          <button
            type="button"
            onClick={() => setShowMonthYearPicker((prev) => !prev)}
            style={{
              padding: "6px 14px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 800,
              border: "1px solid #E2E8F0",
              backgroundColor: "#F8FAFC",
              color: "#0F766E",
              cursor: "pointer",
            }}
          >
            🗓️ {String(viewMonth + 1).padStart(2, "0")} / {viewYear}
          </button>

          <button
            type="button"
            onClick={handleJumpToday}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 800,
              border: "1px solid #00A389",
              backgroundColor: "#ECFDF5",
              color: "#0F766E",
              cursor: "pointer",
            }}
          >
            <RotateCcw size={14} />
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
            borderRadius: "50%",
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
          borderRadius: "999px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          whiteSpace: "nowrap",
          transition: "all 0.15s ease",
        }}
      >
        <Calendar size={16} color="#00A389" />
        <span>{label}</span>
      </button>

      {onNextWeek && (
        <button
          type="button"
          onClick={onNextWeek}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
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
