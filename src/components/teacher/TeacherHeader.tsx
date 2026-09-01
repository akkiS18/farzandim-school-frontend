"use client";

import React from "react";
import { Menu, Calendar, Bell } from "lucide-react";
import { parseLocalDate, formatLocalDate } from "@/lib/dateUtils";

interface TeacherHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  userInfo?: {
    first_name?: string;
    last_name?: string;
  };
  selectedDate?: string;
  onOpenDatePicker?: () => void;
  onDateChange?: (date: string) => void;
  unapprovedCount?: number;
  onOpenUnapproved?: () => void;
  title?: string;
  showDatePicker?: boolean;
}

export default function TeacherHeader({
  sidebarOpen,
  setSidebarOpen,
  userInfo,
  selectedDate,
  onOpenDatePicker,
  onDateChange,
  unapprovedCount = 0,
  onOpenUnapproved,
  showDatePicker = false,
}: TeacherHeaderProps) {
  const isToday = selectedDate ? selectedDate === formatLocalDate(new Date()) : true;

  const formattedDateLabel = (() => {
    if (!selectedDate) return "Bugun";
    if (isToday) return "Bugun";
    try {
      const d = parseLocalDate(selectedDate);
      const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
      return `${d.getDate()}-${months[d.getMonth()]}`;
    } catch {
      return selectedDate;
    }
  })();

  return (
    <header className="md:hidden sticky top-0 z-40 bg-[#1E2B42] text-white border-b border-neutral-700/60 px-3.5 h-[52px] min-h-[52px] max-h-[52px] flex items-center justify-between gap-2 shadow-none">
      {/* Left: Menu button & User Greeting */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-8.5 h-8.5 rounded-none bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center transition active:scale-95 shrink-0"
          aria-label="Menyuni ochish"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-xs font-bold text-white truncate tracking-tight">
            {userInfo?.first_name ? `${userInfo.first_name} ${userInfo.last_name || ""}` : "O'qituvchi"}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
            O'qituvchi Portali
          </p>
        </div>
      </div>

      {/* Right: Date Button & Notification Bell */}
      <div className="flex items-center gap-1.5 shrink-0">
        {showDatePicker && onOpenDatePicker && (
          <button
            type="button"
            onClick={onOpenDatePicker}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-[11px] font-bold font-sans uppercase tracking-wider transition border cursor-pointer h-8.5 ${
              isToday
                ? "bg-white text-slate-900 border-white font-bold"
                : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#A51C30]" />
            <span className="whitespace-nowrap">{formattedDateLabel}</span>
          </button>
        )}

        {onOpenUnapproved && (
          <button
            type="button"
            onClick={onOpenUnapproved}
            className="relative w-8.5 h-8.5 rounded-none bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center transition active:scale-95"
            aria-label="Tasdiqlash kutilayotgan baholar"
          >
            <Bell className="w-4 h-4" />
            {unapprovedCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-none bg-[#A51C30] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {unapprovedCount > 9 ? "9+" : unapprovedCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
