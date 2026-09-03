"use client";

import React, { useState, useEffect } from "react";
import { useDialog } from "../../hooks/useDialog";
import CustomDialogModal from "../CustomDialogModal";
import TargetPresets from "../TargetPresets";
import { AnnouncementItem, ClassItem } from "./types";
import { 
  Megaphone, 
  BarChart3, 
  Search, 
  RotateCw, 
  Plus, 
  Trash2, 
  X, 
  Eye, 
  CheckCircle2, 
  Users 
} from "lucide-react";

interface AnnouncementsSectionProps {
  token: string;
  classes: ClassItem[];
  students: any[];
  apiUrl: string;
  isTeacher?: boolean;
  userRole?: string;
  currentUserId?: number;
}

export default function AnnouncementsSection({
  token,
  classes,
  students,
  apiUrl,
  isTeacher = false,
  userRole,
  currentUserId,
}: AnnouncementsSectionProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const { dialogState, showAlert, showConfirm } = useDialog();
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [votingOptionId, setVotingOptionId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const observerTarget = React.useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => observer.disconnect();
  }, []);

  // Modal & Filter States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "announcements" | "polls">("all");

  // Poll Voters Modal State
  const [showVotersModal, setShowVotersModal] = useState(false);
  const [selectedAnnForVoters, setSelectedAnnForVoters] = useState<AnnouncementItem | null>(null);
  const [pollVotersList, setPollVotersList] = useState<any[]>([]);
  const [votersLoading, setVotersLoading] = useState(false);
  const [votersSearch, setVotersSearch] = useState("");
  const [selectedOptionFilter, setSelectedOptionFilter] = useState<number | "all">("all");

  // Form States
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [selectedLevelIds, setSelectedLevelIds] = useState<number[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // Poll States
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [targetType, setTargetType] = useState<"all" | "classes" | "levels" | "students">(isTeacher ? "classes" : "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [studentSearchText, setStudentSearchText] = useState("");

  const handleOpenVotersModal = async (ann: AnnouncementItem, initialOptionId: number | "all" = "all") => {
    setSelectedAnnForVoters(ann);
    setSelectedOptionFilter(initialOptionId);
    setVotersSearch("");
    setShowVotersModal(true);
    setVotersLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/schools/announcements/${ann.id}/poll-voters`, {
        headers: safeFetchHeaders(),
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setPollVotersList(data);
      } else {
        setPollVotersList([]);
      }
    } catch (e) {
      console.error(e);
      setPollVotersList([]);
    } finally {
      setVotersLoading(false);
    }
  };

  const safeFetchHeaders = () => {
    const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (sId) headers["X-School-ID"] = sId;
    return headers;
  };

  const availableLevels = Array.from(
    new Set(classes.map((c) => c.level).filter((l): l is number => typeof l === "number"))
  ).sort((a, b) => a - b);

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(() => {
      fetchAnnouncements(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Esc key listener for create modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showCreateModal) {
        setShowCreateModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCreateModal]);

  const fetchAnnouncements = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/schools/announcements`, {
        headers: safeFetchHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        setAnnouncements(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch announcements:", data.error);
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleClassCheckboxChange = (classId: number) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleLevelCheckboxChange = (level: number) => {
    setSelectedLevelIds((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const handleStudentCheckboxChange = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions((prev) => [...prev, ""]);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, val: string) => {
    setPollOptions((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError("Sarlavha va e'lon matni to'ldirilishi shart");
      return;
    }

    if (isPoll) {
      const validOpts = pollOptions.filter((o) => o.trim() !== "");
      if (validOpts.length < 2) {
        setFormError("So'rovnoma uchun kamida 2 ta variant kiritilishi shart");
        return;
      }
    }

    setSubmitLoading(true);
    setFormError("");
    setFormSuccess("");

    const classIds = targetType === "classes" ? selectedClassIds : [];
    const levelIds = targetType === "levels" ? selectedLevelIds : [];
    const studentIds = targetType === "students" ? selectedStudentIds : [];

    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(`${apiUrl}/api/schools/announcements`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          class_ids: classIds,
          level_ids: levelIds,
          student_ids: studentIds,
          is_poll: isPoll,
          options: isPoll ? pollOptions.filter((o) => o.trim() !== "") : [],
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setFormSuccess("E'lon chop etildi va Telegram bot orqali bildirishnomalar yuborildi!");
        setTitle("");
        setContent("");
        setIsPoll(false);
        setPollOptions(["", ""]);
        setSelectedClassIds([]);
        setSelectedLevelIds([]);
        setSelectedStudentIds([]);
        setTargetType(isTeacher ? "classes" : "all");
        setStudentSearchText("");
        setShowCreateModal(false);
        fetchAnnouncements();
      } else {
        setFormError(data.error || "E'lon yaratishda xatolik yuz berdi");
      }
    } catch (err) {
      setFormError("Serverga bog'lanishda xatolik yuz berdi");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleVote = async (annId: number, optionId: number) => {
    setVotingOptionId(optionId);
    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(`${apiUrl}/api/schools/announcements/${annId}/vote`, {
        method: "POST",
        headers,
        body: JSON.stringify({ option_id: optionId }),
      });

      if (response.ok) {
        fetchAnnouncements();
      } else {
        const data = await response.json();
        showAlert(data.error || "Ovoz berishda xatolik yuz berdi");
      }
    } catch {
      showAlert("Server bilan bog'lanishda xatolik");
    } finally {
      setVotingOptionId(null);
    }
  };

  const handleDelete = (id: number) => {
    showConfirm(
      "Ushbu e'lonni o'chirishni xohlaysizmi?",
      async () => {
        try {
          const response = await fetch(`${apiUrl}/api/schools/announcements/${id}`, {
            method: "DELETE",
            headers: safeFetchHeaders(),
          });
          if (response.ok) {
            setAnnouncements((prev) => prev.filter((ann) => ann.id !== id));
          } else {
            const data = await response.json();
            showAlert(data.error || "O'chirishda xatolik yuz berdi");
          }
        } catch (err) {
          showAlert("Server bilan aloqa uzildi");
        }
      },
      { title: "E'lonni o'chirish", type: "danger", confirmText: "Ha, o'chirish" }
    );
  };

  const getTargetLabel = (ann: AnnouncementItem) => {
    const classIds = ann.class_ids || [];
    const levelIds = ann.level_ids || [];
    const studentIds = ann.student_ids || [];

    if (classIds.length === 0 && levelIds.length === 0 && studentIds.length === 0) {
      return <span className="text-[#1D1E26] font-mono font-extrabold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-none text-[10px]">Butun maktab</span>;
    }

    const labels: React.ReactNode[] = [];

    if (classIds.length > 0) {
      const names = classIds
        .map((cid: number) => classes.find((c) => c.id === cid)?.name)
        .filter(Boolean)
        .join(", ");
      labels.push(
        <span key="classes" className="text-[#1D1E26] font-mono font-extrabold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-none text-[10px] truncate max-w-[200px] inline-block">
          Sinf: {names || "topilmadi"}
        </span>
      );
    }

    if (levelIds.length > 0) {
      const names = levelIds.map((l: number) => `${l}-sinflar`).join(", ");
      labels.push(
        <span key="levels" className="text-[#1D1E26] font-mono font-extrabold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-none text-[10px] inline-block">
          Level: {names}
        </span>
      );
    }

    if (studentIds.length > 0) {
      labels.push(
        <span key="students" className="text-[#1D1E26] font-mono font-extrabold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-none text-[10px] inline-block">
          Xususiy ({studentIds.length} o'quvchi)
        </span>
      );
    }

    return <div className="flex flex-wrap gap-1.5">{labels}</div>;
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = ann.title.toLowerCase().includes(q) || ann.content.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (activeFilter === "announcements") return !ann.is_poll;
    if (activeFilter === "polls") return ann.is_poll;
    return true;
  });

  const displayedAnnouncements = filteredAnnouncements.slice(0, page * PAGE_SIZE);

  const countAnnouncements = announcements.filter((a) => !a.is_poll).length;
  const countPolls = announcements.filter((a) => a.is_poll).length;

  const filteredStudentsForSelect = students.filter((s) => {
    if (!studentSearchText.trim()) return true;
    const txt = studentSearchText.toLowerCase();
    const fullName = `${s.last_name || ""} ${s.first_name || ""} ${s.middle_name || ""}`.toLowerCase();
    const className = (s.class_name || "").toLowerCase();
    return fullName.includes(txt) || className.includes(txt);
  });

  return (
    <div className="space-y-5 font-sans text-white select-none animate-fadeIn pb-12">
      {/* ── Unified Header ── */}
      <div className="bg-white border border-slate-100/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs text-slate-500 font-mono">
            Jami: <strong className="text-[#1D1E26] font-extrabold">{announcements.length}</strong> ta e'lon
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchAnnouncements()}
            disabled={loading}
            className="w-[38px] h-[38px] rounded-none bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-[#1D1E26] transition cursor-pointer disabled:opacity-50 shrink-0"
            title="Yangilash"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin text-[#1D1E26]" : ""}`} />
          </button>
          
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setFormSuccess("");
              setShowCreateModal(true);
            }}
            className="bg-[#1D1E26] text-[#D4F562] hover:bg-slate-800 font-extrabold text-xs py-2.5 px-3.5 rounded-none flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Subtabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => { setActiveFilter("all"); setPage(1); }}
            className={`px-4 py-2.5 rounded-none text-xs font-extrabold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeFilter === "all"
                ? "bg-[#1D1E26] text-[#D4F562] font-black"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>Barchasi</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-none font-mono font-bold ${
              activeFilter === "all" ? "bg-white/20 text-[#D4F562]" : "bg-slate-200 text-slate-700"
            }`}>
              {announcements.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveFilter("announcements"); setPage(1); }}
            className={`px-4 py-2.5 rounded-none text-xs font-extrabold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeFilter === "announcements"
                ? "bg-[#1D1E26] text-[#D4F562] font-black"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>E'lonlar</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-none font-mono font-bold ${
              activeFilter === "announcements" ? "bg-white/20 text-[#D4F562]" : "bg-slate-200 text-slate-700"
            }`}>
              {countAnnouncements}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveFilter("polls"); setPage(1); }}
            className={`px-4 py-2.5 rounded-none text-xs font-extrabold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeFilter === "polls"
                ? "bg-[#1D1E26] text-[#D4F562] font-black"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>So'rovnomalar</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-none font-mono font-bold ${
              activeFilter === "polls" ? "bg-white/20 text-[#D4F562]" : "bg-slate-200 text-slate-700"
            }`}>
              {countPolls}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px] sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="E'lonlarni qidirish..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-none outline-none focus:ring-2 focus:ring-[#1D1E26] transition placeholder:text-slate-400 placeholder:font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-4 h-4 flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Full-Width Feed Cards */}
      {loading ? (
        <div className="text-center py-20 bg-white border border-zinc-200/70 rounded-none shadow-xs">
          <div className="w-8 h-8 border-3 border-[#1D1E26] border-t-transparent rounded-none animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-zinc-400 font-mono">E'lonlar yuklanmoqda...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-200/80 rounded-none bg-white space-y-2">
          <Megaphone className="w-10 h-10 text-zinc-300 mx-auto" />
          <h3 className="text-sm sm:text-base font-bold font-sans text-[#1D1E26]">Hech qanday e'lon topilmadi</h3>
          <p className="text-zinc-400 text-xs font-medium max-w-sm mx-auto">
            Hozircha hech qanday e'lon yoki so'rovnoma joylanmagan. Yangi e'lon yaratish uchun yuqoridagi tugmani bosing.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedAnnouncements.map((ann) => {
            const totalVotes = ann.poll_options
              ? ann.poll_options.reduce((sum, opt) => sum + opt.vote_count, 0)
              : 0;

            return (
              <div key={ann.id} className="bg-white border border-slate-200 rounded-none p-5 sm:p-6 shadow-xs space-y-4 transition">
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-semibold text-[#1D1E26]">{ann.title}</h4>
                      {ann.is_poll ? (
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-[#1D1E26] font-mono font-extrabold text-[10px] px-2.5 py-1 rounded-none border border-slate-200">
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>So'rovnoma</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-[#1D1E26] font-mono font-extrabold text-[10px] px-2.5 py-1 rounded-none border border-slate-200">
                          <Megaphone className="w-3.5 h-3.5" />
                          <span>Oddiy E'lon</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-400 font-mono">
                      Muallif: <strong className="text-zinc-700 font-semibold">{ann.author_name || "Admin"}</strong> • {new Date(ann.created_at).toLocaleString("uz-UZ", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getTargetLabel(ann)}
                    {(!isTeacher || ann.author_id === currentUserId) && (
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="text-xs bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold p-2 rounded-none transition cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium whitespace-pre-wrap">{ann.content}</p>

                {/* Poll Options */}
                {ann.is_poll && ann.poll_options && ann.poll_options.length > 0 && (
                  <div className="mt-3 p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-none space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-600 font-mono flex-wrap gap-2">
                      <span className="flex items-center gap-1.5">
                        <span>Ovoz berish variantlari</span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-700 font-medium bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-none">
                          <Eye className="w-3 h-3" />
                          <span>Faqat kuzatuv rejimi</span>
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">Jami: {totalVotes} ovoz</span>
                        {totalVotes > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenVotersModal(ann);
                            }}
                            className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#1D1E26] bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-none transition cursor-pointer"
                            title="Kimlar qaysi variantga ovoz berganini ko'rish"
                          >
                            <Users className="w-3 h-3 text-[#1D1E26]" />
                            <span>Javoblarni ko'rish</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {ann.poll_options.map((opt) => {
                        const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
                        const canVote = userRole === "PARENT" || userRole === "STUDENT";
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              if (canVote) {
                                handleVote(ann.id, opt.id);
                              } else {
                                handleOpenVotersModal(ann, opt.id);
                              }
                            }}
                            disabled={votingOptionId === opt.id}
                            className={`w-full text-left p-3.5 rounded-none border transition relative overflow-hidden group cursor-pointer ${
                              opt.user_voted
                                ? "bg-slate-100 border-slate-400 text-slate-900"
                                : "bg-white border-zinc-200/90 text-zinc-800 hover:border-zinc-300"
                            }`}
                            title={!canVote ? "Ushbu variantga ovoz berganlarni ko'rish" : undefined}
                          >
                            {/* Progress bar background */}
                            <div
                              className={`absolute top-0 left-0 bottom-0 transition-all duration-500 ${
                                opt.user_voted ? "bg-[#D4F562]/20" : "bg-slate-100/70"
                              }`}
                              style={{ width: `${pct}%` }}
                            />

                            <div className="relative z-10 flex items-center justify-between text-xs font-bold">
                              <span className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded-none border flex items-center justify-center shrink-0 ${
                                  opt.user_voted ? "border-[#D4F562] bg-[#D4F562] text-[#1D1E26]" : "border-zinc-300"
                                }`}>
                                  {opt.user_voted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </span>
                                <span>{opt.option_text}</span>
                              </span>
                              <span className="font-mono text-[11px] text-zinc-500 font-bold">
                                {pct}% ({opt.vote_count})
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {filteredAnnouncements.length > displayedAnnouncements.length && (
        <div ref={observerTarget} className="h-10 flex items-center justify-center pt-4 pb-10">
          <span className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin"></span>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT / POLL MODAL */}
      {showCreateModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
            }
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-zinc-200/80 shadow-2xl rounded-none w-full max-w-xl overflow-hidden transition-all transform scale-100 flex flex-col max-h-[90vh] text-zinc-900 animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-xl text-slate-900 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#1D1E26]" />
                  <span>Yangi E'lon yoki So'rovnoma Yaratish</span>
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Mo'ljallangan auditoriyani tanlab e'lon yuboring
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-none bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {formError && (
                <div className="p-3.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-none text-xs font-bold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Segmented Type Switch */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase font-mono mb-2">E'lon Turi</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-none border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsPoll(false)}
                      className={`py-2.5 px-3 rounded-none text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${!isPoll ? "bg-[#1D1E26] text-[#D4F562]" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      <Megaphone className="w-4 h-4 text-[#1D1E26]" />
                      <span>Oddiy E'lon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPoll(true)}
                      className={`py-2.5 px-3 rounded-none text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${isPoll ? "bg-[#1D1E26] text-[#D4F562]" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      <BarChart3 className="w-4 h-4 text-[#1D1E26]" />
                      <span>Interaktiv So'rovnoma</span>
                    </button>
                  </div>
                </div>

                {/* Sarlavha */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase font-mono mb-1.5">Sarlavha *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E'lon sarlavhasini kiriting..."
                    className="w-full bg-zinc-50 border border-zinc-200/80 text-zinc-800 rounded-none px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#1D1E26] transition font-bold"
                  />
                </div>

                {/* Matn */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase font-mono mb-1.5">Batafsil Matn *</label>
                  <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    placeholder="E'lon yoki so'rovnoma matnini yozing..."
                    className="w-full bg-zinc-50 border border-zinc-200/80 text-zinc-800 rounded-none px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#1D1E26] transition font-medium resize-none"
                  />
                </div>

                {/* Poll Options section */}
                {isPoll && (
                  <div className="p-4 bg-zinc-50/80 border border-zinc-200/80 rounded-none space-y-3 animate-fadeIn">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase font-mono">So'rovnoma Variantlari *</label>
                    <div className="space-y-2">
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Variant ${idx + 1}...`}
                            value={opt}
                            onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                            className="flex-1 bg-white border border-zinc-200 text-zinc-800 rounded-none px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-[#1D1E26] font-bold"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePollOption(idx)}
                              className="w-8 h-8 rounded-none bg-slate-100 text-[#1D1E26] hover:bg-red-100 flex items-center justify-center font-bold text-xs cursor-pointer shrink-0 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {pollOptions.length < 6 && (
                      <button
                        type="button"
                        onClick={handleAddPollOption}
                        className="text-xs text-[#1D1E26] font-bold hover:underline cursor-pointer pt-1 inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Variant qo'shish</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Target Scope Selection */}
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <TargetPresets
                    selectedLevels={selectedLevelIds}
                    selectedClasses={selectedClassIds}
                    selectedStudents={selectedStudentIds}
                    onLevelsChange={(levels) => {
                      setSelectedLevelIds(levels);
                      if (levels.length > 0) setTargetType("levels");
                    }}
                    onClassesChange={(cls) => {
                      setSelectedClassIds(cls);
                      if (cls.length > 0) setTargetType("classes");
                    }}
                    onStudentsChange={(stus) => {
                      setSelectedStudentIds(stus);
                      if (stus.length > 0) setTargetType("students");
                    }}
                    token={token}
                    apiUrl={apiUrl}
                    label="O'quvchilar To'plami (Mavjud shablonlar)"
                    theme="admin"
                  />
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase font-mono">Kimlarga Yuboriladi?</label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {!isTeacher && (
                      <button
                        type="button"
                        onClick={() => setTargetType("all")}
                        className={`py-2 px-3 rounded-none text-xs font-extrabold transition text-center cursor-pointer ${targetType === "all" ? "bg-[#1D1E26] text-[#D4F562]" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                      >
                        Butun Maktab
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setTargetType("classes")}
                      className={`py-2 px-3 rounded-none text-xs font-extrabold transition text-center cursor-pointer ${targetType === "classes" ? "bg-[#1D1E26] text-[#D4F562]" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                    >
                      Sinflar bo'yicha
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType("levels")}
                      className={`py-2 px-3 rounded-none text-xs font-extrabold transition text-center cursor-pointer ${targetType === "levels" ? "bg-[#1D1E26] text-[#D4F562]" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                    >
                      Level bo'yicha
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType("students")}
                      className={`py-2 px-3 rounded-none text-xs font-extrabold transition text-center cursor-pointer ${targetType === "students" ? "bg-[#1D1E26] text-[#D4F562]" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                    >
                      Xususiy O'quvchilar
                    </button>
                  </div>

                  {targetType === "classes" && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-none flex flex-wrap gap-2 max-h-44 overflow-y-auto">
                      {classes.map((cls) => {
                        const isSelected = selectedClassIds.includes(cls.id);
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => handleClassCheckboxChange(cls.id)}
                            className={`px-3 py-1.5 rounded-none text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                              isSelected ? "bg-[#1D1E26] border-[#1D1E26] text-[#D4F562] font-black" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            <span>{cls.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {targetType === "levels" && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-none flex flex-wrap gap-2 max-h-44 overflow-y-auto">
                      {availableLevels.map((lvl) => {
                        const isSelected = selectedLevelIds.includes(lvl);
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => handleLevelCheckboxChange(lvl)}
                            className={`px-3 py-1.5 rounded-none text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                              isSelected ? "bg-[#1D1E26] border-[#1D1E26] text-[#D4F562] font-black" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            <span>{lvl}-sinflar</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {targetType === "students" && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-none space-y-2">
                      <input
                        type="text"
                        placeholder="O'quvchini qidirish..."
                        value={studentSearchText}
                        onChange={(e) => setStudentSearchText(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-none px-3.5 py-1.5 text-xs text-zinc-800 font-bold outline-none focus:ring-2 focus:ring-[#1D1E26]"
                      />
                      <div className="max-h-36 overflow-y-auto space-y-1.5">
                        {filteredStudentsForSelect.map((s) => {
                          const isSelected = selectedStudentIds.includes(s.id);
                          return (
                            <label key={s.id} className="flex items-center space-x-2 text-xs font-semibold text-zinc-700 cursor-pointer hover:bg-white p-1.5 rounded-none transition">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleStudentCheckboxChange(s.id)}
                                className="w-4 h-4 rounded border-zinc-300 text-white focus:ring-[#1D1E26]"
                              />
                              <span className="font-bold text-zinc-800">{s.last_name} {s.first_name}</span>
                              <span className="text-zinc-400 text-[10px]">({s.class_name || "Sinfi yo'q"})</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#1D1E26] rounded-none text-xs font-extrabold cursor-pointer transition"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-6 py-2.5 bg-[#1D1E26] text-[#D4F562] hover:bg-slate-800 rounded-none text-xs font-black disabled:opacity-50 flex items-center space-x-2 cursor-pointer transition"
                  >
                    {submitLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-[#1D1E26] border-t-transparent rounded-none animate-spin shrink-0"></span>
                        <span>Chop etilmoqda...</span>
                      </>
                    ) : (
                      <>
                        <Megaphone className="w-4 h-4" />
                        <span>Chop Etish va Yuborish</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* POLL VOTERS DETAIL MODAL */}
      {showVotersModal && selectedAnnForVoters && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowVotersModal(false);
            }
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-zinc-200/80 shadow-2xl rounded-none w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-900 animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-xl text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#1D1E26]" />
                  <span>So'rovnoma Javoblari & Ovoz Berganlar</span>
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5 truncate max-w-[450px]">
                  {selectedAnnForVoters.title} · <strong className="text-[#1D1E26] font-mono">{pollVotersList.length} ta ovoz</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVotersModal(false)}
                className="w-8 h-8 rounded-none bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="px-6 pt-4 pb-3 border-b border-zinc-100 space-y-3 bg-zinc-50/50">
              {/* Option Tabs / Pills */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedOptionFilter("all")}
                  className={`px-3 py-1.5 rounded-none text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                    selectedOptionFilter === "all" ? "bg-[#1D1E26] text-[#D4F562] border-[#1D1E26]" : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <span>Barchasi</span>
                  <span className={`px-1.5 py-0.2 rounded-none text-[10px] font-mono ${
                    selectedOptionFilter === "all" ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-700"
                  }`}>
                    {pollVotersList.length}
                  </span>
                </button>

                {selectedAnnForVoters.poll_options?.map((opt) => {
                  const optVotersCount = pollVotersList.filter((v) => v.option_id === opt.id).length;
                  const isSelected = selectedOptionFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOptionFilter(opt.id)}
                      className={`px-3 py-1.5 rounded-none text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                        isSelected ? "bg-[#1D1E26] text-[#D4F562] border-[#1D1E26] font-black" : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <span className="truncate max-w-[150px]">{opt.option_text}</span>
                      <span className={`px-1.5 py-0.2 rounded-none text-[10px] font-mono ${
                        isSelected ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-700"
                      }`}>
                        {optVotersCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ism, telefon raqami yoki farzandi bo'yicha qidirish..."
                  value={votersSearch}
                  onChange={(e) => setVotersSearch(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-none pl-10 pr-4 py-2 text-xs text-zinc-800 outline-none focus:ring-2 focus:ring-[#1D1E26] font-medium shadow-2xs"
                />
                {votersSearch && (
                  <button
                    type="button"
                    onClick={() => setVotersSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Voters List Container */}
            <div className="p-6 overflow-y-auto space-y-3 max-h-[500px]">
              {votersLoading ? (
                <div className="py-16 text-center text-xs text-zinc-400 font-mono flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-none animate-spin"></div>
                  <span>Ovoz beruvchilar yuklanmoqda...</span>
                </div>
              ) : (() => {
                const filtered = pollVotersList.filter((v) => {
                  if (selectedOptionFilter !== "all" && v.option_id !== selectedOptionFilter) return false;
                  if (!votersSearch.trim()) return true;
                  const q = votersSearch.toLowerCase();
                  return (
                    v.full_name.toLowerCase().includes(q) ||
                    v.phone.toLowerCase().includes(q) ||
                    v.children_info.toLowerCase().includes(q) ||
                    v.student_class_name.toLowerCase().includes(q) ||
                    v.option_text.toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-xs text-zinc-400 italic bg-zinc-50 rounded-none border border-dashed border-zinc-200">
                      {votersSearch || selectedOptionFilter !== "all"
                        ? "Qidiruv bo'yicha ovoz beruvchilar topilmadi"
                        : "Ushbu so'rovnomada hali hech kim ovoz bermagan"}
                    </div>
                  );
                }

                return filtered.map((voter) => {
                  const isTelegram = Boolean(voter.telegram_id);
                  const formattedDate = voter.created_at
                    ? new Date(voter.created_at).toLocaleString("uz-UZ", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  return (
                    <div
                      key={voter.vote_id}
                      className="p-4 bg-white border border-zinc-200/80 rounded-none hover:border-slate-200 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Left: Voter Identity & Meta */}
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-none bg-[#1D1E26] text-[#D4F562] font-black text-xs flex items-center justify-center shrink-0">
                          {voter.full_name ? voter.full_name[0].toUpperCase() : "U"}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                              {voter.full_name || "Foydalanuvchi"}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-none text-[10px] font-bold ${
                              voter.role_name === "PARENT"
                                ? "bg-slate-100 text-slate-700 border border-slate-200"
                                : voter.role_name === "STUDENT"
                                ? "bg-slate-100 text-slate-700 border border-slate-200"
                                : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                            }`}>
                              {voter.role_name === "PARENT" ? "Ota-ona" : voter.role_name === "STUDENT" ? "O'quvchi" : voter.role_name}
                            </span>
                            {/* Platform source */}
                            {isTelegram ? (
                              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-none text-[10px] font-bold flex items-center gap-1">
                                <span>Telegram Bot</span>
                              </span>
                            ) : (
                              <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded-none text-[10px] font-bold flex items-center gap-1">
                                <span>Web Sayt</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 font-medium">
                            {voter.phone && (
                              <span className="font-mono text-zinc-600 font-bold">{voter.phone}</span>
                            )}
                            {voter.children_info && (
                              <span className="text-[#1D1E26] font-semibold flex items-center gap-1">
                                <span>Farzandi:</span>
                                <strong className="font-bold">{voter.children_info}</strong>
                              </span>
                            )}
                            {voter.student_class_name && (
                              <span className="text-teal-600 font-semibold flex items-center gap-1">
                                <span>Sinfi:</span>
                                <strong className="font-bold">{voter.student_class_name}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Chosen Option & Time */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 shrink-0 gap-1">
                        <span className="px-3 py-1 bg-[#1D1E26] text-[#D4F562] font-bold rounded-none text-xs">
                          {voter.option_text}
                        </span>
                        {formattedDate && (
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {formattedDate}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-mono">
                Telegram bot va Web platforma orqali kelgan barcha javoblar
              </span>
              <button
                type="button"
                onClick={() => setShowVotersModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#1D1E26] font-extrabold rounded-none text-xs transition cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Dialog Modal */}
      <CustomDialogModal
        theme="admin"
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
      />
    </div>
  );
}

