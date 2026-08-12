import React, { useState, useEffect, useRef } from "react";
import { ClassItem } from "./types";
import { TargetPresets } from "@/components/TargetPresets";
import SmartCalendarModal, { getMondayOfDate, formatDateISO, formatWeekRangeLabel } from "@/components/SmartCalendarModal";
import CustomDialogModal from "@/components/CustomDialogModal";
import { Sparkles, Calendar, X, Search, Check, Trash2, ArrowLeft, ArrowRight, Eye, UserCheck, ShieldAlert, CheckCircle2, ChevronRight, Sliders, History, RotateCcw, Save, Bot, FileText, SlidersHorizontal, Layers, Cpu } from "lucide-react";

interface GroupedWeekItem {
  year: number;
  week_number: number;
  start_date: string;
  end_date: string;
  report_count: number;
}

interface AdminStudentReportItem {
  id: string;
  student_id: number;
  year: number;
  week_number: number;
  start_date: string;
  end_date: string;
  report_text: string;
  summary_json?: {
    average_grade?: number;
    prev_average_grade?: number;
    grade_trend?: string;
    total_grades?: number;
    books_read_count?: number;
  };
  created_at: string;
  student_name: string;
  class_name: string;
}

interface AIReportsSectionProps {
  token: string;
  API_URL: string;
  classes: ClassItem[];
}

export default function AIReportsSection({ token, API_URL, classes }: AIReportsSectionProps) {
  // Views: "grouped" (list of week folders) | "detail" (students in selected week)
  const [viewMode, setViewMode] = useState<"grouped" | "detail">("grouped");
  const [selectedWeek, setSelectedWeek] = useState<GroupedWeekItem | null>(null);

  // Grouped list
  const [groupedWeeks, setGroupedWeeks] = useState<GroupedWeekItem[]>([]);
  const [groupedLoading, setGroupedLoading] = useState<boolean>(true);

  // Detail student reports list
  const [reports, setReports] = useState<AdminStudentReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [previewReport, setPreviewReport] = useState<AdminStudentReportItem | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);

  // Generate Modal States
  const [genClassId, setGenClassId] = useState<string>("");
  const [genStudentSearch, setGenStudentSearch] = useState<string>("");
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState<boolean>(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [generating, setGenerating] = useState<boolean>(false);
  const [genStatusMessage, setGenStatusMessage] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Week selection states for report generation
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(formatDateISO(getMondayOfDate(new Date())));
  const [selectedWeekLabel, setSelectedWeekLabel] = useState<string>(formatWeekRangeLabel(getMondayOfDate(new Date())));

  // Confirm Dialog State for deletion
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // AI Instructions & Settings States
  const [isAISettingsOpen, setIsAISettingsOpen] = useState<boolean>(false);
  const [aiSettingsLoading, setAISettingsLoading] = useState<boolean>(false);
  const [aiSettingsSaving, setAISettingsSaving] = useState<boolean>(false);
  const [systemInstructionText, setSystemInstructionText] = useState<string>("");
  const [maxTokensVal, setMaxTokensVal] = useState<number>(1000);
  const [temperatureVal, setTemperatureVal] = useState<number>(0.7);
  const [changeReasonText, setChangeReasonText] = useState<string>("");

  // AI Prompt History States
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  const storyScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setSystemInstructionText((prev) => prev + " " + tag);
      setToastMessage(`Teg promptga qo'shildi: ${tag}`);
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const start = textarea.selectionStart ?? systemInstructionText.length;
    const end = textarea.selectionEnd ?? systemInstructionText.length;
    const text = systemInstructionText;

    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + tag + after;

    setSystemInstructionText(newText);
    setToastMessage(`Teg promptga qo'shildi: ${tag}`);
    setTimeout(() => setToastMessage(null), 2500);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 10);
  };

  const resetGenerateModal = () => {
    setIsGenerateModalOpen(false);
    setGenClassId("");
    setSelectedStudentIds([]);
    setGenStudentSearch("");
    setGenStatusMessage("");
    setGenerating(false);
  };

  // Fetch AI Instruction Settings
  const fetchAIInstruction = async () => {
    setAISettingsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schools/admin/ai-instructions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-School-ID": localStorage.getItem("school_id") || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.instruction) {
          setSystemInstructionText(data.instruction.system_instruction || "");
          setMaxTokensVal(data.instruction.max_tokens || 1000);
          setTemperatureVal(data.instruction.temperature || 0.7);
        }
      }
    } catch (err) {
      console.error("Error fetching AI instruction:", err);
    } finally {
      setAISettingsLoading(false);
    }
  };

  // Save AI Instruction Settings
  const handleSaveAIInstruction = async () => {
    if (!systemInstructionText.trim()) {
      setToastMessage("System Instruction matni bo'sh bo'lishi mumkin emas!");
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    setAISettingsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/schools/admin/ai-instructions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-School-ID": localStorage.getItem("school_id") || "",
        },
        body: JSON.stringify({
          title: "Haftalik Pedagogik Tahlil Prompti",
          system_instruction: systemInstructionText,
          max_tokens: Number(maxTokensVal),
          temperature: Number(temperatureVal),
          change_reason: changeReasonText.trim() || "Admin AI prompt sozlamalarini yangiladi",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setToastMessage(data.message || "AI Prompt sozlamalari saqlandi!");
        setTimeout(() => setToastMessage(null), 4000);
        setChangeReasonText("");
        setIsAISettingsOpen(false);
      } else {
        setToastMessage(`Xatolik: ${data.error || "Saqlashda xatolik"}`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err: any) {
      setToastMessage(`Server bilan bog'lanishda xatolik: ${err.message || err}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setAISettingsSaving(false);
    }
  };

  // Fetch AI Instruction History
  const fetchAIInstructionHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schools/admin/ai-instructions/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-School-ID": localStorage.getItem("school_id") || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error fetching AI instruction history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Revert to History Version
  const handleRevertInstruction = async (logId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/schools/admin/ai-instructions/revert/${logId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-School-ID": localStorage.getItem("school_id") || "",
        },
      });

      const data = await res.json();
      if (res.ok) {
        setToastMessage(data.message || `Version #${logId} ga qaytarildi!`);
        setTimeout(() => setToastMessage(null), 4000);
        setIsHistoryOpen(false);
        fetchAIInstruction();
      } else {
        setToastMessage(`Xatolik: ${data.error || "Promptni qaytarishda xatolik"}`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err: any) {
      setToastMessage(`Ulanishda xatolik: ${err.message || err}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isHistoryOpen) {
          setIsHistoryOpen(false);
        } else if (isAISettingsOpen) {
          setIsAISettingsOpen(false);
        } else if (isCalendarOpen) {
          setIsCalendarOpen(false);
        } else if (isGenerateModalOpen) {
          resetGenerateModal();
        } else if (previewReport) {
          setPreviewReport(null);
        } else if (confirmDialog?.isOpen) {
          setConfirmDialog(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHistoryOpen, isAISettingsOpen, isCalendarOpen, isGenerateModalOpen, previewReport, confirmDialog]);

  // Reset active story index when opening report preview
  useEffect(() => {
    if (previewReport) {
      setActiveStoryIndex(0);
    }
  }, [previewReport]);

  // 1. Fetch Grouped Weeks
  const fetchGroupedWeeks = async () => {
    setGroupedLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schools/admin/ai-reports/grouped`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-School-ID": localStorage.getItem("school_id") || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setGroupedWeeks(data.groups || []);
      }
    } catch (err) {
      console.error("Error fetching grouped weeks:", err);
    } finally {
      setGroupedLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupedWeeks();
  }, [token, API_URL]);

  // 2. Fetch Detail Student Reports for Selected Week
  const fetchReportsByWeek = async () => {
    if (!selectedWeek) return;
    setReportsLoading(true);
    try {
      let query = `year=${selectedWeek.year}&week_number=${selectedWeek.week_number}&page=${page}&limit=10`;
      if (selectedClassId) query += `&class_id=${selectedClassId}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(`${API_URL}/api/schools/admin/ai-reports/by-week?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-School-ID": localStorage.getItem("school_id") || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setTotalPages(data.total_pages || 1);
        setTotalCount(data.total_count || 0);
      }
    } catch (err) {
      console.error("Error fetching reports by week:", err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "detail" && selectedWeek) {
      fetchReportsByWeek();
    }
  }, [viewMode, selectedWeek, page, selectedClassId, search, token, API_URL]);

  // Fetch Students for Generate Modal
  useEffect(() => {
    if (!isGenerateModalOpen) return;
    const fetchStudents = async () => {
      setStudentsLoading(true);
      try {
        let url = `${API_URL}/api/schools/users?role=STUDENT`;
        if (genClassId && genClassId !== "ALL") url += `&class_id=${genClassId}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-School-ID": localStorage.getItem("school_id") || "",
          },
        });
        if (res.ok) {
          const data = await res.json();
          const rawList = Array.isArray(data) ? data : data.users || [];
          const formatted = rawList.map((u: any) => ({
            ...u,
            id: u.student_id || u.id,
          }));
          setStudentsList(formatted);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, [isGenerateModalOpen, genClassId, token, API_URL]);

  // Handle Admin Batch Generate
  const handleBatchGenerate = async () => {
    setGenerating(true);
    setGenStatusMessage("Gemini AI hisobotlari generatsiya qilinmoqda...");
    try {
      const classIdParam = genClassId && genClassId !== "ALL" ? Number(genClassId) : null;
      const res = await fetch(`${API_URL}/api/schools/admin/ai-reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-School-ID": localStorage.getItem("school_id") || "",
        },
        body: JSON.stringify({
          student_ids: selectedStudentIds,
          class_id: classIdParam,
          target_date: selectedWeekStart,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Server xatoligi (${res.status}): ${text || "Bo'sh javob olinmadi"}`);
      }

      if (res.ok) {
        const msg = data.message || "Generatsiya muvaffaqiyatli yakunlandi!";
        setGenStatusMessage(msg);
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 5000);
        setTimeout(() => {
          resetGenerateModal();
          fetchGroupedWeeks();
          if (selectedWeek) fetchReportsByWeek();
        }, 1000);
      } else {
        const errMsg = `Xatolik: ${data.error || "Generatsiya qilishda muammo yuz berdi"}`;
        setGenStatusMessage(errMsg);
        setToastMessage(errMsg);
        setTimeout(() => setToastMessage(null), 5000);
        setGenerating(false);
      }
    } catch (err: any) {
      const errMsg = `Xatolik: ${err.message || "Ulanishda xato"}`;
      setGenStatusMessage(errMsg);
      setToastMessage(errMsg);
      setTimeout(() => setToastMessage(null), 5000);
      setGenerating(false);
    }
  };

  const handleDeleteWeek = (e: React.MouseEvent, week: GroupedWeekItem) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: "Haftalik hisobotlarni o'chirish",
      message: `${week.year}-yil ${week.week_number}-haftaga tegishli barcha (${week.report_count} ta) AI hisobotlarni o'chirmoqchimisiz?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`${API_URL}/api/schools/admin/ai-reports/week?year=${week.year}&week_number=${week.week_number}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "X-School-ID": localStorage.getItem("school_id") || "",
            },
          });

          if (res.ok) {
            const data = await res.json();
            setToastMessage(data.message || "Hafta hisobotlari o'chirildi!");
            setTimeout(() => setToastMessage(null), 4000);
            fetchGroupedWeeks();
          } else {
            setToastMessage("Haftani o'chirishda xatolik yuz berdi");
            setTimeout(() => setToastMessage(null), 4000);
          }
        } catch (err) {
          console.error("Error deleting week reports:", err);
          setToastMessage("Server bilan bog'lanishda xatolik");
          setTimeout(() => setToastMessage(null), 4000);
        }
      },
    });
  };

  const handleDeleteSingleReport = (e: React.MouseEvent, reportId: string, studentName: string) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: "Hisobotni o'chirish",
      message: `${studentName} o'quvchining AI hisobotini o'chirmoqchimisiz?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`${API_URL}/api/schools/admin/ai-reports/${reportId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "X-School-ID": localStorage.getItem("school_id") || "",
            },
          });

          if (res.ok) {
            setToastMessage("O'quvchi hisoboti o'chirildi!");
            setTimeout(() => setToastMessage(null), 4000);
            fetchReportsByWeek();
            fetchGroupedWeeks();
          } else {
            setToastMessage("Hisobotni o'chirishda xatolik yuz berdi");
            setTimeout(() => setToastMessage(null), 4000);
          }
        } catch (err) {
          console.error("Error deleting report:", err);
          setToastMessage("Server bilan bog'lanishda xatolik");
          setTimeout(() => setToastMessage(null), 4000);
        }
      },
    });
  };

  // Helper to parse markdown into story sections cleanly
  const parseMarkdownSections = (text: string) => {
    if (!text) return [];
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");

    // Check if text uses explicit ---SECTION:--- markers
    if (cleanText.includes("---SECTION:")) {
      const parts = cleanText.split(/---SECTION:\s*/g).filter(s => s.trim().length > 0);
      return parts.map((part) => {
        const lines = part.split("\n").filter(l => l.trim().length > 0);
        let title = lines[0]?.replace(/---/g, "").replace(/\*\*/g, "").trim() || "Bo'lim";
        const bodyLines = lines.slice(1).map(l => l.replace(/\*\*/g, "").trim());
        return { title, bodyLines, fullContent: bodyLines.join("\n") };
      });
    }

    // Fallback parsing for legacy reports
    const sectionNames = ["HAFTALIK XULOSA", "DINAMIKA TAHLILI", "FANLAR VA KITOBXONLIK", "OTA-ONAGA AMALIY TAVSIYALAR"];
    const rawBlocks = cleanText.split(/(?=\*\*(?:Haftalik|O'sish|Fanlar|Ota-onaga)[^*]+\*\*)/g).filter(s => s.trim().length > 0);

    return rawBlocks.map((block, idx) => {
      const lines = block.split("\n").filter(l => l.trim().length > 0);
      const titleLine = lines[0] || sectionNames[idx] || `Bo'lim ${idx + 1}`;
      const title = titleLine.replace(/\*\*/g, "").replace(/^#+\s*/, "").replace(/^[0-9]\.\s*/, "").trim();
      const bodyLines = lines.slice(1).map(l => l.replace(/\*\*/g, "").trim());
      return { title, bodyLines, fullContent: bodyLines.join("\n") };
    });
  };

  const scrollToStory = (index: number) => {
    if (!storyScrollRef.current) return;
    const container = storyScrollRef.current;
    const childHeight = container.clientHeight;
    container.scrollTo({
      top: index * childHeight,
      behavior: "smooth",
    });
    setActiveStoryIndex(index);
  };

  const handleStoryScroll = () => {
    if (!storyScrollRef.current) return;
    const container = storyScrollRef.current;
    const childHeight = container.clientHeight;
    const newIndex = Math.round(container.scrollTop / childHeight);
    if (newIndex !== activeStoryIndex && newIndex >= 0) {
      setActiveStoryIndex(newIndex);
    }
  };

  const filteredStudents = studentsList.filter((s) => {
    if (!genStudentSearch.trim()) return true;
    const fullName = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
    return fullName.includes(genStudentSearch.trim().toLowerCase());
  });

  const displayStudents = genStudentSearch.trim() ? filteredStudents : filteredStudents.slice(0, 15);

  return (
    <div className="space-y-6 font-sans select-none relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-lg w-full px-4">
          <div className="bg-[#1D1E26] text-white px-6 py-4 rounded-2xl shadow-2xl border border-emerald-400/80 font-black text-sm flex items-center justify-between gap-3 animate-bounce">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white font-black text-base cursor-pointer ml-3"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-[#1D1E26] text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4F562] text-[#1D1E26] text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#1D1E26]" />
            Gemini AI Tahlilchi
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">AI Hisobotlar Boshqaruvi</h2>
          <p className="text-xs text-slate-400">
            Farzandlar o'zlashtirishi, xulqi va kitobxonligi bo'yicha sun'iy intellekt haftalik feedbacklari
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              fetchAIInstruction();
              setIsAISettingsOpen(true);
            }}
            className="px-5 py-3 rounded-2xl bg-slate-800 text-white hover:bg-slate-700 font-extrabold text-xs tracking-wide shadow-lg transition cursor-pointer flex items-center gap-2 border border-slate-700"
          >
            <Sliders className="w-4 h-4 text-[#D4F562]" />
            <span>AI Prompt & Sozlamalar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedStudentIds([]);
              setGenClassId("");
              setGenStudentSearch("");
              setGenStatusMessage("");
              setIsGenerateModalOpen(true);
            }}
            className="px-5 py-3 rounded-2xl bg-[#D4F562] text-[#1D1E26] font-extrabold text-xs tracking-wide shadow-lg shadow-lime-500/10 hover:bg-[#c2e84d] transition cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Yangi AI Hisobot Yaratish</span>
          </button>
        </div>
      </div>

      {/* Main View: Grouped Weeks Folders */}
      {viewMode === "grouped" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#1D1E26] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Haftalik Guruhlangan Hisobotlar
            </h3>
            <span className="text-xs font-bold text-slate-500">
              Jami: {groupedWeeks.length} ta hafta
            </span>
          </div>

          {groupedLoading ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#D4F562] border-t-[#1D1E26] rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Haftalik hisobotlar ro'yxati yuklanmoqda...</p>
            </div>
          ) : groupedWeeks.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Hali hech qanday AI hisobot yaratilmagan.</h4>
              <p className="text-xs text-slate-400">
                Yuqoridagi "Yangi AI Hisobot Yaratish" tugmasi orqali o'quvchilar uchun haftalik hisobot shakllantiring.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedWeeks.map((week) => (
                <div
                  key={`${week.year}-${week.week_number}`}
                  onClick={() => {
                    setSelectedWeek(week);
                    setPage(1);
                    setViewMode("detail");
                  }}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-indigo-400 hover:shadow-lg transition duration-200 cursor-pointer space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider group-hover:bg-indigo-600 group-hover:text-white transition">
                      {week.year}-yil / {week.week_number}-hafta
                    </span>
                    <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                      {week.report_count} ta o'quvchi
                    </span>
                  </div>

                  <div className="text-sm font-bold text-[#1D1E26]">
                    {week.start_date} — {week.end_date}
                  </div>

                  <div className="flex items-center justify-between text-xs text-indigo-600 font-bold pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      O'quvchilar ro'yxati <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteWeek(e, week)}
                      title="Haftani o'chirish"
                      className="p-1.5 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail View: Students list in selected week */}
      {viewMode === "detail" && selectedWeek && (
        <div className="space-y-4">
          {/* Back Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <button
              onClick={() => setViewMode("grouped")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#1D1E26] transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Haftalar ro'yxatiga qaytish</span>
            </button>
            <div className="text-xs font-extrabold text-indigo-950">
              {selectedWeek.year}-yil / {selectedWeek.week_number}-hafta ({selectedWeek.start_date} — {selectedWeek.end_date})
            </div>
          </div>

          {/* Filters & Search Header */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 w-full relative">
              <input
                type="text"
                placeholder="O'quvchi ismi yoki sinf bo'yicha qidirish..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Class Filter */}
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 bg-white cursor-pointer"
            >
              <option value="">Barcha sinflar</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
            {reportsLoading ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">O'quvchilar hisobotlari yuklanmoqda...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold">
                Ushbu filtr bo'yicha hech qanday o'quvchi hisoboti topilmadi.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-100 text-[10px]">
                    <tr>
                      <th className="px-5 py-3">O'quvchi</th>
                      <th className="px-5 py-3">Sinf</th>
                      <th className="px-5 py-3">O'rtacha Baho</th>
                      <th className="px-5 py-3">Dinamika</th>
                      <th className="px-5 py-3">O'qilgan Kitoblar</th>
                      <th className="px-5 py-3 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {reports.map((rep) => {
                      const avg = rep.summary_json?.average_grade || 0;
                      const trend = rep.summary_json?.grade_trend || "STABLE";

                      return (
                        <tr
                          key={rep.id}
                          onClick={() => setPreviewReport(rep)}
                          className="hover:bg-slate-50/80 transition cursor-pointer"
                        >
                          <td className="px-5 py-3.5 font-bold text-slate-900">{rep.student_name}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                              {rep.class_name}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-black text-indigo-950">
                            {avg > 0 ? avg.toFixed(1) : "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            {trend === "UP" && <span className="text-emerald-600 font-extrabold">O'sdi</span>}
                            {trend === "DOWN" && <span className="text-rose-500 font-extrabold">Pasaydi</span>}
                            {trend === "STABLE" && <span className="text-slate-600 font-extrabold">Barqaror</span>}
                          </td>
                          <td className="px-5 py-3.5 font-bold">
                            {rep.summary_json?.books_read_count || 0} ta
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                title="Hisobotni ko'rish"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewReport(rep);
                                }}
                                className="p-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                title="Hisobotni o'chirish"
                                onClick={(e) => handleDeleteSingleReport(e, rep.id, rep.student_name)}
                                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer"
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
            )}

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Jami: {totalCount} ta o'quvchi (Sahifa {page} / {totalPages})</span>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Avvalgisi</span>
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
                >
                  <span>Keyingisi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: Admin Generate AI Report Modal ── */}
      {isGenerateModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) resetGenerateModal();
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-zinc-200/80 shadow-2xl rounded-3xl w-full max-w-xl overflow-hidden transition-all transform scale-100 flex flex-col max-h-[90vh] text-zinc-900 animate-fadeIn"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#16193E] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span>AI Hisobot Yaratish</span>
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Haftani va kerakli o'quvchilarni tanlab AI hisobot shakllantiring
                </p>
              </div>
              <button
                type="button"
                onClick={resetGenerateModal}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
              {/* Week Selection Component */}
              <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-zinc-50 p-4 rounded-2xl border border-indigo-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>Hisobot Haftasi</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Haftani Tanlash</span>
                  </button>
                </div>

                <div className="p-3 bg-white rounded-xl border border-indigo-200/70 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                      W
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-zinc-900">{selectedWeekLabel}</div>
                      <div className="text-[10px] font-bold text-zinc-400">Boshlanish sanasi: {selectedWeekStart}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    Tanlandi
                  </span>
                </div>
              </div>

              {/* Target Presets Component */}
              <div className="bg-zinc-50/80 p-3.5 rounded-2xl border border-zinc-200/80">
                <TargetPresets
                  selectedLevels={[]}
                  selectedClasses={genClassId && genClassId !== "ALL" ? [Number(genClassId)] : []}
                  selectedStudents={selectedStudentIds}
                  onLevelsChange={() => {}}
                  onClassesChange={(clsIds) => setGenClassId(clsIds.length > 0 ? String(clsIds[0]) : "")}
                  onStudentsChange={(stIds) => setSelectedStudentIds(stIds)}
                  token={token}
                  apiUrl={API_URL}
                  label="O'quvchilar To'plamlari (Shablonni Tanlash / Saqlash)"
                  theme="lime"
                />
              </div>

              {/* Class Selector Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700">Sinfni tanlang:</label>
                <select
                  value={genClassId}
                  onChange={(e) => setGenClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 focus:outline-none focus:border-indigo-500 bg-white cursor-pointer shadow-2xs"
                >
                  <option value="">Sinfni tanlang...</option>
                  <option value="ALL">Barcha sinflar ({studentsList.length} ta o'quvchi)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Checkbox List Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                  <span>
                    O'quvchilar ({selectedStudentIds.length} ta tanlandi):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedStudentIds.length === filteredStudents.length) {
                        setSelectedStudentIds([]);
                      } else {
                        setSelectedStudentIds(filteredStudents.map((s) => s.id));
                      }
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-[11px] cursor-pointer font-bold transition"
                  >
                    {selectedStudentIds.length === filteredStudents.length ? "Barchasini bekor qilish" : "Barchasini tanlash"}
                  </button>
                </div>

                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="O'quvchi ismi bo'yicha qidirish..."
                    value={genStudentSearch}
                    onChange={(e) => setGenStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white shadow-2xs"
                  />
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                </div>

                <div className="text-[11px] font-bold text-zinc-400 px-1">
                  {genStudentSearch.trim()
                    ? `Qidiruv natijasi: ${displayStudents.length} ta o'quvchi`
                    : `Dastlabki ${displayStudents.length} ta o'quvchi ko'rsatildi (Jami: ${studentsList.length} ta). Boshqa o'quvchini topish uchun qidiruvdan foydalaning.`}
                </div>

                <div className="border border-zinc-200 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-1 bg-zinc-50/60 custom-scrollbar">
                  {studentsLoading ? (
                    <p className="text-xs text-zinc-400 text-center py-4 font-medium">O'quvchilar ro'yxati yuklanmoqda...</p>
                  ) : displayStudents.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-4 font-medium">O'quvchilar topilmadi.</p>
                  ) : (
                    displayStudents.map((s) => {
                      const isChecked = selectedStudentIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center space-x-2.5 text-xs text-zinc-800 font-medium cursor-pointer hover:bg-zinc-100/80 p-2 rounded-xl transition"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedStudentIds((prev) => prev.filter((id) => id !== s.id));
                              } else {
                                setSelectedStudentIds((prev) => [...prev, s.id]);
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                          />
                          <span>
                            {s.first_name} {s.last_name} ({s.class_name || "Sinf"})
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {genStatusMessage && (
                <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-900 text-xs font-bold border border-indigo-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{genStatusMessage}</span>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={resetGenerateModal}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-200/80 transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={generating}
                onClick={handleBatchGenerate}
                className="px-5 py-2.5 rounded-xl bg-[#D4F562] text-[#1D1E26] text-xs font-black hover:bg-[#c2e84d] transition shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#1D1E26]" />
                <span>{generating ? "Generatsiya qilinmoqda..." : "Generatsiya qilish"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Full-Screen Yandex Music / Spotify Wrapped Style Story Reel ── */}
      {previewReport && (() => {
        const sections = parseMarkdownSections(previewReport.report_text);
        const totalSlides = 1 + sections.length; // Slide 0 is Cover/Metrics, Slides 1..4 are sections

        const cardThemes = [
          // Slide 0: Cover & Key Metrics (Velvet Indigo Theme)
          {
            bg: "bg-gradient-to-b from-[#0F172A] via-[#1E1B4B] to-[#311042]",
            accent: "emerald",
            tag: "HAFTALIK HISOBOT",
          },
          // Slide 1: Haftalik Umumiy Xulosa (Emerald Teal Theme)
          {
            bg: "bg-gradient-to-b from-[#064E3B] via-[#047857] to-[#065F46]",
            accent: "emerald",
            tag: "01 / HAFTALIK XULOSA",
          },
          // Slide 2: O'sish va O'zgarish Dinamikasi (Sapphire Blue Theme)
          {
            bg: "bg-gradient-to-b from-[#1E3A8A] via-[#1D4ED8] to-[#1E40AF]",
            accent: "cyan",
            tag: "02 / DINAMIKA TAHLILI",
          },
          // Slide 3: Fanlar va Kitobxonlik Tahlili (Violet Purple Theme)
          {
            bg: "bg-gradient-to-b from-[#4C1D95] via-[#6D28D9] to-[#5B21B6]",
            accent: "indigo",
            tag: "03 / FANLAR VA KITOBXONLIK",
          },
          // Slide 4: Ota-onaga Amaliy Tavsiyalar (Sunset Amber Theme)
          {
            bg: "bg-gradient-to-b from-[#7C2D12] via-[#C2410C] to-[#9A3412]",
            accent: "amber",
            tag: "04 / OTA-ONAGA TAVSIYALAR",
          },
        ];

        return (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewReport(null);
            }}
            className="fixed inset-0 bg-[#0B0C10]/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md h-[90vh] max-h-[780px] rounded-[36px] overflow-hidden shadow-2xl border border-white/10 flex flex-col select-none"
            >
              {/* Top Story Navigation Progress Bars */}
              <div className="absolute top-4 left-4 right-4 z-30 flex items-center gap-1.5">
                {Array.from({ length: totalSlides }).map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => scrollToStory(idx)}
                    className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden cursor-pointer backdrop-blur-xs transition"
                  >
                    <div
                      className={`h-full bg-white transition-all duration-300 ${
                        idx === activeStoryIndex ? "w-full" : idx < activeStoryIndex ? "w-full opacity-60" : "w-0"
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setPreviewReport(null)}
                className="absolute top-7 right-5 z-30 p-2 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 backdrop-blur-md border border-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Vertical Scroll Snap Container */}
              <div
                ref={storyScrollRef}
                onScroll={handleStoryScroll}
                className="w-full h-full overflow-y-auto snap-y snap-mandatory scrollbar-none"
                style={{ scrollSnapType: "y mandatory" }}
              >
                {/* ── SLIDE 0: Cover & Key Metrics Card ── */}
                <div className={`w-full h-full snap-start snap-always shrink-0 p-6 pt-16 flex flex-col justify-between relative overflow-hidden ${cardThemes[0].bg} text-white`}>
                  <div className="space-y-4 z-10">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/90 text-[10px] font-black uppercase tracking-widest border border-white/15 backdrop-blur-md">
                      {cardThemes[0].tag}
                    </span>

                    <div className="space-y-1">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-xl font-black mb-3 text-white shadow-inner">
                        {previewReport.student_name.slice(0, 2).toUpperCase()}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                        {previewReport.student_name}
                      </h2>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="px-3 py-0.5 rounded-full bg-white/15 text-xs font-extrabold border border-white/20">
                          {previewReport.class_name}
                        </span>
                        <span className="text-xs text-white/70 font-semibold">
                          {previewReport.start_date} — {previewReport.end_date}
                        </span>
                      </div>
                    </div>

                    {/* Key Metrics Horizon Cards */}
                    <div className="grid grid-cols-3 gap-2.5 pt-4">
                      <div className="bg-white/10 border border-white/15 p-3 rounded-2xl backdrop-blur-md text-center flex flex-col justify-center min-h-[64px]">
                        <span className="text-[9px] font-black text-white/60 uppercase tracking-wider block">O'rtacha</span>
                        <span className="text-xs font-black text-white mt-0.5 block">
                          {previewReport.summary_json?.average_grade && previewReport.summary_json.average_grade > 0
                            ? previewReport.summary_json.average_grade.toFixed(1)
                            : "Baholanmagan"}
                        </span>
                      </div>

                      <div className="bg-white/10 border border-white/15 p-3 rounded-2xl backdrop-blur-md text-center flex flex-col justify-center min-h-[64px]">
                        <span className="text-[9px] font-black text-white/60 uppercase tracking-wider block">Dinamika</span>
                        <span className="text-xs font-black text-emerald-300 mt-0.5 block">
                          {previewReport.summary_json?.grade_trend === "UP" && "O'sdi"}
                          {previewReport.summary_json?.grade_trend === "DOWN" && "Pasaydi"}
                          {previewReport.summary_json?.grade_trend === "STABLE" && "Barqaror"}
                          {(!previewReport.summary_json?.grade_trend || previewReport.summary_json?.grade_trend === "") && "Boshlang'ich"}
                        </span>
                      </div>

                      <div className="bg-white/10 border border-white/15 p-3 rounded-2xl backdrop-blur-md text-center flex flex-col justify-center min-h-[64px]">
                        <span className="text-[9px] font-black text-white/60 uppercase tracking-wider block">Kitoblar</span>
                        <span className="text-xs font-black text-amber-300 mt-0.5 block">
                          {previewReport.summary_json?.books_read_count && previewReport.summary_json.books_read_count > 0
                            ? `${previewReport.summary_json.books_read_count} ta`
                            : "Kitob o'qilmadi"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scroll Down Hint */}
                  <div className="z-10 text-center space-y-1 pb-4 animate-bounce">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block">
                      Pastga suring
                    </span>
                    <ArrowRight className="w-5 h-5 mx-auto text-white/70 rotate-90" />
                  </div>
                </div>

                {/* ── SLIDES 1..4: Report Sections Story Cards ── */}
                {sections.map((sec, idx) => {
                  const theme = cardThemes[Math.min(idx + 1, cardThemes.length - 1)];

                  return (
                    <div
                      key={idx}
                      className={`w-full h-full snap-start snap-always shrink-0 p-6 pt-16 flex flex-col justify-between relative overflow-hidden ${theme.bg} text-white`}
                    >
                      <div className="space-y-5 z-10 flex-1 overflow-y-auto scrollbar-none pr-1">
                        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/90 text-[10px] font-black uppercase tracking-widest border border-white/15 backdrop-blur-md">
                          {theme.tag}
                        </span>

                        <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                          {sec.title}
                        </h3>

                        <div className="space-y-3 text-sm text-white/95 leading-relaxed font-medium">
                          {sec.bodyLines.length > 0 ? (
                            sec.bodyLines.map((line, lIdx) => {
                              let textLine = line.trim();
                              if (textLine.startsWith("-") || textLine.startsWith("*")) {
                                return (
                                  <div key={lIdx} className="bg-white/10 border border-white/15 p-3.5 rounded-2xl backdrop-blur-md my-2">
                                    <span className="text-white font-semibold">{textLine.replace(/^[-*]\s*/, "")}</span>
                                  </div>
                                );
                              }
                              return <p key={lIdx} className="bg-white/10 border border-white/15 p-4 rounded-2xl backdrop-blur-md leading-relaxed">{textLine}</p>;
                            })
                          ) : (
                            <p className="bg-white/10 border border-white/15 p-4 rounded-2xl backdrop-blur-md leading-relaxed">{sec.fullContent}</p>
                          )}
                        </div>
                      </div>

                      {/* Footer Progress & Scroll Hint */}
                      <div className="z-10 pt-4 flex items-center justify-between border-t border-white/15 shrink-0">
                        <span className="text-[11px] font-extrabold text-white/70">
                          {idx + 1} / {sections.length} bo'lim
                        </span>

                        {idx < sections.length - 1 ? (
                          <button
                            onClick={() => scrollToStory(idx + 2)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-slate-900 font-black text-xs hover:bg-slate-100 transition cursor-pointer shadow-lg"
                          >
                            <span>Keyingisi</span>
                            <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setPreviewReport(null)}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-white text-slate-900 font-black text-xs hover:bg-slate-100 transition cursor-pointer shadow-lg"
                          >
                            <span>Tugatish</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 3: Smart Calendar Week Selector Modal ── */}
      {isCalendarOpen && (
        <SmartCalendarModal
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          mode="week"
          selectedWeekStart={selectedWeekStart}
          onSelectWeek={(startStr, _endStr, label) => {
            setSelectedWeekStart(startStr);
            setSelectedWeekLabel(label);
            setIsCalendarOpen(false);
          }}
          title="AI Hisobot uchun Haftani Tanlang"
        />
      )}

      {/* ── MODAL 4: Custom Dialog Confirm Modal ── */}
      {confirmDialog && (
        <CustomDialogModal
          isOpen={confirmDialog.isOpen}
          type="danger"
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* ── MODAL 5: AI System Prompt & Token Settings Modal ── */}
      {isAISettingsOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAISettingsOpen(false);
          }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99990] flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1D1E26] border border-slate-800 text-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] my-auto animate-fadeIn"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-lime-500/10 text-[#D4F562] border border-lime-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                    AI System Prompt & Token Sozlamalari
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Gemini AI haftalik tahlillari va feedbacklari uchun asosiy pedagogik yo'riqnoma
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAISettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 overflow-y-auto font-sans">
              {aiSettingsLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs font-mono">
                  <div className="w-7 h-7 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  AI Prompt sozlamalari yuklanmoqda...
                </div>
              ) : (
                <>
                  {/* Dynamic Tags Helper Banner */}
                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between text-xs font-extrabold text-[#D4F562] gap-2">
                      <span className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        Dinamik Teglar (Bosib prompt matniga joylashtiring)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">
                        Teg ustiga bosing → Prompt matniga joylanadi
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        "{StudentName}",
                        "{ClassName}",
                        "{WeekStartDate}",
                        "{WeekEndDate}",
                        "{CurrentAverageGrade}",
                        "{Grades}",
                        "{TeacherComments}",
                        "{BooksRead}",
                        "{PrevAverageGrade}",
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleInsertTag(tag)}
                          title={`${tag} tegini prompt matniga qo'shish uchun bosing`}
                          className="bg-slate-800 hover:bg-[#D4F562] hover:text-[#1D1E26] text-slate-200 text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl border border-slate-700 hover:border-[#D4F562] transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95 group"
                        >
                          <span className="text-lime-400 group-hover:text-[#1D1E26] font-bold text-xs">+</span>
                          <span>{tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea Instruction */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-extrabold text-slate-300 uppercase tracking-wider text-[11px]">
                        AI System Instruction / Prompt Matni *
                      </label>
                      <span className="text-[11px] font-mono text-slate-400">
                        {systemInstructionText.length} belgi (~{Math.ceil(systemInstructionText.length / 4)} token)
                      </span>
                    </div>
                    <textarea
                      ref={textareaRef}
                      rows={10}
                      value={systemInstructionText}
                      onChange={(e) => setSystemInstructionText(e.target.value)}
                      placeholder="AI uchun pedagogik yo'riqnomani kiriting..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition leading-relaxed resize-none"
                    />
                  </div>

                  {/* Settings Grid: Max Tokens & Temperature */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                        Max Tokens Limit (100 - 8000) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={100}
                          max={8000}
                          value={maxTokensVal}
                          onChange={(e) => setMaxTokensVal(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-lime-400 transition"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">Generatsiya uchun maksimal javob uzunligi tokenlarda</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                        Temperature (Ijodkorlik ko'rsatkichi: 0.0 - 1.0)
                      </label>
                      <input
                        type="number"
                        step={0.1}
                        min={0.0}
                        max={1.0}
                        value={temperatureVal}
                        onChange={(e) => setTemperatureVal(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-lime-400 transition"
                      />
                      <p className="text-[10px] text-slate-400">0.7 - balanslangan va pedagogik izchil feedback uchun</p>
                    </div>
                  </div>

                  {/* Change Reason optional input */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                      O'zgarish Sababi (Tarix logi uchun izoh)
                    </label>
                    <input
                      type="text"
                      value={changeReasonText}
                      onChange={(e) => setChangeReasonText(e.target.value)}
                      placeholder="Masalan: Yangi o'quv yili uchun prompt qoidalari kuchaytirildi..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white outline-none focus:border-lime-400 transition"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer Controls */}
            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
              <button
                type="button"
                onClick={() => {
                  fetchAIInstructionHistory();
                  setIsHistoryOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs flex items-center gap-2 transition cursor-pointer border border-slate-700"
              >
                <History className="w-4 h-4 text-sky-400" />
                <span>Prompt Versiyalar Tarixi</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAISettingsOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  disabled={aiSettingsSaving}
                  onClick={handleSaveAIInstruction}
                  className="px-5 py-2.5 rounded-2xl bg-[#D4F562] text-[#1D1E26] font-black text-xs flex items-center gap-2 shadow-lg shadow-lime-500/10 hover:bg-[#c2e84d] transition cursor-pointer disabled:opacity-50"
                >
                  {aiSettingsSaving ? (
                    <div className="w-4 h-4 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Saqlash va Qo'llash</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 6: AI Prompt Version History Drawer/Modal ── */}
      {isHistoryOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHistoryOpen(false);
          }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99995] flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1D1E26] border border-slate-800 text-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] my-auto animate-fadeIn"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">
                    AI Promptlar O'zgarish Tarixi
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Istalgan o'tgan prompt versiyasiga 1-bosishda qayta olasiz
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Logs List */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
              {historyLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs font-mono">
                  <div className="w-7 h-7 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Versiyalar tarixi yuklanmoqda...
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-mono space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-600" />
                  <p>Hali hech qanday o'tgan prompt tarixi mavjud emas</p>
                </div>
              ) : (
                historyLogs.map((logItem) => (
                  <div
                    key={logItem.id}
                    className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[11px] font-mono font-bold border border-sky-500/20">
                          Version #{logItem.id}
                        </span>
                        <span className="text-xs text-slate-300 font-extrabold">
                          {logItem.changed_by_user_name || "Admin"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          • {new Date(logItem.created_at).toLocaleString("uz-UZ")}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-slate-400">
                          Max Tokens: {logItem.max_tokens}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRevertInstruction(logItem.id)}
                          className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border border-sky-500/30"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Ushbu versiyaga qaytarish</span>
                        </button>
                      </div>
                    </div>

                    {logItem.change_reason && (
                      <p className="text-xs text-slate-400 font-medium">
                        <strong className="text-slate-300">Izoh:</strong> {logItem.change_reason}
                      </p>
                    )}

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                      {logItem.system_instruction}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800 flex justify-end bg-slate-900/50">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
