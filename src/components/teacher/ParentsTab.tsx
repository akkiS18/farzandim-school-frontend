"use client";

import React from "react";
import { Search, FileSpreadsheet, UserPlus, UserMinus, ChevronLeft, ChevronRight } from "lucide-react";

interface ParentItem {
  id?: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone?: string;
  passport?: string;
  student_name?: string;
  class_name?: string;
  student_id?: number;
}

interface ParentsTabProps {
  selectedClassId: string | number | null;
  classParents: ParentItem[];
  classParentsLoading: boolean;
  parentsSearch: string;
  setParentsSearch: (val: string) => void;
  parentsPage: number;
  setParentsPage: React.Dispatch<React.SetStateAction<number>>;
  parentsPageSize: number;
  setParentsPageSize: (val: number) => void;
  onOpenImportParentsModal: () => void;
  onOpenAddParentModal: () => void;
  onUnlinkParentFromStudent: (studentId: any, parentId: any) => void;
}

export const ParentsTab: React.FC<ParentsTabProps> = ({
  selectedClassId,
  classParents,
  classParentsLoading,
  parentsSearch,
  setParentsSearch,
  parentsPage,
  setParentsPage,
  parentsPageSize,
  setParentsPageSize,
  onOpenImportParentsModal,
  onOpenAddParentModal,
  onUnlinkParentFromStudent,
}) => {
  const filteredParents = classParents.filter((pt) => {
    const q = parentsSearch.toLowerCase().trim();
    if (!q) return true;
    const name = `${pt.first_name || ""} ${pt.last_name || ""} ${pt.middle_name || ""}`.toLowerCase();
    const phone = (pt.phone || "").toLowerCase();
    const child = (pt.student_name || "").toLowerCase();
    const cls = (pt.class_name || "").toLowerCase();
    return name.includes(q) || phone.includes(q) || child.includes(q) || cls.includes(q);
  });

  const totalParentsPages = Math.ceil(filteredParents.length / parentsPageSize) || 1;
  const currentPage = Math.min(parentsPage, totalParentsPages);
  const paginatedParents = filteredParents.slice(
    (currentPage - 1) * parentsPageSize,
    currentPage * parentsPageSize
  );

  return (
    <div className="space-y-4 animate-fadeIn pb-36">
      <div className="bg-white border border-zinc-200/70 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-900">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-[#16193E]">
            {selectedClassId ? "Sinf Ota-onalari (Vasiylar)" : "Barcha Ota-onalar (Vasiylar)"}
          </h3>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            {selectedClassId
              ? "Sinfdagi barcha o'quvchilarning ota-onalari (vasiylari) va ularni boshqarish"
              : "Maktabdagi barcha o'quvchilarning ota-onalari (vasiylari) ro'yxati"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 rounded-2xl px-3 py-2">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={parentsSearch}
              onChange={(e) => {
                setParentsSearch(e.target.value);
                setParentsPage(1);
              }}
              placeholder="Ota-ona qidirish..."
              className="bg-transparent border-none text-xs font-bold text-zinc-800 outline-none w-32 sm:w-44 transition-all"
            />
          </div>

          <button
            type="button"
            title="Excel orqali yuklash"
            onClick={onOpenImportParentsModal}
            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-2xl transition cursor-pointer flex items-center justify-center shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Ota-ona qo'shish"
            onClick={onOpenAddParentModal}
            className="p-2.5 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-2xl transition cursor-pointer flex items-center justify-center shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {classParentsLoading ? (
        <div className="text-center py-16 bg-white border border-zinc-200/70 rounded-3xl shadow-xs">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
        </div>
      ) : filteredParents.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-zinc-200/80 rounded-3xl">
          <p className="text-sm font-bold text-zinc-800 mb-1">Ota-onalar mavjud emas</p>
          <p className="text-xs text-zinc-400 font-mono">
            {parentsSearch
              ? "Qidiruv bo'yicha hech qanday ota-ona topilmadi."
              : selectedClassId
              ? "Ushbu sinfda hozircha bog'langan ota-onalar ro'yxatga olinmagan."
              : "Maktabda hozircha bog'langan ota-onalar ro'yxatga olinmagan."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/70 rounded-3xl shadow-xs overflow-hidden text-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-20 bg-zinc-50 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/70 font-mono">
                <tr>
                  <th className="px-4 py-3.5 text-center font-mono w-12 sticky left-0 z-30 bg-zinc-50">T/R</th>
                  <th className="px-6 py-3.5 sticky left-12 z-30 bg-zinc-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    Ism Familiya
                  </th>
                  <th className="px-6 py-3.5">Telefon</th>
                  <th className="px-6 py-3.5">Pasport</th>
                  <th className="px-6 py-3.5">O'quvchi (Farzand)</th>
                  <th className="px-6 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700 bg-white">
                {paginatedParents.map((pt, idx) => {
                  const globalIndex = (currentPage - 1) * parentsPageSize + idx + 1;
                  const pId = pt.id || pt.user_id;
                  return (
                    <tr key={`${pId}-${idx}`} className="group hover:bg-zinc-50/80 transition">
                      <td className="px-4 py-3.5 text-center font-mono text-zinc-400 sticky left-0 z-10 bg-white group-hover:bg-zinc-50/80 transition">
                        {globalIndex}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-[#16193E] sticky left-12 z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] group-hover:bg-zinc-50/80 transition">
                        {pt.first_name} {pt.last_name}{" "}
                        {pt.middle_name && <span className="text-zinc-400 font-normal">({pt.middle_name})</span>}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-zinc-500">{pt.phone || "—"}</td>
                      <td className="px-6 py-3.5 font-mono text-indigo-700 font-bold">
                        {pt.passport || "Kiritilmagan"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-3 py-1 rounded-xl text-[11px] font-extrabold bg-[#E0F2FE] text-[#0284C7] inline-block">
                          {pt.student_name || "Noma'lum"}{" "}
                          {pt.class_name && (
                            <span className="font-mono text-zinc-500 text-[10px]">({pt.class_name})</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          title="Farzanddan ajratish"
                          onClick={() => onUnlinkParentFromStudent(pt.student_id, pId)}
                          className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="bg-zinc-50 border-t border-zinc-200/70 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 font-medium">
            <div className="flex items-center gap-3">
              <span>
                Jami <b>{filteredParents.length}</b> ta ota-onadan{" "}
                <b>{(currentPage - 1) * parentsPageSize + 1}</b>-
                <b>{Math.min(currentPage * parentsPageSize, filteredParents.length)}</b> ko'rsatilmoqda
              </span>

              <select
                value={parentsPageSize}
                onChange={(e) => {
                  setParentsPageSize(Number(e.target.value));
                  setParentsPage(1);
                }}
                className="bg-white border border-zinc-200 rounded-xl px-2.5 py-1 text-xs font-bold text-zinc-700 outline-none cursor-pointer"
              >
                <option value={15}>15 tadan</option>
                <option value={25}>25 tadan</option>
                <option value={50}>50 tadan</option>
                <option value={100}>100 tadan</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setParentsPage((p) => Math.max(p - 1, 1))}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Oldingi</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalParentsPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalParentsPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-zinc-400 font-mono">...</span>}
                        <button
                          type="button"
                          onClick={() => setParentsPage(p)}
                          className={`w-8 h-8 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                            currentPage === p
                              ? "bg-[#5B50EC] text-white shadow-xs"
                              : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalParentsPages}
                onClick={() => setParentsPage((p) => Math.min(p + 1, totalParentsPages))}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold cursor-pointer flex items-center gap-1"
              >
                <span className="hidden sm:inline">Keyingi</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentsTab;
