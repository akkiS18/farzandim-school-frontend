"use client";

import React, { useState, useEffect } from "react";
import { AnnouncementItem, ClassItem } from "./types";

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
      return <span className="text-[#65A30D] font-bold bg-[#ECFCCA] px-2.5 py-1 rounded-lg text-[10px]">Barcha sinflar</span>;
    }

    const labels: React.ReactNode[] = [];

    if (classIds.length > 0) {
      const names = classIds
        .map((cid: number) => classes.find((c) => c.id === cid)?.name)
        .filter(Boolean)
        .join(", ");
      labels.push(
        <span key="classes" className="text-[#0284C7] font-bold bg-[#E0F2FE] px-2.5 py-1 rounded-lg text-[10px] truncate max-w-[200px] inline-block">
          Sinf: {names || "topilmadi"}
        </span>
      );
    }

    if (levelIds.length > 0) {
      const names = levelIds.map((l: number) => `${l}-sinflar`).join(", ");
      labels.push(
        <span key="levels" className="text-[#FF7A00] font-bold bg-[#FFEADB] px-2.5 py-1 rounded-lg text-[10px] inline-block">
          Level: {names}
        </span>
      );
    }

    if (studentIds.length > 0) {
      labels.push(
        <span key="students" className="text-purple-700 font-bold bg-purple-100 px-2.5 py-1 rounded-lg text-[10px] inline-block">
          Xususiy ({studentIds.length} o'quvchi)
        </span>
      );
    }

    return <div className="flex flex-wrap gap-1.5">{labels}</div>;
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    const q = searchQuery.toLowerCase();
    return ann.title.toLowerCase().includes(q) || ann.content.toLowerCase().includes(q);
  });

  const filteredStudentsForSelect = students.filter((s) => {
    if (!studentSearchText.trim()) return true;
    const txt = studentSearchText.toLowerCase();
    const fullName = `${s.last_name || ""} ${s.first_name || ""} ${s.middle_name || ""}`.toLowerCase();
    const className = (s.class_name || "").toLowerCase();
    return fullName.includes(txt) || className.includes(txt);
  });

  return (
    <div className="space-y-6 font-sans text-[#1D1E26] select-none">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-[#1D1E26] tracking-tight">E'lonlar & So'rovnomalar</h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Maktab jamoasi, ota-onalar va o'quvchilar uchun e'lonlar va so'rovnomalar (polls) yuborish.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Create Form */}
        <div className="lg:col-span-5 bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-black text-[#1D1E26]">Yangi E'lon / So'rovnoma Yaratish</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Mo'ljallangan auditoriyani tanlab yuboring.</p>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Sarlavha *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E'lon sarlavhasi..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">E'lon Matni *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Batafsil ma'lumot matni..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition font-medium resize-none"
              />
            </div>

            {/* Poll Toggle Switch */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  📊 So'rovnoma (Poll) qo'shish
                </span>
                <input
                  type="checkbox"
                  checked={isPoll}
                  onChange={(e) => setIsPoll(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#1D1E26] focus:ring-[#D4F562] cursor-pointer"
                />
              </div>

              {isPoll && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200/60">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono">So'rovnoma Variantlari *</label>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Variant ${idx + 1}...`}
                        value={opt}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                        className="flex-1 bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] font-semibold"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(idx)}
                          className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center font-bold text-xs cursor-pointer shrink-0"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  {pollOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer pt-1 block"
                    >
                      + Variant qo'shish
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Target Scope Selection */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-2">Kimlarga Yuboriladi?</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {!isTeacher && (
                  <button
                    type="button"
                    onClick={() => setTargetType("all")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-center cursor-pointer ${
                      targetType === "all"
                        ? "bg-[#D4F562] border-lime-300 text-[#1D1E26]"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Butun Maktab
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTargetType("classes")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-center cursor-pointer ${
                    targetType === "classes"
                      ? "bg-[#D4F562] border-lime-300 text-[#1D1E26]"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Sinflar bo'yicha
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("levels")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-center cursor-pointer ${
                    targetType === "levels"
                      ? "bg-[#D4F562] border-lime-300 text-[#1D1E26]"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Level bo'yicha
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("students")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-center cursor-pointer ${
                    targetType === "students"
                      ? "bg-[#D4F562] border-lime-300 text-[#1D1E26]"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Xususiy O'quvchilar
                </button>
              </div>

              {targetType === "classes" && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 max-h-40 overflow-y-auto">
                  {classes.map((cls) => (
                    <label key={cls.id} className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedClassIds.includes(cls.id)}
                        onChange={() => handleClassCheckboxChange(cls.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#1D1E26] focus:ring-[#D4F562]"
                      />
                      <span>{cls.name}</span>
                    </label>
                  ))}
                </div>
              )}

              {targetType === "levels" && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 max-h-40 overflow-y-auto">
                  {availableLevels.map((lvl) => (
                    <label key={lvl} className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLevelIds.includes(lvl)}
                        onChange={() => handleLevelCheckboxChange(lvl)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#1D1E26] focus:ring-[#D4F562]"
                      />
                      <span>{lvl}-sinflar</span>
                    </label>
                  ))}
                </div>
              )}

              {targetType === "students" && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <input
                    type="text"
                    placeholder="O'quvchini qidirish..."
                    value={studentSearchText}
                    onChange={(e) => setStudentSearchText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
                  />
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {filteredStudentsForSelect.map((s) => (
                      <label key={s.id} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(s.id)}
                          onChange={() => handleStudentCheckboxChange(s.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#1D1E26] focus:ring-[#D4F562]"
                        />
                        <span>{s.last_name} {s.first_name} ({s.class_name || "Sinfi yo'q"})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-[#D4F562] text-[#1D1E26] font-black text-xs py-3 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            >
              {submitLoading ? "Chop etilmoqda..." : "E'lonni Chop Etish"}
            </button>
          </form>
        </div>

        {/* Right Side: Announcement Feed Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between bg-white border border-slate-100/80 p-4 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#1D1E26]">Chop Etilgan E'lonlar ({filteredAnnouncements.length})</h3>
              <button
                type="button"
                onClick={() => fetchAnnouncements()}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="Qayta yuklash"
              >
                🔄
              </button>
            </div>
            <input
              type="text"
              placeholder="Qidiruv..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] font-medium"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl bg-white">
              <p className="text-slate-400 text-xs font-medium">Hech qanday e'lon topilmadi.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((ann) => {
                const totalVotes = ann.poll_options
                  ? ann.poll_options.reduce((sum, opt) => sum + opt.vote_count, 0)
                  : 0;

                return (
                  <div key={ann.id} className="bg-white border border-slate-100/80 rounded-3xl p-5 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-[#1D1E26] text-sm">{ann.title}</h4>
                          {ann.is_poll && (
                            <span className="bg-indigo-50 text-indigo-700 font-extrabold text-[10px] px-2 py-0.5 rounded-lg border border-indigo-100">
                              📊 So'rovnoma
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Muallif: <strong className="text-slate-600">{ann.author_name || "Admin"}</strong> | {new Date(ann.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {getTargetLabel(ann)}
                        {(!isTeacher || ann.author_id === currentUserId) && (
                          <button
                            onClick={() => handleDelete(ann.id)}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold p-1.5 rounded-xl transition cursor-pointer"
                            title="O'chirish"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{ann.content}</p>

                    {/* Poll Rendering */}
                    {ann.is_poll && ann.poll_options && ann.poll_options.length > 0 && (
                      <div className="mt-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 font-mono">
                          <span className="flex items-center gap-1">
                            Variantlar
                            <span className="text-[10px] text-amber-600 font-normal bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">
                              (Faqat kuzatuv rejimi)
                            </span>
                          </span>
                          <span>Jami: {totalVotes} ovoz</span>
                        </div>

                        <div className="space-y-2">
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
                                className={`w-full text-left p-2.5 rounded-xl border transition relative overflow-hidden group ${
                                  canVote ? "cursor-pointer" : "cursor-default"
                                } ${
                                  opt.user_voted
                                    ? "bg-indigo-50/80 border-indigo-300 text-indigo-900"
                                    : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                                }`}
                              >
                                {/* Progress bar background */}
                                <div
                                  className={`absolute top-0 left-0 bottom-0 transition-all duration-500 ${
                                    opt.user_voted ? "bg-indigo-200/60" : "bg-lime-100/60"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />

                                <div className="relative z-10 flex items-center justify-between text-xs font-bold">
                                  <span className="flex items-center gap-2">
                                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                      opt.user_voted ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                                    }`}>
                                      {opt.user_voted && "✓"}
                                    </span>
                                    {opt.option_text}
                                  </span>
                                  <span className="font-mono text-[11px] text-slate-500">
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
        </div>
      </div>
    </div>
  );
}
