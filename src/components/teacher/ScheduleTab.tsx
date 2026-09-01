"use client";

import React from "react";
import { Calendar, Pencil, Plus } from "lucide-react";

interface SchedulePeriod {
  start_date: string;
  end_date: string;
}

interface ScheduleItem {
  id?: number;
  day_of_week: number;
  lesson_number: number;
  subject_id: number;
  subject_name: string;
  start_date?: string;
  end_date?: string;
}

interface ScheduleException {
  id: number;
  date: string;
  lesson_number: number;
  subject_id: number | null;
  subject_name?: string;
  is_deleted?: boolean;
  created_at: string;
}

interface ClassTeacher {
  teacher_id: number;
  subject_id: number;
}

interface ScheduleTabProps {
  selectedClassId: string | number | null;
  classes: any[];
  isMainTeacherOfClass: () => boolean;
  userInfo: any;
  classTeachers: ClassTeacher[];
  schedulePeriods: SchedulePeriod[];
  scheduleViewDate: string;
  onSelectPeriodDate: (startDate: string) => void;
  onOpenEditScheduleModal: () => void;
  onOpenNewPeriodModal: () => void;
  overallSchedule: { [key: string]: any[] };
  overallScheduleLoading: boolean;
  classSchedule: ScheduleItem[];
  classScheduleLoading: boolean;
  exceptionsSectionRef: React.RefObject<HTMLDivElement | null>;
  onOpenAddExceptionModal: () => void;
  scheduleExceptions: ScheduleException[];
  scheduleExceptionsLoading: boolean;
  onDeleteException: (id: number) => void;
}

/** Format "2026-09-01" → "01-Sen" */
function shortDate(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    const m = ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];
    return `${d.getDate()}-${m[d.getMonth()]}`;
  } catch {
    return iso;
  }
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  selectedClassId,
  classes,
  isMainTeacherOfClass,
  userInfo,
  classTeachers,
  schedulePeriods,
  scheduleViewDate,
  onSelectPeriodDate,
  onOpenEditScheduleModal,
  onOpenNewPeriodModal,
  overallSchedule,
  overallScheduleLoading,
  classSchedule,
  classScheduleLoading,
  exceptionsSectionRef,
  onOpenAddExceptionModal,
  scheduleExceptions,
  scheduleExceptionsLoading,
  onDeleteException,
}) => {
  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || "Sinf";

  return (
    <div className="space-y-4 pb-32 font-sans">

      {/* ── MAIN SCHEDULE CARD ── */}
      <div className="bg-white border border-neutral-200 rounded-none p-4 sm:p-6 space-y-4 text-slate-900">



        {/* ── SCHEDULE TABLE ── */}
        {!selectedClassId ? (
          /* OVERALL TEACHER SCHEDULE */
          overallScheduleLoading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="overflow-x-auto border border-neutral-200 rounded-none">
              <table className="min-w-full divide-y divide-neutral-200 text-center table-fixed">
                <thead className="bg-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3 w-16 min-w-[56px] text-center bg-slate-100 border-r border-neutral-200">Soat</th>
                    {["Dush","Sesh","Chor","Pay","Juma","Shan"].map((d) => (
                      <th key={d} className="px-2 py-3 min-w-[70px] border-r border-neutral-200 last:border-r-0">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-xs text-slate-700">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                    <tr key={period} className="hover:bg-slate-50 transition">
                      <td className="px-2.5 py-3 font-mono font-bold text-slate-400 bg-slate-50 border-r border-neutral-200 text-center">
                        {period}-dars
                      </td>
                      {[1, 2, 3, 4, 5, 6].map((day) => {
                        const items = overallSchedule[`${day}-${period}`] || [];
                        const hasConflict = items.length >= 2;
                        return (
                          <td key={day} className="px-2 py-2 border-r border-neutral-200 last:border-r-0 align-middle">
                            {items.length === 0 ? (
                              <span className="text-neutral-300 font-mono">—</span>
                            ) : hasConflict ? (
                              <div className="bg-amber-50 border border-amber-300 text-amber-950 p-2 rounded-none text-center">
                                <span className="text-[9px] font-bold uppercase text-amber-800 tracking-tight block">
                                  ⚠ Ziddiyat
                                </span>
                                {items.map((it, idx) => (
                                  <div key={idx} className="text-[10px] font-bold text-amber-950 border-t border-amber-200 pt-0.5 mt-0.5">
                                    {it.class_name} — {it.subject_name}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-neutral-200 p-2 rounded-none text-center">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">
                                  {items[0].class_name}
                                </span>
                                <span className="text-[11px] font-bold text-slate-900 block">
                                  {items[0].subject_name}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : /* SPECIFIC CLASS SCHEDULE */
        classScheduleLoading ? (
          <div className="text-center py-10">
            <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto border border-neutral-200 rounded-none">
            <table className="min-w-full divide-y divide-neutral-200 text-center table-fixed">
              <thead className="bg-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3 w-16 min-w-[56px] text-center bg-slate-100 border-r border-neutral-200">Soat</th>
                  {["Dush","Sesh","Chor","Pay","Juma","Shan"].map((d) => (
                    <th key={d} className="px-2 py-3 min-w-[70px] border-r border-neutral-200 last:border-r-0">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs text-slate-700">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                  <tr key={period} className="hover:bg-slate-50 transition">
                    <td className="px-2.5 py-3 font-mono font-bold text-slate-400 bg-slate-50 border-r border-neutral-200 text-center">
                      {period}-dars
                    </td>
                    {[1, 2, 3, 4, 5, 6].map((day) => {
                      const lesson = classSchedule.find(
                        (item) => item.day_of_week === day && item.lesson_number === period
                      );
                      const isMyClass = isMainTeacherOfClass();
                      const isMyTaughtSubject =
                        lesson &&
                        classTeachers.some(
                          (ct) => ct.teacher_id === userInfo?.id && ct.subject_id === lesson.subject_id
                        );

                      return (
                        <td key={day} className="px-2 py-2 border-r border-neutral-200 last:border-r-0 align-middle">
                          {lesson ? (
                            lesson.subject_id === 0 || lesson.subject_name === "Bekor qilingan" ? (
                              <span className="text-red-500 font-bold line-through block italic text-xs">
                                Bekor
                              </span>
                            ) : isMyClass ? (
                              /* Sinf Rahbari: oddiy matn */
                              <span className="text-slate-900 font-bold block text-xs">
                                {lesson.subject_name}
                              </span>
                            ) : isMyTaughtSubject ? (
                              /* Mening darsim */
                              <div className="bg-emerald-50 border border-emerald-300 p-1.5 rounded-none text-center">
                                <span className="text-[9px] font-bold text-emerald-700 uppercase block tracking-wide">
                                  Darsim
                                </span>
                                <span className="text-[11px] font-bold text-emerald-950 block">
                                  {lesson.subject_name}
                                </span>
                              </div>
                            ) : (
                              /* Boshqa o'qituvchi darsi */
                              <div className="bg-slate-50 border border-neutral-200 p-1.5 rounded-none text-center">
                                <span className="text-xs font-bold text-slate-700 block">
                                  {lesson.subject_name}
                                </span>
                              </div>
                            )
                          ) : (
                            <span className="text-neutral-300 font-mono">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── EXCEPTIONS SECTION ── */}
      <div
        ref={exceptionsSectionRef}
        className="bg-white border border-neutral-200 rounded-none p-4 sm:p-6 space-y-4 text-slate-900"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-neutral-200 pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
              DARS O'ZGARISHLARI
            </span>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
              Kunlik Dars Jadvali O'zgarishlari
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Sinf o'qituvchisi yoki fan o'qituvchilari tomonidan kiritilgan bir martalik dars qo'shimchalari yoki bekor qilishlar.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddExceptionModal}
            className="bg-[#A51C30] hover:bg-[#8B1828] text-white font-bold text-xs py-2 px-3.5 rounded-none transition cursor-pointer flex items-center gap-1.5 shrink-0 h-9"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>O'zgarish kiritish</span>
          </button>
        </div>

        {scheduleExceptionsLoading ? (
          <div className="text-center py-6">
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : scheduleExceptions.length === 0 ? (
          <p className="text-slate-400 text-xs font-mono py-8 text-center border border-dashed border-neutral-200 bg-slate-50">
            Hech qanday dars o'zgarishi kiritilmagan.
          </p>
        ) : (
          <div className="overflow-x-auto border border-neutral-200 rounded-none">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 border-r border-neutral-200">Sana</th>
                  <th className="px-4 py-3 border-r border-neutral-200">Dars soati</th>
                  <th className="px-4 py-3 border-r border-neutral-200">Holat / Fan</th>
                  <th className="px-4 py-3 border-r border-neutral-200">Kiritilgan vaqt</th>
                  <th className="px-4 py-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {scheduleExceptions.map((exc) => {
                  const isPast = new Date(exc.date + "T23:59:59") < new Date();
                  return (
                    <tr key={exc.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-semibold text-slate-800 border-r border-neutral-200">
                        {exc.date}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 border-r border-neutral-200">
                        {exc.lesson_number}-dars
                      </td>
                      <td className="px-4 py-3 border-r border-neutral-200">
                        {exc.is_deleted ? (
                          <span className="text-slate-400 line-through italic text-[11px]">O'chirilgan</span>
                        ) : exc.subject_id === null ? (
                          <span className="bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded-none text-[10px] font-bold">
                            Bekor qilingan
                          </span>
                        ) : (
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-none text-[10px] font-bold">
                            {exc.subject_name} — O'zgartirilgan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[10px] font-mono border-r border-neutral-200">
                        {new Date(exc.created_at).toLocaleString("uz-UZ")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!exc.is_deleted && !isPast && (
                          <button
                            type="button"
                            onClick={() => onDeleteException(exc.id)}
                            className="text-[#A51C30] hover:text-[#8B1828] font-bold text-[10px] bg-red-50 border border-red-200 px-2.5 py-1 rounded-none transition cursor-pointer"
                          >
                            O'chirish
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ScheduleTab;
