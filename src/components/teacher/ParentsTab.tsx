"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  FileSpreadsheet,
  UserPlus,
  UserMinus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Pencil,
} from "lucide-react";
import EditParentModal from "@/components/dashboard/EditParentModal";

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
  class_id?: number;
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
  mainClasses?: { id: number; name: string }[];
  selectedFilterClassId?: string | number;
  onSelectFilterClass?: (val: string | number) => void;
  onRefreshParents?: () => void;
}

type SortField = "default" | "name" | "student";
type SortDirection = "asc" | "desc";

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
  mainClasses,
  selectedFilterClassId,
  onSelectFilterClass,
  onRefreshParents,
}) => {
  const [sortField, setSortField] = useState<SortField>("default");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [editingParent, setEditingParent] = useState<{
    id: number;
    first_name: string;
    last_name: string;
    middle_name?: string;
    phone?: string;
    passport?: string;
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const filteredParents = useMemo(() => {
    let list = classParents;
    if (selectedFilterClassId) {
      list = list.filter((pt) => {
        if (pt.class_id && String(pt.class_id) === String(selectedFilterClassId)) {
          return true;
        }
        if (mainClasses && pt.class_name) {
          const matchCls = mainClasses.find((c) => String(c.id) === String(selectedFilterClassId));
          if (matchCls && matchCls.name === pt.class_name) return true;
        }
        return false;
      });
    }
    const q = parentsSearch.toLowerCase().trim();
    if (!q) return list;

    return list.filter((pt) => {
      return (
        (pt.first_name || "").toLowerCase().includes(q) ||
        (pt.last_name || "").toLowerCase().includes(q) ||
        (pt.middle_name || "").toLowerCase().includes(q) ||
        (pt.passport || "").toLowerCase().includes(q) ||
        (pt.phone || "").toLowerCase().includes(q) ||
        (pt.student_name || "").toLowerCase().includes(q)
      );
    });
  }, [classParents, selectedFilterClassId, mainClasses, parentsSearch]);

  const sortedParents = useMemo(() => {
    if (sortField === "default") return filteredParents;

    return [...filteredParents].sort((a, b) => {
      let valA = "";
      let valB = "";

      if (sortField === "name") {
        valA = `${a.first_name || ""} ${a.last_name || ""} ${a.middle_name || ""}`.trim();
        valB = `${b.first_name || ""} ${b.last_name || ""} ${b.middle_name || ""}`.trim();
      } else if (sortField === "student") {
        valA = (a.student_name || "").trim();
        valB = (b.student_name || "").trim();
      }

      const cmp = valA.localeCompare(valB, "uz", { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filteredParents, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedParents.length / parentsPageSize) || 1;
  const currentPage = Math.min(parentsPage, totalPages);
  const paginatedParents = sortedParents.slice(
    (currentPage - 1) * parentsPageSize,
    currentPage * parentsPageSize
  );

  const handleSort = (field: SortField) => {
    if (field === "default") {
      setSortField("default");
      setSortDirection("asc");
      setParentsPage(1);
      return;
    }

    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField("default");
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setParentsPage(1);
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-36">
      <div className="bg-white border border-neutral-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold font-serif text-[#1E2B42]">
            {selectedFilterClassId && mainClasses?.find((c) => String(c.id) === String(selectedFilterClassId))
              ? `${mainClasses.find((c) => String(c.id) === String(selectedFilterClassId))?.name} sinfi vasiylari (Ota-onalar)`
              : "Barcha vasiylar (Ota-onalar)"}
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            {selectedFilterClassId && mainClasses?.find((c) => String(c.id) === String(selectedFilterClassId))
              ? `${mainClasses.find((c) => String(c.id) === String(selectedFilterClassId))?.name} sinfidagi barcha o'quvchilarning ota-onalari ro'yxati`
              : "Siz rahbarlik qilayotgan barcha sinflardagi ota-onalar ro'yxati"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Class Filter Dropdown (Default: Barchasi) */}
          {mainClasses && mainClasses.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-neutral-200 px-2.5 py-2">
              <span className="text-[11px] font-bold font-sans text-slate-500 uppercase tracking-wider hidden md:inline">
                Sinf:
              </span>
              <select
                value={selectedFilterClassId || ""}
                onChange={(e) => {
                  if (onSelectFilterClass) {
                    onSelectFilterClass(e.target.value);
                  }
                  setParentsPage(1);
                }}
                className="bg-transparent border-none text-xs font-bold font-sans text-slate-800 outline-none cursor-pointer pr-1"
                title="Sinf bo'yicha filtrlash"
              >
                <option value="">Barchasi</option>
                {mainClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} sinfi
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Search */}
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
      ) : sortedParents.length === 0 ? (
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
        <div className="bg-white border border-neutral-200 overflow-hidden shadow-xs">
          {/* Always visible table sort status bar */}
          <div className="px-4 py-2 bg-slate-50 border-b border-neutral-200 flex items-center justify-between text-xs text-slate-700 font-sans">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1E2B42]">Tartib:</span>
              {sortField === "default" ? (
                <span className="text-slate-500">Saralanmagan</span>
              ) : (
                <span className="text-slate-800">
                  <span className="text-[#1E2B42] font-semibold">
                    {sortField === "name" && "Ism-familiya bo'yicha"}
                    {sortField === "student" && "O'quvchi (Farzand) bo'yicha"}
                  </span>
                  {" ("}
                  <strong className="text-[#1E2B42]">{sortDirection === "asc" ? "A → Z" : "Z → A"}</strong>
                  {")"}
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
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title="Tahrirlash"
                        onClick={() => {
                          setEditingParent({
                            id: pId!,
                            first_name: pt.first_name,
                            last_name: pt.last_name,
                            middle_name: pt.middle_name,
                            phone: pt.phone,
                            passport: pt.passport,
                          });
                          setShowEditModal(true);
                        }}
                        className="p-2 border border-neutral-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Farzanddan ajratish"
                        onClick={() => onUnlinkParentFromStudent(pt.student_id, pId)}
                        className="p-2 border border-neutral-200 text-[#A51C30] hover:bg-red-50 transition cursor-pointer"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
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
                  {/* T/R Header */}
                  <th
                    onClick={() => handleSort("default")}
                    className="px-4 py-3 text-center w-14 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                    title="Asl tartib (T/R)"
                  >
                    T/R
                  </th>

                  {/* ISM FAMILIYA Header */}
                  <th
                    onClick={() => handleSort("name")}
                    className={`px-6 py-3 cursor-pointer select-none transition-colors group hover:bg-slate-100 ${
                      sortField === "name" ? "text-[#1E2B42] font-black bg-slate-100" : "text-slate-600"
                    }`}
                    title="Ism-familiya bo'yicha saralash (A-Z / Z-A)"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Ism Familiya</span>
                      {sortField === "name" ? (
                        sortDirection === "asc" ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1E2B42]/10 text-[#1E2B42]">
                            <ArrowUp className="w-3 h-3 text-[#1E2B42]" /> A-Z
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1E2B42]/10 text-[#1E2B42]">
                            <ArrowDown className="w-3 h-3 text-[#1E2B42]" /> Z-A
                          </span>
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-[#1E2B42] group-hover:scale-110 transition-all" />
                      )}
                    </div>
                  </th>

                  {/* TELEFON Header (Static) */}
                  <th className="px-6 py-3">Telefon</th>

                  {/* PASPORT Header (Static) */}
                  <th className="px-6 py-3">Pasport</th>

                  {/* O'QUVCHI (FARZAND) Header */}
                  <th
                    onClick={() => handleSort("student")}
                    className={`px-6 py-3 cursor-pointer select-none transition-colors group hover:bg-slate-100 ${
                      sortField === "student" ? "text-[#1E2B42] font-black bg-slate-100" : "text-slate-600"
                    }`}
                    title="O'quvchi (Farzand) ismi bo'yicha saralash (A-Z / Z-A)"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>O'quvchi (Farzand)</span>
                      {sortField === "student" ? (
                        sortDirection === "asc" ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1E2B42]/10 text-[#1E2B42]">
                            <ArrowUp className="w-3 h-3 text-[#1E2B42]" /> A-Z
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1E2B42]/10 text-[#1E2B42]">
                            <ArrowDown className="w-3 h-3 text-[#1E2B42]" /> Z-A
                          </span>
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-[#1E2B42] group-hover:scale-110 transition-all" />
                      )}
                    </div>
                  </th>

                  {/* AMALLAR Header */}
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
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Tahrirlash"
                            onClick={() => {
                              setEditingParent({
                                id: pId!,
                                first_name: pt.first_name,
                                last_name: pt.last_name,
                                middle_name: pt.middle_name,
                                phone: pt.phone,
                                passport: pt.passport,
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Farzanddan ajratish"
                            onClick={() => onUnlinkParentFromStudent(pt.student_id, pId)}
                            className="p-1.5 text-[#A51C30] hover:bg-red-50 transition cursor-pointer"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
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
                Jami <strong className="text-slate-800">{sortedParents.length}</strong> ta ota-onadan{" "}
                <strong className="text-slate-800">
                  {sortedParents.length > 0 ? (currentPage - 1) * parentsPageSize + 1 : 0}
                </strong>-
                <strong className="text-slate-800">{Math.min(currentPage * parentsPageSize, sortedParents.length)}</strong> ko'rsatilmoqda
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

      {/* EDIT PARENT MODAL */}
      <EditParentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingParent(null);
        }}
        parent={editingParent}
        onSuccess={() => {
          if (onRefreshParents) onRefreshParents();
        }}
      />
    </div>
  );
};

export default ParentsTab;
