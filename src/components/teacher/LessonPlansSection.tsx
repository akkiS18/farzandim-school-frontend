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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Calendar,
  ArrowRight,
  ClipboardPaste,
  Save,
  Split,
  Combine,
  GripVertical,
  PlusCircle,
  HelpCircle,
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

interface SchedulePeriod {
  start_date: string;
  end_date: string;
}

interface SmartGridRow {
  id: string;
  date: string; // YYYY-MM-DD
  displayDate: string; // DD.MM.YYYY
  dayLetter: string; // D, S, Ch, P, J, Sh
  dayOfWeek: number; // 1-7
  lessonNumber: number; // 1, 2, 3...
  topicName: string;
  notes: string;
}

interface LessonPlansSectionProps {
  token: string;
  API_URL: string;
  classes?: ClassItem[];
  subjects?: SubjectItem[];
  userInfo: any;
}

const WEEKDAYS = [
  { id: 1, name: "Dushanba", short: "Dush", letter: "D" },
  { id: 2, name: "Seshanba", short: "Sesh", letter: "S" },
  { id: 3, name: "Chorshanba", short: "Chor", letter: "Ch" },
  { id: 4, name: "Payshanba", short: "Pay", letter: "P" },
  { id: 5, name: "Juma", short: "Juma", letter: "J" },
  { id: 6, name: "Shanba", short: "Shan", letter: "Sh" },
  { id: 7, name: "Yakshanba", short: "Yak", letter: "Y" },
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Multi-choice Class Filter States
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [classSearchTerm, setClassSearchTerm] = useState("");
  const classDropdownRef = useRef<HTMLDivElement>(null);

  // Subject & Search Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Single Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected item for Edit / Delete
  const [editingPlan, setEditingPlan] = useState<LessonPlanItem | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);

  // Form State for Single Edit
  const [formClassId, setFormClassId] = useState<number | "">("");
  const [formSubjectId, setFormSubjectId] = useState<number | "">("");
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(1);
  const [formLessonNumber, setFormLessonNumber] = useState<number>(1);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [formTopicName, setFormTopicName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // ==========================================
  // SMART PLAN BUILDER & GRID EDITOR STATES
  // ==========================================
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [builderClassId, setBuilderClassId] = useState<number | "">("");
  const [builderSubjectId, setBuilderSubjectId] = useState<number | "">("");
  const [builderStartDate, setBuilderStartDate] = useState("");
  const [builderEndDate, setBuilderEndDate] = useState("");
  const [schedulePeriods, setSchedulePeriods] = useState<SchedulePeriod[]>([]);
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState<number | "custom">(0);
  const [pasteText, setPasteText] = useState("");
  const [smartRows, setSmartRows] = useState<SmartGridRow[]>([]);
  const [builderStep, setBuilderStep] = useState<"setup" | "grid">("setup");
  const [builderLoading, setBuilderLoading] = useState(false);
  const [builderError, setBuilderError] = useState("");
  const [savingBatch, setSavingBatch] = useState(false);

  // Interactive Table Edit / Formula bar states
  const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null);
  const [formulaValue, setFormulaValue] = useState("");
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const safeFetchHeaders = () => {
    const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (sId) headers["X-School-ID"] = sId;
    return headers;
  };

  // Keyboard listener for Escape key & outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEditModal(false);
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
      const res = await fetch(`${effectiveApiUrl}/api/schools/lesson-plans/meta`, {
        headers: safeFetchHeaders(),
      });
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
        headers: safeFetchHeaders(),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setPlans(data);
      } else {
        setPlans([]);
      }
      setCurrentPage(1); // Reset to page 1 on filter
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

  // Load schedule periods when builderClassId changes
  useEffect(() => {
    if (!builderClassId || !token) {
      setSchedulePeriods([]);
      return;
    }
    const fetchPeriods = async () => {
      try {
        const res = await fetch(`${effectiveApiUrl}/api/schools/classes/${builderClassId}/schedule-periods`, {
          headers: safeFetchHeaders(),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data) && data.length > 0) {
          setSchedulePeriods(data);
          setSelectedPeriodIdx(0);
          setBuilderStartDate(data[0].start_date);
          setBuilderEndDate(data[0].end_date);
        } else {
          setSchedulePeriods([]);
          setSelectedPeriodIdx("custom");
          const now = new Date();
          const y = now.getFullYear();
          setBuilderStartDate(`${y}-09-02`);
          setBuilderEndDate(`${y}-11-04`);
        }
      } catch (err) {
        console.error("Failed to load schedule periods:", err);
      }
    };
    fetchPeriods();
  }, [builderClassId, token]);

  // Update dates when period selection changes
  const handlePeriodChange = (val: string) => {
    if (val === "custom") {
      setSelectedPeriodIdx("custom");
    } else {
      const idx = Number(val);
      setSelectedPeriodIdx(idx);
      if (schedulePeriods[idx]) {
        setBuilderStartDate(schedulePeriods[idx].start_date);
        setBuilderEndDate(schedulePeriods[idx].end_date);
      }
    }
  };

  // Format date helper: YYYY-MM-DD -> DD.MM.YYYY
  const toDisplayDate = (dStr: string) => {
    if (!dStr) return "";
    const parts = dStr.split("-");
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return dStr;
  };

  // ==========================================
  // SMART SCHEDULE & ROW GENERATOR
  // ==========================================
  const handleGenerateSmartGrid = async () => {
    if (!builderClassId || !builderSubjectId) {
      setBuilderError("Iltimos, sinf va fanni tanlang");
      return;
    }
    if (!builderStartDate || !builderEndDate) {
      setBuilderError("Iltimos, boshlanish va tugash sanalarini belgilang");
      return;
    }
    if (new Date(builderStartDate) > new Date(builderEndDate)) {
      setBuilderError("Boshlanish sanasi tugash sanasidan keyin bo'lishi mumkin emas");
      return;
    }

    setBuilderLoading(true);
    setBuilderError("");

    try {
      const resSched = await fetch(`${effectiveApiUrl}/api/schools/classes/${builderClassId}/schedule`, {
        headers: safeFetchHeaders(),
      });
      const schedData = await resSched.json();
      if (!resSched.ok) throw new Error(schedData.error || "Dars jadvalini olib bo'lmadi");

      const subjectSlots: { dayOfWeek: number; lessonNumber: number }[] = [];
      if (Array.isArray(schedData)) {
        for (const item of schedData) {
          if (item.subject_id === Number(builderSubjectId)) {
            subjectSlots.push({
              dayOfWeek: item.day_of_week,
              lessonNumber: item.lesson_number,
            });
          }
        }
      }

      if (subjectSlots.length === 0) {
        throw new Error(
          "Ushbu sinf dars jadvalida tanlangan fan uchun haftalik darslar biriktirilmagan. Avval dars jadvalini to'ldiring."
        );
      }

      subjectSlots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.lessonNumber - b.lessonNumber);

      let holidaysSet = new Set<string>();
      try {
        const resHol = await fetch(`${effectiveApiUrl}/api/schools/holidays`, {
          headers: safeFetchHeaders(),
        });
        const holData = await resHol.json();
        if (resHol.ok && Array.isArray(holData)) {
          holData.forEach((h: any) => {
            if (h.holiday_date) {
              const dStr = typeof h.holiday_date === "string" ? h.holiday_date.split("T")[0] : "";
              if (dStr) holidaysSet.add(dStr);
            }
          });
        }
      } catch (err) {
        console.warn("Holidays fetch error:", err);
      }

      const generatedRows: SmartGridRow[] = [];
      const curDate = new Date(builderStartDate + "T00:00:00");
      const stopDate = new Date(builderEndDate + "T23:59:59");

      while (curDate <= stopDate) {
        const yyyy = curDate.getFullYear();
        const mm = String(curDate.getMonth() + 1).padStart(2, "0");
        const dd = String(curDate.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        if (!holidaysSet.has(dateStr)) {
          let dayOfWeek = curDate.getDay();
          if (dayOfWeek === 0) dayOfWeek = 7;

          const matchingSlots = subjectSlots.filter((s) => s.dayOfWeek === dayOfWeek);
          for (const slot of matchingSlots) {
            const wk = WEEKDAYS.find((w) => w.id === dayOfWeek);
            generatedRows.push({
              id: `${dateStr}_${slot.lessonNumber}_${Math.random().toString(36).substr(2, 5)}`,
              date: dateStr,
              displayDate: `${dd}.${mm}.${yyyy}`,
              dayLetter: wk ? wk.letter : "D",
              dayOfWeek: dayOfWeek,
              lessonNumber: slot.lessonNumber,
              topicName: "",
              notes: "",
            });
          }
        }
        curDate.setDate(curDate.getDate() + 1);
      }

      if (generatedRows.length === 0) {
        throw new Error("Belgilangan sana oralig'ida birorta ham dars kuni topilmadi.");
      }

      if (pasteText.trim()) {
        const lines = pasteText
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        lines.forEach((line, idx) => {
          if (idx < generatedRows.length) {
            generatedRows[idx].topicName = line;
          } else {
            generatedRows.push({
              id: `extra_${idx}_${Math.random().toString(36).substr(2, 5)}`,
              date: generatedRows[generatedRows.length - 1]?.date || builderEndDate,
              displayDate: toDisplayDate(generatedRows[generatedRows.length - 1]?.date || builderEndDate),
              dayLetter: "+",
              dayOfWeek: 1,
              lessonNumber: 1,
              topicName: line,
              notes: "Qo'shimcha dars",
            });
          }
        });
      }

      setSmartRows(generatedRows);
      setBuilderStep("grid");
      if (generatedRows.length > 0) {
        setActiveCellIndex(0);
        setFormulaValue(generatedRows[0].topicName);
      }
    } catch (err: any) {
      setBuilderError(err.message || "Ish rejasini generatsiya qilishda xatolik");
    } finally {
      setBuilderLoading(false);
    }
  };

  const handleTopicChange = (index: number, val: string) => {
    setSmartRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], topicName: val };
      return updated;
    });
    if (activeCellIndex === index) {
      setFormulaValue(val);
    }
  };

  const handleFormulaChange = (val: string) => {
    setFormulaValue(val);
    if (activeCellIndex !== null && smartRows[activeCellIndex]) {
      setSmartRows((prev) => {
        const updated = [...prev];
        updated[activeCellIndex] = { ...updated[activeCellIndex], topicName: val };
        return updated;
      });
    }
  };

  const handleInsertRowAfter = (index: number) => {
    setSmartRows((prev) => {
      const updated = [...prev];
      const target = updated[index];
      const newRow: SmartGridRow = {
        id: `inserted_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        date: target?.date || builderStartDate,
        displayDate: target?.displayDate || toDisplayDate(builderStartDate),
        dayLetter: target?.dayLetter || "D",
        dayOfWeek: target?.dayOfWeek || 1,
        lessonNumber: target?.lessonNumber || 1,
        topicName: "",
        notes: "",
      };
      updated.splice(index + 1, 0, newRow);
      return updated;
    });
    setActiveCellIndex(index + 1);
    setFormulaValue("");
    showToast("Yangi dars qatori oraliqqa qo'shildi", "success");
  };

  const handleMergeRows = (sourceIdx: number, targetIdx: number) => {
    if (sourceIdx === targetIdx) return;
    setSmartRows((prev) => {
      const updated = [...prev];
      const sourceTopic = updated[sourceIdx]?.topicName.trim();
      const targetTopic = updated[targetIdx]?.topicName.trim();

      const combinedTopic = targetTopic && sourceTopic ? `${targetTopic} / ${sourceTopic}` : targetTopic || sourceTopic;
      updated[targetIdx] = { ...updated[targetIdx], topicName: combinedTopic };
      updated.splice(sourceIdx, 1);
      return updated;
    });
    showToast("2 ta mavzu bitta sanaga muvaffaqiyatli birlashtirildi!", "success");
  };

  const handleDeleteGridRow = (index: number) => {
    setSmartRows((prev) => prev.filter((_, i) => i !== index));
    if (activeCellIndex === index) {
      setActiveCellIndex(null);
      setFormulaValue("");
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedRowIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverRowIndex !== index) {
      setDragOverRowIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedRowIndex !== null && draggedRowIndex !== targetIndex) {
      handleMergeRows(draggedRowIndex, targetIndex);
    }
    setDraggedRowIndex(null);
    setDragOverRowIndex(null);
  };

  // Batch save to backend
  const handleSaveBatchPlans = async () => {
    if (!builderClassId || !builderSubjectId) {
      setBuilderError("Sinf va fan tanlanmagan");
      return;
    }

    const validItems = smartRows
      .filter((r) => r.topicName.trim().length > 0)
      .map((r) => ({
        start_date: r.date,
        day_of_week: r.dayOfWeek,
        lesson_number: r.lessonNumber,
        topic_name: r.topicName.trim(),
        notes: r.notes.trim(),
      }));

    if (validItems.length === 0) {
      setBuilderError("Saqlash uchun kamida 1 ta to'ldirilgan dars mavzusi bo'lishi kerak");
      return;
    }

    setSavingBatch(true);
    setBuilderError("");

    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const res = await fetch(`${effectiveApiUrl}/api/schools/lesson-plans/batch`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          class_id: Number(builderClassId),
          subject_id: Number(builderSubjectId),
          start_date_from: builderStartDate,
          start_date_to: builderEndDate,
          overwrite: true,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ish rejasini saqlab bo'lmadi");

      showToast(data.message || `${validItems.length} ta dars rejasi saqlandi!`, "success");
      setShowSmartModal(false);
      setBuilderStep("setup");
      setSmartRows([]);
      setPasteText("");
      fetchLessonPlans();
    } catch (err: any) {
      setBuilderError(err.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setSavingBatch(false);
    }
  };

  const openSmartModal = () => {
    setBuilderStep("setup");
    setBuilderError("");
    setPasteText("");
    setSmartRows([]);
    if (myClasses.length > 0 && !builderClassId) {
      setBuilderClassId(myClasses[0].id);
    }
    if (mySubjects.length > 0 && !builderSubjectId) {
      setBuilderSubjectId(mySubjects[0].id);
    }
    setShowSmartModal(true);
  };

  // Single Edit Save
  const handleSingleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClassId || !formSubjectId || !formTopicName.trim()) {
      setFormError("Barcha majburiy maydonlarni to'ldiring");
      return;
    }

    setFormSubmitting(true);
    setFormError("");

    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const payload = {
        class_id: Number(formClassId),
        subject_id: Number(formSubjectId),
        day_of_week: Number(formDayOfWeek),
        lesson_number: Number(formLessonNumber),
        start_date: formStartDate,
        topic_name: formTopicName.trim(),
        notes: formNotes.trim(),
      };

      const url = `${effectiveApiUrl}/api/schools/lesson-plans/${editingPlan?.id}`;
      const res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejani saqlab bo'lmadi");

      showToast("Dars mavzusi muvaffaqiyatli tahrirlandi", "success");
      setShowEditModal(false);
      setEditingPlan(null);
      fetchLessonPlans();
    } catch (err: any) {
      setFormError(err.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlanId) return;
    try {
      const res = await fetch(`${effectiveApiUrl}/api/schools/lesson-plans/${deletingPlanId}`, {
        method: "DELETE",
        headers: safeFetchHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "O'chirib bo'lmadi");
      }
      showToast("Dars mavzusi o'chirildi", "success");
      setShowDeleteModal(false);
      setDeletingPlanId(null);
      fetchLessonPlans();
    } catch (err: any) {
      showToast(err.message || "Xatolik", "error");
    }
  };

  // Helper labels
  const classDropdownLabel = useMemo(() => {
    if (selectedClassIds.length === 0) return "Barcha sinflar";
    if (selectedClassIds.length === 1) {
      const found = myClasses.find((c) => c.id === selectedClassIds[0]);
      return found ? `${found.name} sinfi` : "1 ta sinf";
    }
    return `${selectedClassIds.length} ta sinf tanlangan`;
  }, [selectedClassIds, myClasses]);

  // Pagination calculation
  const totalPages = Math.ceil(plans.length / pageSize) || 1;
  const paginatedPlans = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return plans.slice(startIndex, startIndex + pageSize);
  }, [plans, currentPage, pageSize]);

  return (
    <div className="space-y-5 animate-fadeIn pb-32">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold transition-all duration-300 animate-slideDown ${
            toastMessage.type === "success"
              ? "bg-emerald-900/95 text-white border-emerald-700/80 shadow-emerald-900/30"
              : "bg-rose-900/95 text-white border-rose-700/80 shadow-rose-900/30"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#16193E] via-[#2A2B6A] to-[#16193E] rounded-3xl p-5 sm:p-6 lg:p-7 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase mb-2 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Ish Rejasi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Ish Rejasi (Syllabus)</h2>
          <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-xl">
            Sinf dars jadvali asosida sanalarni avtomatik tuzing, Excel mavzularini bir zumda copy-paste qiling va tahrirlang.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={openSmartModal}
            className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-[#D4F562] to-[#BFEA42] hover:from-[#c7ea50] hover:to-[#b0dc33] text-[#1D1E26] font-black text-xs sm:text-sm flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-[#D4F562]/20 cursor-pointer"
          >
            <ClipboardPaste className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D1E26]" />
            <span>+ Yangi Ish Reja (Excel Paste)</span>
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

                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {myClasses.map((cls) => {
                    const isSelected = selectedClassIds.includes(cls.id);
                    return (
                      <label
                        key={cls.id}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition select-none ${
                          isSelected ? "bg-indigo-50/80 text-indigo-900" : "hover:bg-zinc-50 text-zinc-700"
                        }`}
                      >
                        <span>{cls.name} sinfi</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedClassIds((prev) =>
                              prev.includes(cls.id) ? prev.filter((id) => id !== cls.id) : [...prev, cls.id]
                            );
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedSubjectId("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
                selectedSubjectId === "all"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
              }`}
            >
              Barcha fanlar
            </button>
            {mySubjects.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
                  selectedSubjectId === sub.id
                    ? "bg-[#5B50EC] text-white shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Mavzu nomi bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 outline-none focus:bg-white focus:border-indigo-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Main Table / List View */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-zinc-200/80 shadow-xs">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono text-zinc-400">Ish rejalari yuklanmoqda...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-zinc-300 p-8 shadow-xs">
          <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-zinc-800">Ish rejalari topilmadi</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Hali ushbu sinf va fanlar uchun ish rejalari kiritilmagan. Yuqoridagi tugma orqali osongina Excel mavzularini qo'shing.
          </p>
          <button
            type="button"
            onClick={openSmartModal}
            className="mt-4 px-4 py-2.5 rounded-xl bg-[#5B50EC] text-white text-xs font-bold hover:bg-[#4a3fdb] transition cursor-pointer shadow-md inline-flex items-center gap-2"
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>Ish rejasini kiritish</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center">#</th>
                  <th className="px-4 py-3.5">Sana</th>
                  <th className="px-4 py-3.5">Kun</th>
                  <th className="px-4 py-3.5">Soat</th>
                  <th className="px-4 py-3.5">Sinf</th>
                  <th className="px-4 py-3.5">Fan</th>
                  <th className="px-4 py-3.5">Mavzu nomi</th>
                  <th className="px-4 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginatedPlans.map((p, idx) => {
                  const wk = WEEKDAYS.find((w) => w.id === p.day_of_week);
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={p.id} className="hover:bg-indigo-50/30 transition">
                      <td className="px-4 py-3 text-center text-zinc-400 font-mono font-bold">{globalIdx}</td>
                      <td className="px-4 py-3 font-mono font-bold text-zinc-900">{toDisplayDate(p.start_date)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-bold text-[11px]">
                          {wk ? wk.letter : "D"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">{p.lesson_number}-soat</td>
                      <td className="px-4 py-3 font-bold text-zinc-800">{p.class_name}</td>
                      <td className="px-4 py-3 font-bold text-zinc-800">{p.subject_name}</td>
                      <td className="px-4 py-3 font-medium text-zinc-900 font-sans max-w-md">{p.topic_name}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPlan(p);
                              setFormClassId(p.class_id);
                              setFormSubjectId(p.subject_id);
                              setFormDayOfWeek(p.day_of_week);
                              setFormLessonNumber(p.lesson_number);
                              setFormStartDate(p.start_date);
                              setFormTopicName(p.topic_name);
                              setFormNotes(p.notes || "");
                              setFormError("");
                              setShowEditModal(true);
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            title="Tahrirlash"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingPlanId(p.id);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="O'chirish"
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

          {/* Smart Pagination Bar */}
          {plans.length > 0 && (
            <div className="px-6 py-3.5 bg-zinc-50/80 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 font-semibold">
              <div className="flex items-center gap-2">
                <span>Jami: <b className="text-zinc-900 font-mono">{plans.length}</b> ta dars mavzusi</span>
                <span className="text-zinc-300">•</span>
                <span>Ko'rsatish:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value={10}>10 ta</option>
                  <option value={15}>15 ta</option>
                  <option value={25}>25 ta</option>
                  <option value={50}>50 ta</option>
                </select>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Oldingi sahifa"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && p - prev > 1;
                        return (
                          <React.Fragment key={p}>
                            {showEllipsis && <span className="px-1 text-zinc-400 font-mono">...</span>}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(p)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
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
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Keyingi sahifa"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SMART AUTO SCHEDULE & EXCEL PASTE GRID BUILDER                     */}
      {/* ========================================================================= */}
      {showSmartModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingBatch) {
              setShowSmartModal(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
        >
          <div className="w-full max-w-5xl bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#16193E] text-white flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D4F562] to-[#A3E635] text-[#1D1E26] flex items-center justify-center font-black">
                  <ClipboardPaste className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Aqlli Ish Rejasi Yaratish</h3>
                  <p className="text-[11px] text-indigo-200/80 font-medium">
                    Sinf dars jadvali asosida sanalarni tuzing va Excel mavzularini to'ldiring
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSmartModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {builderError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{builderError}</span>
                </div>
              )}

              {builderStep === "setup" ? (
                /* STEP 1: SETUP CLASS, SUBJECT, PERIOD, EXCEL TEXT */
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Class Select */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-zinc-400 uppercase font-mono mb-1.5">
                        Sinfni tanlang *
                      </label>
                      <select
                        value={builderClassId}
                        onChange={(e) => setBuilderClassId(Number(e.target.value) || "")}
                        className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] font-bold cursor-pointer"
                      >
                        <option value="">-- Sinfni tanlang --</option>
                        {myClasses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} sinfi
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subject Select */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-zinc-400 uppercase font-mono mb-1.5">
                        Fanni tanlang *
                      </label>
                      <select
                        value={builderSubjectId}
                        onChange={(e) => setBuilderSubjectId(Number(e.target.value) || "")}
                        className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] font-bold cursor-pointer"
                      >
                        <option value="">-- Fanni tanlang --</option>
                        {mySubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Period / Quarter Select */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-zinc-400 uppercase font-mono mb-1.5">
                        Dars davri / Chorak *
                      </label>
                      <select
                        value={selectedPeriodIdx}
                        onChange={(e) => handlePeriodChange(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] font-bold cursor-pointer"
                      >
                        {schedulePeriods.map((p, idx) => (
                          <option key={idx} value={idx}>
                            {idx + 1}-chorak ({p.start_date} — {p.end_date})
                          </option>
                        ))}
                        <option value="custom">Boshqa sana oralig'i...</option>
                      </select>
                    </div>
                  </div>

                  {/* Date Range Inputs (if custom or verify) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/80 p-4 rounded-2xl border border-zinc-200/80">
                    <div>
                      <label className="block text-[10px] font-extrabold text-zinc-400 uppercase font-mono mb-1.5">
                        Boshlanish sanasi
                      </label>
                      <input
                        type="date"
                        value={builderStartDate}
                        onChange={(e) => setBuilderStartDate(e.target.value)}
                        className="w-full bg-white border border-zinc-200 text-zinc-800 rounded-xl px-3.5 py-2 text-xs outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-zinc-400 uppercase font-mono mb-1.5">
                        Tugash sanasi
                      </label>
                      <input
                        type="date"
                        value={builderEndDate}
                        onChange={(e) => setBuilderEndDate(e.target.value)}
                        className="w-full bg-white border border-zinc-200 text-zinc-800 rounded-xl px-3.5 py-2 text-xs outline-none font-bold"
                      />
                    </div>
                  </div>

                  {/* Excel Copy-Paste Textarea */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-extrabold text-zinc-500 uppercase font-mono">
                        Excel'dan mavzular ustunini copy-paste qilib tashlang (ixtiyoriy)
                      </label>
                      <span className="text-[10px] text-zinc-400 font-mono font-medium">
                        (Har bir qator alohida mavzu bo'lib tushadi)
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder="Masalan:&#10;1-mavzu. Kirish va takrorlash&#10;2-mavzu. O'nli kasrlar ustida amallar&#10;3-mavzu. FASTAS nazorat ishi..."
                      className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-mono text-zinc-800 placeholder:text-zinc-400 outline-none focus:bg-white focus:border-indigo-500 transition leading-relaxed resize-y"
                    />
                  </div>
                </div>
              ) : (
                /* STEP 2: INTERACTIVE GRID EDITOR (Social Passport Style) */
                <div className="space-y-4">
                  {/* Top Formula Bar & Quick Edit Toolbar */}
                  <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-2 shrink-0 text-xs font-bold text-zinc-600 font-mono">
                      <Edit3 className="w-4 h-4 text-indigo-600" />
                      <span>Formula / Tahrirlash:</span>
                    </div>
                    <input
                      type="text"
                      value={formulaValue}
                      onChange={(e) => handleFormulaChange(e.target.value)}
                      placeholder="Tanlangan qatordagi mavzu nomini shu yerda tezkor tahrirlashingiz mumkin..."
                      className="flex-1 px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono font-bold text-zinc-400">
                        Jami: {smartRows.length} ta dars
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 font-medium px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Qatorlar orasidagi <b>+</b> tugmasi orqali oraliqqa yangi dars qo'shishingiz mumkin.</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 hidden sm:block">
                      Mavzuni boshqa mavzu ustiga sudrab tashlab birlashtirish mumkin
                    </div>
                  </div>

                  {/* 4-Column Table Grid */}
                  <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-xs max-h-[50vh] overflow-y-auto">
                    <table className="w-full text-left text-xs text-zinc-800 border-collapse">
                      <thead className="bg-[#16193E] text-white sticky top-0 z-10 text-[10px] font-extrabold uppercase font-mono tracking-wider">
                        <tr>
                          <th className="px-3 py-3 w-10 text-center">#</th>
                          <th className="px-3 py-3 w-28">1. Sana</th>
                          <th className="px-3 py-3 w-16 text-center">2. Kun</th>
                          <th className="px-3 py-3 w-16 text-center">3. Soat</th>
                          <th className="px-3 py-3">4. Mavzu nomi (Tahrirlanadigan)</th>
                          <th className="px-3 py-3 w-20 text-right">Amal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {smartRows.map((row, idx) => {
                          const isActive = activeCellIndex === idx;
                          const isDragOver = dragOverRowIndex === idx;

                          return (
                            <React.Fragment key={row.id}>
                              <tr
                                draggable
                                onDragStart={() => handleDragStart(idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDrop={(e) => handleDrop(e, idx)}
                                onClick={() => {
                                  setActiveCellIndex(idx);
                                  setFormulaValue(row.topicName);
                                }}
                                className={`transition group cursor-pointer ${
                                  isActive ? "bg-indigo-50/70" : "hover:bg-zinc-50/80"
                                } ${isDragOver ? "bg-amber-100 border-2 border-dashed border-amber-500" : ""}`}
                              >
                                <td className="px-2 py-2.5 text-center text-zinc-400 font-mono font-bold select-none">
                                  <div className="flex items-center justify-center gap-1">
                                    <GripVertical className="w-3 h-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition cursor-grab" />
                                    <span>{idx + 1}</span>
                                  </div>
                                </td>

                                <td className="px-3 py-2.5 font-mono font-bold text-zinc-900 whitespace-nowrap">
                                  {row.displayDate}
                                </td>

                                <td className="px-3 py-2.5 text-center">
                                  <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 font-extrabold text-[11px] font-mono">
                                    {row.dayLetter}
                                  </span>
                                </td>

                                <td className="px-3 py-2.5 text-center font-mono font-bold text-indigo-700">
                                  {row.lessonNumber}
                                </td>

                                <td className="px-3 py-1.5">
                                  <input
                                    type="text"
                                    value={row.topicName}
                                    onChange={(e) => handleTopicChange(idx, e.target.value)}
                                    placeholder="Dars mavzusini kiriting..."
                                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium font-sans border transition outline-none ${
                                      isActive
                                        ? "border-indigo-500 bg-white shadow-2xs font-semibold"
                                        : "border-transparent bg-transparent hover:border-zinc-200 focus:bg-white focus:border-indigo-500"
                                    }`}
                                  />
                                </td>

                                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleInsertRowAfter(idx);
                                      }}
                                      className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                                      title="Ostiga yangi qator qo'shish"
                                    >
                                      <PlusCircle className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteGridRow(idx);
                                      }}
                                      className="p-1 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                      title="Qatorni o'chirish"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Desktop Hover Row-Divider Inserter (+) */}
                              <tr className="hidden sm:table-row h-0">
                                <td colSpan={6} className="p-0 border-0 relative">
                                  <div className="h-2 -my-1 relative group/insert flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10">
                                    <div className="w-full h-0.5 bg-emerald-400 absolute"></div>
                                    <button
                                      type="button"
                                      onClick={() => handleInsertRowAfter(idx)}
                                      className="relative bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-1 shadow-md text-[10px] font-bold flex items-center gap-1 px-2.5 cursor-pointer transform -translate-y-0.5 hover:scale-105 transition"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Oraliqqa dars qo'shish</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between shrink-0">
              {builderStep === "grid" ? (
                <button
                  type="button"
                  onClick={() => setBuilderStep("setup")}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition cursor-pointer"
                >
                  ← Qaytadan sozlash
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSmartModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition cursor-pointer"
                >
                  Bekor qilish
                </button>
              )}

              {builderStep === "setup" ? (
                <button
                  type="button"
                  onClick={handleGenerateSmartGrid}
                  disabled={builderLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#5B50EC] hover:bg-[#4A3FDB] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-500/20"
                >
                  {builderLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Jadval hisoblanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <span>Jadvalni tuzish</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveBatchPlans}
                  disabled={savingBatch}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4F562] to-[#BFEA42] hover:from-[#c7ea50] hover:to-[#b0dc33] text-[#1D1E26] text-xs font-black transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#D4F562]/30"
                >
                  {savingBatch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saqlanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-[#1D1E26]" />
                      <span>Ish Rejasini Saqlash ({smartRows.filter((r) => r.topicName.trim()).length} ta mavzu)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SINGLE EDIT LESSON PLAN                                            */}
      {/* ========================================================================= */}
      {showEditModal && editingPlan && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !formSubmitting) {
              setShowEditModal(false);
              setEditingPlan(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl text-zinc-900 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-black text-zinc-900">Dars Mavzusini Tahrirlash</h3>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPlan(null);
                }}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSingleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase font-mono mb-1.5">Sana *</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase font-mono mb-1.5">Dars soati *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={formLessonNumber}
                    onChange={(e) => setFormLessonNumber(Number(e.target.value))}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-zinc-400 uppercase font-mono mb-1.5">Mavzu nomi *</label>
                <textarea
                  rows={3}
                  required
                  value={formTopicName}
                  onChange={(e) => setFormTopicName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-100 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#5B50EC] hover:bg-[#4A3FDB] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION                                                */}
      {/* ========================================================================= */}
      {showDeleteModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeleteModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl text-zinc-900 space-y-4 animate-fadeIn">
            <h3 className="text-base font-black text-zinc-900">Mavzuni o'chirish</h3>
            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              Haqiqatan ham ushbu dars mavzusini ish rejasidan o'chirmoqchimisiz?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-100 transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDeletePlan}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Ha, o'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
