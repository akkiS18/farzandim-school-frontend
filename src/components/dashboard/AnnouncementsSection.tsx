"use client";

import React, { useState, useEffect } from "react";
import { AnnouncementItem, ClassItem } from "./types";

interface AnnouncementsSectionProps {
  token: string;
  classes: ClassItem[];
  students: any[];
  apiUrl: string;
  isTeacher?: boolean;
  currentUserId?: number;
}

export default function AnnouncementsSection({
  token,
  classes,
  students,
  apiUrl,
  isTeacher = false,
  currentUserId,
}: AnnouncementsSectionProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form States
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [selectedLevelIds, setSelectedLevelIds] = useState<number[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
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
    new Set(classes.map((c) => c.level).filter(Boolean))
  ).sort((a, b) => (a || 0) - (b || 0)) as number[];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
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
      setLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError("Sarlavha va e'lon matni to'ldirilishi shart");
      return;
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
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setFormSuccess("E'lon chop etildi va Telegram bot orqali bildirishnomalar yuborildi!");
        setTitle("");
        setContent("");
        setSelectedClassIds([]);
        setSelectedLevelIds([]);
        setSelectedStudentIds([]);
        setTargetType("all");
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

  const getTargetLabel = (ann: any) => {
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
      const names = studentIds
        .map((sid: number) => {
          const s = students.find((x) => (x.student_id || x.id) === sid);
          return s ? `${s.first_name} ${s.last_name.charAt(0)}.` : `ID: ${sid}`;
        })
        .join(", ");
      labels.push(
        <span key="students" className="text-[#7E22CE] font-bold bg-[#F3E8FF] px-2.5 py-1 rounded-lg text-[10px] truncate max-w-[200px] inline-block">
          O'quvchi: {names}
        </span>
      );
    }

    return <div className="flex flex-wrap gap-2">{labels}</div>;
  };

  const filteredStudentsList = students.filter((s) =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearchText.toLowerCase())
  );

  const filteredAnnouncements = announcements.filter((ann) =>
    ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ann.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-[#1D1E26] select-none">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-[#1D1E26] tracking-tight">E'lonlar va Bildirishnomalar</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Sinflar, o'quvchilar yoki sinf darajalari (level) kesimida bildirishnomalar yuborish.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Form */}
        <div className="lg:col-span-1 bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-black text-[#1D1E26]">Yangi e'lon yaratish</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-medium">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-[#ECFCCA] border border-lime-200 text-[#65A30D] rounded-2xl text-xs font-bold">
                {formSuccess}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">
                E'lon Sarlavhasi
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: Majlis yoki tadbirlar..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">
                E'lon Matni
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Batafsil e'lon matni..."
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition resize-none"
              />
            </div>

            {/* Target Select Filter Buttons */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono block">
                Kimlarga yuborilsin?
              </label>
              <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 text-xs font-extrabold">
                {!isTeacher && (
                  <button
                    type="button"
                    onClick={() => setTargetType("all")}
                    className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl text-[10px] font-extrabold transition cursor-pointer text-center ${
                      targetType === "all" ? "bg-white text-[#1D1E26] shadow-xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Barchaga
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTargetType("classes")}
                  className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl text-[10px] font-extrabold transition cursor-pointer text-center ${
                    targetType === "classes" ? "bg-white text-[#1D1E26] shadow-xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Sinflarga
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("levels")}
                  className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl text-[10px] font-extrabold transition cursor-pointer text-center ${
                    targetType === "levels" ? "bg-white text-[#1D1E26] shadow-xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Levellarga
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("students")}
                  className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl text-[10px] font-extrabold transition cursor-pointer text-center ${
                    targetType === "students" ? "bg-white text-[#1D1E26] shadow-xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  O'quvchiga
                </button>
              </div>
            </div>

            {/* Dynamic Selection lists */}
            {targetType === "classes" && (
              <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-44 overflow-y-auto">
                <span className="text-[10px] text-slate-400 font-extrabold font-mono uppercase block mb-1">Sinflarni belgilang:</span>
                {classes.map((cls) => (
                  <label key={cls.id} className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer font-medium hover:text-[#1D1E26]">
                    <input
                      type="checkbox"
                      checked={selectedClassIds.includes(cls.id)}
                      onChange={() => handleClassCheckboxChange(cls.id)}
                      className="rounded text-[#1D1E26] focus:ring-[#D4F562]"
                    />
                    <span>{cls.name} (Level {cls.level})</span>
                  </label>
                ))}
              </div>
            )}

            {targetType === "levels" && (
              <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-44 overflow-y-auto">
                <span className="text-[10px] text-slate-400 font-extrabold font-mono uppercase block mb-1">Levellarni belgilang:</span>
                {availableLevels.map((lvl) => (
                  <label key={lvl} className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer font-medium hover:text-[#1D1E26]">
                    <input
                      type="checkbox"
                      checked={selectedLevelIds.includes(lvl)}
                      onChange={() => handleLevelCheckboxChange(lvl)}
                      className="rounded text-[#1D1E26] focus:ring-[#D4F562]"
                    />
                    <span>Level {lvl}</span>
                  </label>
                ))}
              </div>
            )}

            {targetType === "students" && (
              <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-56 overflow-y-auto">
                <input
                  type="text"
                  placeholder="O'quvchini qidirish..."
                  value={studentSearchText}
                  onChange={(e) => setStudentSearchText(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs px-3 py-1.5 rounded-xl outline-none mb-2"
                />
                {filteredStudentsList.map((st) => {
                  const sId = st.student_id || st.id;
                  return (
                    <label key={sId} className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer font-medium hover:text-[#1D1E26]">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(sId)}
                        onChange={() => handleStudentCheckboxChange(sId)}
                        className="rounded text-[#1D1E26] focus:ring-[#D4F562]"
                      />
                      <span>{st.first_name} {st.last_name} ({st.class_name || "Sinfsiz"})</span>
                    </label>
                  );
                })}
              </div>
            )}

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-[#D4F562] text-[#1D1E26] font-black text-xs py-3 rounded-2xl shadow-xs hover:opacity-90 transition cursor-pointer"
            >
              {submitLoading ? "E'lon yuborilmoqda..." : "E'lonni Chop Etish & Yuborish"}
            </button>
          </form>
        </div>

        {/* Right Column: Announcement Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-base font-black text-[#1D1E26]">Chop etilgan e'lonlar tarixi</h3>
              
              <input
                type="text"
                placeholder="E'lonlardan izlash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium px-3.5 py-2 rounded-xl outline-none focus:ring-2 focus:ring-[#D4F562] w-56"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs">
                E'lonlar yuklanmoqda...
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium text-xs italic border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                E'lonlar topilmadi.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="bg-slate-50/80 border border-slate-100 rounded-3xl p-5 shadow-xs space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-[#1D1E26]">{ann.title}</h4>
                        <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono">
                          <span>👤 {ann.author_name || "Admin"}</span>
                          <span>•</span>
                          <span>📅 {new Date(ann.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Delete button for Admin or Owner */}
                      {(!isTeacher || ann.author_name?.includes(currentUserId?.toString() || "")) && (
                        <button
                          onClick={() => handleDelete(ann.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-xl transition"
                          title="E'lonni o'chirish"
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                      {ann.content}
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">Kimlarga:</span>
                      {getTargetLabel(ann)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
