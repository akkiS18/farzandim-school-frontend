"use client";

import React, { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [votingOptionId, setVotingOptionId] = useState<number | null>(null);

  // Modal & Filter States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "announcements" | "polls">("all");

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
        alert(data.error || "Ovoz berishda xatolik yuz berdi");
      }
    } catch {
      alert("Server bilan bog'lanishda xatolik");
    } finally {
      setVotingOptionId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Ushbu e'lonni o'chirishni xohlaysizmi?")) return;

    try {
      const response = await fetch(`${apiUrl}/api/schools/announcements/${id}`, {
        method: "DELETE",
        headers: safeFetchHeaders(),
      });

      if (response.ok) {
        setAnnouncements((prev) => prev.filter((ann) => ann.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || "O'chirishda xatolik yuz berdi");
      }
    } catch (err) {
      alert("Server bilan aloqa uzildi");
    }
  };

  const getTargetLabel = (ann: AnnouncementItem) => {
    const classIds = ann.class_ids || [];
    const levelIds = ann.level_ids || [];
    const studentIds = ann.student_ids || [];

    if (classIds.length === 0 && levelIds.length === 0 && studentIds.length === 0) {
      return <span className="text-[#65A30D] font-bold bg-[#ECFCCA] px-2.5 py-1 rounded-xl text-[10px]">Butun maktab</span>;
    }

    const labels: React.ReactNode[] = [];

    if (classIds.length > 0) {
      const names = classIds
        .map((cid: number) => classes.find((c) => c.id === cid)?.name)
        .filter(Boolean)
        .join(", ");
      labels.push(
        <span key="classes" className="text-[#0284C7] font-extrabold bg-[#E0F2FE] px-2.5 py-1 rounded-xl text-[10px] truncate max-w-[200px] inline-block">
          Sinf: {names || "topilmadi"}
        </span>
      );
    }

    if (levelIds.length > 0) {
      const names = levelIds.map((l: number) => `${l}-sinflar`).join(", ");
      labels.push(
        <span key="levels" className="text-[#FF7A00] font-extrabold bg-[#FFEADB] px-2.5 py-1 rounded-xl text-[10px] inline-block">
          Level: {names}
        </span>
      );
    }

    if (studentIds.length > 0) {
      labels.push(
        <span key="students" className="text-purple-700 font-extrabold bg-purple-100 px-2.5 py-1 rounded-xl text-[10px] inline-block">
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
    <div className="space-y-5 font-sans text-zinc-900 select-none animate-fadeIn pb-12">
      {/* Top Header Card with Primary Action Button */}
      <div className="bg-white border border-zinc-200/70 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-extrabold text-[#16193E] tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-600 shrink-0" />
            <span>E'lonlar & So'rovnomalar</span>
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Maktab jamoasi, ota-onalar va o'quvchilar uchun e'lonlar va so'rovnomalar (polls) yuborish hamda boshqarish.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError("");
            setFormSuccess("");
            setShowCreateModal(true);
          }}
          className="bg-[#5B50EC] hover:bg-[#4A3FDB] text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi E'lon / So'rovnoma Yaratish</span>
        </button>
      </div>

      {/* Filter & Search Navigation Panel */}
      <div className="bg-white border border-zinc-200/70 p-3 sm:p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeFilter === "all"
                ? "bg-[#5B50EC] text-white shadow-xs"
                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200/60"
            }`}
          >
            <span>Barchasi</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeFilter === "all" ? "bg-white/20 text-white" : "bg-zinc-200/70 text-zinc-700"
            }`}>
              {announcements.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("announcements")}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeFilter === "announcements"
                ? "bg-[#5B50EC] text-white shadow-xs"
                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200/60"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>E'lonlar</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeFilter === "announcements" ? "bg-white/20 text-white" : "bg-zinc-200/70 text-zinc-700"
            }`}>
              {countAnnouncements}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("polls")}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeFilter === "polls"
                ? "bg-[#5B50EC] text-white shadow-xs"
                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200/60"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>So'rovnomalar</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeFilter === "polls" ? "bg-white/20 text-white" : "bg-zinc-200/70 text-zinc-700"
            }`}>
              {countPolls}
            </span>
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 shrink-0 justify-end">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 rounded-2xl px-3.5 py-2">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              placeholder="E'lonlarni qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs outline-none font-bold text-zinc-800 w-36 sm:w-48"
            />
          </div>

          <button
            type="button"
            onClick={() => fetchAnnouncements()}
            className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 border border-zinc-200/60 rounded-2xl transition cursor-pointer shrink-0"
            title="Qayta yuklash"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full-Width Feed Cards */}
      {loading ? (
        <div className="text-center py-20 bg-white border border-zinc-200/70 rounded-3xl shadow-xs">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-zinc-400 font-mono">E'lonlar yuklanmoqda...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-200/80 rounded-3xl bg-white space-y-2">
          <Megaphone className="w-10 h-10 text-zinc-300 mx-auto" />
          <p className="text-zinc-800 text-sm font-extrabold">Hech qanday e'lon topilmadi</p>
          <p className="text-zinc-400 text-xs font-medium max-w-sm mx-auto">
            Hozircha hech qanday e'lon yoki so'rovnoma joylanmagan. Yangi e'lon yaratish uchun yuqoridagi tugmani bosing.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => {
            const totalVotes = ann.poll_options
              ? ann.poll_options.reduce((sum, opt) => sum + opt.vote_count, 0)
              : 0;

            return (
              <div key={ann.id} className="bg-white border border-zinc-200/70 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-md transition">
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-[#16193E] text-base sm:text-lg">{ann.title}</h4>
                      {ann.is_poll ? (
                        <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 font-extrabold text-[10px] px-3 py-1 rounded-xl border border-indigo-100">
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>So'rovnoma</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 font-extrabold text-[10px] px-3 py-1 rounded-xl border border-blue-100">
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
                        className="text-xs bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-bold p-2 rounded-xl transition cursor-pointer"
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
                  <div className="mt-3 p-4 sm:p-5 bg-zinc-50/80 border border-zinc-200/80 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-600 font-mono">
                      <span className="flex items-center gap-1.5">
                        <span>Ovoz berish variantlari</span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                          <Eye className="w-3 h-3" />
                          <span>Faqat kuzatuv rejimi</span>
                        </span>
                      </span>
                      <span>Jami: {totalVotes} ovoz</span>
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
                                alert("Admin va o'qituvchilar so'rovnomada ovoz bera olmaydilar. Faqat ota-onalar va o'quvchilar ovoz berishi mumkin.");
                              }
                            }}
                            disabled={votingOptionId === opt.id}
                            className={`w-full text-left p-3.5 rounded-2xl border transition relative overflow-hidden group ${
                              canVote ? "cursor-pointer" : "cursor-default"
                            } ${
                              opt.user_voted
                                ? "bg-indigo-50/80 border-indigo-300 text-indigo-900"
                                : "bg-white border-zinc-200/90 text-zinc-800 hover:border-zinc-300"
                            }`}
                          >
                            {/* Progress bar background */}
                            <div
                              className={`absolute top-0 left-0 bottom-0 transition-all duration-500 ${
                                opt.user_voted ? "bg-indigo-200/60" : "bg-indigo-100/70"
                              }`}
                              style={{ width: `${pct}%` }}
                            />

                            <div className="relative z-10 flex items-center justify-between text-xs font-bold">
                              <span className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  opt.user_voted ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300"
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
          <div className="bg-white border border-zinc-200/80 shadow-2xl rounded-3xl w-full max-w-xl overflow-hidden transition-all transform scale-100 flex flex-col max-h-[90vh] text-zinc-900 animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#16193E] flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-indigo-600" />
                  <span>Yangi E'lon yoki So'rovnoma Yaratish</span>
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Mo'ljallangan auditoriyani tanlab e'lon yuboring
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Segmented Type Switch */}
                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase font-mono mb-2">E'lon Turi</label>
                  <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200/60">
                    <button
                      type="button"
                      onClick={() => setIsPoll(false)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
                        !isPoll
                          ? "bg-white text-[#16193E] shadow-xs"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      <Megaphone className="w-4 h-4 text-blue-600" />
                      <span>📢 Oddiy E'lon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPoll(true)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
                        isPoll
                          ? "bg-white text-[#16193E] shadow-xs"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <span>📊 Interaktiv So'rovnoma</span>
                    </button>
                  </div>
                </div>

                {/* Sarlavha */}
                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase font-mono mb-1.5">Sarlavha *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E'lon sarlavhasini kiriting..."
                    className="w-full bg-zinc-50 border border-zinc-200/80 text-zinc-800 rounded-2xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition font-bold"
                  />
                </div>

                {/* Matn */}
                <div>
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase font-mono mb-1.5">Batafsil Matn *</label>
                  <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    placeholder="E'lon yoki so'rovnoma matnini yozing..."
                    className="w-full bg-zinc-50 border border-zinc-200/80 text-zinc-800 rounded-2xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium resize-none"
                  />
                </div>

                {/* Poll Options section */}
                {isPoll && (
                  <div className="p-4 bg-zinc-50/80 border border-zinc-200/80 rounded-2xl space-y-3 animate-fadeIn">
                    <label className="block text-[10px] font-extrabold text-zinc-400 uppercase font-mono">So'rovnoma Variantlari *</label>
                    <div className="space-y-2">
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Variant ${idx + 1}...`}
                            value={opt}
                            onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                            className="flex-1 bg-white border border-zinc-200 text-zinc-800 rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePollOption(idx)}
                              className="w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center font-bold text-xs cursor-pointer shrink-0 transition"
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
                        className="text-xs text-indigo-600 font-extrabold hover:underline cursor-pointer pt-1 inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Variant qo'shish</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Target Scope Selection */}
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase font-mono">Kimlarga Yuboriladi?</label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {!isTeacher && (
                      <button
                        type="button"
                        onClick={() => setTargetType("all")}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold transition text-center cursor-pointer ${
                          targetType === "all"
                            ? "bg-[#5B50EC] text-white shadow-xs"
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        Butun Maktab
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setTargetType("classes")}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold transition text-center cursor-pointer ${
                        targetType === "classes"
                          ? "bg-[#5B50EC] text-white shadow-xs"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      Sinflar bo'yicha
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType("levels")}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold transition text-center cursor-pointer ${
                        targetType === "levels"
                          ? "bg-[#5B50EC] text-white shadow-xs"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      Level bo'yicha
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType("students")}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold transition text-center cursor-pointer ${
                        targetType === "students"
                          ? "bg-[#5B50EC] text-white shadow-xs"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      Xususiy O'quvchilar
                    </button>
                  </div>

                  {targetType === "classes" && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex flex-wrap gap-2 max-h-44 overflow-y-auto">
                      {classes.map((cls) => {
                        const isSelected = selectedClassIds.includes(cls.id);
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => handleClassCheckboxChange(cls.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 border ${
                              isSelected
                                ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs"
                                : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                            <span>{cls.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {targetType === "levels" && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex flex-wrap gap-2 max-h-44 overflow-y-auto">
                      {availableLevels.map((lvl) => {
                        const isSelected = selectedLevelIds.includes(lvl);
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => handleLevelCheckboxChange(lvl)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 border ${
                              isSelected
                                ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs"
                                : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                            <span>{lvl}-sinflar</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {targetType === "students" && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-2">
                      <input
                        type="text"
                        placeholder="O'quvchini qidirish..."
                        value={studentSearchText}
                        onChange={(e) => setStudentSearchText(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-1.5 text-xs text-zinc-800 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="max-h-36 overflow-y-auto space-y-1.5">
                        {filteredStudentsForSelect.map((s) => {
                          const isSelected = selectedStudentIds.includes(s.id);
                          return (
                            <label key={s.id} className="flex items-center space-x-2 text-xs font-semibold text-zinc-700 cursor-pointer hover:bg-white p-1.5 rounded-xl transition">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleStudentCheckboxChange(s.id)}
                                className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
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
                    className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-2xl text-xs font-extrabold cursor-pointer transition"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-6 py-2.5 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-2xl text-xs font-extrabold disabled:opacity-50 flex items-center space-x-2 cursor-pointer shadow-xs transition"
                  >
                    {submitLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span>
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
    </div>
  );
}
