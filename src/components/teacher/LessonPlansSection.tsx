"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ChevronLeft,
  GraduationCap,
  Calendar,
  BookOpen,
  ArrowRight,
  ClipboardPaste,
  Edit3,
  Combine,
  PlusCircle,
  Trash2,
  GripVertical,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import api from "@/lib/api";

interface ClassItem {
  id: number;
  name: string;
  is_main_teacher?: boolean;
}

interface SubjectItem {
  id: number;
  name: string;
}

interface SchedulePeriod {
  start_date: string;
  end_date: string;
}

interface FixedScheduleSlot {
  id: string;
  date: string; // YYYY-MM-DD
  displayDate: string; // DD.MM.YYYY
  dayLetter: string; // D, S, Ch, P, J, Sh
  dayOfWeek: number; // 1-7
  lessonNumber: number; // 1, 2, 3...
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
  // Step Navigation State (No Modal!)
  const [viewStep, setViewStep] = useState<
    "step1_class" | "step2_quarter" | "step3_subject" | "step4_editor"
  >("step1_class");

  // Selection states
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<SchedulePeriod | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);

  // Loaded metadata
  const [myClasses, setMyClasses] = useState<ClassItem[]>([]);
  const [schedulePeriods, setSchedulePeriods] = useState<SchedulePeriod[]>([]);
  const [classSubjects, setClassSubjects] = useState<SubjectItem[]>([]);
  const [selectedClassIsMain, setSelectedClassIsMain] = useState(false);

  // Loading states
  const [metaLoading, setMetaLoading] = useState(false);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);

  // Editor Grid States
  // Fixed Schedule Slots (Dates, Day of Week, Lesson Numbers) - 100% Fixed & Static!
  const [fixedSlots, setFixedSlots] = useState<FixedScheduleSlot[]>([]);

  // Topics Array - 1-to-1 matching with fixedSlots index! (Only this array is edited, dragged, merged, inserted, or deleted!)
  const [topicList, setTopicList] = useState<string[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [formulaValue, setFormulaValue] = useState("");
  const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null);

  // Drag & Drop topic state
  const [draggedTopicIdx, setDraggedTopicIdx] = useState<number | null>(null);
  const [dragOverSlotIdx, setDragOverSlotIdx] = useState<number | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load teacher's assigned classes on mount
  const fetchTeacherMeta = async () => {
    setMetaLoading(true);
    try {
      const data = await api.get("/api/schools/lesson-plans/meta");
      setMyClasses(Array.isArray(data.classes) ? data.classes : []);
    } catch (err) {
      console.error("Failed to load teacher metadata:", err);
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherMeta();
  }, []);

  // Step 1 -> Step 2: Select Class
  const handleSelectClass = async (cls: ClassItem) => {
    setSelectedClass(cls);
    setSelectedQuarter(null);
    setSelectedSubject(null);
    setPeriodsLoading(true);
    setSubjectsLoading(true);
    setViewStep("step2_quarter");

    try {
      const periodsData = await api.get(`/api/schools/classes/${cls.id}/schedule-periods`);
      setSchedulePeriods(Array.isArray(periodsData) ? periodsData : []);
    } catch (err) {
      console.error("Failed to load schedule periods:", err);
      setSchedulePeriods([]);
    } finally {
      setPeriodsLoading(false);
    }

    try {
      const subjData = await api.get(`/api/schools/lesson-plans/class-subjects?class_id=${cls.id}`);
      setClassSubjects(Array.isArray(subjData.subjects) ? subjData.subjects : []);
      setSelectedClassIsMain(!!subjData.is_main_teacher);
    } catch (err) {
      console.error("Failed to load class subjects:", err);
      setClassSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  // Step 2 -> Step 3: Select Quarter
  const handleSelectQuarter = (period: SchedulePeriod) => {
    setSelectedQuarter(period);
    setSelectedSubject(null);
    setViewStep("step3_subject");
  };

  // Step 3 -> Step 4: Select Subject & Load Editor
  const handleSelectSubject = (subj: SubjectItem) => {
    setSelectedSubject(subj);
    if (selectedClass && selectedQuarter) {
      loadEditorData(selectedClass.id, selectedQuarter, subj.id);
    }
    setViewStep("step4_editor");
  };

  // Back Navigation Helper
  const handleGoBackStep = () => {
    if (viewStep === "step4_editor") {
      setViewStep("step3_subject");
    } else if (viewStep === "step3_subject") {
      setViewStep("step2_quarter");
    } else if (viewStep === "step2_quarter") {
      setViewStep("step1_class");
    }
  };

  // Load Fixed Schedule Slots & Saved Topics for Editor
  const loadEditorData = async (classId: number, quarter: SchedulePeriod, subjectId: number) => {
    setEditorLoading(true);
    setPasteText("");
    setActiveCellIndex(null);
    setFormulaValue("");

    try {
      // 1. Fetch weekly schedule for this class
      const schedData = await api.get(`/api/schools/classes/${classId}/schedule`);
      const subjectSlots: { dayOfWeek: number; lessonNumber: number }[] = [];
      if (Array.isArray(schedData)) {
        for (const item of schedData) {
          if (item.subject_id === Number(subjectId)) {
            subjectSlots.push({
              dayOfWeek: item.day_of_week,
              lessonNumber: item.lesson_number,
            });
          }
        }
      }
      subjectSlots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.lessonNumber - b.lessonNumber);

      if (subjectSlots.length === 0) {
        showToast("Ushbu sinf dars jadvalida tanlangan fan uchun haftalik darslar biriktirilmagan", "error");
        setFixedSlots([]);
        setTopicList([]);
        return;
      }

      // 2. Fetch holidays
      let holidaysSet = new Set<string>();
      try {
        const holData = await api.get("/api/schools/holidays");
        if (Array.isArray(holData)) {
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

      // 3. Generate Fixed Schedule Slots
      const generatedSlots: FixedScheduleSlot[] = [];
      const curDate = new Date(quarter.start_date + "T00:00:00");
      const stopDate = new Date(quarter.end_date + "T23:59:59");

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
            generatedSlots.push({
              id: `${dateStr}_${slot.lessonNumber}`,
              date: dateStr,
              displayDate: `${dd}.${mm}.${yyyy}`,
              dayLetter: wk ? wk.letter : "D",
              dayOfWeek: dayOfWeek,
              lessonNumber: slot.lessonNumber,
            });
          }
        }
        curDate.setDate(curDate.getDate() + 1);
      }

      setFixedSlots(generatedSlots);

      // 4. Fetch existing saved lesson plans from DB
      const existingMap: Record<string, string> = {};
      try {
        const existingPlans = await api.get(
          `/api/schools/lesson-plans?class_id=${classId}&subject_id=${subjectId}&start_date_from=${quarter.start_date}&start_date_to=${quarter.end_date}`
        );
        if (Array.isArray(existingPlans)) {
          existingPlans.forEach((p: any) => {
            const key = `${p.start_date}_${p.lesson_number}`;
            existingMap[key] = p.topic_name || "";
          });
        }
      } catch (err) {
        console.warn("Fetch existing plans error:", err);
      }

      // Map topics to slots
      const initialTopics = generatedSlots.map(
        (slot) => existingMap[slot.id] || ""
      );
      setTopicList(initialTopics);
    } catch (err: any) {
      showToast(err.message || "Ish rejasini yuklashda xatolik", "error");
      setFixedSlots([]);
      setTopicList([]);
    } finally {
      setEditorLoading(false);
    }
  };

  // ==========================================
  // TOPIC MANIPULATION HANDLERS (Topic-Only!)
  // ==========================================

  // Single Topic Input change
  const handleTopicChange = (index: number, val: string) => {
    setTopicList((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
    if (activeCellIndex === index) {
      setFormulaValue(val);
    }
  };

  // Formula bar change
  const handleFormulaChange = (val: string) => {
    setFormulaValue(val);
    if (activeCellIndex !== null && activeCellIndex < topicList.length) {
      setTopicList((prev) => {
        const copy = [...prev];
        copy[activeCellIndex] = val;
        return copy;
      });
    }
  };

  // Excel paste listener
  const handlePasteTopics = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    setTopicList((prev) =>
      prev.map((t, idx) => (lines[idx] !== undefined ? lines[idx] : t))
    );
    showToast(`${lines.length} ta mavzu joylashtirildi!`, "success");
  };

  // 1-Click Button Topic Merge
  const handleMergeWithNextTopic = (index: number) => {
    if (index >= topicList.length - 1) {
      showToast("Keyingi qator mavzusi mavjud emas", "error");
      return;
    }
    setTopicList((prev) => {
      const copy = [...prev];
      const t1 = copy[index]?.trim() || "";
      const t2 = copy[index + 1]?.trim() || "";
      if (!t2) return prev;
      copy[index] = t1 ? `${t1} / ${t2}` : t2;
      copy[index + 1] = "";
      return copy;
    });
    showToast("2 ta mavzu bitta dars kuni uchun birlashtirildi!", "success");
  };

  // Drag and Drop Topic Merge (Target slot gets merged topic, source slot is cleared)
  const handleDropTopic = (targetSlotIdx: number) => {
    if (draggedTopicIdx === null || draggedTopicIdx === targetSlotIdx) {
      setDraggedTopicIdx(null);
      setDragOverSlotIdx(null);
      return;
    }

    const sourceIdx = draggedTopicIdx;
    const targetIdx = targetSlotIdx;

    setTopicList((prev) => {
      const copy = [...prev];
      const sourceTopic = copy[sourceIdx]?.trim() || "";
      const targetTopic = copy[targetIdx]?.trim() || "";

      if (!sourceTopic) {
        return prev;
      }

      copy[targetIdx] = targetTopic ? `${targetTopic} / ${sourceTopic}` : sourceTopic;
      copy[sourceIdx] = "";
      return copy;
    });

    setDraggedTopicIdx(null);
    setDragOverSlotIdx(null);
    showToast("Mavzular bitta dars sanasiga birlashtirildi!", "success");
  };

  // Insert empty Topic slot at index + 1 (shifts topic names down)
  const handleInsertTopicAfter = (index: number) => {
    setTopicList((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, "");
      copy.pop(); // keep array length equal to fixedSlots
      return copy;
    });
    setActiveCellIndex(index + 1);
    setFormulaValue("");
    showToast("Yangi mavzu joyi ajratildi", "success");
  };

  // Delete Topic at index (shifts topic names up)
  const handleDeleteTopic = (index: number) => {
    setTopicList((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      copy.push("");
      return copy;
    });
    if (activeCellIndex === index) {
      setActiveCellIndex(null);
      setFormulaValue("");
    }
  };

  // Save Batch Plans to Backend
  const handleSaveBatchPlans = async () => {
    if (!selectedClass || !selectedQuarter || !selectedSubject) {
      showToast("Sinf, chorak va fan tanlanmagan", "error");
      return;
    }

    const validItems = fixedSlots
      .map((slot, idx) => ({
        start_date: slot.date,
        day_of_week: slot.dayOfWeek,
        lesson_number: slot.lessonNumber,
        topic_name: (topicList[idx] || "").trim(),
        notes: "",
      }))
      .filter((item) => item.topic_name.length > 0);

    if (validItems.length === 0) {
      showToast("Saqlash uchun kamida 1 ta mavzu kiritilgan bo'lishi kerak", "error");
      return;
    }

    setSavingBatch(true);
    try {
      const data = await api.post("/api/schools/lesson-plans/batch", {
        class_id: selectedClass.id,
        subject_id: selectedSubject.id,
        start_date_from: selectedQuarter.start_date,
        start_date_to: selectedQuarter.end_date,
        overwrite: true,
        items: validItems,
      });

      showToast(data.message || `${validItems.length} ta dars rejasi saqlandi!`, "success");
    } catch (err: any) {
      showToast(err.message || "Saqlashda xatolik yuz berdi", "error");
    } finally {
      setSavingBatch(false);
    }
  };

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

      {/* Main Header & Step Breadcrumbs Banner */}
      <div className="bg-gradient-to-r from-[#16193E] via-[#2A2B6A] to-[#16193E] rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide uppercase mb-2 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Ish Rejasi (Syllabus)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex flex-wrap items-center gap-2">
            <span>Ish Rejasi Paneli</span>
            {selectedClass && (
              <>
                <span className="text-indigo-400 font-normal text-sm">➔</span>
                <span className="bg-indigo-500/30 text-indigo-200 text-xs px-2.5 py-1 rounded-lg border border-indigo-400/30 font-bold">
                  {selectedClass.name} sinfi
                </span>
              </>
            )}
            {selectedQuarter && (
              <>
                <span className="text-indigo-400 font-normal text-sm">➔</span>
                <span className="bg-emerald-500/30 text-emerald-200 text-xs px-2.5 py-1 rounded-lg border border-emerald-400/30 font-bold">
                  {selectedQuarter.start_date} — {selectedQuarter.end_date}
                </span>
              </>
            )}
            {selectedSubject && (
              <>
                <span className="text-indigo-400 font-normal text-sm">➔</span>
                <span className="bg-purple-500/30 text-purple-200 text-xs px-2.5 py-1 rounded-lg border border-purple-400/30 font-bold">
                  {selectedSubject.name}
                </span>
              </>
            )}
          </h2>
        </div>

        {/* Action / Back Button */}
        <div className="flex items-center gap-2 shrink-0">
          {viewStep !== "step1_class" && (
            <button
              type="button"
              onClick={handleGoBackStep}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/15"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Orqaga qaytish</span>
            </button>
          )}

          {viewStep === "step4_editor" && (
            <button
              type="button"
              onClick={handleSaveBatchPlans}
              disabled={savingBatch || fixedSlots.length === 0}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D4F562] to-[#BFEA42] hover:from-[#c7ea50] hover:to-[#b0dc33] text-[#1D1E26] font-black text-xs shadow-lg shadow-[#D4F562]/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingBatch ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-[#1D1E26]" />
              )}
              <span>{savingBatch ? "Saqlanmoqda..." : "Barcha Mavzularni Saqlash"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: SINFLAR CARD KO'RINISHIDA                                         */}
      {/* ========================================================================= */}
      {viewStep === "step1_class" && (
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-zinc-900">1. Sinfni tanlang</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Ish rejasi ko'riladigan yoki kiritiladigan sinf kartochkasini tanlang
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
              Jami {myClasses.length} ta sinf
            </span>
          </div>

          {metaLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-zinc-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-xs font-medium">Sinflar yuklanmoqda...</span>
            </div>
          ) : myClasses.length === 0 ? (
            <div className="p-12 text-center bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-500 text-xs">
              Sizga biriktirilgan sinflar topilmadi. Avval admin tomonidan sinf va darslar biriktirilganiga ishonch hosil qiling.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myClasses.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => handleSelectClass(cls)}
                  className="p-6 rounded-2xl border-2 border-zinc-200/90 bg-white hover:border-[#5B50EC] hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-[#5B50EC] group-hover:text-white transition-all duration-200">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    {cls.is_main_teacher ? (
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full font-mono">
                        👑 Sinf rahbari
                      </span>
                    ) : (
                      <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full font-mono">
                        📚 Fan o'qituvchisi
                      </span>
                    )}
                  </div>
                  <div className="mt-5">
                    <h4 className="text-xl font-black text-zinc-900 group-hover:text-[#5B50EC] transition">
                      {cls.name} sinfi
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-all">
                      <span>Choraklar va fanlarni ko'rish</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: CHORAKLAR CARD KO'RINISHIDA (Strict Schedule Period Check)         */}
      {/* ========================================================================= */}
      {viewStep === "step2_quarter" && selectedClass && (
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <button
                type="button"
                onClick={() => setViewStep("step1_class")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 mb-2 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sinflarga qaytish</span>
              </button>
              <h3 className="text-base font-black text-zinc-900">2. Chorakni tanlang</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Ushbu sinf dars jadvalida belgilangan chorak / davr kartochkasini tanlang
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              Tanlangan: {selectedClass.name} sinfi
            </span>
          </div>

          {periodsLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-zinc-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-xs font-medium">Choraklar va jadval davrlari yuklanmoqda...</span>
            </div>
          ) : schedulePeriods.length === 0 ? (
            /* Strict Requirement: If no schedule period is defined, show EMPTY STATE! */
            <div className="p-12 text-center bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl space-y-3">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="text-base font-black text-zinc-800">
                Ushbu sinf uchun dars jadvali va choraklar belgilanmagan
              </h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                {selectedClass.name} sinfi uchun hali dars jadvali va choraklar kiritilmagan. Avval Dars Jadvali bo'limida ushbu sinf uchun dars jadvalini tuzing.
              </p>
              <button
                type="button"
                onClick={() => setViewStep("step1_class")}
                className="px-5 py-2.5 bg-[#5B50EC] text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition cursor-pointer"
              >
                Boshqa sinf tanlash
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {schedulePeriods.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectQuarter(p)}
                  className="p-6 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 hover:border-indigo-600 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black font-mono text-sm shadow-md">
                      {idx + 1}
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white px-2.5 py-1 rounded-full text-indigo-800 border border-indigo-200 shadow-2xs">
                      Dars Jadvali Davri
                    </span>
                  </div>
                  <div className="mt-5">
                    <h4 className="text-lg font-black text-zinc-900 group-hover:text-indigo-600 transition">
                      {idx + 1}-Chorak / Davr
                    </h4>
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-900 mt-1 bg-white/80 px-3 py-1.5 rounded-xl border border-indigo-100">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{p.start_date} — {p.end_date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: FANLAR CARD KO'RINISHIDA                                          */}
      {/* ========================================================================= */}
      {viewStep === "step3_subject" && selectedClass && selectedQuarter && (
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <button
                type="button"
                onClick={() => setViewStep("step2_quarter")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 mb-2 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Choraklarga qaytish</span>
              </button>
              <h3 className="text-base font-black text-zinc-900">3. Fanni tanlang</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {selectedClassIsMain
                  ? "Siz ushbu sinfning Sinf Rahbarisiz — sinfning barcha fanlari ko'rsatilmoqda"
                  : "Siz ushbu sinfda o'zingiz dars beradigan fan kartochkasini tanlang"}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl">
              Jami {classSubjects.length} ta fan
            </span>
          </div>

          {subjectsLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-zinc-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <span className="text-xs font-medium">Sinf fanlari yuklanmoqda...</span>
            </div>
          ) : classSubjects.length === 0 ? (
            <div className="p-12 text-center bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-500 text-xs space-y-2">
              <div>Ushbu sinf uchun biror fan topilmadi. Avval dars jadvali kiritilganini tekshiring.</div>
              <button
                type="button"
                onClick={() => setViewStep("step1_class")}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Boshqa sinf tanlash
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classSubjects.map((subj) => (
                <div
                  key={subj.id}
                  onClick={() => handleSelectSubject(subj)}
                  className="p-6 rounded-2xl border-2 border-zinc-200/90 bg-white hover:border-purple-600 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all duration-200">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-full font-mono">
                      {selectedClassIsMain ? "Sinf fani" : "Dars fangingiz"}
                    </span>
                  </div>
                  <div className="mt-5">
                    <h4 className="text-xl font-black text-zinc-900 group-hover:text-purple-600 transition">
                      {subj.name}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-all">
                      <span>Ish rejasini tahrirlash va ko'rish</span>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: INTERAKTIV ISH REJA TAHRIRLASH JADVALI (TOPIC-ONLY MANIPULATION)  */}
      {/* ========================================================================= */}
      {viewStep === "step4_editor" && selectedClass && selectedQuarter && selectedSubject && (
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4 animate-fadeIn">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
            <div>
              <button
                type="button"
                onClick={() => setViewStep("step3_subject")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 mb-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Fanlarga qaytish</span>
              </button>
              <h3 className="text-base font-black text-zinc-900">
                {selectedClass.name} sinfi • {selectedSubject.name} fani
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                Davr: {selectedQuarter.start_date} — {selectedQuarter.end_date} (Jami {fixedSlots.length} ta dars kuni)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveBatchPlans}
                disabled={savingBatch || fixedSlots.length === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{savingBatch ? "Saqlanmoqda..." : "Barcha Mavzularni Saqlash"}</span>
              </button>
            </div>
          </div>

          {editorLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Sinf dars jadvali va rejasi hisoblanmoqda...</span>
            </div>
          ) : fixedSlots.length === 0 ? (
            <div className="p-12 text-center bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-500 text-xs">
              Ushbu fan uchun dars kunlari hisoblanmadi. Avval Dars Jadvalida haftalik dars soatlari biriktirilganini tekshiring.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Excel Copy-Paste Box */}
              <div className="space-y-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-indigo-900 font-mono flex items-center gap-2">
                    <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                    <span>Excel'dan mavzular ustunini (Ctrl+V) nusxalab tashlang:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteTopics}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg cursor-pointer transition shadow-2xs"
                  >
                    Mavzularni Joylashtirish
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Excel'dan mavzular ustunini nusxalab shu yerga yuboring (Ctrl+V)..."
                  className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-xs font-mono text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-400 transition leading-relaxed"
                />
              </div>

              {/* Quick Edit Bar */}
              <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2 shrink-0 text-xs font-bold text-zinc-600 font-mono">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>Tezkor Tahrirlash:</span>
                </div>
                <input
                  type="text"
                  value={formulaValue}
                  onChange={(e) => handleFormulaChange(e.target.value)}
                  placeholder="Tanlangan qatordagi mavzu nomini shu yerda tezkor tahrirlashingiz mumkin..."
                  className="flex-1 px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono font-bold text-zinc-500">
                    Jami: {fixedSlots.length} ta dars kuni
                  </span>
                </div>
              </div>

              {/* Syllabus Table (Fixed Schedule Columns + Topic Column) */}
              <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-xs max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left text-xs text-zinc-800 border-collapse">
                  <thead className="bg-[#16193E] text-white sticky top-0 z-10 text-[10px] font-extrabold uppercase font-mono tracking-wider">
                    <tr>
                      <th className="px-3 py-3 w-10 text-center">#</th>
                      <th className="px-3 py-3 w-28">Sana (O'zgarmas)</th>
                      <th className="px-3 py-3 w-16 text-center">Kun</th>
                      <th className="px-3 py-3 w-20 text-center">Soat</th>
                      <th className="px-3 py-3">Dars Mavzusi (Tahrirlanadigan & Birlashtiriladigan)</th>
                      <th className="px-3 py-3 w-28 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-sans">
                    {fixedSlots.map((slot, idx) => {
                      const isActive = activeCellIndex === idx;
                      const isDragOver = dragOverSlotIdx === idx;
                      const currentTopic = topicList[idx] || "";

                      return (
                        <tr
                          key={slot.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragOverSlotIdx !== idx) setDragOverSlotIdx(idx);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDropTopic(idx);
                          }}
                          onClick={() => {
                            setActiveCellIndex(idx);
                            setFormulaValue(currentTopic);
                          }}
                          className={`transition cursor-pointer ${
                            isDragOver
                              ? "bg-indigo-100 border-2 border-dashed border-indigo-500"
                              : isActive
                              ? "bg-indigo-50/70"
                              : "hover:bg-zinc-50"
                          }`}
                        >
                          {/* Row # */}
                          <td className="px-3 py-2 text-center font-mono text-zinc-400 font-bold select-none">
                            {idx + 1}
                          </td>

                          {/* Fixed Date */}
                          <td className="px-3 py-2 font-mono font-bold text-zinc-800 whitespace-nowrap">
                            {slot.displayDate}
                          </td>

                          {/* Fixed Day of Week */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md font-mono font-black text-[10px] bg-zinc-100 text-zinc-700">
                              {slot.dayLetter}
                            </span>
                          </td>

                          {/* Fixed Lesson Number */}
                          <td className="px-3 py-2 text-center font-mono font-extrabold text-indigo-700 whitespace-nowrap">
                            {slot.lessonNumber}-dars
                          </td>

                          {/* Editable & Draggable Topic Cell */}
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  setDraggedTopicIdx(idx);
                                }}
                                title="Mavzuni boshqa sanaga sudrab o'tkazish yoki birlashtirish"
                                className="p-1 rounded-md text-zinc-300 hover:text-indigo-600 hover:bg-indigo-50 cursor-grab active:cursor-grabbing shrink-0"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <input
                                type="text"
                                value={currentTopic}
                                onChange={(e) => handleTopicChange(idx, e.target.value)}
                                placeholder="Dars mavzusini kiriting..."
                                className={`w-full py-1 text-xs outline-none transition font-medium ${
                                  isActive
                                    ? "font-bold text-indigo-900 border-b-2 border-indigo-600 bg-white"
                                    : "bg-transparent border-b border-transparent focus:border-indigo-400 text-zinc-800"
                                }`}
                              />
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInsertTopicAfter(idx);
                                }}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 transition cursor-pointer"
                                title="Yangi mavzu joyi ajratish"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTopic(idx);
                                }}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition cursor-pointer"
                                title="Mavzuni o'chirish"
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
