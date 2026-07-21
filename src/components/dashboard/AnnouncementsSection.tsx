"use client";

import React, { useState, useEffect } from "react";
import { AnnouncementItem, ClassItem } from "./types";

interface AnnouncementsSectionProps {
  token: string;
  classes: ClassItem[];
  students: any[]; // List of students from dashboard
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

  // Target Filter type helper: "all" | "classes" | "levels" | "students"
  const [targetType, setTargetType] = useState<"all" | "classes" | "levels" | "students">(isTeacher ? "classes" : "all");

  // Search filter inside select tools
  const [searchQuery, setSearchQuery] = useState("");
  const [studentSearchText, setStudentSearchText] = useState("");

  // Generate unique active levels from classes
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
        headers: { Authorization: `Bearer ${token}` },
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

    // Prepare filter lists based on active targetType
    const classIds = targetType === "classes" ? selectedClassIds : [];
    const levelIds = targetType === "levels" ? selectedLevelIds : [];
    const studentIds = targetType === "students" ? selectedStudentIds : [];

    try {
      const response = await fetch(`${apiUrl}/api/schools/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
        // Refresh list
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
        headers: { Authorization: `Bearer ${token}` },
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
      return <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg">🏫 Barcha sinflar</span>;
    }

    const labels: React.ReactNode[] = [];

    if (classIds.length > 0) {
      const names = classIds
        .map((cid: number) => classes.find((c) => c.id === cid)?.name)
        .filter(Boolean)
        .join(", ");
      labels.push(
        <span key="classes" className="text-blue-400 font-semibold bg-blue-500/10 px-2.5 py-1 rounded-lg truncate max-w-[200px] inline-block">
          👥 Sinf: {names || "topilmadi"}
        </span>
      );
    }

    if (levelIds.length > 0) {
      const names = levelIds.map((l: number) => `${l}-sinflar`).join(", ");
      labels.push(
        <span key="levels" className="text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg inline-block">
          🎓 Level: {names}
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
        <span key="students" className="text-indigo-400 font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-lg truncate max-w-[200px] inline-block">
          👦 O&apos;quvchi: {names}
        </span>
      );
    }

    return <div className="flex flex-wrap gap-2">{labels}</div>;
  };

  // Filter students by search text
  const filteredStudentsList = students.filter((s) =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(studentSearchText.toLowerCase())
  );

  const filteredAnnouncements = announcements.filter((ann) =>
    ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ann.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">📢 E&apos;lonlar va Bildirishnomalar</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Sinflar, o&apos;quvchilar yoki sinf darajalari (level) kesimida bildirishnomalar yuborish.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Form */}
        <div className="lg:col-span-1 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-zinc-200">Yangi e&apos;lon yaratish</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs">
                ⚠️ {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl text-xs">
                ✨ {formSuccess}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                E&apos;lon Sarlavhasi
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: Majlis yoki tadbirlar..."
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                E&apos;lon Matni
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Batafsil e'lon matni..."
                rows={4}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none transition resize-none"
              />
            </div>

            {/* Target Select Filter Buttons */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                Kimlarga yuborilsin?
              </label>
              <div className={`grid ${isTeacher ? "grid-cols-3" : "grid-cols-4"} gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-850`}>
                {!isTeacher && (
                  <button
                    type="button"
                    onClick={() => setTargetType("all")}
                    className={`py-1.5 rounded-lg text-[9px] font-bold transition ${
                      targetType === "all" ? "bg-zinc-800 text-zinc-100 shadow" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Barchaga
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTargetType("classes")}
                  className={`py-1.5 rounded-lg text-[9px] font-bold transition ${
                    targetType === "classes" ? "bg-zinc-800 text-zinc-100 shadow" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Sinflarga
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("levels")}
                  className={`py-1.5 rounded-lg text-[9px] font-bold transition ${
                    targetType === "levels" ? "bg-zinc-800 text-zinc-100 shadow" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Level
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("students")}
                  className={`py-1.5 rounded-lg text-[9px] font-bold transition ${
                    targetType === "students" ? "bg-zinc-800 text-zinc-100 shadow" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  O&apos;quvchiga
                </button>
              </div>
            </div>

            {/* Class target UI */}
            {targetType === "classes" && (
              <div className="space-y-2 bg-zinc-900/20 border border-zinc-900 rounded-xl p-3.5 animate-fadeIn">
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Sinflarni tanlang ({selectedClassIds.length})</span>
                  <button
                    type="button"
                    onClick={() => setSelectedClassIds(classes.map((c) => c.id))}
                    className="text-blue-500 text-[9px] hover:text-blue-400 transition"
                  >
                    Hammasini tanlash
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {classes.map((cls) => (
                    <label key={cls.id} className="flex items-center space-x-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedClassIds.includes(cls.id)}
                        onChange={() => handleClassCheckboxChange(cls.id)}
                        className="rounded border-zinc-800 text-blue-600 bg-zinc-900 focus:ring-0"
                      />
                      <span>{cls.name} sinfi</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Level target UI */}
            {targetType === "levels" && (
              <div className="space-y-2 bg-zinc-900/20 border border-zinc-900 rounded-xl p-3.5 animate-fadeIn">
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Sinf Darajasini tanlang ({selectedLevelIds.length})</span>
                  <button
                    type="button"
                    onClick={() => setSelectedLevelIds(availableLevels)}
                    className="text-amber-500 text-[9px] hover:text-amber-400 transition"
                  >
                    Hammasi
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {availableLevels.map((lvl) => (
                    <label key={lvl} className="flex items-center space-x-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLevelIds.includes(lvl)}
                        onChange={() => handleLevelCheckboxChange(lvl)}
                        className="rounded border-zinc-800 text-amber-600 bg-zinc-900 focus:ring-0"
                      />
                      <span>{lvl}-sinflar (Barchasi)</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Student target UI */}
            {targetType === "students" && (
              <div className="space-y-2 bg-zinc-900/20 border border-zinc-900 rounded-xl p-3.5 animate-fadeIn">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                  O&apos;quvchilarni tanlang ({selectedStudentIds.length})
                </span>
                
                {/* Embedded search inside students target tool */}
                <input
                  type="text"
                  value={studentSearchText}
                  onChange={(e) => setStudentSearchText(e.target.value)}
                  placeholder="Ism bo'yicha qidirish..."
                  className="w-full bg-zinc-950/40 border border-zinc-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-300 outline-none"
                />

                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {filteredStudentsList.length === 0 ? (
                    <div className="text-[10px] text-zinc-600 text-center py-4">O&apos;quvchilar topilmadi</div>
                  ) : (
                    filteredStudentsList.map((stud) => {
                      const id = stud.student_id || stud.id;
                      return (
                        <label key={id} className="flex items-center space-x-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(id)}
                            onChange={() => handleStudentCheckboxChange(id)}
                            className="rounded border-zinc-800 text-indigo-600 bg-zinc-900 focus:ring-0"
                          />
                          <div className="flex flex-col">
                            <span>{stud.first_name} {stud.last_name}</span>
                            <span className="text-[9px] text-zinc-600">{stud.class_name || "Sinf belgilanmagan"}</span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shadow-blue-500/10 flex items-center justify-center space-x-2 animate-fadeIn"
            >
              {submitLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Jo&apos;natilmoqda...</span>
                </>
              ) : (
                <span>🚀 E&apos;lonni Yuborish</span>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: List of announcements */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex items-center">
            <span className="text-zinc-600 text-base mr-3">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="E'lonlarni sarlavha va matn bo'yicha qidirish..."
              className="w-full bg-transparent border-none text-xs text-zinc-200 outline-none"
            />
          </div>

          <div className="space-y-3.5">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-zinc-600 space-y-2">
                <div className="w-6 h-6 border-2 border-zinc-800 border-t-zinc-500 rounded-full animate-spin" />
                <span className="text-xs">E&apos;lonlar yuklanmoqda...</span>
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="text-center p-12 bg-zinc-950/20 border border-dashed border-zinc-900 rounded-2xl text-zinc-500 text-xs">
                📭 Chop etilgan e&apos;lonlar mavjud emas.
              </div>
            ) : (
              filteredAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800/80 rounded-2xl p-5 space-y-3.5 transition duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-100">{ann.title}</h4>
                      <p className="text-[10px] text-zinc-500">
                        ✍️ {ann.author_name || "Maktab Ma'muriyati"} • 📅 {new Date(ann.created_at).toLocaleString("uz-UZ", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {(!isTeacher || ann.author_id === currentUserId) && (
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="text-zinc-600 hover:text-red-400 p-1.5 hover:bg-red-500/5 rounded-xl transition cursor-pointer"
                        title="O'chirish"
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {ann.content}
                  </p>

                  <div className="flex items-center text-[10px] text-zinc-500 border-t border-zinc-900/60 pt-3">
                    <span className="mr-3">Yuborilgan guruh:</span>
                    {getTargetLabel(ann)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
