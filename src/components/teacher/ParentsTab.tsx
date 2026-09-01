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

const ParentsTab: React.FC<ParentsTabProps> = ({
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

    return (
      (pt.first_name || "").toLowerCase().includes(q) ||
      (pt.last_name || "").toLowerCase().includes(q) ||
      (pt.student_name || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredParents.length / parentsPageSize) || 1;
  const currentPage = Math.min(parentsPage, totalPages);
  const paginatedParents = filteredParents.slice(
    (currentPage - 1) * parentsPageSize,
    currentPage * parentsPageSize
  );

  return (
    <div className="space-y-4 animate-fadeIn pb-36">
      <div className="bg-white border border-neutral-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold font-serif text-[#1E2B42]">
            {selectedClassId ? "Sinf Vasiylari (Ota-onalar)" : "Barcha Vasiylar (Ota-onalar)"}
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            {selectedClassId
              ? "Tanlangan sinfdagi barcha o'quvchilarning ota-onalari ro'yxati"
              : "Maktabdagi barcha o'quvchilarning ota-onalari ro'yxati"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 border border-neutral-200 px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={parentsSearch}
              onChange={(e) => {
                setParentsSearch(e.target.value);
                setParentsPage(1);
              }}
              placeholder="Ota-ona qidirish..."
              className="bg-transparent border-none text-xs font-bold font-sans text-slate-800 outline-none w-32 sm:w-44 transition-all"
            />
          </div>

          <button
            type="button"
            title="Excel orqali yuklash"
            onClick={onOpenImportParentsModal}
            className="p-2 bg-white hover:bg-slate-50 border border-neutral-300 text-slate-700 transition cursor-pointer flex items-center justify-center"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Ota-ona qo'shish"
            onClick={onOpenAddParentModal}
            className="p-2 bg-[#A51C30] hover:bg-[#8a1526] text-white transition cursor-pointer flex items-center justify-center"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {classParentsLoading ? (
        <div className="py-16 flex flex-col items-center justify-center bg-slate-50 border border-neutral-200">
          <div className="w-6 h-6 border-2 border-[#1E2B42] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Yuklanmoqda...</p>
        </div>
      ) : filteredParents.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-neutral-300">
          <p className="text-sm font-bold text-slate-700 font-serif mb-1">
            {parentsSearch
              ? "Hech kim topilmadi"
              : selectedClassId
              ? "Ushbu sinfda ota-onalar yo'q"
              : "Maktabda ota-onalar ro'yxatga olinmagan"}
          </p>
          <p className="text-xs text-slate-500 font-sans">
            Yangi vasiy qo'shish yoki qidiruvni o'zgartirish orqali ro'yxatni shakllantiring.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 overflow-hidden">
          {/* MOBILE CARD VIEW FOR PARENTS (Hidden on SM and up) */}
          <div className="block sm:hidden divide-y divide-neutral-200">
            {paginatedParents.map((pt, idx) => {
              const globalIndex = (currentPage - 1) * parentsPageSize + idx + 1;
              const pId = pt.id || pt.user_id;

              return (
                <div key={`${pId}-${idx}`} className="p-4 flex flex-col gap-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-400 font-mono mb-1">#{globalIndex}</div>
                      <div className="text-sm font-bold text-[#1E2B42] font-serif">
                        {pt.first_name} {pt.last_name}
                      </div>
                      {pt.middle_name && (
                        <div className="text-xs text-slate-500 font-sans">{pt.middle_name}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      title="Farzanddan ajratish"
                      onClick={() => onUnlinkParentFromStudent(pt.student_id, pId)}
                      className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-[#A51C30] transition cursor-pointer"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-neutral-100 pt-3">
                    <div>
                      <div className="text-slate-400 font-bold uppercase tracking-wider mb-0.5">Telefon</div>
                      <div className="text-slate-800 font-sans font-medium">{pt.phone || "—"}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-bold uppercase tracking-wider mb-0.5">Pasport</div>
                      <div className="text-slate-800 font-sans font-bold">{pt.passport || "—"}</div>
                    </div>
                    <div className="col-span-2 mt-1">
                      <div className="text-slate-400 font-bold uppercase tracking-wider mb-0.5">O'quvchi (Farzand)</div>
                      <div className="text-slate-800 font-sans">
                        {pt.student_name || "Noma'lum"}{" "}
                        {pt.class_name && <span className="text-slate-500 ml-1">({pt.class_name})</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (Hidden on Mobile) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-neutral-200 font-sans">
                <tr>
                  <th className="px-4 py-3 text-center w-12">T/R</th>
                  <th className="px-6 py-3">Ism Familiya</th>
                  <th className="px-6 py-3">Telefon</th>
                  <th className="px-6 py-3">Pasport</th>
                  <th className="px-6 py-3">O'quvchi (Farzand)</th>
                  <th className="px-6 py-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans text-slate-700 bg-white">
                {paginatedParents.map((pt, idx) => {
                  const globalIndex = (currentPage - 1) * parentsPageSize + idx + 1;
                  const pId = pt.id || pt.user_id;
                  return (
                    <tr key={`${pId}-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400">
                        {globalIndex}
                      </td>
                      <td className="px-6 py-3 font-bold text-slate-800">
                        {pt.first_name} {pt.last_name}{" "}
                        {pt.middle_name && <span className="text-slate-400 font-normal">({pt.middle_name})</span>}
                      </td>
                      <td className="px-6 py-3 text-slate-600">{pt.phone || "—"}</td>
                      <td className="px-6 py-3 font-bold text-slate-800">
                        {pt.passport || "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-slate-700 font-bold">
                          {pt.student_name || "Noma'lum"}{" "}
                          {pt.class_name && (
                            <span className="font-normal text-slate-500">({pt.class_name})</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          title="Farzanddan ajratish"
                          onClick={() => onUnlinkParentFromStudent(pt.student_id, pId)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-[#A51C30] transition cursor-pointer inline-flex items-center justify-center"
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
          <div className="bg-slate-50 border-t border-neutral-200 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-sans">
            <div className="flex items-center gap-3">
              <span>
                Jami <strong className="text-slate-800">{filteredParents.length}</strong> ta ota-onadan{" "}
                <strong className="text-slate-800">
                  {filteredParents.length > 0 ? (currentPage - 1) * parentsPageSize + 1 : 0}
                </strong>-
                <strong className="text-slate-800">{Math.min(currentPage * parentsPageSize, filteredParents.length)}</strong> ko'rsatilmoqda
              </span>

              <select
                value={parentsPageSize}
                onChange={(e) => {
                  setParentsPageSize(Number(e.target.value));
                  setParentsPage(1);
                }}
                className="bg-white border border-neutral-300 rounded-none px-2 py-1 outline-none focus:border-[#1E2B42]"
              >
                <option value={15}>15 ta</option>
                <option value={25}>25 ta</option>
                <option value={50}>50 ta</option>
                <option value={100}>100 ta</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setParentsPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-white border border-neutral-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setParentsPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 bg-white border border-neutral-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
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
