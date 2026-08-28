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
    <div className="space-y-6 pb-40">
      <div className="bg-white border border-zinc-200/70 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 animate-fadeIn text-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100/80 pb-3">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 px-3.5 py-1 rounded-full text-indigo-700 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                {!selectedClassId
                  ? "🌐 Mening Shaxsiy Dars Jadvalim (Umumiy)"
                  : isMainTeacherOfClass()
                  ? `⭐ Sinf Rahbari: ${selectedClassName} Haftalik Dars Jadvali`
                  : `📚 ${selectedClassName} Dars Jadvali (Fan o'qituvchisi ko'rinishi)`}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium">
              {!selectedClassId
                ? "Siz dars beradigan barcha sinflarning haftalik rejasi. Bir xil vaqtda 2 ta sinf darsi bo'lsa, sariq rang bilan ziddiyat ko'rsatiladi."
                : isMainTeacherOfClass()
                ? "Sinfingizdagi barcha fanlar va dars jadvali."
                : "Ushbu sinfda siz kiradigan darslar alohida ta'kidlab ko'rsatilgan."}
            </p>
          </div>

          {/* Quick Header Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-2">
            {selectedClassId && (isMainTeacherOfClass() || userInfo?.role === "ADMIN") && (
              <button
                type="button"
                onClick={onOpenEditScheduleModal}
                className="bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-extrabold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-2xs hover:scale-105"
                title="Sinf haftalik dars jadvalini tahrirlash"
              >
                <Pencil className="w-3.5 h-3.5 text-white" />
                <span>Jadvalni tahrirlash</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                exceptionsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
              title="Pastdagi o'zgarishlar jadvaliga silliq tushish"
            >
              <span>O'zgarishlarni ko'rish ({scheduleExceptions.length})</span>
            </button>
          </div>
        </div>

        {/* Schedule Periods / Quarters Filter Bar */}
        {selectedClassId && (
          <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold text-[#16193E] uppercase font-mono tracking-wider flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dars Jadvali Davrlari (Choraklar):</span>
              </span>

              {schedulePeriods.length === 0 ? (
                <span className="text-xs text-zinc-500 font-medium italic">Hali davrlar belgilanmagan</span>
              ) : (
                schedulePeriods.map((period: any, pIdx: number) => {
                  const isCurrentActive =
                    scheduleViewDate >= period.start_date && scheduleViewDate <= period.end_date;
                  return (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => onSelectPeriodDate(period.start_date)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                        isCurrentActive
                          ? "bg-[#5B50EC] text-white shadow-xs scale-105"
                          : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
                      }`}
                    >
                      <span>{pIdx + 1}-chorak/davr:</span>
                      <span className="font-mono text-[11px]">
                        {period.start_date} — {period.end_date}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {(isMainTeacherOfClass() || userInfo?.role === "ADMIN") && (
              <button
                type="button"
                onClick={onOpenNewPeriodModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] py-1.5 px-3 rounded-xl transition cursor-pointer shrink-0 shadow-2xs flex items-center gap-1"
                title="Yangi chorak yoki vaqt oralig'i dars jadvalini qo'shish"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yangi Davr Jadvali Qo'shish</span>
              </button>
            )}
          </div>
        )}

        {!selectedClassId ? (
          /* OVERALL TEACHER SCHEDULE VIEW */
          overallScheduleLoading ? (
            <div className="text-center py-10">
              <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200/70 bg-white shadow-xs">
              <table className="min-w-full divide-y divide-zinc-200/70 text-center table-fixed">
                <thead className="bg-[#fafafa] text-[10px] sm:text-xs font-extrabold text-[#16193E] uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3 w-16 text-center bg-[#fafafa]">Soat</th>
                    <th className="px-3 py-3">Dushanba</th>
                    <th className="px-3 py-3">Seshanba</th>
                    <th className="px-3 py-3">Chorshanba</th>
                    <th className="px-3 py-3">Payshanba</th>
                    <th className="px-3 py-3">Juma</th>
                    <th className="px-3 py-3">Shanba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                    <tr key={period} className="hover:bg-indigo-50/20 transition">
                      <td className="px-2.5 py-3 font-mono font-bold text-zinc-400 bg-[#fafafa]">
                        {period}-dars
                      </td>
                      {[1, 2, 3, 4, 5, 6].map((day) => {
                        const items = overallSchedule[`${day}-${period}`] || [];
                        const hasConflict = items.length >= 2;

                        return (
                          <td key={day} className="px-2 py-2 border-l border-zinc-100 align-middle">
                            {items.length === 0 ? (
                              <span className="text-zinc-300 italic text-xs font-mono">-</span>
                            ) : hasConflict ? (
                              <div className="bg-amber-100 border-2 border-amber-400 text-amber-950 p-2 rounded-xl text-center shadow-xs">
                                <span className="text-[9px] font-black uppercase text-amber-800 tracking-tight block">
                                  ⚠️ 2 TA DARS ZIDDIYATI
                                </span>
                                {items.map((it, idx) => (
                                  <div
                                    key={idx}
                                    className="text-[10px] font-black text-amber-950 border-t border-amber-300/60 pt-0.5 mt-0.5"
                                  >
                                    {it.class_name} — {it.subject_name}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-indigo-50/90 border border-indigo-200/80 p-2 rounded-xl text-center shadow-2xs">
                                <span className="text-[10px] font-black text-indigo-700 block font-mono uppercase">
                                  {items[0].class_name}
                                </span>
                                <span className="text-[11px] font-black text-zinc-900 block">
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
        ) : /* SPECIFIC CLASS SCHEDULE VIEW */
        classScheduleLoading ? (
          <div className="text-center py-10">
            <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200/70 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-zinc-200/70 text-center table-fixed">
              <thead className="bg-[#fafafa] text-[10px] sm:text-xs font-extrabold text-[#16193E] uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3 w-16 text-center bg-[#fafafa]">Soat</th>
                  <th className="px-3 py-3">Dushanba</th>
                  <th className="px-3 py-3">Seshanba</th>
                  <th className="px-3 py-3">Chorshanba</th>
                  <th className="px-3 py-3">Payshanba</th>
                  <th className="px-3 py-3">Juma</th>
                  <th className="px-3 py-3">Shanba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                  <tr key={period} className="hover:bg-indigo-50/20 transition">
                    <td className="px-2.5 py-3 font-mono font-bold text-zinc-400 bg-[#fafafa]">
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
                        <td key={day} className="px-2.5 py-3 border-l border-zinc-100 align-middle">
                          {lesson ? (
                            lesson.subject_id === 0 || lesson.subject_name === "Bekor qilingan" ? (
                              <span className="text-red-500 font-bold line-through block italic text-xs">
                                Bekor qilingan
                              </span>
                            ) : isMyClass ? (
                              /* Main Teacher View: Full details */
                              <span className="text-zinc-900 font-extrabold block text-xs">
                                {lesson.subject_name}
                              </span>
                            ) : isMyTaughtSubject ? (
                              /* Subject Teacher View: My own lesson in this class */
                              <div className="bg-emerald-50 border-2 border-emerald-300 p-2 rounded-xl text-center shadow-2xs">
                                <span className="text-[9px] font-black text-emerald-600 uppercase block tracking-wider font-mono">
                                  Darsim
                                </span>
                                <span className="text-xs font-black text-emerald-950 block">
                                  {lesson.subject_name}
                                </span>
                              </div>
                            ) : (
                              /* Subject Teacher View: Another teacher's lesson */
                              <div className="bg-zinc-50/90 border border-zinc-200/80 p-2 rounded-xl text-center">
                                <span className="text-xs font-bold text-zinc-700 block">
                                  {lesson.subject_name}
                                </span>
                              </div>
                            )
                          ) : (
                            <span className="text-zinc-300 italic text-xs font-mono">-</span>
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

      {/* Exceptions manager */}
      <div
        ref={exceptionsSectionRef}
        className="bg-white border border-zinc-200/70 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 animate-fadeIn text-zinc-900"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#16193E]">
              Kunlik Dars Jadvali O'zgarishlari
            </h3>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Sinf o'qituvchisi yoki fan o'qituvchilari tomonidan kiritilgan bir martalik dars qo'shimchalari yoki
              bekor qilishlar.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddExceptionModal}
            className="bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-bold text-xs py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
          >
            <span>+ O'zgarish kiritish</span>
          </button>
        </div>

        {scheduleExceptionsLoading ? (
          <div className="text-center py-6">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : scheduleExceptions.length === 0 ? (
          <p className="text-zinc-400 text-xs font-mono py-6 text-center border border-dashed border-zinc-200/80 rounded-2xl bg-zinc-50/40">
            Hech qanday dars o'zgarishi kiritilmagan.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200/70 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-zinc-200/60 text-left text-xs text-zinc-700">
              <thead className="bg-[#fafafa] text-[9px] sm:text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Sana</th>
                  <th className="px-4 py-3">Dars soati</th>
                  <th className="px-4 py-3">Holat / Fan</th>
                  <th className="px-4 py-3">Kiritilgan vaqt</th>
                  <th className="px-4 py-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60">
                {scheduleExceptions.map((exc) => {
                  const isPast = new Date(exc.date + "T23:59:59") < new Date();
                  return (
                    <tr key={exc.id} className="hover:bg-zinc-50/30 transition">
                      <td className="px-4 py-3 font-semibold text-zinc-800">{exc.date}</td>
                      <td className="px-4 py-3 font-mono text-zinc-500">{exc.lesson_number}-dars</td>
                      <td className="px-4 py-3">
                        {exc.is_deleted ? (
                          <span className="text-zinc-400 line-through italic text-[11px]">O'chirilgan</span>
                        ) : exc.subject_id === null ? (
                          <span className="bg-red-500/10 border border-red-500/20 text-red-500 px-2 py-0.5 rounded text-[10px] font-semibold font-mono">
                            Bekor qilingan
                          </span>
                        ) : (
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-semibold font-mono">
                            {exc.subject_name} (O'zgartirilgan)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-[10px] font-mono">
                        {new Date(exc.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!exc.is_deleted && !isPast && (
                          <button
                            type="button"
                            onClick={() => onDeleteException(exc.id)}
                            className="text-red-650 hover:text-red-500 font-semibold text-[10px] bg-red-50 border border-red-200 px-2.5 py-1 rounded-md transition cursor-pointer"
                          >
                            O'chirish (Tiklash)
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
