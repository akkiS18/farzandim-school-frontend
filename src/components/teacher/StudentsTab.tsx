"use client";

import React from "react";
import {
  Search,
  ArrowRightLeft,
  FileSpreadsheet,
  UserPlus,
  Users,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Student {
  id?: number;
  student_id?: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  class_name?: string;
  phone?: string;
  birthdate?: string;
  enrollment_date?: string;
  created_at?: string;
  address?: string;
  ina?: string;
}

interface StudentsTabProps {
  selectedClassId: string | number | null;
  studentsTabList: Student[];
  studentsTabLoading: boolean;
  studentsSearch: string;
  setStudentsSearch: (val: string) => void;
  studentsPage: number;
  setStudentsPage: React.Dispatch<React.SetStateAction<number>>;
  studentsPageSize: number;
  setStudentsPageSize: (val: number) => void;
  onOpenTransferModal: () => void;
  onOpenImportStudentsModal: () => void;
  onOpenCreateStudentModal: () => void;
  onOpenParentsModal: (student: Student) => void;
  onOpenEditStudentModal: (student: Student) => void;
  onDeleteStudent: (studentId: any) => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  selectedClassId,
  studentsTabList,
  studentsTabLoading,
  studentsSearch,
  setStudentsSearch,
  studentsPage,
  setStudentsPage,
  studentsPageSize,
  setStudentsPageSize,
  onOpenTransferModal,
  onOpenImportStudentsModal,
  onOpenCreateStudentModal,
  onOpenParentsModal,
  onOpenEditStudentModal,
  onDeleteStudent,
}) => {
  const filteredStudents = studentsTabList.filter((st) => {
    const q = studentsSearch.toLowerCase().trim();
    if (!q) return true;
    const name = `${st.first_name || ""} ${st.last_name || ""} ${st.middle_name || ""}`.toLowerCase();
    const phone = (st.phone || "").toLowerCase();
    const cls = (st.class_name || "").toLowerCase();
    return name.includes(q) || phone.includes(q) || cls.includes(q);
  });

  const totalStudentsPages = Math.ceil(filteredStudents.length / studentsPageSize) || 1;
  const currentPage = Math.min(studentsPage, totalStudentsPages);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPageSize,
    currentPage * studentsPageSize
  );

  return (
    <div className="space-y-4 animate-fadeIn pb-36">
      <div className="bg-white border border-zinc-200/70 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-900">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-[#16193E]">
            {selectedClassId ? "Sinf O'quvchilari" : "Barcha O'quvchilar"}
          </h3>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            {selectedClassId
              ? "Sinf rahbari sifatida o'quvchilarni qo'shishingiz va boshqarishingiz mumkin"
              : "Maktabdagi barcha sinf o'quvchilarining umumiy ro'yxati"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 rounded-2xl px-3 py-2">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={studentsSearch}
              onChange={(e) => {
                setStudentsSearch(e.target.value);
                setStudentsPage(1);
              }}
              placeholder="O'quvchi qidirish..."
              className="bg-transparent border-none text-xs font-bold text-zinc-800 outline-none w-32 sm:w-44 transition-all"
            />
          </div>

          <button
            type="button"
            title="O'quvchilarni sinfdan sinfga ko'chirish"
            onClick={onOpenTransferModal}
            className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-2xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Sinfga Ko'chirish</span>
          </button>

          <button
            type="button"
            title="Excel orqali yuklash"
            onClick={onOpenImportStudentsModal}
            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-2xl transition cursor-pointer flex items-center justify-center shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="O'quvchi qo'shish"
            onClick={onOpenCreateStudentModal}
            className="p-2.5 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-2xl transition cursor-pointer flex items-center justify-center shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {studentsTabLoading ? (
        <div className="text-center py-16 bg-white border border-zinc-200/70 rounded-3xl shadow-xs">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-zinc-200/80 rounded-3xl">
          <p className="text-xs text-zinc-400 font-mono">
            {studentsSearch
              ? "Qidiruv bo'yicha hech qanday o'quvchi topilmadi."
              : selectedClassId
              ? "Ushbu sinfda hozircha o'quvchilar yo'q."
              : "Maktabda hozircha o'quvchilar ro'yxatga olinmagan."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/70 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[920px]">
              <thead className="sticky top-0 z-20 bg-zinc-50 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider border-b border-zinc-200/70 font-mono">
                <tr>
                  <th className="px-4 py-3.5 text-center font-mono w-12 sticky left-0 z-30 bg-zinc-50 whitespace-nowrap">
                    T/R
                  </th>
                  <th className="px-6 py-3.5 sticky left-12 z-30 bg-zinc-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] whitespace-nowrap min-w-[180px]">
                    Ism Familiya
                  </th>
                  <th className="px-6 py-3.5 whitespace-nowrap min-w-[90px]">Sinf</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Telefon</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Tug'ilgan sana</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Maktabga kirish sanasi</th>
                  <th className="px-6 py-3.5 text-right whitespace-nowrap">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700 bg-white">
                {paginatedStudents.map((st, idx) => {
                  const globalIndex = (currentPage - 1) * studentsPageSize + idx + 1;
                  const stId = Number(st.id || st.student_id);
                  return (
                    <tr key={stId || idx} className="group hover:bg-zinc-50/80 transition">
                      <td className="px-4 py-3.5 text-center font-mono text-zinc-400 sticky left-0 z-10 bg-white group-hover:bg-zinc-50/80 transition">
                        {globalIndex}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-[#16193E] sticky left-12 z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] group-hover:bg-zinc-50/80 transition min-w-[180px] whitespace-nowrap">
                        {st.first_name} {st.last_name}{" "}
                        {st.middle_name && <span className="text-zinc-400 font-normal">({st.middle_name})</span>}
                      </td>
                      <td className="px-6 py-3.5 font-mono whitespace-nowrap">
                        <span className="px-3 py-1 rounded-xl text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 inline-block whitespace-nowrap shrink-0">
                          {st.class_name || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-zinc-500 whitespace-nowrap">{st.phone || "—"}</td>
                      <td className="px-6 py-3.5 font-mono text-zinc-500 whitespace-nowrap">
                        {st.birthdate ? st.birthdate.split("T")[0] : "—"}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-zinc-600 font-bold whitespace-nowrap">
                        <span className="bg-indigo-50/70 text-indigo-800 px-2.5 py-1 rounded-xl text-[11px] border border-indigo-100/60 inline-block whitespace-nowrap">
                          📅{" "}
                          {st.enrollment_date
                            ? st.enrollment_date.split("T")[0]
                            : st.created_at
                            ? st.created_at.split("T")[0]
                            : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          title="Vasiylar (Ota-onalar)"
                          onClick={() => onOpenParentsModal(st)}
                          className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Tahrirlash"
                          onClick={() => onOpenEditStudentModal(st)}
                          className="p-2 bg-zinc-100 hover:bg-zinc-200 text-[#16193E] rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center justify-center"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="O'chirish"
                          onClick={() => onDeleteStudent(stId)}
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
          <div className="bg-zinc-50 border-t border-zinc-200/70 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 font-medium">
            <div className="flex items-center gap-3">
              <span>
                Jami <b>{filteredStudents.length}</b> ta o'quvchidan{" "}
                <b>{(currentPage - 1) * studentsPageSize + 1}</b>-
                <b>{Math.min(currentPage * studentsPageSize, filteredStudents.length)}</b> ko'rsatilmoqda
              </span>

              <select
                value={studentsPageSize}
                onChange={(e) => {
                  setStudentsPageSize(Number(e.target.value));
                  setStudentsPage(1);
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
                onClick={() => setStudentsPage((p) => Math.max(p - 1, 1))}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Oldingi</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalStudentsPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalStudentsPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-zinc-400 font-mono">...</span>}
                        <button
                          type="button"
                          onClick={() => setStudentsPage(p)}
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
                disabled={currentPage >= totalStudentsPages}
                onClick={() => setStudentsPage((p) => Math.min(p + 1, totalStudentsPages))}
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

export default StudentsTab;
