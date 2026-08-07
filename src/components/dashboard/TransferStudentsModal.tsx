"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ArrowRightLeft,
  Search,
  CheckSquare,
  Square,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Lock,
} from "lucide-react";
import api from "@/lib/api";

interface StudentItem {
  id: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  class_id?: number;
  class_name?: string;
  phone?: string;
}

interface ClassItem {
  id: number;
  name: string;
  grade_level?: number;
}

interface TransferStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceClassId?: number;
  sourceClassName?: string;
  lockSourceClass?: boolean;
  allClasses?: ClassItem[];
  allStudents?: StudentItem[];
  onSuccess: () => void;
}

export default function TransferStudentsModal({
  isOpen,
  onClose,
  sourceClassId,
  sourceClassName,
  lockSourceClass = false,
  allClasses: propClasses = [],
  allStudents = [],
  onSuccess,
}: TransferStudentsModalProps) {
  // Mode: "push" = From My Class to Target Class (Default)
  //       "pull" = From External Class into My Class
  const [transferMode, setTransferMode] = useState<"push" | "pull">("push");

  // Classes list (prop or dynamically fetched)
  const [classList, setClassList] = useState<ClassItem[]>(propClasses);

  // Selected Source Class ID
  const [selectedSourceClassId, setSelectedSourceClassId] = useState<number | "all">(
    sourceClassId ? Number(sourceClassId) : "all"
  );
  // Selected Target Class ID
  const [targetClassId, setTargetClassId] = useState<number | "">("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // Dynamic student list & loading state
  const [studentsList, setStudentsList] = useState<StudentItem[]>(allStudents);
  const [fetchingStudents, setFetchingStudents] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch all classes directly whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (propClasses && propClasses.length > 0) {
      setClassList(propClasses);
    }

    const fetchAllClasses = async () => {
      try {
        const data = await api.get("/api/schools/classes?all=true");
        if (Array.isArray(data) && data.length > 0) {
          setClassList(data);
        }
      } catch (err) {
        console.error("Failed to fetch classes in transfer modal:", err);
      }
    };

    fetchAllClasses();
  }, [isOpen]);

  // Sync mode and class IDs when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setTransferMode("push");
    setSelectedUserIds([]);
    setSearchQuery("");
    setError("");
    setSuccessMsg("");

    if (sourceClassId) {
      setSelectedSourceClassId(Number(sourceClassId));
      setTargetClassId("");
    } else {
      setSelectedSourceClassId("all");
      setTargetClassId("");
    }
  }, [isOpen, sourceClassId]);

  // Handle Mode Switch ("push" vs "pull")
  const handleModeSwitch = (newMode: "push" | "pull") => {
    setTransferMode(newMode);
    setSelectedUserIds([]);
    setError("");
    setSuccessMsg("");

    if (!sourceClassId) return;

    const numSourceId = Number(sourceClassId);

    if (newMode === "push") {
      // From My Class (sourceClassId) to another class
      setSelectedSourceClassId(numSourceId);
      setTargetClassId("");
    } else {
      // From another class to My Class (sourceClassId)
      setTargetClassId(numSourceId);
      // Select first available external class as source
      const otherClass = classList.find((c) => Number(c.id) !== numSourceId);
      if (otherClass) {
        setSelectedSourceClassId(Number(otherClass.id));
      } else {
        setSelectedSourceClassId("all");
      }
    }
  };

  // Dynamically fetch students when selectedSourceClassId changes
  useEffect(() => {
    if (!isOpen) return;

    // Fetch from API dynamically for selected source class
    const fetchStudentsForClass = async () => {
      setFetchingStudents(true);
      try {
        const query =
          selectedSourceClassId === "all"
            ? "/api/schools/users?role=STUDENT"
            : `/api/schools/users?role=STUDENT&class_id=${selectedSourceClassId}`;
        const data = await api.get(query);
        setStudentsList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch class students:", err);
        setStudentsList([]);
      } finally {
        setFetchingStudents(false);
      }
    };

    fetchStudentsForClass();
  }, [selectedSourceClassId, isOpen]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    return studentsList.filter((student) => {
      const matchesClass =
        selectedSourceClassId === "all" ||
        Number(student.class_id) === Number(selectedSourceClassId) ||
        !student.class_id;
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase().trim());
      return matchesClass && matchesSearch;
    });
  }, [studentsList, selectedSourceClassId, searchQuery]);

  // Source Class Object
  const sourceClassObj = useMemo(() => {
    return classList.find((c) => Number(c.id) === Number(selectedSourceClassId));
  }, [classList, selectedSourceClassId]);

  // Target Class Object
  const targetClassObj = useMemo(() => {
    return classList.find((c) => Number(c.id) === Number(targetClassId));
  }, [classList, targetClassId]);

  // Available classes for dropdowns (exclude locked side)
  const availableSourceClasses = useMemo(() => {
    if (transferMode === "pull" && sourceClassId) {
      return classList.filter((c) => Number(c.id) !== Number(sourceClassId));
    }
    return classList;
  }, [classList, transferMode, sourceClassId]);

  const availableTargetClasses = useMemo(() => {
    if (transferMode === "push" && sourceClassId) {
      return classList.filter((c) => Number(c.id) !== Number(sourceClassId));
    }
    return classList.filter((c) => Number(c.id) !== Number(selectedSourceClassId));
  }, [classList, transferMode, sourceClassId, selectedSourceClassId]);

  const isAllSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((st) => selectedUserIds.includes(st.user_id || st.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const currentIds = filteredStudents.map((st) => st.user_id || st.id);
      setSelectedUserIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      const currentIds = filteredStudents.map((st) => st.user_id || st.id);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const toggleSelectStudent = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!targetClassId) {
      setError("Iltimos, o'quvchilar ko'chirilishi kerak bo'lgan manzil sinfni tanlang.");
      return;
    }

    if (selectedUserIds.length === 0) {
      setError("Iltimos, ko'chirish uchun kamida bitta o'quvchini belgilang.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post(
        `/api/schools/classes/${targetClassId}/transfer-students`,
        {
          user_ids: selectedUserIds,
        }
      );

      const count = res.transferred_count || selectedUserIds.length;
      const targetName = targetClassObj?.name || "yangi sinf";
      setSuccessMsg(`Muvaffaqiyatli ${count} ta o'quvchi ${targetName} sinfiga ko'chirildi!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || "O'quvchilarni ko'chirishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentClassName = sourceClassName || sourceClassObj?.name || "Hozirgi sinf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">O'quvchilarni Sinfdan Sinfga Ko'chirish</h2>
              <p className="text-xs text-slate-400">
                {transferMode === "push"
                  ? `${currentClassName} sinfidan o'quvchilarni belgilab, boshqa sinfga o'tkazing`
                  : `Boshqa sinfdan ${currentClassName} sinfiga o'quvchilarni o'tkazib oling`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switch Tabs (If sourceClassId exists) */}
        {sourceClassId && (
          <div className="px-6 pt-4 pb-0 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleModeSwitch("push")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition cursor-pointer border-b-2 ${
                transferMode === "push"
                  ? "bg-white text-indigo-700 border-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 border-transparent"
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Sinfimdan boshqa sinfga o'tkazish ({currentClassName} ➔ Yangi sinf)</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSwitch("pull")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition cursor-pointer border-b-2 ${
                transferMode === "pull"
                  ? "bg-white text-indigo-700 border-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 border-transparent"
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Boshqa sinfdan sinfimga qabul qilish (Yangi sinf ➔ {currentClassName})</span>
            </button>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleTransferSubmit} className="flex flex-col flex-1 overflow-hidden p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-2xl">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Selection Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
            {/* Source Class Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>1. Manba Sinf (O'quvchi olinadigan) *</span>
                {transferMode === "push" && sourceClassId && (
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Sizning sinfingiz
                  </span>
                )}
              </label>
              <select
                value={selectedSourceClassId}
                disabled={transferMode === "push" && Boolean(sourceClassId)}
                onChange={(e) => {
                  const val = e.target.value === "all" ? "all" : Number(e.target.value);
                  setSelectedSourceClassId(val);
                  setSelectedUserIds([]);
                }}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none transition ${
                  transferMode === "push" && Boolean(sourceClassId)
                    ? "bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed"
                    : "bg-slate-50 text-slate-800 border-slate-200 focus:bg-white focus:border-indigo-500"
                }`}
              >
                {!sourceClassId && <option value="all">Barcha sinflar o'quvchilari</option>}
                {availableSourceClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Class Selection */}
            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>2. Manzil Sinf (O'tkaziladigan) *</span>
                {transferMode === "pull" && sourceClassId && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Sizning sinfingiz
                  </span>
                )}
              </label>
              <select
                value={targetClassId}
                disabled={transferMode === "pull" && Boolean(sourceClassId)}
                onChange={(e) => setTargetClassId(Number(e.target.value))}
                required
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-extrabold outline-none transition ${
                  transferMode === "pull" && Boolean(sourceClassId)
                    ? "bg-indigo-100/80 text-indigo-950 border-indigo-300 cursor-not-allowed"
                    : "bg-indigo-50/70 border-indigo-200 text-indigo-950 focus:bg-white focus:border-indigo-600"
                }`}
              >
                {transferMode !== "pull" && <option value="">-- Yangi sinfni tanlang --</option>}
                {availableTargetClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Search & Select All Toolbar */}
          <div className="flex items-center justify-between gap-3 shrink-0 pt-2 border-t border-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`${sourceClassObj?.name || 'Manba sinf'} o'quvchilari orasidan qidirish...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition font-medium"
              />
            </div>

            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={fetchingStudents || filteredStudents.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <span>Barchasini bekor qilish</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-400" />
                  <span>Barchasini tanlash</span>
                </>
              )}
            </button>
          </div>

          {/* Student List Checkboxes */}
          <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[300px] border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-slate-50/50 p-2">
            {fetchingStudents ? (
              <div className="flex flex-col items-center justify-center py-12 text-indigo-600 gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-xs font-semibold">
                  {sourceClassObj?.name || "Manba sinf"} o'quvchilari yuklanmoqda...
                </p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Users className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-medium">Ushbu sinfda mos keluvchi o'quvchi topilmadi</p>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const uid = student.user_id || student.id;
                const isSelected = selectedUserIds.includes(uid);
                return (
                  <div
                    key={uid}
                    onClick={() => toggleSelectStudent(uid)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                      isSelected
                        ? "bg-indigo-50/80 border border-indigo-200 text-indigo-950 font-semibold"
                        : "hover:bg-white text-slate-700 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-indigo-600">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold">
                          {student.first_name} {student.last_name}
                        </p>
                        {student.class_name && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <GraduationCap className="w-3 h-3" />
                            Hozirgi sinfi: <span className="font-semibold text-slate-600">{student.class_name}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Tanlangan
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-600 font-medium">
              Tanlangan:{" "}
              <span className="font-bold text-indigo-600">
                {selectedUserIds.length} ta o'quvchi
              </span>
              {targetClassObj && (
                <span className="ml-1 text-slate-500 font-semibold">
                  ({sourceClassObj?.name || "Manba sinf"}) ➔ <span className="font-extrabold text-indigo-800">{targetClassObj.name}</span> sinfiga
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={loading || selectedUserIds.length === 0 || !targetClassId}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ko'chirilmoqda...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4" />
                    Ko'chirishni Saqlash
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
