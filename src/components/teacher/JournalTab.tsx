"use client";

import React from "react";
import { BookOpen, Calendar, MessageSquare } from "lucide-react";
import { parseDateString } from "@/lib/dateUtils";

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
  onAddJournalColumn: (name: string) => void;
  onRemoveJournalColumn: (colId: string) => void;
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
  onAddJournalColumn,
  onRemoveJournalColumn,
  onColumnGradingSystemChange,
  onCellSave,
  onOpenCalendar,
  onOpenStudentCommentModal,
  findGradeForDayAndType,
}) => {
  if (!selectedClassId) {
    return (
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs my-12 text-zinc-900">
        <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xs">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-zinc-800 tracking-tight mb-2">SINF JURNALI (BAHOLASH)</h2>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
          Baholash va darslarni kiritish uchun pastdagi floating panel orqali kerakli sinf va fanni tanlang.
        </p>
      </div>
    );
  }

  const clsName = classes.find((c) => c.id === selectedClassId)?.name || "";
  const subjObj = selectedSubjectId ? subjects.find((s) => s.id === selectedSubjectId) : null;
  const subjName = subjObj ? subjObj.name : "Fanni tanlang";

  const days = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
  const dateObj = new Date(journalDate + "T00:00:00");
  const dayName = !isNaN(dateObj.getTime()) ? days[dateObj.getDay()] : "";

  const activeHoliday = holidays.find((h) => {
    const hDate = parseDateString(h.holiday_date);
    return hDate === journalDate;
  });

  return (
    <div className="space-y-6">
      {/* Compact Low-Height Header Bar */}
      <div className="bg-white border border-zinc-200/70 rounded-2xl sm:rounded-3xl px-5 py-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn text-zinc-900">
        {/* Left: Class Info, Single Prominent Subject Badge, and Topic Badge */}
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Kunlik Jurnal</span>
            <span className="text-zinc-300 font-light">•</span>
            <span className="text-xs font-extrabold text-[#16193E]">{clsName ? `${clsName} sinfi` : "Sinf"}</span>
          </div>

          <span className="text-zinc-300 font-light hidden sm:inline">•</span>

          {/* Single Prominent Subject Name */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/80 px-3.5 py-1 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shrink-0"></span>
            <span className="text-sm sm:text-base font-extrabold text-indigo-900 tracking-tight">{subjName}</span>
            {selectedLessonNumber ? (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md ml-1">
                {selectedLessonNumber}-soat
              </span>
            ) : null}
          </div>

          {/* PROMINENT LESSON TOPIC BADGE */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 px-3.5 py-1 rounded-xl shadow-2xs">
            <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[10px] font-black text-blue-900 uppercase font-mono tracking-tight shrink-0">
              Mavzu:
            </span>
            <span className="text-xs font-bold text-blue-950 font-sans truncate max-w-[180px] sm:max-w-xs md:max-w-md">
              {currentJournalTopicLoading ? (
                <span className="text-zinc-400 font-mono text-[10px]">Yuklanmoqda...</span>
              ) : currentJournalTopic ? (
                currentJournalTopic
              ) : (
                <span className="text-zinc-400 font-normal italic">Mavzu belgilanmagan</span>
              )}
            </span>
          </div>
        </div>

        {/* Right: Date & Category Badges */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-500">
          <button
            type="button"
            onClick={onOpenCalendar}
            className="bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-700 px-3 py-1 rounded-xl flex items-center gap-1.5 font-medium transition cursor-pointer"
            title="Sana tanlash (Smart Calendar)"
          >
            <Calendar className="w-3.5 h-3.5 text-[#5B50EC]" />
            <span>
              {journalDate} {dayName ? `(${dayName})` : ""}
            </span>
          </button>
          <span className="bg-purple-50 text-purple-700 border border-purple-100/80 px-2.5 py-1 rounded-xl text-[11px] font-bold">
            {selectedGradeCategory === "DAILY"
              ? "Kundalik"
              : selectedGradeCategory === "QUARTERLY_EXAM"
              ? "🏆 Choraklik"
              : "🎓 Imtihon"}
          </span>
          <span className="text-zinc-400 font-mono text-[11px] hidden lg:inline">
            ({students.length} ta o'quvchi)
          </span>
        </div>
      </div>

      {/* Holiday Warning Banner */}
      {activeHoliday && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-center space-x-3 text-xs font-semibold animate-fadeIn mb-4">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-bold">Dam olish kuni: {activeHoliday.name}</p>
            <p className="text-[10px] text-red-600 mt-0.5">
              Bugun maktab admini tomonidan dam olish kuni deb belgilangan. Jurnalda baho qo'yish imkoniyati bloklanadi.
            </p>
          </div>
        </div>
      )}

      {/* Journal Grid Container Card */}
      {journalLoading ? (
        <div className="text-center py-16 bg-white border border-zinc-200/70 rounded-3xl shadow-xs">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
        </div>
      ) : !selectedSubjectId ? (
        (() => {
          const isScheduleEmpty =
            classSchedule.length === 0 ||
            classSchedule.every((item) => item.subject_id === 0 || !item.subject_id);
          if (isScheduleEmpty) {
            return (
              <div className="text-center py-16 bg-white border border-dashed border-red-200 rounded-3xl animate-fadeIn">
                <p className="text-sm text-red-650 font-bold mb-1">Dars jadvali hali qo'shilmagan</p>
                <p className="text-xs text-zinc-400 font-mono">
                  Dars baholarini ko'rish va kiritish uchun birinchi navbatda haftalik dars jadvalini kiriting.
                </p>
              </div>
            );
          }
          return (
            <div className="text-center py-16 bg-white border border-dashed border-zinc-200/80 rounded-3xl">
              <p className="text-sm text-[#16193E] font-extrabold mb-1">Fanni tanlang</p>
              <p className="text-xs text-zinc-400 font-medium">
                Dars baholarini ko'rish va kiritish uchun pastdagi panel orqali fanni tanlang.
              </p>
            </div>
          );
        })()
      ) : (
        <div className="bg-white border border-zinc-200/70 rounded-3xl shadow-xs overflow-hidden animate-fadeIn text-zinc-900">
          {/* Grid legend row */}
          <div className="px-6 py-4 bg-[#fafafa] border-b border-zinc-200/80 flex flex-wrap items-center justify-between gap-3 text-zinc-800">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-[10px] font-extrabold text-[#16193E] uppercase tracking-widest font-mono">
                {selectedLessonNumber ? `${selectedLessonNumber}-SOAT ` : ""}BAHOLAR JURNALI
              </span>

              {(() => {
                const hasApprovedOrAnyGradesForToday = journalAllGrades.some((g) => {
                  const gDate = parseDateString(g.grade_date);
                  return (
                    g.subject_id === Number(selectedSubjectId) &&
                    g.lesson_number === Number(selectedLessonNumber) &&
                    gDate === journalDate
                  );
                });

                return (
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Kategoriya:</span>
                    <select
                      value={selectedGradeCategory}
                      onChange={(e) => setSelectedGradeCategory(e.target.value)}
                      disabled={hasApprovedOrAnyGradesForToday}
                      className={`bg-zinc-150 border-none rounded-md px-2 py-0.5 text-[9px] font-bold text-zinc-700 outline-none transition text-center ${
                        hasApprovedOrAnyGradesForToday
                          ? "opacity-65 cursor-not-allowed bg-zinc-200"
                          : "bg-zinc-150 hover:bg-zinc-200 cursor-pointer"
                      }`}
                      title={
                        hasApprovedOrAnyGradesForToday
                          ? "Ushbu darsda baholar kiritilgani sababli kategoriyani o'zgartirib bo'lmaydi"
                          : ""
                      }
                    >
                      <option value="DAILY">Kundalik</option>
                      <option value="QUARTERLY_EXAM">🏆 Choraklik</option>
                      <option value="SEMESTER_EXAM">🎓 Imtihon</option>
                    </select>
                  </div>
                );
              })()}

              <button
                type="button"
                onClick={() => {
                  const name = prompt("Yangi baholash turi nomini kiriting (masalan: Uyga vazifa, Mustaqil ish):");
                  if (name) {
                    onAddJournalColumn(name);
                  }
                }}
                className="bg-[#5B50EC] hover:bg-indigo-700 text-white font-semibold text-[9px] py-1 px-2.5 rounded-md transition cursor-pointer"
              >
                + Yangi baho turi
              </button>

              {journalColumns.filter((c) => !["ATTENDANCE", "BEHAVIOR", "MASTERY"].includes(c.id)).length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const customCols = journalColumns.filter(
                      (c) => !["ATTENDANCE", "BEHAVIOR", "MASTERY"].includes(c.id)
                    );
                    const names = customCols.map((c) => c.name).join(", ");
                    const toRemove = prompt(`O'chirmoqchi bo'lgan baholash turi nomini kiriting (${names}):`);
                    if (toRemove) {
                      const found = customCols.find(
                        (c) => c.name.toLowerCase() === toRemove.trim().toLowerCase()
                      );
                      if (found) {
                        onRemoveJournalColumn(found.id);
                      }
                    }
                  }}
                  className="bg-red-50 hover:bg-red-105 border border-red-200 text-red-600 font-semibold text-[9px] py-1 px-2.5 rounded-md transition cursor-pointer"
                >
                  O'chirish
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[calc(100vh-310px)] sm:max-h-[calc(100vh-280px)] overflow-y-auto rounded-b-3xl">
            <table className="min-w-full divide-y divide-zinc-200 text-left border-separate border-spacing-0">
              <thead className="bg-[#fafafa] text-[9px] sm:text-[10px] font-bold text-zinc-450 uppercase tracking-wider sticky top-0 z-30 shadow-xs">
                <tr>
                  <th className="px-2.5 py-2.5 sm:px-4 sm:py-4 w-10 sm:w-12 text-center font-mono sticky top-0 left-0 z-40 bg-[#fafafa] border-b border-zinc-200">
                    №
                  </th>
                  <th className="px-2.5 py-2.5 sm:px-4 sm:py-4 sticky top-0 left-[40px] sm:left-[48px] z-40 bg-[#fafafa] border-b border-zinc-200 min-w-[120px] sm:min-w-[140px] shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    O'quvchi ismi
                  </th>
                  {journalColumns.map((col) => (
                    <th
                      key={col.id}
                      className="px-3 py-2.5 sm:px-6 sm:py-4 text-center border-b border-zinc-200 sticky top-0 z-30 bg-[#fafafa]"
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
                                className={`border border-zinc-200 rounded-md px-1.5 py-0.5 text-[8px] font-bold text-zinc-650 outline-none transition text-center max-w-[100px] ${
                                  hasGradesInThisColumn
                                    ? "opacity-65 cursor-not-allowed bg-zinc-200"
                                    : "bg-zinc-100 hover:bg-zinc-150 cursor-pointer"
                                }`}
                                title={
                                  hasGradesInThisColumn
                                    ? "Ushbu ustunda baholar kiritilgani sababli baholash tizimini o'zgartirib bo'lmaydi"
                                    : ""
                                }
                              >
                                <option value="">Oddiy tizim</option>
                                {gradingSystemsList.map((gs) => (
                                  <option key={gs.id} value={gs.id}>
                                    {gs.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })()}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 sm:px-4 sm:py-4 text-center border-b border-zinc-200 sticky top-0 z-30 bg-[#fafafa] w-12 sm:w-16">
                    <div
                      className="flex items-center justify-center gap-1 text-[9px] text-zinc-400 font-extrabold uppercase"
                      title="Baho izohlari"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Izoh</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs bg-white">
                {students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3 + journalColumns.length}
                      className="px-6 py-10 text-center text-zinc-450 italic font-mono"
                    >
                      Bu sinfda o'quvchilar topilmadi.
                    </td>
                  </tr>
                ) : (
                  students.map((st, idx) => {
                    const attKey = `${st.id}_${selectedSubjectId}_${selectedLessonNumber}_ATTENDANCE`;
                    const attendanceVal = cellInputs[attKey] || "+";

                    return (
                      <tr
                        key={st.id}
                        className={`hover:bg-zinc-50/50 transition ${
                          attendanceVal === "-" ? "opacity-60 bg-zinc-50/30" : ""
                        }`}
                      >
                        {/* No. */}
                        <td className="px-2.5 py-2.5 sm:px-4 sm:py-4 text-center font-mono text-zinc-400 text-xs font-semibold sticky left-0 z-10 bg-white border-b border-zinc-100">
                          {String(idx + 1).padStart(2, "0")}
                        </td>

                        {/* Student Name */}
                        <td className="px-2.5 py-2.5 sm:px-4 sm:py-4 font-bold text-zinc-800 text-xs sm:text-sm whitespace-nowrap sticky left-[40px] sm:left-[48px] z-10 bg-white border-b border-zinc-100 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)]">
                          {st.first_name} {st.last_name}
                        </td>

                        {/* Columns */}
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
                            <td key={col.id} className="px-6 py-3 text-center">
                              <div className="relative inline-block group">
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
                                    className="absolute -left-6 top-2.5 w-3 h-3 text-[#5B50EC] border-zinc-300 rounded focus:ring-0 cursor-pointer z-20"
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
                                    className={`w-14 h-8 rounded-lg text-center border font-bold font-mono text-xs outline-none transition focus:ring-2 focus:ring-indigo-500 cursor-pointer
                                      ${
                                        cellVal === "+"
                                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                          : cellVal === "-"
                                          ? "bg-red-50 border-red-300 text-red-700"
                                          : "bg-amber-50 border-amber-300 text-amber-700"
                                      }
                                    `}
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
                                          className={`w-16 h-8 rounded-lg text-center border font-bold font-mono text-xs outline-none transition focus:ring-2 focus:ring-indigo-500 cursor-pointer bg-white border-zinc-300 text-zinc-800
                                            ${
                                              attendanceVal === "-"
                                                ? "bg-zinc-100/50 cursor-not-allowed text-zinc-300 border-zinc-200"
                                                : ""
                                            }
                                          `}
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
                                        className={`w-16 h-8 rounded-lg text-center border font-bold font-mono text-xs outline-none transition focus:ring-2 focus:ring-indigo-500
                                          ${
                                            isSaving
                                              ? "border-indigo-400 animate-pulse bg-indigo-50/30"
                                              : "bg-white border-zinc-300 text-zinc-800"
                                          }
                                          ${
                                            attendanceVal === "-"
                                              ? "bg-zinc-100/50 cursor-not-allowed text-zinc-300 border-zinc-200"
                                              : ""
                                          }
                                        `}
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
                                        className={`w-16 h-8 rounded-lg text-center border font-bold font-mono text-xs outline-none transition focus:ring-2 focus:ring-indigo-500 cursor-pointer
                                          ${
                                            (cellVal || "0") === "0"
                                              ? "bg-zinc-50 border-zinc-300 text-zinc-700"
                                              : Number(cellVal) > 0
                                              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                              : "bg-red-50 border-red-300 text-red-700"
                                          }
                                        `}
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
                                      className={`w-16 h-8 rounded-lg text-center border font-bold font-mono text-xs outline-none transition focus:ring-2 focus:ring-indigo-500
                                        ${
                                          isSaving
                                            ? "border-indigo-400 animate-pulse bg-indigo-50/30"
                                            : "bg-white border-zinc-300 text-zinc-800"
                                        }
                                        ${
                                          attendanceVal === "-"
                                            ? "bg-zinc-100/50 cursor-not-allowed text-zinc-300 border-zinc-200"
                                            : ""
                                        }
                                      `}
                                    />
                                  );
                                })()}

                                {/* Status badges */}
                                {isApproved && (
                                  <span
                                    className="absolute -right-2 -top-2 bg-white border border-zinc-200 rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] shadow-sm select-none z-20"
                                    title="Baho tasdiqlangan"
                                  >
                                    🔒
                                  </span>
                                )}
                                {!isApproved && isParentApproved && (
                                  <span
                                    className="absolute -right-2 -top-2 bg-white border border-teal-200 text-teal-600 rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-extrabold shadow-sm select-none z-20"
                                    title="Ota-ona ko'rdi"
                                  >
                                    ✓
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Action: Comment Button Column */}
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
                            <td className="px-3 py-3 text-center border-b border-zinc-100">
                              <button
                                type="button"
                                disabled={!hasAnyGrade}
                                onClick={() => onOpenStudentCommentModal(st, studentGrades)}
                                title={hasAnyGrade ? "Izoh yozish / ko'rish" : "Izoh yozish uchun avval baho qo'ying"}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition mx-auto ${
                                  hasAnyGrade
                                    ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/80 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                    : "bg-zinc-100 text-zinc-300 border border-transparent cursor-not-allowed opacity-40"
                                }`}
                              >
                                <MessageSquare className="w-4 h-4" />
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
          </div>

          {/* Footer hint */}
          <div className="px-5 py-3 border-t border-zinc-150 bg-zinc-50 flex items-center justify-between">
            <p className="text-[10px] text-zinc-400 font-mono">O'zgarishlar kiritilganda avtomatik saqlanadi.</p>
            <p className="text-[10px] text-zinc-400 font-mono">
              {
                journalAllGrades.filter((g) => {
                  const gDate = parseDateString(g.grade_date);
                  return gDate === journalDate && g.subject_id === Number(selectedSubjectId);
                }).length
              }{" "}
              ta baho kiritilgan
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalTab;
