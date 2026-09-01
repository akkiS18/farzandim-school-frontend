"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronRight,
  Check,
  Lock,
  CheckCheck,
} from "lucide-react";
import { parseDateString, parseLocalDate, formatLocalDate } from "@/lib/dateUtils";

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
}

interface Subject {
  id: number;
  name: string;
}

interface ClassItem {
  id: number;
  name: string;
  is_main_teacher?: boolean;
}

interface JournalColumn {
  id: string;
  name: string;
}

interface GradingSystem {
  id: string | number;
  name: string;
  type?: string;
  code?: string;
  options?: any;
  min_value?: number;
  max_value?: number;
}

interface HolidayItem {
  holiday_date?: string;
  name: string;
}

interface JournalTabProps {
  selectedClassId: string | number | null;
  classes: ClassItem[];
  subjects: Subject[];
  selectedSubjectId: string | number | null;
  selectedLessonNumber: number | string | null;
  journalDate: string;
  currentJournalTopic: string;
  currentJournalTopicLoading: boolean;
  selectedGradeCategory: string;
  setSelectedGradeCategory: (cat: string) => void;
  students: Student[];
  holidays: HolidayItem[];
  journalLoading: boolean;
  classSchedule: any[];
  journalAllGrades: any[];
  journalColumns: JournalColumn[];
  columnGradingSystems: { [key: string]: any };
  gradingSystemsList: GradingSystem[];
  cellInputs: { [key: string]: string };
  setCellInputs: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  cellSaving: string | null;
  selectedGradeIds: Set<number>;
  setSelectedGradeIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  onAddJournalColumn?: (name: string) => void;
  onRemoveJournalColumn?: (colId: string) => void;
  onColumnGradingSystemChange: (colId: string, val: any) => void;
  onCellSave: (
    studentId: number,
    subjectId: number,
    lessonNumber: number,
    gradeType: string,
    value: string
  ) => void;
  onOpenCalendar: () => void;
  onOpenStudentCommentModal: (student: Student, grades: any[]) => void;
  findGradeForDayAndType: (
    studentId: number,
    subjectId: number,
    lessonNumber: number,
    gradeType: string
  ) => any;
  highlightStudentId?: number | null;
  clearHighlightStudentId?: () => void;
  onSelectClass?: (classId: number | "") => void;
  onSelectSubject?: (subjectId: number | "", lessonNumber?: number | string | null) => void;
  journalLessonsToday?: Array<{ subject_id: number; subject_name: string; lesson_number: number }>;
  onSave?: () => void;
  saveLoading?: boolean;
}

export const JournalTab: React.FC<JournalTabProps> = ({
  selectedClassId,
  classes,
  subjects,
  selectedSubjectId,
  selectedLessonNumber,
  journalDate,
  currentJournalTopic,
  currentJournalTopicLoading,
  selectedGradeCategory,
  setSelectedGradeCategory,
  students,
  holidays,
  journalLoading,
  classSchedule,
  journalAllGrades,
  journalColumns,
  columnGradingSystems,
  gradingSystemsList,
  cellInputs,
  setCellInputs,
  cellSaving,
  selectedGradeIds,
  setSelectedGradeIds,
  onColumnGradingSystemChange,
  onCellSave,
  onOpenCalendar,
  onOpenStudentCommentModal,
  findGradeForDayAndType,
  highlightStudentId,
  clearHighlightStudentId,
  onSelectClass,
  onSelectSubject,
  journalLessonsToday = [],
  onSave,
  saveLoading = false,
}) => {
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  useEffect(() => {
    if (highlightStudentId) {
      const timer = setTimeout(() => {
        const row = document.getElementById(`student-row-${highlightStudentId}`);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        if (clearHighlightStudentId) {
          clearHighlightStudentId();
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [highlightStudentId, students]);

  const clsName = classes.find((c) => c.id === selectedClassId)?.name || "";
  const subjObj = selectedSubjectId ? subjects.find((s) => s.id === selectedSubjectId) : null;
  const subjName = subjObj ? subjObj.name : "Fanni tanlang";

  const formattedUzbekDate = (() => {
    try {
      const d = parseLocalDate(journalDate);
      const mNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
      const days = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
      return `${d.getDate()}-${mNames[d.getMonth()]}, ${days[d.getDay()]}`;
    } catch {
      return journalDate;
    }
  })();

  const shortDateMobile = (() => {
    try {
      const d = parseLocalDate(journalDate);
      const mShort = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
      return `${d.getDate()}-${mShort[d.getMonth()]}`;
    } catch {
      return journalDate;
    }
  })();

  const activeHoliday = holidays.find((h) => {
    const hDate = parseDateString(h.holiday_date);
    return hDate === journalDate;
  });

  return (
    <div className="space-y-0 sm:space-y-3 font-sans">
      {/* CLASS PICKER */}
      {!selectedClassId ? (
        <div className="bg-white border-y sm:border border-neutral-200 rounded-none p-4 sm:p-6 shadow-none space-y-4">
          <div className="border-b border-neutral-200 pb-3">
            <span className="text-[11px] font-bold font-sans text-slate-500 uppercase tracking-widest block">
              1-BOSQICH: JURNALNI OCHISH
            </span>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 tracking-tight mt-0.5">
              Sinfni tanlang
            </h2>
            <p className="text-xs text-slate-600 font-normal">
              Baholash jurnalini ko'rish yoki baho qo'yish uchun quyidagi sinflardan birini tanlang:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {classes.map((cls) => (
              <div
                key={cls.id}
                onClick={() => {
                  if (onSelectClass) onSelectClass(cls.id);
                }}
                className="p-4 rounded-none border border-neutral-200 hover:border-slate-400 bg-white transition cursor-pointer group flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold font-sans text-slate-500 uppercase tracking-wider block">
                    MAKTAB SINFI
                  </span>
                  <h4 className="font-serif text-lg font-bold text-[#A51C30] group-hover:underline transition-colors mt-0.5">
                    {cls.name} SINFI
                  </h4>
                  {cls.is_main_teacher && (
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2 mt-1.5 inline-block rounded-none uppercase tracking-wider">
                      ★ Sinf Rahbari
                    </span>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#A51C30] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* JOURNAL TABLE */}
          {activeHoliday && (
            <div className="bg-rose-50 border-y sm:border border-rose-200 text-rose-900 rounded-none p-3.5 flex items-center space-x-3 text-xs font-semibold">
              <span className="text-base font-bold">⚠️</span>
              <div>
                <p className="font-bold">Dam olish kuni: {activeHoliday.name}</p>
                <p className="text-[11px] text-rose-700 mt-0.5 font-normal">
                  Bugun dam olish kuni deb belgilangan. Jurnalda baho qo'yish imkoniyati bloklanadi.
                </p>
              </div>
            </div>
          )}

          {/* Direct Subject Picker if No Subject Selected */}
          {journalLoading ? (
            <div className="text-center py-16 bg-white border-y sm:border border-neutral-200 rounded-none">
              <div className="w-6 h-6 border-2 border-[#A51C30] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Yuklanmoqda...</p>
            </div>
          ) : !selectedSubjectId ? (
            (() => {
              const isScheduleEmpty =
                classSchedule.length === 0 ||
                classSchedule.every((item) => item.subject_id === 0 || !item.subject_id);
              if (isScheduleEmpty) {
                return (
                  <div className="text-center py-12 bg-white border-y sm:border border-neutral-200 rounded-none p-6 space-y-2">
                    <Clock className="w-8 h-8 text-[#A51C30] mx-auto" />
                    <h4 className="font-serif text-base font-bold text-slate-900">Dars jadvali hali shakllanmagan</h4>
                    <p className="text-xs text-slate-600 font-normal max-w-sm mx-auto">
                      Dars baholarini kiritish uchun birinchi navbatda dars jadvalini belgilang.
                    </p>
                  </div>
                );
              }
              return (
                <div className="bg-white border-y sm:border border-neutral-200 rounded-none p-4 sm:p-6 space-y-3">
                  <div className="border-b border-neutral-200 pb-2">
                    <span className="text-[11px] font-bold font-sans text-slate-500 uppercase tracking-widest block">
                      2-BOSQICH: DARSNI TANLASH
                    </span>
                    <h4 className="font-serif text-xl font-bold text-slate-900">Fanni tanlang</h4>
                    <p className="text-xs text-slate-600">Bugungi dars jadvalidan kerakli darsni tanlang:</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {journalLessonsToday.map((lesson) => (
                      <div
                        key={`direct_lesson_${lesson.subject_id}_${lesson.lesson_number}`}
                        onClick={() => {
                          if (onSelectSubject) onSelectSubject(lesson.subject_id, lesson.lesson_number);
                        }}
                        className="p-4 rounded-none border border-neutral-200 hover:border-slate-400 bg-white transition cursor-pointer group flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-bold font-sans text-slate-500 uppercase tracking-wider block">
                            {lesson.lesson_number}-SOAT DARSI
                          </span>
                          <h5 className="font-serif text-lg font-bold text-[#A51C30] group-hover:underline transition-colors mt-0.5">
                            {lesson.subject_name}
                          </h5>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#A51C30] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()
          ) : (
            /* 4. UNIFIED FULL-BLEED JOURNAL GRADE TABLE */
            <div className="bg-white border-y sm:border border-neutral-200 rounded-none [scrollbar-width:thin]">
              <table className="min-w-full text-left border-separate border-spacing-0">
                <thead className="bg-slate-100 text-[10px] sm:text-[11px] font-bold font-sans text-slate-700 uppercase tracking-wider sticky top-0 z-20 shadow-xs">
                  <tr>
                    <th className="px-1 py-3 w-11 min-w-[44px] max-w-[44px] text-center font-mono sticky top-0 left-0 z-30 bg-slate-100 border-r border-b border-neutral-200">
                      №
                    </th>
                    <th className="px-3 py-3 sticky top-0 left-[44px] z-30 bg-slate-100 border-r border-b border-neutral-200 min-w-[140px] max-w-[170px] sm:min-w-[180px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                      O'quvchi ismi
                    </th>
                    {journalColumns.map((col) => (
                      <th
                        key={col.id}
                        className="px-2 py-3 text-center border-b border-neutral-200 min-w-[68px] max-w-[80px] sticky top-0 z-20 bg-slate-100"
                      >
                        <div>{col.name}</div>
                        {col.id !== "ATTENDANCE" &&
                          (() => {
                            const hasGradesInThisColumn = journalAllGrades.some((g) => {
                              const gDate = g.grade_date
                                ? typeof g.grade_date === "string"
                                  ? g.grade_date.split("T")[0]
                                  : new Date(g.grade_date).toISOString().split("T")[0]
                                : "";
                              return (
                                g.subject_id === Number(selectedSubjectId) &&
                                g.lesson_number === Number(selectedLessonNumber) &&
                                g.grade_type === col.id &&
                                gDate === journalDate
                              );
                            });

                            return (
                              <div className="flex flex-col items-center mt-1">
                                <div className="relative inline-block" title={hasGradesInThisColumn ? "Baho kiritilgani uchun o'zgartirib bo'lmaydi" : "Baholash tizimi"}>
                                  <select
                                    value={
                                      columnGradingSystems[col.id] ||
                                      (col.id === "BEHAVIOR"
                                        ? String(
                                            gradingSystemsList.find(
                                              (gs) =>
                                                gs.name.toLowerCase().includes("xulq") ||
                                                gs.name.toLowerCase().includes("behavior") ||
                                                gs.type === "BEHAVIOR" ||
                                                gs.code === "BEHAVIOR"
                                            )?.id || ""
                                          )
                                        : "")
                                    }
                                    onChange={(e) => onColumnGradingSystemChange(col.id, e.target.value)}
                                    disabled={hasGradesInThisColumn}
                                    className={`appearance-none border border-neutral-300 rounded-none pl-2 pr-5 py-0.5 text-[10px] font-bold font-sans uppercase text-slate-700 outline-none transition text-center min-w-[36px] max-w-[48px] ${
                                      hasGradesInThisColumn
                                        ? "opacity-65 cursor-not-allowed bg-slate-200"
                                        : "bg-white hover:bg-slate-50 cursor-pointer"
                                    }`}
                                  >
                                    <option value="">-</option>
                                    {gradingSystemsList.map((gs) => {
                                      const match = gs.name.match(/\d+/);
                                      const shortName = match ? match[0] : gs.name.split(" ")[0].toUpperCase();
                                      return (
                                        <option key={gs.id} value={gs.id}>
                                          {shortName}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <ChevronDown className={`w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none ${hasGradesInThisColumn ? "text-slate-400" : "text-slate-600"}`} />
                                </div>
                              </div>
                            );
                          })()}
                      </th>
                    ))}
                    <th className="px-1 py-3 text-center border-b border-neutral-200 w-11 min-w-[44px] max-w-[44px] sticky top-0 z-20 bg-slate-100">
                      <div className="flex items-center justify-center text-[10px] text-slate-500 font-bold uppercase" title="Baho izohlari">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-200 text-xs bg-white">
                  {students.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3 + journalColumns.length}
                        className="px-6 py-12 text-center text-slate-400 italic font-mono"
                      >
                        Ushbu sinfda o'quvchilar mavjud emas.
                      </td>
                    </tr>
                  ) : (
                    students.map((st, idx) => {
                      const attKey = `${st.id}_${selectedSubjectId}_${selectedLessonNumber}_ATTENDANCE`;
                      const attendanceVal = cellInputs[attKey] || "+";
                      const isHighlighted = highlightStudentId === st.id;

                      return (
                        <tr
                          key={st.id}
                          id={`student-row-${st.id}`}
                          className={`group hover:bg-slate-50 transition-colors ${
                            attendanceVal === "-" ? "opacity-60 bg-slate-50/50" : ""
                          } ${isHighlighted ? "bg-amber-50" : ""}`}
                        >
                          {/* № Sticky Pinned Left */}
                          <td
                            className={`px-1 py-2.5 text-center font-mono text-slate-500 text-xs font-semibold sticky left-0 z-10 border-r border-b border-neutral-200 w-11 min-w-[44px] max-w-[44px] ${
                              isHighlighted ? "bg-amber-50 text-amber-950 font-bold" : "bg-white group-hover:bg-slate-50"
                            }`}
                          >
                            {String(idx + 1).padStart(2, "0")}
                          </td>

                          {/* Student Name Sticky Pinned Left */}
                          <td
                            className={`px-3 py-2.5 font-bold text-slate-900 text-xs sm:text-sm whitespace-nowrap sticky left-[44px] z-10 border-r border-b border-neutral-200 min-w-[140px] max-w-[170px] sm:min-w-[180px] truncate shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] ${
                              isHighlighted ? "bg-amber-50 text-amber-950" : "bg-white group-hover:bg-slate-50"
                            }`}
                          >
                            {st.first_name} {st.last_name}
                          </td>

                          {/* Dynamic Grade Columns */}
                          {journalColumns.map((col) => {
                            const key = `${st.id}_${selectedSubjectId}_${selectedLessonNumber}_${col.id}`;
                            const cellVal = cellInputs[key] || "";
                            const grade = findGradeForDayAndType(
                              st.id,
                              Number(selectedSubjectId),
                              Number(selectedLessonNumber),
                              col.id
                            );
                            const isApproved = grade?.status === "approved";
                            const isParentApproved = grade?.approved_by_parent;
                            const isSaving = cellSaving === key;
                            const isHoliday = holidays.some((h) => {
                              const hDate = parseDateString(h.holiday_date);
                              return hDate === journalDate;
                            });

                            return (
                              <td key={col.id} className="px-1.5 py-2.5 text-center border-b border-neutral-200 min-w-[68px] max-w-[80px]">
                                <div className="relative inline-flex items-center justify-center">
                                  {grade && !isApproved && (
                                    <input
                                      type="checkbox"
                                      checked={selectedGradeIds.has(grade.id)}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setSelectedGradeIds((prev) => {
                                          const next = new Set(prev);
                                          if (checked) {
                                            next.add(grade.id);
                                          } else {
                                            next.delete(grade.id);
                                          }
                                          return next;
                                        });
                                      }}
                                      className="absolute -left-3.5 top-2 w-3 h-3 text-[#A51C30] border-neutral-300 rounded-none focus:ring-0 cursor-pointer z-10"
                                      title="Tasdiqlash uchun tanlash"
                                    />
                                  )}

                                  {col.id === "ATTENDANCE" ? (
                                    <select
                                      value={cellVal}
                                      onChange={(e) =>
                                        onCellSave(
                                          st.id,
                                          Number(selectedSubjectId),
                                          Number(selectedLessonNumber),
                                          "ATTENDANCE",
                                          e.target.value
                                        )
                                      }
                                      disabled={isSaving || isApproved || isHoliday}
                                      className={`w-12 h-8 rounded-none text-center border font-bold font-mono text-xs outline-none transition cursor-pointer ${
                                        cellVal === "+"
                                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                          : cellVal === "-"
                                          ? "bg-rose-50 border-rose-300 text-rose-800"
                                          : "bg-amber-50 border-amber-300 text-amber-800"
                                      }`}
                                    >
                                      <option value="+">+</option>
                                      <option value="-">-</option>
                                      <option value="k">k</option>
                                    </select>
                                  ) : (() => {
                                    const colGSId = columnGradingSystems[col.id];
                                    const colGS = gradingSystemsList.find((gs) => String(gs.id) === String(colGSId));

                                    if (colGS) {
                                      let options: { label: string; numeric_value?: number }[] = [];
                                      if (colGS.options) {
                                        try {
                                          options =
                                            typeof colGS.options === "string"
                                              ? JSON.parse(colGS.options)
                                              : colGS.options;
                                        } catch (e) {
                                          console.error("Failed to parse options", e);
                                        }
                                      }
                                      if (Array.isArray(options) && options.length > 0) {
                                        return (
                                          <select
                                            value={cellVal}
                                            onChange={(e) =>
                                              onCellSave(
                                                st.id,
                                                Number(selectedSubjectId),
                                                Number(selectedLessonNumber),
                                                col.id,
                                                e.target.value
                                              )
                                            }
                                            disabled={isSaving || isApproved || isHoliday || attendanceVal === "-"}
                                            className={`w-13 h-8 rounded-none text-center border font-bold font-mono text-xs outline-none transition cursor-pointer bg-white border-neutral-300 text-slate-900 ${
                                              attendanceVal === "-"
                                                ? "bg-slate-100 cursor-not-allowed text-slate-300 border-neutral-200"
                                                : ""
                                            }`}
                                          >
                                            <option value="">—</option>
                                            {options.map((opt, oidx) => (
                                              <option key={oidx} value={opt.label}>
                                                {opt.label}
                                              </option>
                                            ))}
                                          </select>
                                        );
                                      }

                                      return (
                                        <input
                                          type="text"
                                          value={cellVal}
                                          onChange={(e) =>
                                            setCellInputs((prev) => ({ ...prev, [key]: e.target.value }))
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault();
                                              onCellSave(
                                                st.id,
                                                Number(selectedSubjectId),
                                                Number(selectedLessonNumber),
                                                col.id,
                                                cellVal
                                              );
                                            }
                                          }}
                                          onBlur={() => {
                                            onCellSave(
                                              st.id,
                                              Number(selectedSubjectId),
                                              Number(selectedLessonNumber),
                                              col.id,
                                              cellVal
                                            );
                                          }}
                                          disabled={isSaving || isApproved || isHoliday || attendanceVal === "-"}
                                          placeholder={`${
                                            colGS.min_value !== undefined && colGS.max_value !== undefined
                                              ? `${colGS.min_value}-${colGS.max_value}`
                                              : "—"
                                          }`}
                                          className={`w-13 h-8 rounded-none text-center border font-bold font-mono text-xs outline-none transition ${
                                            isSaving
                                              ? "border-[#A51C30] animate-pulse bg-rose-50/40"
                                              : "bg-white border-neutral-300 text-slate-900"
                                          } ${
                                            attendanceVal === "-"
                                              ? "bg-slate-100 cursor-not-allowed text-slate-300 border-neutral-200"
                                              : ""
                                          }`}
                                        />
                                      );
                                    }

                                    if (col.id === "BEHAVIOR") {
                                      return (
                                        <select
                                          value={cellVal || "0"}
                                          onChange={(e) =>
                                            onCellSave(
                                              st.id,
                                              Number(selectedSubjectId),
                                              Number(selectedLessonNumber),
                                              "BEHAVIOR",
                                              e.target.value
                                            )
                                          }
                                          disabled={isSaving || isApproved || isHoliday || attendanceVal === "-"}
                                          className={`w-13 h-8 rounded-none text-center border font-bold font-mono text-xs outline-none transition cursor-pointer ${
                                            (cellVal || "0") === "0"
                                              ? "bg-slate-50 border-neutral-300 text-slate-700"
                                              : Number(cellVal) > 0
                                              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                              : "bg-rose-50 border-rose-300 text-rose-800"
                                          }`}
                                        >
                                          <option value="5">+5</option>
                                          <option value="4">+4</option>
                                          <option value="3">+3</option>
                                          <option value="2">+2</option>
                                          <option value="1">+1</option>
                                          <option value="0">0</option>
                                          <option value="-1">-1</option>
                                          <option value="-2">-2</option>
                                          <option value="-3">-3</option>
                                          <option value="-4">-4</option>
                                          <option value="-5">-5</option>
                                        </select>
                                      );
                                    }

                                    return (
                                      <input
                                        type="text"
                                        value={cellVal}
                                        onChange={(e) =>
                                          setCellInputs((prev) => ({ ...prev, [key]: e.target.value }))
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            onCellSave(
                                              st.id,
                                              Number(selectedSubjectId),
                                              Number(selectedLessonNumber),
                                              col.id,
                                              cellVal
                                            );
                                          }
                                        }}
                                        onBlur={() => {
                                          onCellSave(
                                            st.id,
                                            Number(selectedSubjectId),
                                            Number(selectedLessonNumber),
                                            col.id,
                                            cellVal
                                          );
                                        }}
                                        disabled={isSaving || isApproved || isHoliday || attendanceVal === "-"}
                                        placeholder="—"
                                        className={`w-13 h-8 rounded-none text-center border font-bold font-mono text-xs outline-none transition ${
                                          isSaving
                                            ? "border-[#A51C30] animate-pulse bg-rose-50/40"
                                            : "bg-white border-neutral-300 text-slate-900"
                                        } ${
                                          attendanceVal === "-"
                                            ? "bg-slate-100 cursor-not-allowed text-slate-300 border-neutral-200"
                                            : ""
                                        }`}
                                      />
                                    );
                                  })()}

                                  {/* Status Badges */}
                                  {isApproved && (
                                    <span
                                      className="absolute -right-2 -top-1.5 bg-white border border-neutral-300 text-slate-700 rounded-none w-3.5 h-3.5 flex items-center justify-center text-[8px] z-10"
                                      title="Baho tasdiqlangan"
                                    >
                                      <Lock className="w-2.5 h-2.5 text-[#1E2B42]" />
                                    </span>
                                  )}
                                  {!isApproved && isParentApproved && (
                                    <span
                                      className="absolute -right-2 -top-1.5 bg-white border border-teal-300 text-teal-700 rounded-none w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold z-10"
                                      title="Ota-ona ko'rdi"
                                    >
                                      <CheckCheck className="w-2.5 h-2.5 text-teal-600" />
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          {/* Comment Button Column */}
                          {(() => {
                            const studentGrades = journalColumns
                              .filter((col) => col.id !== "ATTENDANCE")
                              .map((col) => {
                                const key = `${st.id}_${selectedSubjectId}_${selectedLessonNumber}_${col.id}`;
                                const grade = findGradeForDayAndType(
                                  st.id,
                                  Number(selectedSubjectId),
                                  Number(selectedLessonNumber),
                                  col.id
                                );
                                const val = (
                                  cellInputs[key] !== undefined ? cellInputs[key] : grade ? grade.value : ""
                                ).trim();
                                return {
                                  colId: col.id,
                                  colName: col.name,
                                  value: val,
                                  grade,
                                  key,
                                };
                              })
                              .filter((item) => item.value !== "" && item.value !== "—");

                            const hasAnyGrade = studentGrades.length > 0;

                            return (
                              <td className="px-1 py-2.5 text-center border-b border-neutral-200 w-11 min-w-[44px] max-w-[44px]">
                                <button
                                  type="button"
                                  disabled={!hasAnyGrade}
                                  onClick={() => onOpenStudentCommentModal(st, studentGrades)}
                                  title={hasAnyGrade ? "Izoh yozish / ko'rish" : "Izoh yozish uchun avval baho qo'ying"}
                                  className={`w-7 h-7 rounded-none flex items-center justify-center transition mx-auto border ${
                                    hasAnyGrade
                                      ? "bg-slate-50 hover:bg-slate-100 text-slate-800 border-neutral-300 cursor-pointer"
                                      : "bg-slate-50 text-slate-300 border-neutral-200 cursor-not-allowed opacity-40"
                                  }`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            );
                          })()}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Table Footer Summary */}
              <div className="px-4 py-2 border-t border-neutral-200 bg-slate-50 flex items-center justify-between text-slate-500 text-[10px] font-sans uppercase tracking-wider">
                <span>O'quvchilar: {students.length} ta</span>
                <span>
                  Kiritilgan baholar:{" "}
                  {
                    journalAllGrades.filter((g) => {
                      const gDate = parseDateString(g.grade_date);
                      return gDate === journalDate && g.subject_id === Number(selectedSubjectId);
                    }).length
                  }{" "}
                  ta
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JournalTab;



