"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileSpreadsheet,
  Plus,
  Download,
  UploadCloud,
  Search,
  Trash2,
  Edit3,
  BookOpen,
  GraduationCap,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ChevronDown,
  Sparkles,
  Check,
} from "lucide-react";

interface ClassItem {
  id: number;
  name: string;
}

interface SubjectItem {
  id: number;
  name: string;
}

interface LessonPlanItem {
  id: number;
  teacher_id: number;
  teacher_name?: string;
  class_id: number;
  class_name: string;
  subject_id: number;
  subject_name: string;
  day_of_week: number;
  lesson_number: number;
  start_date: string;
  topic_name: string;
  notes: string;
  created_at: string;
}

interface LessonPlansSectionProps {
  token: string;
  API_URL: string;
  classes?: ClassItem[];
  subjects?: SubjectItem[];
  userInfo: any;
}

const WEEKDAYS = [
  { id: 1, name: "Dushanba", short: "Dush" },
  { id: 2, name: "Seshanba", short: "Sesh" },
  { id: 3, name: "Chorshanba", short: "Chor" },
  { id: 4, name: "Payshanba", short: "Pay" },
  { id: 5, name: "Juma", short: "Juma" },
  { id: 6, name: "Shanba", short: "Shan" },
];

export default function LessonPlansSection({
  token,
  API_URL,
  userInfo,
}: LessonPlansSectionProps) {
  const effectiveApiUrl = API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:6560";

  // Teacher's specific assigned classes and subjects
  const [myClasses, setMyClasses] = useState<ClassItem[]>([]);
  const [mySubjects, setMySubjects] = useState<SubjectItem[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);

  // Data states
  const [plans, setPlans] = useState<LessonPlanItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Multi-choice Class Filter States
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [classSearchTerm, setClassSearchTerm] = useState("");
  const classDropdownRef = useRef<HTMLDivElement>(null);

  // Subject & Search Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected item for Edit / Delete
  const [editingPlan, setEditingPlan] = useState<LessonPlanItem | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);

  // Form State for Add / Edit
  const [formClassId, setFormClassId] = useState<number | "">("");
  const [formSubjectId, setFormSubjectId] = useState<number | "">("");
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(1);
  const [formLessonNumber, setFormLessonNumber] = useState<number>(1);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [formTopicName, setFormTopicName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Excel Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported_count: number;
    failed_count: number;
    errors: { row: number; error: string }[];
  } | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Keyboard listener for Escape key & outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowImportModal(false);
        setShowDeleteModal(false);
        setIsClassDropdownOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target as Node)) {
        setIsClassDropdownOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch Teacher's assigned metadata (classes & subjects only)
  const fetchTeacherMeta = async () => {
    if (!token) return;
    setMetaLoading(true);
    try {
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (sId) headers["X-School-ID"] = sId;

      const res = await fetch(`${effectiveApiUrl}/api/schools/lesson-plans/meta`, { headers });
      const data = await res.json();
      if (res.ok) {
        setMyClasses(Array.isArray(data.classes) ? data.classes : []);
        setMySubjects(Array.isArray(data.subjects) ? data.subjects : []);
      }
    } catch (err) {
      console.error("Failed to load teacher metadata:", err);
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherMeta();
  }, [token]);

  // Fetch lesson plans from backend
  const fetchLessonPlans = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (sId) headers["X-School-ID"] = sId;

      const params = new URLSearchParams();
      if (selectedClassIds.length > 0) {
        params.append("class_ids", selectedClassIds.join(","));
      }
      if (selectedSubjectId !== "all") {
        params.append("subject_id", String(selectedSubjectId));
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const res = await fetch(`${effectiveApiUrl}/api/schools/lesson-plans?${params.toString()}`, {
        headers,
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setPlans(data);
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.error("Failed to load lesson plans:", err);
      showToast("Dars rejalarini yuklashda xatolik yuz berdi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessonPlans();
  }, [token, selectedClassIds, selectedSubjectId, searchQuery]);

  // Format Uzbek Date
  const formatUzDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr + "T00:00:00");
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("uz-UZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Get weekday name
  const getWeekdayName = (dayNum: number) => {
    const found = WEEKDAYS.find((w) => w.id === dayNum);
    return found ? found.name : `${dayNum}-kun`;
  };

  // Filtered Class List in Searchable Dropdown
  const filteredDropdownClasses = useMemo(() => {
    if (!classSearchTerm.trim()) return myClasses;
    const term = classSearchTerm.toLowerCase();
    return myClasses.filter((c) => c.name.toLowerCase().includes(term));
  }, [myClasses, classSearchTerm]);

  // Toggle class selection in multiple choice dropdown
  const handleToggleClass = (classId: number) => {
    setSelectedClassIds((prev) => {
      if (prev.includes(classId)) {
        return prev.filter((id) => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
  };

  // Select all / Deselect all classes
  const handleSelectAllClasses = () => {
    if (selectedClassIds.length === myClasses.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(myClasses.map((c) => c.id));
    }
  };

  // Multiple Choice Dropdown Button Label Text
  const classDropdownLabel = useMemo(() => {
    if (selectedClassIds.length === 0) {
      return "Barcha Sinflar";
    }
    if (selectedClassIds.length === 1) {
      const found = myClasses.find((c) => c.id === selectedClassIds[0]);
      return found ? found.name : "1 ta sinf";
    }
    if (selectedClassIds.length === myClasses.length) {
      return "Barcha Sinflar (Hammasi)";
    }
    return `${selectedClassIds.length} ta sinf tanlandi`;
  }, [selectedClassIds, myClasses]);

  // Handle Download Excel Template
  const handleDownloadTemplate = async () => {
    try {
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (sId) headers["X-School-ID"] = sId;

      const res = await fetch(`${effectiveApiUrl}/api/schools/import/template/lesson-plans`, { headers });
      if (!res.ok) throw new Error("Shablonni yuklab bo'lmadi");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ish_rejasi_shablon.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Excel shablon muvaffaqiyatli yuklandi!", "success");
    } catch (err: any) {
      showToast(err.message || "Shablon yuklashda xatolik", "error");
    }
  };

  // Handle Excel Import
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setImportError("Iltimos, Excel (.xlsx) faylini tanlang");
      return;
    }

    setImportLoading(true);
    setImportError("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (sId) headers["X-School-ID"] = sId;

      const res = await fetch(`${effectiveApiUrl}/api/schools/import/lesson-plans`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors && data.errors.length > 0) {
          setImportResult(data);
        } else {
          throw new Error(data.error || "Ish rejasini import qilishda xatolik yuz berdi");
        }
        return;
      }

      setImportResult(data);
      showToast(`${data.imported_count} ta dars mavzusi muvaffaqiyatli qo'shildi!`, "success");
      fetchLessonPlans();
      if (!data.errors || data.errors.length === 0) {
        setTimeout(() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportResult(null);
        }, 1800);
      }
    } catch (err: any) {
      setImportError(err.message || "Import qilishda xatolik");
    } finally {
      setImportLoading(false);
    }
  };

  // Handle Save Single (Add / Edit)
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClassId || !formSubjectId || !formTopicName.trim() || !formStartDate) {
      setFormError("Sinf, fan, sana va mavzu nomini to'ldirish shart");
      return;
    }

    setFormSubmitting(true);
    setFormError("");

    const payload = {
      class_id: Number(formClassId),
      subject_id: Number(formSubjectId),
      day_of_week: Number(formDayOfWeek),
      lesson_number: Number(formLessonNumber),
      start_date: formStartDate,
      topic_name: formTopicName.trim(),
      notes: formNotes.trim(),
    };

    try {
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      if (sId) headers["X-School-ID"] = sId;

      const isEdit = Boolean(editingPlan);
      const url = isEdit
        ? `${effectiveApiUrl}/api/schools/lesson-plans/${editingPlan!.id}`
        : `${effectiveApiUrl}/api/schools/lesson-plans`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dars rejasini saqlab bo'lmadi");

      showToast(isEdit ? "Dars mavzusi muvaffaqiyatli yangilandi!" : "Yangi dars mavzusi qo'shildi!", "success");
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingPlan(null);
      fetchLessonPlans();
    } catch (err: any) {
      setFormError(err.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Plan
  const handleDeletePlan = async () => {
    if (!deletingPlanId) return;
    try {
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (sId) headers["X-School-ID"] = sId;

      const res = await fetch(`${effectiveApiUrl}/api/schools/lesson-plans/${deletingPlanId}`, {
        method: "DELETE",
        headers,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dars rejasini o'chirib bo'lmadi");

      showToast("Dars mavzusi muvaffaqiyatli o'chirildi!", "success");
      setShowDeleteModal(false);
      setDeletingPlanId(null);
      fetchLessonPlans();
    } catch (err: any) {
      showToast(err.message || "O'chirishda xatolik", "error");
    }
  };

  // Open Edit Modal helper
  const openEditModal = (plan: LessonPlanItem) => {
    setEditingPlan(plan);
    setFormClassId(plan.class_id);
    setFormSubjectId(plan.subject_id);
    setFormDayOfWeek(plan.day_of_week);
    setFormLessonNumber(plan.lesson_number);
    setFormStartDate(plan.start_date);
    setFormTopicName(plan.topic_name);
    setFormNotes(plan.notes || "");
    setFormError("");
    setShowEditModal(true);
  };

  // Open Add Modal helper
  const openAddModal = () => {
    setEditingPlan(null);
    setFormClassId(myClasses.length > 0 ? myClasses[0].id : "");
    setFormSubjectId(mySubjects.length > 0 ? mySubjects[0].id : "");
    setFormDayOfWeek(1);
    setFormLessonNumber(1);
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormTopicName("");
    setFormNotes("");
    setFormError("");
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#16193E] via-[#242866] to-[#16193E] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>O'qituvchi Taqvim-Mavzu Rejasi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Dars Ish Rejasi</h1>
          <p className="text-xs sm:text-sm text-indigo-200/80 font-medium leading-relaxed">
            Faqat o'zingiz dars beradigan fanlar bo'yicha ish rejangizni tuzing, Excel orqali birato'la yuklang va mavzular monitoringini olib boring.
          </p>
        </div>

        {/* Action Icon Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative z-10 bg-white/10 p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl border border-white/15 backdrop-blur-md self-start sm:self-auto">
          {/* Download Template Icon Button */}
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-indigo-200 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
            title="Excel shablonini yuklab olish (.xlsx)"
            aria-label="Excel shablonini yuklab olish"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Excel Import Icon Button */}
          <button
            type="button"
            onClick={() => {
              setImportFile(null);
              setImportError("");
              setImportResult(null);
              setShowImportModal(true);
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/30"
            title="Excel orqali ish rejasini yuklash"
            aria-label="Excel orqali ish rejasini yuklash"
          >
            <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-100" />
          </button>

          {/* Add New Lesson Topic Icon Button */}
          <button
            type="button"
            onClick={openAddModal}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#5B50EC] hover:bg-[#4A3FDB] text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-indigo-500/30"
            title="Yangi dars mavzusi qo'shish"
            aria-label="Yangi dars mavzusi qo'shish"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          
          {/* Multiple Choice Searchable Class Dropdown */}
          <div className="relative shrink-0" ref={classDropdownRef}>
            <button
              type="button"
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer flex items-center justify-between gap-2.5 border select-none min-w-[200px] sm:min-w-[220px] ${
                selectedClassIds.length > 0
                  ? "bg-indigo-50 text-indigo-900 border-indigo-200 shadow-2xs"
                  : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <GraduationCap className={`w-4 h-4 shrink-0 ${selectedClassIds.length > 0 ? "text-indigo-600" : "text-zinc-400"}`} />
                <span className="truncate">{classDropdownLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {selectedClassIds.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-mono font-black">
                    {selectedClassIds.length}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isClassDropdownOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {/* Dropdown Panel */}
            {isClassDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white border-2 border-indigo-500/20 shadow-2xl rounded-2xl p-3 z-50 animate-fadeIn space-y-2.5">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Sinf nomini qidirish..."
                    value={classSearchTerm}
                    onChange={(e) => setClassSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 outline-none focus:bg-white focus:border-indigo-500 transition"
                  />
                  {classSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setClassSearchTerm("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Quick Toggle Actions */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2 px-1 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSelectAllClasses}
                    className="text-indigo-600 hover:text-indigo-800 font-extrabold cursor-pointer"
                  >
                    {selectedClassIds.length === myClasses.length ? "Hammasini tozalash" : "Barchasini tanlash"}
                  </button>
                  <span className="text-zinc-400 font-mono font-medium">
                    {selectedClassIds.length} / {myClasses.length} tanlangan
                  </span>
                </div>

                {/* Classes Checkbox List */}
                <div className="max-h-52 overflow-y-auto space-y-1 pr-1 [scrollbar-width:thin]">
                  {filteredDropdownClasses.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-4 italic font-medium">Sinf topilmadi</p>
                  ) : (
                    filteredDropdownClasses.map((cls) => {
                      const isChecked = selectedClassIds.includes(cls.id);
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => handleToggleClass(cls.id)}
                          className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer select-none ${
                            isChecked
                              ? "bg-indigo-50 text-indigo-900"
                              : "hover:bg-zinc-50 text-zinc-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                              isChecked
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-zinc-300 bg-white"
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span>{cls.name}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Subject Filter and Search Box */}
          <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
            {/* Subject Selector (Teacher's own subjects only) */}
            <div className="relative shrink-0 min-w-[180px]">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-800 outline-none cursor-pointer transition focus:border-indigo-500"
              >
                <option value="all">Barcha Fanlarim ({mySubjects.length})</option>
                {mySubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Mavzu nomi bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:bg-white focus:border-indigo-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Plans Table / List */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-zinc-500 font-medium">Dars ish rejalari yuklanmoqda...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-extrabold text-[#16193E]">Hozircha dars ish rejasi mavjud emas</h3>
              <p className="text-xs text-zinc-400 font-medium">
                O'zingizning fanlaringiz bo'yicha Excel shablonini to'ldirib yuklang yoki yangi dars mavzularini qo'shing.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-3">
              <div className="inline-flex items-center gap-2.5 bg-zinc-100/80 p-1.5 rounded-2xl border border-zinc-200/80 shadow-2xs">
                {/* Download Template */}
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-10 h-10 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                  title="Excel shablonini yuklab olish (.xlsx)"
                  aria-label="Excel shablonini yuklab olish"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                </button>

                {/* Excel Import */}
                <button
                  type="button"
                  onClick={() => {
                    setImportFile(null);
                    setImportError("");
                    setImportResult(null);
                    setShowImportModal(true);
                  }}
                  className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-emerald-600/25"
                  title="Excel orqali ish rejasini yuklash"
                  aria-label="Excel orqali ish rejasini yuklash"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                </button>

                {/* Add Topic */}
                <button
                  type="button"
                  onClick={openAddModal}
                  className="w-10 h-10 rounded-xl bg-[#5B50EC] hover:bg-[#4A3FDB] text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-indigo-500/25"
                  title="Yangi dars mavzusi qo'shish"
                  aria-label="Yangi dars mavzusi qo'shish"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200/70 text-left">
              <thead className="bg-[#fafafa] text-[10px] sm:text-xs font-extrabold text-[#16193E] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">№</th>
                  <th className="py-3.5 px-4">Sana & Hafta kuni</th>
                  <th className="py-3.5 px-4">Soat</th>
                  <th className="py-3.5 px-4">Sinf</th>
                  <th className="py-3.5 px-4">Fan</th>
                  <th className="py-3.5 px-4">Dars Mavzusi</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-800">
                {plans.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-indigo-50/20 transition">
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-zinc-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-[#16193E] block">{formatUzDate(item.start_date)}</span>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-mono inline-block">
                          {getWeekdayName(item.day_of_week)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-zinc-700 font-mono bg-zinc-100 px-2.5 py-1 rounded-lg">
                        {item.lesson_number}-dars
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl">
                        {item.class_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-zinc-900">
                      {item.subject_name}
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-[#16193E] block leading-snug">
                          {item.topic_name}
                        </span>
                        {item.notes && (
                          <span className="text-[11px] text-zinc-400 font-medium block italic">
                            {item.notes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-indigo-100 text-zinc-600 hover:text-indigo-700 flex items-center justify-center transition cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingPlanId(item.id);
                            setShowDeleteModal(true);
                          }}
                          className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-rose-100 text-zinc-600 hover:text-rose-700 flex items-center justify-center transition cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add or Edit Lesson Plan */}
      {(showAddModal || showEditModal) && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setShowEditModal(false);
              setEditingPlan(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
        >
          <div className="w-full max-w-xl bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 relative text-zinc-900 animate-fadeIn space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#16193E]">
                    {editingPlan ? "Dars Mavzusini Tahrirlash" : "Yangi Dars Mavzusi Qo'shish"}
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">
                    O'zingizning fanlaringiz va sinflaringiz bo'yicha mavzuni to'ldiring
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setEditingPlan(null);
                }}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Class select */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Sinf *
                  </label>
                  <select
                    required
                    value={formClassId}
                    onChange={(e) => setFormClassId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:border-indigo-500 outline-none transition cursor-pointer"
                  >
                    <option value="">Sinfni tanlang</option>
                    {myClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject select (Teacher's own subjects only) */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Fan (Mening Fanlarim) *
                  </label>
                  <select
                    required
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:border-indigo-500 outline-none transition cursor-pointer"
                  >
                    <option value="">Fanni tanlang</option>
                    {mySubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Dars Sanasi *
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:border-indigo-500 outline-none transition cursor-pointer font-mono"
                  />
                </div>

                {/* Weekday */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Hafta Kuni *
                  </label>
                  <select
                    required
                    value={formDayOfWeek}
                    onChange={(e) => setFormDayOfWeek(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:border-indigo-500 outline-none transition cursor-pointer"
                  >
                    {WEEKDAYS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.id}-kun)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lesson hour */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Dars Soati (1-8) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formLessonNumber}
                    onChange={(e) => setFormLessonNumber(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:border-indigo-500 outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* Topic Name */}
              <div>
                <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Dars Mavzusi Nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 1 raqamini o'rganish va yozish"
                  value={formTopicName}
                  onChange={(e) => setFormTopicName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Qo'shimcha Izoh / Uyga Vazifa (Ixtiyoriy)
                </label>
                <textarea
                  rows={2}
                  placeholder="Mavzu bo'yicha eslatmalar..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2.5 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-200 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-[#5B50EC] text-white rounded-xl text-xs font-bold hover:bg-[#4A3FDB] transition cursor-pointer shadow-md shadow-indigo-500/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingPlan ? "O'zgarishlarni Saqlash" : "Mavzuni Qo'shish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Lesson Plans from Excel */}
      {showImportModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowImportModal(false);
              setImportFile(null);
              setImportError("");
              setImportResult(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
        >
          <div className="w-full max-w-2xl bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 relative text-zinc-900 animate-fadeIn space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#16193E]">Ish Rejasini Excel Orqali Import Qilish</h3>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">
                    Faqat o'zingiz dars beradigan fanlar rejasini Excel shablonda to'ldirib yuklang
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportError("");
                  setImportResult(null);
                }}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template download & rules info banner */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-black text-emerald-950 block">Excel Shablon Ustunlari:</span>
                  <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                    1. <b>hafta kuni</b> (1=Dushanba, 2=Seshanba...)<br />
                    2. <b>dars nome</b> (Dars soati: 1, 2, 4...)<br />
                    3. <b>sinf</b> (Masalan: 1-A, 5-B)<br />
                    4. <b>fan</b> (Faqat o'zingiz dars beradigan fan: {mySubjects.map(s => s.name).join(", ") || "Fanlaringiz"})<br />
                    5. <b>start_date</b> (Sana: 2026-09-01 yoki 25.10.2026)<br />
                    6. <b>mavzu nomi</b> (Dars mavzusi — <span className="text-rose-600 font-bold">Majburiy</span>)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm shadow-emerald-600/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Shablonni yuklab olish</span>
                </button>
              </div>
            </div>

            {importError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Import result summary */}
            {importResult && (
              <div className="space-y-3">
                <div className={`p-4 rounded-2xl border text-xs font-bold ${
                  importResult.failed_count === 0
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Natija: {importResult.imported_count} ta mavzu muvaffaqiyatli qo'shildi, {importResult.failed_count} ta qatorda xatolik.</span>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-2xl border border-rose-200 bg-rose-50/50 p-3 space-y-1.5 text-xs">
                    <span className="font-extrabold text-rose-900 block mb-1">Xatoliklar ro'yxati:</span>
                    {importResult.errors.map((err, eIdx) => (
                      <div key={eIdx} className="text-rose-700 flex items-start gap-2 bg-white/80 p-2 rounded-xl border border-rose-100">
                        <span className="font-mono font-black text-rose-800 shrink-0">Qator {err.row}:</span>
                        <span>{err.error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleImport} className="space-y-5">
              {/* File Upload Box */}
              <div>
                <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Excel (.xlsx) Faylini tanlang *
                </label>
                <div className="border-2 border-dashed border-zinc-200 hover:border-emerald-500 rounded-2xl p-6 text-center bg-zinc-50/50 transition cursor-pointer relative group">
                  <input
                    type="file"
                    accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImportFile(e.target.files[0]);
                        setImportError("");
                        setImportResult(null);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    {importFile ? (
                      <div>
                        <p className="text-xs font-extrabold text-zinc-900">{importFile.name}</p>
                        <p className="text-[11px] text-zinc-400 font-mono">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-zinc-700">Faylni shu yerga tashlang yoki tanlash uchun bosing</p>
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Faqat .xlsx (Excel) format</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportError("");
                    setImportResult(null);
                  }}
                  className="px-4 py-2.5 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-200 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={importLoading || !importFile}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shadow-md shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {importLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{importLoading ? "Yuklanmoqda..." : "Ish Rejasini Import Qilish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {showDeleteModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false);
              setDeletingPlanId(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <div className="w-full max-w-md bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-2xl text-zinc-900 animate-fadeIn space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-[#16193E]">Dars Mavzusini O'chirish</h3>
              <p className="text-xs text-zinc-500 font-medium">
                Haqiqatan ham ushbu dars mavzusini ish rejasidan o'chirmoqchimisiz?
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingPlanId(null);
                }}
                className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-200 transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDeletePlan}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition cursor-pointer shadow-md shadow-rose-500/20"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border font-bold text-xs flex items-center gap-2 animate-fadeIn ${
            toastMessage.type === "success"
              ? "bg-[#16193E] text-white border-white/15"
              : "bg-rose-600 text-white border-rose-700"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
