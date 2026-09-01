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
  isException?: boolean;
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
      setSelectedSubject(null);
    } else if (viewStep === "step2_quarter") {
      setViewStep("step1_class");
      setSelectedQuarter(null);
      setSelectedSubject(null);
    }
  };

  // Helper for explicitly jumping steps (used by back buttons in UI)
  const jumpToStep = (step: typeof viewStep) => {
    setViewStep(step);
    if (step === "step1_class") {
      setSelectedClass(null);
      setSelectedQuarter(null);
      setSelectedSubject(null);
    } else if (step === "step2_quarter") {
      setSelectedQuarter(null);
      setSelectedSubject(null);
    } else if (step === "step3_subject") {
      setSelectedSubject(null);
    }
  };

  // Load Fixed Schedule Slots & Saved Topics for Editor from Backend
  const loadEditorData = async (classId: number, quarter: SchedulePeriod, subjectId: number) => {
    setEditorLoading(true);
    setPasteText("");
    setActiveCellIndex(null);
    setFormulaValue("");

    try {
      // Fetch dynamically calculated and deduplicated slots directly from backend
      const res = await api.get(
        `/api/schools/lesson-plans/slots?class_id=${classId}&subject_id=${subjectId}&start_date=${quarter.start_date}&end_date=${quarter.end_date}`
      );

      const slots = Array.isArray(res?.slots) ? res.slots : [];

      if (slots.length === 0) {
        showToast("Ushbu chorakda tanlangan fan uchun darslar topilmadi", "error");
        setFixedSlots([]);
        setTopicList([]);
        setPasteText("");
        return;
      }

      const mappedSlots: FixedScheduleSlot[] = slots.map((s: any) => ({
        id: s.id,
        date: s.date,
        displayDate: s.display_date,
        dayLetter: s.day_letter,
        dayOfWeek: s.day_of_week,
        lessonNumber: s.lesson_number,
        isException: s.is_exception,
      }));

      const topics = slots.map((s: any) => s.topic_name || "");

      setFixedSlots(mappedSlots);
      setTopicList(topics);
      // Pre-fill the top textarea box so user can edit/view/paste topics immediately!
      setPasteText(topics.join("\n"));
    } catch (err: any) {
      showToast(err.message || "Ish rejasini yuklashda xatolik", "error");
      setFixedSlots([]);
      setTopicList([]);
      setPasteText("");
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
      setPasteText(copy.join("\n"));
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
        setPasteText(copy.join("\n"));
        return copy;
      });
    }
  };

  // Excel paste listener / Apply textarea topics
  const handlePasteTopics = () => {
    if (!pasteText.trim() && topicList.length === 0) return;
    const lines = pasteText.split(/\r?\n/).map((l) => l.trim());

    setTopicList((prev) => {
      const updated = prev.map((t, idx) => (lines[idx] !== undefined ? lines[idx] : t));
      return updated;
    });
    const count = lines.filter((l) => l.length > 0).length;
    showToast(`${count} ta mavzu joylashtirildi!`, "success");
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
      setPasteText(copy.join("\n"));
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
      setPasteText(copy.join("\n"));
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
      setPasteText(copy.join("\n"));
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
      setPasteText(copy.join("\n"));
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
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-none shadow-xl border text-sm font-semibold transition-all duration-300 animate-slideDown ${
            toastMessage.type === "success"
              ? "bg-[#1E2B42] text-white border-neutral-700 shadow-neutral-900/30"
              : "bg-[#A51C30] text-white border-rose-900 shadow-rose-900/30"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Header & Step Breadcrumbs Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4 mb-4">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1E2B42] flex items-center gap-2 flex-wrap leading-tight">
          <span>Ish Rejasi Paneli</span>
          
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            {selectedClass && (
              <>
                <span className="text-slate-400 font-sans text-sm mx-1">&rarr;</span>
                <span className="font-sans text-[13px] sm:text-sm font-semibold bg-slate-100 border border-neutral-200 text-slate-700 px-2 py-0.5">
                  {selectedClass.name} sinfi
                </span>
              </>
            )}

            {selectedQuarter && (
              <>
                <span className="text-slate-400 font-sans text-sm mx-1">&rarr;</span>
                <span className="font-sans text-[13px] sm:text-sm font-semibold bg-slate-100 border border-neutral-200 text-slate-700 px-2 py-0.5">
                  {selectedQuarter.start_date} - {selectedQuarter.end_date}
                </span>
              </>
            )}

            {selectedSubject && (
              <>
                <span className="text-slate-400 font-sans text-sm mx-1">&rarr;</span>
                <span className="font-sans text-[13px] sm:text-sm font-semibold bg-[#1E2B42] border border-[#1E2B42] text-white px-2 py-0.5">
                  {selectedSubject.name}
                </span>
              </>
            )}
          </div>
        </h2>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: SINFLAR CARD KO'RINISHIDA                                         */}
      {/* ========================================================================= */}
      {viewStep === "step1_class" && (
        <div className="bg-white rounded-none border border-neutral-200 p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">1. Sinfni tanlang</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ish rejasi ko'riladigan yoki kiritiladigan sinf kartochkasini tanlang
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-none border border-neutral-200">
              Jami {myClasses.length} ta sinf
            </span>
          </div>

          {metaLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
              <span className="text-xs font-medium">Sinflar yuklanmoqda...</span>
            </div>
          ) : myClasses.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border border-dashed border-neutral-300 rounded-none text-slate-500 text-xs">
              Sizga biriktirilgan sinflar topilmadi. Avval admin tomonidan sinf va darslar biriktirilganiga ishonch hosil qiling.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myClasses.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => handleSelectClass(cls)}
                  className="p-6 rounded-none border border-neutral-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-none bg-white border border-neutral-200 text-slate-700 flex items-center justify-center group-hover:bg-[#1E2B42] group-hover:text-white group-hover:border-[#1E2B42] transition-all duration-200">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    {cls.is_main_teacher ? (
                      <span className="text-[10px] font-bold bg-[#A51C30]/10 text-[#A51C30] border border-[#A51C30]/20 px-2.5 py-1 rounded-none font-sans">
                        Sinf rahbari
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 border border-neutral-300 px-2.5 py-1 rounded-none font-sans">
                        Fan o'qituvchisi
                      </span>
                    )}
                  </div>
                  <div className="mt-5">
                    <h4 className="text-xl font-bold text-slate-900 group-hover:text-[#1E2B42] transition font-serif">
                      {cls.name} sinfi
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-all">
                      <span>Choraklar va fanlarni ko'rish</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1E2B42]" />
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
        <div className="bg-white rounded-none border border-neutral-200 p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <button
                type="button"
                onClick={() => jumpToStep("step1_class")}
                className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-[#A51C30] hover:text-red-900 mb-4 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Sinflarga qaytish</span>
              </button>
              <h3 className="text-base font-bold text-slate-900 font-serif">2. Chorakni tanlang</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ushbu sinf dars jadvalida belgilangan chorak / davr kartochkasini tanlang
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-neutral-200 px-3 py-1.5 rounded-none">
              Tanlangan: {selectedClass.name} sinfi
            </span>
          </div>

          {periodsLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
              <span className="text-xs font-medium">Choraklar va jadval davrlari yuklanmoqda...</span>
            </div>
          ) : schedulePeriods.length === 0 ? (
            /* Strict Requirement: If no schedule period is defined, show EMPTY STATE! */
            <div className="p-12 text-center bg-slate-50 border border-dashed border-neutral-300 rounded-none space-y-3">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                Ushbu sinf uchun dars jadvali va choraklar belgilanmagan
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {selectedClass.name} sinfi uchun hali dars jadvali va choraklar kiritilmagan. Avval Dars Jadvali bo'limida ushbu sinf uchun dars jadvalini tuzing.
              </p>
              <button
                type="button"
                onClick={() => jumpToStep("step1_class")}
                className="px-5 py-2.5 bg-[#1E2B42] text-white font-bold text-xs rounded-none hover:bg-slate-800 transition cursor-pointer"
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
                  className="p-6 rounded-none border border-neutral-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-none bg-white border border-neutral-200 text-slate-700 flex items-center justify-center font-bold font-mono text-sm group-hover:bg-[#1E2B42] group-hover:text-white transition-all">
                      {idx + 1}
                    </div>
                    <span className="text-[10px] font-sans font-bold bg-white px-2.5 py-1 rounded-none text-slate-600 border border-neutral-200">
                      Dars Jadvali Davri
                    </span>
                  </div>
                  <div className="mt-5">
                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-[#1E2B42] transition font-serif">
                      {idx + 1}-Chorak / Davr
                    </h4>
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 mt-2 bg-white px-3 py-1.5 rounded-none border border-neutral-200">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.start_date} &mdash; {p.end_date}</span>
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
        <div className="bg-white rounded-none border border-neutral-200 p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <button
                type="button"
                onClick={() => jumpToStep("step2_quarter")}
                className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-[#A51C30] hover:text-red-900 mb-4 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Choraklarga qaytish</span>
              </button>
              <h3 className="text-base font-bold text-slate-900 font-serif">3. Fanni tanlang</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedClassIsMain
                  ? "Siz ushbu sinfning Sinf Rahbarisiz \u2014 sinfning barcha fanlari ko'rsatilmoqda"
                  : "Siz ushbu sinfda o'zingiz dars beradigan fan kartochkasini tanlang"}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-neutral-200 px-3 py-1.5 rounded-none">
              Jami {classSubjects.length} ta fan
            </span>
          </div>

          {subjectsLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
              <span className="text-xs font-medium">Sinf fanlari yuklanmoqda...</span>
            </div>
          ) : classSubjects.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border border-dashed border-neutral-300 rounded-none text-slate-500 text-xs space-y-2">
              <div>Ushbu sinf uchun biror fan topilmadi. Avval dars jadvali kiritilganini tekshiring.</div>
              <button
                type="button"
                onClick={() => jumpToStep("step1_class")}
                className="px-4 py-2 bg-[#1E2B42] text-white rounded-none font-bold text-xs cursor-pointer hover:bg-slate-800 transition"
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
                  className="p-6 rounded-none border border-neutral-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-none bg-white border border-neutral-200 text-slate-700 flex items-center justify-center group-hover:bg-[#1E2B42] group-hover:text-white group-hover:border-[#1E2B42] transition-all duration-200">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold bg-white text-slate-600 border border-neutral-200 px-2.5 py-1 rounded-none font-sans">
                      {selectedClassIsMain ? "Sinf fani" : "Dars fangingiz"}
                    </span>
                  </div>
                  <div className="mt-5">
                    <h4 className="text-xl font-bold text-slate-900 group-hover:text-[#1E2B42] transition font-serif">
                      {subj.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-all">
                      <span>Ish rejasini tahrirlash va ko'rish</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1E2B42]" />
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
        <div className="bg-transparent sm:bg-white rounded-none border-none sm:border sm:border-neutral-200 p-0 sm:p-6 space-y-4 animate-fadeIn">
          {/* Back Button Only */}
          <button
            type="button"
            onClick={() => jumpToStep("step3_subject")}
            className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-[#A51C30] hover:text-red-900 mb-2 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Fanlarga qaytish</span>
          </button>

          {editorLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
              <span className="text-xs font-medium">Sinf dars jadvali va rejasi hisoblanmoqda...</span>
            </div>
          ) : fixedSlots.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border border-dashed border-neutral-300 rounded-none text-slate-500 text-xs">
              Ushbu fan uchun dars kunlari hisoblanmadi. Avval Dars Jadvalida haftalik dars soatlari biriktirilganini tekshiring.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Excel Copy-Paste Box */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-none border border-neutral-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 font-mono flex items-center gap-2">
                    <ClipboardPaste className="w-4 h-4 text-slate-500" />
                    <span>Excel'dan mavzular ustunini (Ctrl+V) nusxalab tashlang:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteTopics}
                    className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px] rounded-none cursor-pointer transition border border-neutral-300"
                  >
                    Mavzularni Joylashtirish
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Excel'dan mavzular ustunini nusxalab shu yerga yuboring (Ctrl+V)..."
                  className="w-full p-3 bg-white border border-neutral-300 rounded-none text-xs font-mono text-slate-900 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#1E2B42] transition leading-relaxed"
                />
              </div>

              {/* Quick Edit Bar */}
              <div className="bg-slate-50 p-3 rounded-none border border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2 shrink-0 text-xs font-bold text-slate-600 font-mono">
                  <Edit3 className="w-4 h-4 text-slate-500" />
                  <span>Tezkor Tahrirlash:</span>
                </div>
                <input
                  type="text"
                  value={formulaValue}
                  onChange={(e) => handleFormulaChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const nextIdx = (activeCellIndex ?? -1) + 1;
                      if (nextIdx < fixedSlots.length) {
                        setActiveCellIndex(nextIdx);
                        setFormulaValue(topicList[nextIdx] || "");
                        const nextInput = document.getElementById(`lesson-plan-topic-input-${nextIdx}`);
                        if (nextInput) {
                          (nextInput as HTMLInputElement).focus();
                          (nextInput as HTMLInputElement).select();
                        }
                      }
                    }
                  }}
                  placeholder="Tanlangan qatordagi mavzu nomini shu yerda tezkor tahrirlashingiz mumkin..."
                  className="flex-1 px-3.5 py-2 bg-white border border-neutral-300 rounded-none text-xs font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-[#1E2B42] transition"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    Jami: {fixedSlots.length} ta dars kuni
                  </span>
                </div>
              </div>

              {/* Syllabus Table (Fixed Schedule Columns + Topic Column) */}
              <div className="border border-neutral-200 rounded-none bg-white overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800 border-separate border-spacing-0">
                  <thead className="text-slate-700 sticky top-0 z-20 text-[10px] font-bold uppercase font-sans tracking-wider shadow-sm">
                    <tr>
                      <th className="px-3 py-3 w-10 text-center bg-slate-100 outline outline-1 outline-neutral-200 border-b border-neutral-300">#</th>
                      <th className="px-3 py-3 w-28 sticky left-0 z-30 bg-slate-100 outline outline-1 outline-neutral-200 border-b border-neutral-300">Sana</th>
                      <th className="px-3 py-3 w-12 sm:w-16 text-center bg-slate-100 outline outline-1 outline-neutral-200 border-b border-neutral-300">Kun</th>
                      <th className="px-3 py-3 w-12 sm:w-20 text-center bg-slate-100 outline outline-1 outline-neutral-200 border-b border-neutral-300">Soat</th>
                      <th className="px-3 py-3 min-w-[200px] sm:min-w-auto bg-slate-100 outline outline-1 outline-neutral-200 border-b border-neutral-300">Dars Mavzusi</th>
                      <th className="px-3 py-3 w-28 text-right bg-slate-100 outline outline-1 outline-neutral-200 border-b border-neutral-300">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="font-sans">
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
                              ? "bg-slate-200 border-2 border-dashed border-slate-500"
                              : isActive
                              ? "bg-slate-100"
                              : "bg-white hover:bg-slate-50"
                          }`}
                        >
                          {/* Row # */}
                          <td className="px-3 py-2 text-center font-mono text-slate-400 font-bold select-none border-b border-neutral-200 border-r border-neutral-100">
                            {idx + 1}
                          </td>

                          {/* Fixed Date */}
                          <td className="px-3 py-2 font-mono font-bold text-slate-800 whitespace-nowrap border-b border-neutral-200 border-r border-neutral-100 sticky left-0 z-10 bg-inherit shadow-[1px_0_0_0_#e5e5e5]">
                            {slot.displayDate}
                          </td>

                          {/* Fixed Day of Week */}
                          <td className="px-3 py-2 text-center whitespace-nowrap border-b border-neutral-200 border-r border-neutral-100">
                            <span className="px-2 py-0.5 rounded-none font-sans font-bold text-[10px] bg-slate-200 text-slate-700">
                              {slot.dayLetter}
                            </span>
                          </td>

                          {/* Fixed Lesson Number */}
                          <td className="px-3 py-2 text-center font-mono font-bold text-slate-700 whitespace-nowrap border-b border-neutral-200 border-r border-neutral-100">
                            <div className="flex items-center justify-center gap-1.5">
                              <span>{slot.lessonNumber}<span className="hidden sm:inline">-dars</span></span>
                              {slot.isException && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-none" title="Dars jadvalidagi o'zgarish (istisno)">
                                  o'zgarish
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Editable & Draggable Topic Cell */}
                          <td className="px-3 py-2 border-b border-neutral-200 border-r border-neutral-100">
                            <div className="flex items-center gap-2">
                              <div
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  setDraggedTopicIdx(idx);
                                }}
                                title="Silljitish uchun torting"
                                className="cursor-grab active:cursor-grabbing p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-none transition"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <input
                                id={`lesson-plan-topic-input-${idx}`}
                                type="text"
                                value={currentTopic}
                                onFocus={() => {
                                  setActiveCellIndex(idx);
                                  setFormulaValue(currentTopic);
                                }}
                                onChange={(e) => handleTopicChange(idx, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const nextInput = document.getElementById(`lesson-plan-topic-input-${idx + 1}`);
                                    if (nextInput) {
                                      (nextInput as HTMLInputElement).focus();
                                      (nextInput as HTMLInputElement).select();
                                    }
                                  } else if (e.key === "ArrowDown") {
                                    const nextInput = document.getElementById(`lesson-plan-topic-input-${idx + 1}`);
                                    if (nextInput) {
                                      (nextInput as HTMLInputElement).focus();
                                    }
                                  } else if (e.key === "ArrowUp") {
                                    const prevInput = document.getElementById(`lesson-plan-topic-input-${idx - 1}`);
                                    if (prevInput) {
                                      (prevInput as HTMLInputElement).focus();
                                    }
                                  }
                                }}
                                placeholder="Dars mavzusini kiriting..."
                                className={`w-full py-1 text-xs outline-none transition font-medium ${
                                  isActive
                                    ? "font-bold text-[#1E2B42] border-b-2 border-[#1E2B42] bg-transparent"
                                    : "bg-transparent border-b border-transparent focus:border-slate-400 text-slate-800"
                                }`}
                              />
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-2 text-right whitespace-nowrap border-b border-neutral-200">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInsertTopicAfter(idx);
                                }}
                                className="p-1.5 rounded-none text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
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
                                className="p-1.5 rounded-none text-[#A51C30] hover:bg-[#A51C30]/10 transition cursor-pointer"
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

          {/* Floating Action Button for Quick Saving while scrolling */}
          <div className="fixed bottom-6 right-8 z-40">
            <button
              type="button"
              onClick={handleSaveBatchPlans}
              disabled={savingBatch || fixedSlots.length === 0}
              className="px-6 py-3 rounded-none bg-[#1E2B42] hover:bg-slate-800 active:scale-95 text-white font-bold text-xs shadow-xl border border-neutral-300 transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {savingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{savingBatch ? "Saqlanmoqda..." : "Barcha Mavzularni Saqlash"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
