"use client";

import React, { useState, useMemo } from "react";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Filter,
  UserCheck,
  UserX,
  Calendar,
} from "lucide-react";

export interface Student {
  id?: number;
  student_id?: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  class_id?: number;
  class_name?: string;
  phone?: string;
  birthdate?: string;
  enrollment_date?: string;
  created_at?: string;
  address?: string;
  ina?: string;
  is_deleted?: boolean;
  deleted_at?: string;
}

interface StudentsTabProps {
  selectedClassId: string | number | null;
  classes?: any[];
  statusFilter?: "active" | "archived" | "all";
  onChangeStatusFilter?: (val: "active" | "archived" | "all") => void;
  selectedClassFilter?: string;
  onChangeClassFilter?: (val: string) => void;
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

type StudentSortField =
  | "default"
  | "name"
  | "class_name"
  | "ina"
  | "birthdate"
  | "enrollment_date"
  | "deleted_at";

type StudentSortDirection = "asc" | "desc";

const parseDateTimestamp = (d?: string): number => {
  if (!d) return 0;
  const clean = d.split("T")[0];
  const time = new Date(clean).getTime();
  return isNaN(time) ? 0 : time;
};

export const StudentsTab: React.FC<StudentsTabProps> = ({
  selectedClassId,
  classes = [],
  statusFilter = "active",
  onChangeStatusFilter,
  selectedClassFilter = "all",
  onChangeClassFilter,
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
  const [sortField, setSortField] = useState<StudentSortField>("default");
  const [sortDirection, setSortDirection] = useState<StudentSortDirection>("asc");
  const [leavingDateFrom, setLeavingDateFrom] = useState("");
  const [leavingDateTo, setLeavingDateTo] = useState("");

  const showLeavingDateColumn = statusFilter === "archived" || statusFilter === "all";

  // Filter students based on search and optional leaving date range
  const filteredStudents = useMemo(() => {
    let list = studentsTabList;

    // Filter by leaving date range if specified
    if (leavingDateFrom || leavingDateTo) {
      const fromTs = leavingDateFrom ? new Date(leavingDateFrom).getTime() : 0;
      const toTs = leavingDateTo ? new Date(leavingDateTo).getTime() + 86400000 - 1 : Infinity;

      list = list.filter((st) => {
        if (!st.deleted_at) return false;
        const delTs = parseDateTimestamp(st.deleted_at);
        return delTs >= fromTs && delTs <= toTs;
      });
    }

    const q = studentsSearch.toLowerCase().trim();
    if (!q) return list;

    return list.filter((st) => {
      const name = `${st.first_name || ""} ${st.last_name || ""} ${st.middle_name || ""}`.toLowerCase();
      const phone = (st.phone || "").toLowerCase();
      const cls = (st.class_name || "").toLowerCase();
      const ina = (st.ina || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || cls.includes(q) || ina.includes(q);
    });
  }, [studentsTabList, studentsSearch, leavingDateFrom, leavingDateTo]);

  // Sort students across all requested fields
  const sortedStudents = useMemo(() => {
    if (sortField === "default") return filteredStudents;

    return [...filteredStudents].sort((a, b) => {
      if (sortField === "name") {
        const nameA = `${a.first_name || ""} ${a.last_name || ""} ${a.middle_name || ""}`.trim();
        const nameB = `${b.first_name || ""} ${b.last_name || ""} ${b.middle_name || ""}`.trim();
        const cmp = nameA.localeCompare(nameB, "uz", { numeric: true, sensitivity: "base" });
        return sortDirection === "asc" ? cmp : -cmp;
      }

      if (sortField === "class_name") {
        const clsA = (a.class_name || "").trim();
        const clsB = (b.class_name || "").trim();
        const cmp = clsA.localeCompare(clsB, "uz", { numeric: true, sensitivity: "base" });
        return sortDirection === "asc" ? cmp : -cmp;
      }

      if (sortField === "ina") {
        const inaA = (a.ina || "").trim();
        const inaB = (b.ina || "").trim();
        const cmp = inaA.localeCompare(inaB, "uz", { numeric: true, sensitivity: "base" });
        return sortDirection === "asc" ? cmp : -cmp;
      }

      if (sortField === "birthdate") {
        const timeA = parseDateTimestamp(a.birthdate);
        const timeB = parseDateTimestamp(b.birthdate);
        if (!timeA && timeB) return 1;
        if (timeA && !timeB) return -1;
        if (!timeA && !timeB) return 0;
        return sortDirection === "desc" ? timeB - timeA : timeA - timeB;
      }

      if (sortField === "enrollment_date") {
        const timeA = parseDateTimestamp(a.enrollment_date || a.created_at);
        const timeB = parseDateTimestamp(b.enrollment_date || b.created_at);
        if (!timeA && timeB) return 1;
        if (timeA && !timeB) return -1;
        if (!timeA && !timeB) return 0;
        return sortDirection === "desc" ? timeB - timeA : timeA - timeB;
      }

      if (sortField === "deleted_at") {
        const timeA = parseDateTimestamp(a.deleted_at);
        const timeB = parseDateTimestamp(b.deleted_at);
        if (!timeA && timeB) return 1;
        if (timeA && !timeB) return -1;
        if (!timeA && !timeB) return 0;
        return sortDirection === "desc" ? timeB - timeA : timeA - timeB;
      }

      return 0;
    });
  }, [filteredStudents, sortField, sortDirection]);

  const totalStudentsPages = Math.ceil(sortedStudents.length / studentsPageSize) || 1;
  const currentPage = Math.min(studentsPage, totalStudentsPages);
  const paginatedStudents = sortedStudents.slice(
    (currentPage - 1) * studentsPageSize,
    currentPage * studentsPageSize
  );

  const handleSort = (field: StudentSortField) => {
    if (field === "default") {
      setSortField("default");
      setSortDirection("asc");
      setStudentsPage(1);
      return;
    }

    if (sortField === field) {
      const defaultDir: StudentSortDirection =
        field === "name" || field === "class_name" || field === "ina" ? "asc" : "desc";
      if (sortDirection === defaultDir) {
        setSortDirection(defaultDir === "asc" ? "desc" : "asc");
      } else {
        setSortField("default");
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      const defaultDir: StudentSortDirection =
        field === "name" || field === "class_name" || field === "ina" ? "asc" : "desc";
      setSortDirection(defaultDir);
    }
    setStudentsPage(1);
  };

  const getSortBadge = (field: StudentSortField, labelAsc = "A-Z", labelDesc = "Z-A") => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:scale-110 transition-all ml-1 shrink-0" />;
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1E2B42]/10 text-[#1E2B42] ml-1 shrink-0">
        {sortDirection === "asc" ? (
          <>
            <ArrowUp className="w-3 h-3 text-[#1E2B42]" /> {labelAsc}
          </>
        ) : (
          <>
            <ArrowDown className="w-3 h-3 text-[#1E2B42]" /> {labelDesc}
          </>
        )}
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn font-sans">
      {/* HEADER BREADCRUMB / ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#1E2B42]">
            {selectedClassFilter && selectedClassFilter !== "all"
              ? classes.find((c) => String(c.id) === String(selectedClassFilter))?.name + " O'quvchilari"
              : selectedClassId
              ? "Sinf O'quvchilari"
              : "Barcha O'quvchilar"}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {statusFilter === "archived"
              ? "Maktabdan chiqib ketgan (arxivlangan) o'quvchilar ro'yxati"
              : statusFilter === "all"
              ? "Maktabdagi barcha faol va arxivlangan o'quvchilar ro'yxati"
              : "O'quvchilarni qo'shishingiz, saralashingiz va boshqarishingiz mumkin"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            title="O'quvchilarni sinfdan sinfga ko'chirish"
            onClick={onOpenTransferModal}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-neutral-200 text-[#1E2B42] font-bold text-xs rounded-none transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Ko'chirish</span>
          </button>

          <button
            type="button"
            title="Excel orqali yuklash"
            onClick={onOpenImportStudentsModal}
            className="p-2 bg-slate-100 hover:bg-slate-200 border border-neutral-200 text-[#1E2B42] rounded-none transition cursor-pointer flex items-center justify-center"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          <button
            type="button"
            title="O'quvchi qo'shish"
            onClick={onOpenCreateStudentModal}
            className="px-3 py-2 bg-[#A51C30] hover:bg-[#8a1526] text-white rounded-none transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span className="text-xs font-bold">Qo'shish</span>
          </button>
        </div>
      </div>

      {/* FILTER & CONTROL BAR */}
      <div className="bg-white border border-neutral-200 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Search */}
          <div className="flex items-center gap-2 bg-slate-50 border border-neutral-300 px-3 py-1.5 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={studentsSearch}
              onChange={(e) => {
                setStudentsSearch(e.target.value);
                setStudentsPage(1);
              }}
              placeholder="O'quvchi qidirish..."
              className="bg-transparent border-none text-xs font-semibold text-slate-700 outline-none w-full p-0"
            />
          </div>

          {/* Class Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-neutral-300 px-2 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedClassFilter}
              onChange={(e) => {
                if (onChangeClassFilter) onChangeClassFilter(e.target.value);
                setStudentsPage(1);
              }}
              className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none cursor-pointer pr-4 p-0"
            >
              <option value="all">Barcha sinflar</option>
              {classes.map((cls) => (
                <option key={cls.id} value={String(cls.id)}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (Pills) */}
          <div className="inline-flex border border-neutral-300 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => {
                if (onChangeStatusFilter) onChangeStatusFilter("active");
                setStudentsPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition cursor-pointer ${
                statusFilter === "active"
                  ? "bg-white text-emerald-700 shadow-2xs border border-neutral-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Faol
            </button>
            <button
              type="button"
              onClick={() => {
                if (onChangeStatusFilter) onChangeStatusFilter("archived");
                setStudentsPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition cursor-pointer ${
                statusFilter === "archived"
                  ? "bg-white text-red-700 shadow-2xs border border-neutral-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserX className="w-3.5 h-3.5 text-red-600" />
              Chiqib ketganlar
            </button>
            <button
              type="button"
              onClick={() => {
                if (onChangeStatusFilter) onChangeStatusFilter("all");
                setStudentsPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white text-[#1E2B42] shadow-2xs border border-neutral-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#1E2B42]" />
              Barchasi
            </button>
          </div>
        </div>

        {/* Date range filter for leaving date (when showing archived / all) */}
        {showLeavingDateColumn && (
          <div className="flex items-center gap-2 text-xs text-slate-600 shrink-0">
            <div className="flex items-center gap-1 font-semibold text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Chiqish sanasi:
            </div>
            <input
              type="date"
              value={leavingDateFrom}
              onChange={(e) => {
                setLeavingDateFrom(e.target.value);
                setStudentsPage(1);
              }}
              title="Dan"
              className="px-2 py-1 bg-slate-50 border border-neutral-300 text-xs font-semibold text-slate-700"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={leavingDateTo}
              onChange={(e) => {
                setLeavingDateTo(e.target.value);
                setStudentsPage(1);
              }}
              title="Gacha"
              className="px-2 py-1 bg-slate-50 border border-neutral-300 text-xs font-semibold text-slate-700"
            />
            {(leavingDateFrom || leavingDateTo) && (
              <button
                type="button"
                onClick={() => {
                  setLeavingDateFrom("");
                  setLeavingDateTo("");
                  setStudentsPage(1);
                }}
                className="text-[11px] text-red-600 font-bold hover:underline cursor-pointer"
              >
                Tozalash
              </button>
            )}
          </div>
        )}
      </div>

      {studentsTabLoading ? (
        <div className="py-16 flex flex-col items-center justify-center bg-slate-50 border border-neutral-200">
          <div className="w-6 h-6 border-2 border-[#1E2B42] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Yuklanmoqda...</p>
        </div>
      ) : sortedStudents.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-neutral-300 text-center px-4">
          <p className="text-sm font-bold text-slate-700 font-serif mb-1">
            {studentsSearch
              ? "Qidiruv bo'yicha hech kim topilmadi"
              : statusFilter === "archived"
              ? "Ushbu parametrlar bo'yicha chiqib ketgan o'quvchilar yo'q"
              : selectedClassFilter !== "all"
              ? "Tanlangan sinfda o'quvchilar yo'q"
              : "O'quvchilar ro'yxati bo'sh"}
          </p>
          <p className="text-xs text-slate-500 max-w-md">
            Filtr parametrlarini o'zgartirib ko'ring yoki yangi o'quvchi qo'shing.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 overflow-hidden shadow-2xs">
          {/* Table Sort Status Indicator Bar */}
          <div className="px-4 py-2 bg-slate-50 border-b border-neutral-200 flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1E2B42]">Tartib:</span>
              {sortField === "default" ? (
                <span className="text-slate-500">Asl tartib (T/R)</span>
              ) : (
                <span className="text-slate-800">
                  <span className="text-[#1E2B42] font-semibold">
                    {sortField === "name" && "Ism-familiya"}
                    {sortField === "class_name" && "Sinf"}
                    {sortField === "ina" && "INA"}
                    {sortField === "birthdate" && "Tug'ilgan sana"}
                    {sortField === "enrollment_date" && "Kirish sanasi"}
                    {sortField === "deleted_at" && "Chiqish sanasi"}
                  </span>{" "}
                  ({sortDirection === "asc" ? "o'sish bo'yicha" : "kamayish bo'yicha"})
                </span>
              )}
            </div>

            {sortField !== "default" && (
              <button
                type="button"
                onClick={() => handleSort("default")}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E2B42] hover:text-[#2d4063] hover:underline cursor-pointer transition-colors"
                title="Boshlang'ich tartibga qaytarish"
              >
                <RotateCcw className="w-3 h-3 text-[#1E2B42]" />
                Asl holatga qaytarish
              </button>
            )}
          </div>

          {/* MOBILE CARD VIEW FOR STUDENTS */}
          <div className="block sm:hidden divide-y divide-neutral-200">
            {paginatedStudents.map((st, idx) => {
              const globalIndex = (currentPage - 1) * studentsPageSize + idx + 1;
              const stId = Number(st.student_id || st.id);
              const isArchived = Boolean(st.is_deleted);

              return (
                <div key={stId || idx} className={`p-4 flex flex-col gap-3 ${isArchived ? "bg-red-50/30" : "bg-white"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <span className="font-mono text-slate-400 text-xs">{globalIndex}.</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-base text-[#1E2B42] leading-tight">
                            {st.first_name} {st.last_name}
                          </p>
                          {isArchived && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 border border-red-200">
                              Chiqib ketgan
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
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
                    {st.deleted_at && (
                      <p><span className="font-bold text-red-500 mr-1">Chiqish:</span> {st.deleted_at.split("T")[0]}</p>
                    )}
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
                    {!isArchived && (
                      <button
                        type="button"
                        title="O'chirish"
                        onClick={() => onDeleteStudent(stId)}
                        className="p-2 border border-neutral-200 text-[#A51C30] hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0 text-xs font-sans">
              <thead className="text-[10px] font-bold uppercase tracking-wider font-mono">
                <tr>
                  {/* T/R Header */}
                  <th
                    onClick={() => handleSort("default")}
                    className="px-4 py-3.5 text-center w-12 sticky top-0 left-0 z-30 bg-slate-50 border-b border-r border-neutral-200 shadow-[1px_0_0_0_#e5e5e5] cursor-pointer select-none hover:bg-slate-100 transition-colors text-slate-500"
                    title="Asl tartib (T/R)"
                  >
                    T/R
                  </th>

                  {/* ISM FAMILIYA Header */}
                  <th
                    onClick={() => handleSort("name")}
                    className={`px-6 py-3.5 sticky top-0 left-12 z-30 border-b border-r border-neutral-200 shadow-[1px_0_0_0_#e5e5e5] min-w-[190px] cursor-pointer select-none transition-colors group hover:bg-slate-100 ${
                      sortField === "name" ? "bg-slate-100 text-[#1E2B42] font-black" : "bg-slate-50 text-slate-600"
                    }`}
                    title="Ism-familiya bo'yicha saralash"
                  >
                    <div className="flex items-center gap-1">
                      <span>Ism Familiya</span>
                      {getSortBadge("name", "A-Z", "Z-A")}
                    </div>
                  </th>

                  {/* SINF Header */}
                  <th
                    onClick={() => handleSort("class_name")}
                    className={`px-6 py-3.5 sticky top-0 z-20 border-b border-neutral-200 min-w-[110px] cursor-pointer select-none transition-colors group hover:bg-slate-100 ${
                      sortField === "class_name" ? "bg-slate-100 text-[#1E2B42] font-black" : "bg-slate-50 text-slate-600"
                    }`}
                    title="Sinf bo'yicha saralash"
                  >
                    <div className="flex items-center gap-1">
                      <span>Sinf</span>
                      {getSortBadge("class_name", "A-Z", "Z-A")}
                    </div>
                  </th>

                  {/* INA Header */}
                  <th
                    onClick={() => handleSort("ina")}
                    className={`px-6 py-3.5 sticky top-0 z-20 border-b border-neutral-200 min-w-[110px] cursor-pointer select-none transition-colors group hover:bg-slate-100 ${
                      sortField === "ina" ? "bg-slate-100 text-[#1E2B42] font-black" : "bg-slate-50 text-slate-600"
                    }`}
                    title="INA bo'yicha saralash"
                  >
                    <div className="flex items-center gap-1">
                      <span>INA</span>
                      {getSortBadge("ina", "A-Z", "Z-A")}
                    </div>
                  </th>

                  {/* TUG'ILGAN SANA Header */}
                  <th
                    onClick={() => handleSort("birthdate")}
                    className={`px-6 py-3.5 sticky top-0 z-20 border-b border-neutral-200 min-w-[130px] cursor-pointer select-none transition-colors group hover:bg-slate-100 ${
                      sortField === "birthdate" ? "bg-slate-100 text-[#1E2B42] font-black" : "bg-slate-50 text-slate-600"
                    }`}
                    title="Tug'ilgan sana bo'yicha saralash"
                  >
                    <div className="flex items-center gap-1">
                      <span>Tug'ilgan sana</span>
                      {getSortBadge("birthdate", "Avvalgi", "So'nggi")}
                    </div>
                  </th>

                  {/* MAKTABGA KIRISH SANASI Header */}
                  <th
                    onClick={() => handleSort("enrollment_date")}
                    className={`px-6 py-3.5 sticky top-0 z-20 border-b border-neutral-200 min-w-[140px] cursor-pointer select-none transition-colors group hover:bg-slate-100 ${
                      sortField === "enrollment_date" ? "bg-slate-100 text-[#1E2B42] font-black" : "bg-slate-50 text-slate-600"
                    }`}
                    title="Maktabga kirish sanasi bo'yicha saralash"
                  >
                    <div className="flex items-center gap-1">
                      <span>Kirish sanasi</span>
                      {getSortBadge("enrollment_date", "Avvalgi", "So'nggi")}
                    </div>
                  </th>

                  {/* MAKTABDAN CHIQISH SANASI Header (When visible) */}
                  {showLeavingDateColumn && (
                    <th
                      onClick={() => handleSort("deleted_at")}
                      className={`px-6 py-3.5 sticky top-0 z-20 border-b border-neutral-200 min-w-[140px] cursor-pointer select-none transition-colors group hover:bg-slate-100 ${
                        sortField === "deleted_at" ? "bg-slate-100 text-[#1E2B42] font-black" : "bg-slate-50 text-slate-600"
                      }`}
                      title="Maktabdan chiqish sanasi bo'yicha saralash"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-red-700">Chiqish sanasi</span>
                        {getSortBadge("deleted_at", "Avvalgi", "So'nggi")}
                      </div>
                    </th>
                  )}

                  {/* STATUS Header (When 'all' is selected) */}
                  {statusFilter === "all" && (
                    <th className="px-6 py-3.5 sticky top-0 z-20 bg-slate-50 border-b border-neutral-200 min-w-[100px] text-slate-500">
                      Holat
                    </th>
                  )}

                  {/* AMALLAR Header */}
                  <th className="px-6 py-3.5 text-right sticky top-0 z-20 bg-slate-50 border-b border-neutral-200 text-slate-500">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-700 bg-white">
                {paginatedStudents.map((st, idx) => {
                  const globalIndex = (currentPage - 1) * studentsPageSize + idx + 1;
                  const stId = Number(st.student_id || st.id);
                  const isLastRow = idx === paginatedStudents.length - 1;
                  const borderBottomClass = isLastRow ? "" : "border-b border-neutral-200";
                  const isArchived = Boolean(st.is_deleted);

                  return (
                    <tr
                      key={stId || idx}
                      className={`group transition ${
                        isArchived ? "bg-red-50/30 hover:bg-red-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className={`px-4 py-3.5 text-center font-mono text-slate-500 sticky left-0 z-10 bg-inherit border-r border-neutral-200 shadow-[1px_0_0_0_#e5e5e5] ${borderBottomClass}`}>
                        {globalIndex}
                      </td>
                      <td className={`px-6 py-3.5 font-bold text-[#1E2B42] sticky left-12 z-10 bg-inherit border-r border-neutral-200 shadow-[1px_0_0_0_#e5e5e5] min-w-[190px] whitespace-nowrap ${borderBottomClass}`}>
                        <div className="flex items-center gap-2">
                          <span>
                            {st.first_name} {st.last_name}{" "}
                            {st.middle_name && <span className="text-slate-400 font-normal">({st.middle_name})</span>}
                          </span>
                          {isArchived && statusFilter !== "all" && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-red-100 text-red-700 border border-red-200">
                              Chiqib ketgan
                            </span>
                          )}
                        </div>
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
                      {showLeavingDateColumn && (
                        <td className={`px-6 py-3.5 font-mono text-red-600 font-bold whitespace-nowrap ${borderBottomClass}`}>
                          {st.deleted_at ? st.deleted_at.split("T")[0] : "—"}
                        </td>
                      )}
                      {statusFilter === "all" && (
                        <td className={`px-6 py-3.5 font-mono whitespace-nowrap ${borderBottomClass}`}>
                          {isArchived ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 inline-block">
                              Chiqib ketgan
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 inline-block">
                              Faol
                            </span>
                          )}
                        </td>
                      )}
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
                          {!isArchived && (
                            <button
                              type="button"
                              title="O'chirish"
                              onClick={() => onDeleteStudent(stId)}
                              className="p-1.5 text-[#A51C30] hover:bg-red-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
              Jami <b>{sortedStudents.length}</b> ta o'quvchidan{" "}
              <b>{sortedStudents.length > 0 ? (currentPage - 1) * studentsPageSize + 1 : 0}</b>-
              <b>{Math.min(currentPage * studentsPageSize, sortedStudents.length)}</b> ko'rsatilmoqda
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
