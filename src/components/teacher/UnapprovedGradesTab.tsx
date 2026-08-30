"use client";

import React from "react";
import { Users, CheckCircle2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export interface UnapprovedGradeItem {
  id: number;
  student_id?: number;
  grade_date?: string;
  value: string;
  student_name: string;
  subject_id: number;
  subject_name: string;
  teacher_name?: string;
  class_id?: number;
  class_name?: string;
  grade_type?: string;
  grade_category?: string;
  lesson_number?: number;
}

interface UnapprovedGradesTabProps {
  selectedClassId: string | number | null;
  selectedSubjectId: string | number | null;
  unapprovedGrades: UnapprovedGradeItem[];
  unapprovedLoading: boolean;
  selectedGradeIds: Set<number>;
  setSelectedGradeIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  unapprovedPage: number;
  setUnapprovedPage: React.Dispatch<React.SetStateAction<number>>;
  unapprovedPageSize: number;
  setUnapprovedPageSize: (size: number) => void;
  onApproveBatch: () => void;
  onApproveSingle: (gradeId: number) => void;
  onDeleteSingle: (gradeId: number) => void;
  onSelectGrade?: (grade: UnapprovedGradeItem) => void;
}

export const UnapprovedGradesTab: React.FC<UnapprovedGradesTabProps> = ({
  selectedClassId,
  selectedSubjectId,
  unapprovedGrades,
  unapprovedLoading,
  selectedGradeIds,
  setSelectedGradeIds,
  unapprovedPage,
  setUnapprovedPage,
  unapprovedPageSize,
  setUnapprovedPageSize,
  onApproveBatch,
  onApproveSingle,
  onDeleteSingle,
  onSelectGrade,
}) => {
  const filteredUnapprovedGrades = unapprovedGrades.filter((g) => {
    if (!selectedSubjectId) return true;
    return Number(g.subject_id) === Number(selectedSubjectId);
  });

  const totalItems = filteredUnapprovedGrades.length;
  const totalPages = Math.ceil(totalItems / unapprovedPageSize) || 1;
  const safePage = Math.min(unapprovedPage, totalPages);
  const startIndex = (safePage - 1) * unapprovedPageSize;
  const paginatedGrades = filteredUnapprovedGrades.slice(startIndex, startIndex + unapprovedPageSize);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-white border border-zinc-200/70 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-900">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-[#16193E]">Tasdiqlanmagan Baholar Ro'yxati</h3>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Bu oynada tasdiqlanmagan (draft) baholar sanasi bo'yicha kamayish tartibida ko'rinadi. Qator ustiga bossangiz jurnalga o'tadi.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {selectedGradeIds.size > 0 && (
            <button
              type="button"
              onClick={onApproveBatch}
              className="bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-bold text-xs py-2.5 px-4 rounded-2xl transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tanlangan ({selectedGradeIds.size}) ta bahoni tasdiqlash</span>
            </button>
          )}
        </div>
      </div>

      {!selectedClassId ? (
        <div className="text-center py-16 bg-white border border-dashed border-zinc-200/80 rounded-3xl animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#5B50EC] flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-extrabold text-[#16193E] mb-1">Sinf tanlanmadi</p>
          <p className="text-xs text-zinc-500 font-medium max-w-sm mx-auto">
            Tasdiqlanmagan baholarni ko'rish uchun pastdagi paneldan sinfni tanlang.
          </p>
        </div>
      ) : unapprovedLoading ? (
        <div className="text-center py-16 bg-white border border-zinc-200/70 rounded-3xl shadow-xs">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
        </div>
      ) : filteredUnapprovedGrades.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-zinc-200/80 rounded-3xl animate-fadeIn">
          <p className="text-sm font-bold text-zinc-800 mb-1">
            {selectedSubjectId ? "Tanlangan fan bo'yicha baholar mavjud emas" : "Barcha baholar tasdiqlangan! 🎉"}
          </p>
          <p className="text-xs text-zinc-400 font-mono">
            Ushbu sinfda hozircha yangi tasdiqlanmagan (draft) baholar mavjud emas.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/70 rounded-3xl shadow-xs overflow-hidden text-zinc-900">
          <div className="max-h-[calc(100vh-320px)] sm:max-h-[calc(100vh-290px)] overflow-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-20 bg-zinc-50 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/70 font-mono">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center sticky left-0 z-30 bg-zinc-50">
                    <input
                      type="checkbox"
                      checked={
                        paginatedGrades.length > 0 && paginatedGrades.every((g) => selectedGradeIds.has(g.id))
                      }
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedGradeIds(() => {
                          const next = new Set<number>();
                          if (checked) {
                            paginatedGrades.forEach((g) => next.add(g.id));
                          }
                          return next;
                        });
                      }}
                      className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Sana</th>
                  <th className="px-6 py-3.5 sticky left-12 z-30 bg-zinc-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    O'quvchi
                  </th>
                  <th className="px-6 py-3.5">Fan</th>
                  <th className="px-4 py-3.5 text-center">Baho</th>
                  <th className="px-4 py-3.5 text-center">Baho Turi</th>
                  <th className="px-6 py-3.5">Kiritdi</th>
                  <th className="px-6 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700 bg-white">
                {paginatedGrades.map((g) => {
                  const formattedDate = g.grade_date
                    ? new Date(g.grade_date).toLocaleDateString("uz-UZ", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—";
                  const numericVal = parseFloat(g.value);
                  const badgeColorClass = !isNaN(numericVal)
                    ? numericVal >= 4.5
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : numericVal >= 3.5
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : numericVal >= 2.5
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-red-50 text-red-700 border-red-200"
                    : "bg-zinc-100 text-zinc-700 border-zinc-200";

                  const isBehavior = g.grade_category === "BEHAVIOR" || g.grade_type === "BEHAVIOR";

                  return (
                    <tr key={g.id} className="group hover:bg-indigo-50/40 transition">
                      <td className="px-4 py-3.5 text-center sticky left-0 z-10 bg-white group-hover:bg-indigo-50/40 transition">
                        <input
                          type="checkbox"
                          checked={selectedGradeIds.has(g.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedGradeIds((prev) => {
                              const next = new Set(prev);
                              if (checked) {
                                next.add(g.id);
                              } else {
                                next.delete(g.id);
                              }
                              return next;
                            });
                          }}
                          className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td
                        onClick={() => onSelectGrade && onSelectGrade(g)}
                        className="px-6 py-3.5 text-zinc-500 font-mono font-bold whitespace-nowrap cursor-pointer hover:text-indigo-600"
                      >
                        {formattedDate}
                      </td>
                      <td
                        onClick={() => onSelectGrade && onSelectGrade(g)}
                        className="px-6 py-3.5 font-bold text-[#16193E] sticky left-12 z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] group-hover:bg-indigo-50/40 transition cursor-pointer group-hover:text-indigo-600"
                      >
                        {g.student_name}
                      </td>
                      <td
                        onClick={() => onSelectGrade && onSelectGrade(g)}
                        className="px-6 py-3.5 cursor-pointer"
                      >
                        <span className="px-3 py-1 rounded-xl text-[11px] font-extrabold bg-[#E0F2FE] text-[#0284C7] inline-block">
                          {g.subject_name}
                        </span>
                      </td>
                      <td
                        onClick={() => onSelectGrade && onSelectGrade(g)}
                        className="px-4 py-3.5 text-center cursor-pointer"
                      >
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs font-black font-mono shadow-2xs ${badgeColorClass}`}
                        >
                          {g.value}
                        </span>
                      </td>
                      <td
                        onClick={() => onSelectGrade && onSelectGrade(g)}
                        className="px-4 py-3.5 text-center cursor-pointer"
                      >
                        {isBehavior ? (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 inline-block shadow-2xs">
                            Xulq
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block shadow-2xs">
                            O'zlashtirish
                          </span>
                        )}
                      </td>
                      <td
                        onClick={() => onSelectGrade && onSelectGrade(g)}
                        className="px-6 py-3.5 text-zinc-500 font-medium cursor-pointer"
                      >
                        {g.teacher_name}
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          title="Tasdiqlash"
                          onClick={() => onApproveSingle(g.id)}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="O'chirish"
                          onClick={() => onDeleteSingle(g.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="px-6 py-3.5 border-t border-zinc-200/70 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 font-medium">
            <div className="flex items-center gap-2">
              <span>Har bir sahifada:</span>
              <select
                value={unapprovedPageSize}
                onChange={(e) => {
                  setUnapprovedPageSize(Number(e.target.value));
                  setUnapprovedPage(1);
                }}
                className="bg-white border border-zinc-200 rounded-xl px-2.5 py-1 text-xs font-bold text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value={10}>10 ta</option>
                <option value={15}>15 ta</option>
                <option value={30}>30 ta</option>
                <option value={50}>50 ta</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-mono text-zinc-500">
                {startIndex + 1} - {Math.min(startIndex + unapprovedPageSize, totalItems)} / {totalItems} ta baho
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setUnapprovedPage((prev) => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-zinc-700" />
                </button>
                <span className="px-2 font-bold font-mono text-zinc-800">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setUnapprovedPage((prev) => Math.min(prev + 1, totalPages))}
                  className="p-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-zinc-700" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnapprovedGradesTab;
