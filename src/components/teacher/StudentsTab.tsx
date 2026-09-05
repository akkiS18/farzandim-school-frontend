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
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER BREADCRUMB / ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4 mb-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#1E2B42]">
            {selectedClassId ? "Sinf O'quvchilari" : "Barcha O'quvchilar"}
          </h2>
          <p className="text-sm text-slate-500 font-sans mt-1">
            {selectedClassId
              ? "Sinf rahbari sifatida o'quvchilarni qo'shishingiz va boshqarishingiz mumkin"
              : "Maktabdagi barcha sinf o'quvchilarining umumiy ro'yxati"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-white border border-neutral-300 px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={studentsSearch}
              onChange={(e) => {
                setStudentsSearch(e.target.value);
                setStudentsPage(1);
              }}
              placeholder="O'quvchi qidirish..."
              className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none w-32 sm:w-44 transition-all focus:ring-0 p-0"
            />
          </div>

          <button
            type="button"
            title="O'quvchilarni sinfdan sinfga ko'chirish"
            onClick={onOpenTransferModal}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-neutral-200 text-[#1E2B42] font-bold text-xs rounded-none transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Ko'chirish</span>
          </button>

          <button
            type="button"
            title="Excel orqali yuklash"
            onClick={onOpenImportStudentsModal}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-neutral-200 text-[#1E2B42] rounded-none transition cursor-pointer flex items-center justify-center"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            title="O'quvchi qo'shish"
            onClick={onOpenCreateStudentModal}
            className="p-2.5 bg-[#A51C30] hover:bg-[#8a1526] text-white rounded-none transition cursor-pointer flex items-center justify-center"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline ml-2 text-xs font-bold">Qo'shish</span>
          </button>
        </div>
      </div>

      {studentsTabLoading ? (
        <div className="py-16 flex flex-col items-center justify-center bg-slate-50 border border-neutral-200">
          <div className="w-6 h-6 border-2 border-[#1E2B42] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Yuklanmoqda...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-neutral-300">
          <p className="text-sm font-bold text-slate-700 font-serif mb-1">
            {studentsSearch
              ? "Hech kim topilmadi"
              : selectedClassId
              ? "Ushbu sinfda o'quvchilar yo'q"
              : "Maktabda o'quvchilar ro'yxatga olinmagan"}
          </p>
          <p className="text-xs text-slate-500 font-sans">
            Yangi o'quvchi qo'shish yoki qidiruvni o'zgartirish orqali ro'yxatni shakllantiring.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 overflow-hidden">
          {/* MOBILE CARD VIEW FOR STUDENTS (Hidden on SM and up) */}
          <div className="block sm:hidden divide-y divide-neutral-200">
            {paginatedStudents.map((st, idx) => {
              const globalIndex = (currentPage - 1) * studentsPageSize + idx + 1;
              const stId = Number(st.student_id || st.id);

              return (
                <div key={stId || idx} className="p-4 flex flex-col gap-3 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <span className="font-mono text-slate-400 text-xs">{globalIndex}.</span>
                      </div>
                      <div>
                        <p className="font-bold text-base text-[#1E2B42] leading-tight mb-1">
                          {st.first_name} {st.last_name}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {st.middle_name ? st.middle_name : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 border border-neutral-200 font-bold text-sm text-[#1E2B42]">
                        {st.class_name || "—"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pl-6 flex flex-col gap-1 text-xs text-slate-600 mt-1">
                    <p><span className="font-bold text-slate-400 mr-1">INA:</span> {st.ina || "—"}</p>
                    <p><span className="font-bold text-slate-400 mr-1">Tug'ilgan sana:</span> {st.birthdate ? st.birthdate.split("T")[0] : "—"}</p>
                    <p><span className="font-bold text-slate-400 mr-1">Qabul:</span> {st.enrollment_date ? st.enrollment_date.split("T")[0] : st.created_at ? st.created_at.split("T")[0] : "—"}</p>
                  </div>

                  <div className="pl-6 flex items-center justify-end gap-2 mt-2 border-t border-neutral-100 pt-3">
                    <button
                      type="button"
                      title="Vasiylar (Ota-onalar)"
                      onClick={() => onOpenParentsModal(st)}
                      className="p-2 border border-neutral-200 text-[#1E2B42] hover:bg-slate-100 transition cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Tahrirlash"
                      onClick={() => onOpenEditStudentModal(st)}
                      className="p-2 border border-neutral-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="O'chirish"
                      onClick={() => onDeleteStudent(stId)}
                      className="p-2 border border-neutral-200 text-[#A51C30] hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
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
                  <th className="px-4 py-3.5 text-center w-12 sticky top-0 left-0 z-30 bg-slate-50 border-b border-r border-neutral-200 shadow-[1px_0_0_0_#e5e5e5]">
                    T/R
                  </th>
                  <th className="px-6 py-3.5 sticky top-0 left-12 z-30 bg-slate-50 border-b border-r border-neutral-200 shadow-[1px_0_0_0_#e5e5e5] min-w-[180px]">
                    Ism Familiya
                  </th>
                  <th className="px-6 py-3.5 sticky top-0 z-20 bg-slate-50 border-b border-neutral-200 min-w-[90px]">Sinf</th>
                  <th className="px-6 py-3.5 sticky top-0 z-20 bg-slate-50 border-b border-neutral-200">INA</th>
                  <th className="px-6 py-3.5 sticky top-0 z-20 bg-slate-50 border-b border-neutral-200">Tug'ilgan sana</th>
                  <th className="px-6 py-3.5 sticky top-0 z-20 bg-slate-50 border-b border-neutral-200">Maktabga kirish sanasi</th>
                  <th className="px-6 py-3.5 text-right sticky top-0 z-20 bg-slate-50 border-b border-neutral-200">Amallar</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 bg-white">
                {paginatedStudents.map((st, idx) => {
                  const globalIndex = (currentPage - 1) * studentsPageSize + idx + 1;
                  const stId = Number(st.student_id || st.id);
                  const isLastRow = idx === paginatedStudents.length - 1;
                  const borderBottomClass = isLastRow ? "" : "border-b border-neutral-200";

                  return (
                    <tr key={stId || idx} className="group hover:bg-slate-50 transition">
                      <td className={`px-4 py-3.5 text-center font-mono text-slate-500 sticky left-0 z-10 bg-inherit border-r border-neutral-200 shadow-[1px_0_0_0_#e5e5e5] ${borderBottomClass}`}>
                        {globalIndex}
                      </td>
                      <td className={`px-6 py-3.5 font-bold text-[#1E2B42] sticky left-12 z-10 bg-inherit border-r border-neutral-200 shadow-[1px_0_0_0_#e5e5e5] min-w-[180px] whitespace-nowrap ${borderBottomClass}`}>
                        {st.first_name} {st.last_name}{" "}
                        {st.middle_name && <span className="text-slate-400 font-normal">({st.middle_name})</span>}
                      </td>
                      <td className={`px-6 py-3.5 font-mono whitespace-nowrap ${borderBottomClass}`}>
                        <span className="px-2.5 py-1 bg-slate-100 border border-neutral-200 font-bold text-sm text-[#1E2B42] inline-block shrink-0">
                          {st.class_name || "—"}
                        </span>
                      </td>
                      <td className={`px-6 py-3.5 font-mono text-slate-500 whitespace-nowrap ${borderBottomClass}`}>{st.ina || "—"}</td>
                      <td className={`px-6 py-3.5 font-mono text-slate-500 whitespace-nowrap ${borderBottomClass}`}>
                        {st.birthdate ? st.birthdate.split("T")[0] : "—"}
                      </td>
                      <td className={`px-6 py-3.5 font-mono text-slate-600 font-bold whitespace-nowrap ${borderBottomClass}`}>
                        {st.enrollment_date
                          ? st.enrollment_date.split("T")[0]
                          : st.created_at
                          ? st.created_at.split("T")[0]
                          : "—"}
                      </td>
                      <td className={`px-6 py-3.5 text-right whitespace-nowrap ${borderBottomClass}`}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Vasiylar (Ota-onalar)"
                            onClick={() => onOpenParentsModal(st)}
                            className="p-1.5 text-[#1E2B42] hover:bg-slate-200 transition cursor-pointer"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Tahrirlash"
                            onClick={() => onOpenEditStudentModal(st)}
                            className="p-1.5 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="O'chirish"
                            onClick={() => onDeleteStudent(stId)}
                            className="p-1.5 text-[#A51C30] hover:bg-red-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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
              Jami <b>{filteredStudents.length}</b> ta o'quvchidan{" "}
              <b>{(currentPage - 1) * studentsPageSize + 1}</b>-
              <b>{Math.min(currentPage * studentsPageSize, filteredStudents.length)}</b> ko'rsatilmoqda
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span>Ko'rsatish:</span>
                <select
                  value={studentsPageSize}
                  onChange={(e) => {
                    setStudentsPageSize(Number(e.target.value));
                    setStudentsPage(1);
                  }}
                  className="bg-white border border-neutral-300 text-slate-700 py-1 pl-2 pr-6 focus:ring-0 focus:border-slate-400 cursor-pointer rounded-none"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setStudentsPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 border border-neutral-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer rounded-none"
                >
                  <ChevronLeft className="w-4 h-4 text-[#1E2B42]" />
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalStudentsPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalStudentsPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && p - prev > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <span className="px-1 text-slate-400 font-mono">...</span>}
                          <button
                            type="button"
                            onClick={() => setStudentsPage(p)}
                            className={`w-7 h-7 font-bold text-xs transition cursor-pointer rounded-none border ${
                              currentPage === p
                                ? "bg-[#1E2B42] border-[#1E2B42] text-white"
                                : "bg-white border-neutral-300 text-slate-700 hover:bg-slate-100"
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

export default StudentsTab;
