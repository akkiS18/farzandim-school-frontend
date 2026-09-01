"use client";

import React from "react";
import { Clock, X, Sparkles } from "lucide-react";

interface LessonItem {
  id?: number;
  subject_name: string;
  lesson_number: number;
  class_name: string;
  time?: string;
  class_id?: number;
  subject_id?: number;
}

interface TodayLessonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayLessons: LessonItem[];
  clubs: any[];
  currentDayNumber: number;
  currentMonthName: string;
  currentYear: number;
  onSelectLesson: (lesson: any) => void;
}

export default function TodayLessonsModal({
  isOpen,
  onClose,
  todayLessons,
  clubs,
  currentDayNumber,
  currentMonthName,
  currentYear,
  onSelectLesson,
}: TodayLessonsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-white border border-zinc-200/80 rounded-none p-6 sm:p-8 shadow-md relative animate-fadeIn space-y-6 text-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-center text-[#1E2B42] font-bold shrink-0">
              <Clock className="w-5 h-5 text-[#1E2B42]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#16193E]">Bugungi Darslar</h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                {currentDayNumber}-{currentMonthName}, {currentYear} kungi dars jadvali
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-none bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Yopish (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lessons List */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 font-mono">
            Dars Jadvali
          </h4>
          {todayLessons.length > 0 ? (
            todayLessons.map((lesson, idx) => {
              const borderAccents = [
                "bg-orange-500",
                "bg-[#1E2B42]",
                "bg-emerald-500",
                "bg-purple-500",
              ];
              const accentColor = borderAccents[idx % borderAccents.length];

              return (
                <div
                  key={idx}
                  onClick={() => onSelectLesson(lesson)}
                  className="bg-zinc-50/80 border border-zinc-200/70 rounded-none p-4 relative overflow-hidden flex items-center justify-between transition hover:border-indigo-300 cursor-pointer group"
                >
                  <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${accentColor}`} />
                  <div className="pl-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-extrabold text-[#16193E] group-hover:text-[#1E2B42] transition">
                        {lesson.subject_name}
                      </h5>
                      <span className="text-[10px] font-mono font-bold bg-slate-50 text-[#1E2B42] px-2 py-0.5 rounded-none">
                        {lesson.lesson_number}-soat
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#1E2B42] flex items-center gap-2">
                      <span>{lesson.class_name}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="font-mono text-zinc-500">{lesson.time}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLesson(lesson);
                    }}
                    className="px-3.5 py-2 bg-[#1E2B42] hover:bg-indigo-700 text-white text-xs font-bold rounded-none transition cursor-pointer shadow-xs"
                  >
                    Jurnalni ochish
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs text-zinc-400 font-medium bg-zinc-50 rounded-none border border-dashed border-zinc-200">
              Bugun darslar mavjud emas
            </div>
          )}

          {/* Teacher Clubs Section at bottom of modal */}
          {clubs.length > 0 && (
            <div className="pt-4 border-t border-zinc-100 space-y-3">
              <div className="flex items-center space-x-2 text-[#1E2B42]">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#16193E] font-mono">
                  To'garaklar
                </h4>
              </div>
              <div className="space-y-2">
                {clubs.map((club, idx) => (
                  <div
                    key={club.id || idx}
                    className="bg-purple-50/60 border border-purple-100 rounded-none p-3.5 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="text-xs font-extrabold text-purple-900">{club.name}</h5>
                      <p className="text-[11px] text-purple-600 font-medium">
                        {club.subject_name || "Qo'shimcha dars"}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-200/70 text-purple-900 px-2.5 py-1 rounded-none">
                      To'garak
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-2.5 px-5 rounded-none transition cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}

