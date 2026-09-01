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
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER BREADCRUMB / ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4 mb-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#1E2B42]">
            Tasdiqlanmagan Baholar
          </h2>
          <p className="text-sm text-slate-500 font-sans mt-1">
            Barcha sinflardagi tasdiqlanmagan (draft) baholar ro'yxati.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          {selectedGradeIds.size > 0 && (
            <button
              type="button"
              onClick={onApproveBatch}
              className="bg-[#A51C30] hover:bg-[#8a1526] text-white font-bold font-sans text-xs py-2.5 px-4 transition cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tanlangan ({selectedGradeIds.size}) ta bahoni tasdiqlash</span>
            </button>
          )}
        </div>
      </div>

      {unapprovedLoading ? (
        <div className="py-16 flex flex-col items-center justify-center bg-slate-50 border border-neutral-200">
          <div className="w-6 h-6 border-2 border-[#1E2B42] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Yuklanmoqda...</p>
        </div>
      ) : filteredUnapprovedGrades.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-neutral-300">
          <p className="text-sm font-bold text-slate-700 font-serif mb-1">
            Barcha baholar tasdiqlangan
          </p>
          <p className="text-xs text-slate-500 font-sans">
            Hozircha yangi tasdiqlanmagan (draft) baholar mavjud emas.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 overflow-hidden">
          {/* MOBILE CARD VIEW FOR GRADES (Hidden on SM and up) */}
          <div className="block sm:hidden divide-y divide-neutral-200">
            {paginatedGrades.map((g) => {
              const formattedDate = g.grade_date
                ? new Date(g.grade_date).toLocaleDateString("uz-UZ", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "—";

              return (
                <div key={g.id} className="p-4 flex flex-col gap-3 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={selectedGradeIds.has(g.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedGradeIds((prev) => {
                              const next = new Set(prev);
                              if (checked) next.add(g.id);
                              else next.delete(g.id);
                              return next;
                            });
                          }}
                          className="w-5 h-5 text-[#A51C30] border-neutral-300 focus:ring-0 rounded-none cursor-pointer"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-base text-[#1E2B42] leading-tight mb-1">
                          {g.student_name}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {formattedDate} • {g.class_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 border border-neutral-200 font-bold font-mono text-sm text-[#1E2B42]">
                        {g.value}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pl-8 flex flex-col gap-1 text-xs text-slate-600">
                    <p><span className="font-bold text-slate-400 mr-1">Fan:</span> {g.subject_name}</p>
                    <p><span className="font-bold text-slate-400 mr-1">Turi:</span> {g.grade_type || g.grade_category || "Noma'lum"}</p>
                  </div>

                  <div className="pl-8 flex items-center justify-end gap-2 mt-2 border-t border-neutral-100 pt-3">
                    <button
                      type="button"
                      onClick={() => onDeleteSingle(g.id)}
                      className="p-2 border border-neutral-200 text-[#A51C30] hover:bg-red-50 transition cursor-pointer"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onApproveSingle(g.id)}
                      className="p-2 border border-[#1E2B42] bg-[#1E2B42] text-white hover:bg-slate-800 transition cursor-pointer"
                      title="Tasdiqlash"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0 text-xs font-sans">
              <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center sticky top-0 left-0 z-30 bg-slate-50 border-b border-r border-neutral-200 shadow-[1px_0_0_0_#e5e5e5]">
                    <input
                      type="checkbox"
                      checked={paginatedGrades.length > 0 && paginatedGrades.every((g) => selectedGradeIds.has(g.id))}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedGradeIds(() => {
                          const next = new Set<number>();
                          if (checked) paginatedGrades.forEach((g) => next.add(g.id));
                          return next;
                        });
                      }}
                      className="w-4 h-4 text-[#A51C30] border-neutral-300 rounded-none focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3.5 whitespace-nowrap sticky top-0 z-20 bg-slate-50 border-b border-r border-neutral-200">Sana</th>
                  <th className="px-6 py-3.5 sticky top-0 left-12 z-30 bg-slate-50 border-b border-r border-neutral-200 shadow-[1px_0_0_0_#e5e5e5]">O'quvchi</th>
                  <th className="px-6 py-3.5 sticky top-0 z-20 bg-slate-50 border-b border-neutral-200">Sinf</th>
                  <th className="px-6 py-3.5 sticky top-0 z-20 bg-slate-50 border-b border-neutral-200">Fan</th>
                  <th className="px-4 py-3.5 text-center sticky top-0 z-20 bg-slate-50 border-b border-neutral-200">Baho</th>
                  <th className="px-4 py-3.5 text-center sticky top-0 z-20 bg-slate-50 border-b border-neutral-200">Baho Turi</th>
                  <th className="px-6 py-3.5 text-right sticky top-0 z-20 bg-slate-50 border-b border-neutral-200">Amallar</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 bg-white">
                {paginatedGrades.map((g, idx) => {
                  const formattedDate = g.grade_date
                    ? new Date(g.grade_date).toLocaleDateString("uz-UZ", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—";

                  const isLastRow = idx === paginatedGrades.length - 1;
                  const borderBottomClass = isLastRow ? "" : "border-b border-neutral-200";

                  return (
                    <tr key={g.id} className="group hover:bg-slate-50 transition">
                      <td className={`px-4 py-3 text-center sticky left-0 z-10 bg-inherit border-r border-neutral-200 shadow-[1px_0_0_0_#e5e5e5] ${borderBottomClass}`}>
                        <input
                          type="checkbox"
                          checked={selectedGradeIds.has(g.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedGradeIds((prev) => {
                              const next = new Set(prev);
                              if (checked) next.add(g.id);
                              else next.delete(g.id);
                              return next;
                            });
                          }}
                          className="w-4 h-4 text-[#A51C30] border-neutral-300 rounded-none focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td onClick={() => onSelectGrade && onSelectGrade(g)} className={`px-6 py-3 font-mono text-slate-500 whitespace-nowrap cursor-pointer border-r border-neutral-200 ${borderBottomClass}`}>
                        {formattedDate}
                      </td>
                      <td onClick={() => onSelectGrade && onSelectGrade(g)} className={`px-6 py-3 font-bold text-[#1E2B42] sticky left-12 z-10 bg-inherit border-r border-neutral-200 shadow-[1px_0_0_0_#e5e5e5] cursor-pointer hover:text-[#A51C30] transition ${borderBottomClass}`}>
                        {g.student_name}
                      </td>
                      <td className={`px-6 py-3 whitespace-nowrap ${borderBottomClass}`}>{g.class_name}</td>
                      <td className={`px-6 py-3 whitespace-nowrap ${borderBottomClass}`}>{g.subject_name}</td>
                      <td className={`px-4 py-3 text-center ${borderBottomClass}`}>
                        <span className="inline-block px-2.5 py-1 bg-slate-100 border border-neutral-200 font-bold font-mono text-sm text-[#1E2B42]">
                          {g.value}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wide ${borderBottomClass}`}>
                        {g.grade_type || g.grade_category || "—"}
                      </td>
                      <td className={`px-6 py-3 text-right whitespace-nowrap ${borderBottomClass}`}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDeleteSingle(g.id); }}
                            className="p-1.5 text-[#A51C30] hover:bg-red-50 transition cursor-pointer"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onApproveSingle(g.id); }}
                            className="p-1.5 text-[#1E2B42] hover:bg-slate-100 transition cursor-pointer"
                            title="Tasdiqlash"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="shrink-0 p-4 border-t border-neutral-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans text-slate-500">
            <div>
              Jami <b>{totalItems}</b> ta baho (Sahifa {safePage} / {totalPages})
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Ko'rsatish:</span>
                <select
                  value={unapprovedPageSize}
                  onChange={(e) => {
                    setUnapprovedPageSize(Number(e.target.value));
                    setUnapprovedPage(1);
                  }}
                  className="bg-white border border-neutral-300 text-slate-700 py-1 pl-2 pr-6 focus:ring-0 focus:border-slate-400 cursor-pointer rounded-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setUnapprovedPage((prev) => Math.max(prev - 1, 1))}
                  className="p-1.5 border border-neutral-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer rounded-none"
                >
                  <ChevronLeft className="w-4 h-4 text-[#1E2B42]" />
                </button>
                <span className="px-2 font-bold font-mono text-[#1E2B42]">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setUnapprovedPage((prev) => Math.min(prev + 1, totalPages))}
                  className="p-1.5 border border-neutral-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer rounded-none"
                >
                  <ChevronRight className="w-4 h-4 text-[#1E2B42]" />
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
