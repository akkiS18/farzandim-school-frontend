"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Eye,
  EyeOff,
  Shuffle,
  Printer,
  Users,
  ImageIcon,
  X,
} from "lucide-react";
import api from "@/lib/api";

interface RosterStudent {
  id: number;
  student_id?: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  photo_url?: string | null;
  class_name?: string;
}

interface PhotoRosterTabProps {
  classes: any[];
  selectedClassId: number | string | null;
  onSelectClass?: (classId: number | string) => void;
}

export default function PhotoRosterTab({
  classes = [],
  selectedClassId,
  onSelectClass,
}: PhotoRosterTabProps) {
  const initialClassId = selectedClassId || (classes.length > 0 ? classes[0].id : "");
  const [activeClassId, setActiveClassId] = useState<number | string>(initialClassId);
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters & Practice mode
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [shuffleOrder, setShuffleOrder] = useState<number[] | null>(null);
  const [zoomStudent, setZoomStudent] = useState<RosterStudent | null>(null);

  useEffect(() => {
    if (selectedClassId && !activeClassId) {
      setActiveClassId(selectedClassId);
    }
  }, [selectedClassId, activeClassId]);

  useEffect(() => {
    if (!activeClassId) return;
    let cancelled = false;
    const loadStudents = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.get(`/api/schools/users?role=STUDENT&class_id=${activeClassId}`);
        if (cancelled) return;
        const list: RosterStudent[] = Array.isArray(data) ? data : [];
        list.sort((a, b) =>
          `${a.last_name || ""} ${a.first_name || ""}`
            .toLowerCase()
            .localeCompare(`${b.last_name || ""} ${b.first_name || ""}`.toLowerCase(), "uz")
        );
        setStudents(list);
        setShuffleOrder(null);
        setRevealedIds(new Set());
      } catch (err: any) {
        if (!cancelled) setError(err.message || "O'quvchilarni yuklab bo'lmadi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadStudents();
    return () => {
      cancelled = true;
    };
  }, [activeClassId]);

  const activeClassObj = useMemo(
    () => classes.find((c) => String(c.id) === String(activeClassId)),
    [classes, activeClassId]
  );

  const displayedStudents = useMemo(() => {
    let list = [...students];
    if (shuffleOrder) {
      const idxMap = new Map<number, number>();
      shuffleOrder.forEach((id, i) => idxMap.set(id, i));
      list.sort((a, b) => (idxMap.get(a.id) ?? 9999) - (idxMap.get(b.id) ?? 9999));
    }
    if (onlyWithPhoto) {
      list = list.filter((s) => !!s.photo_url);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        `${s.last_name || ""} ${s.first_name || ""} ${s.middle_name || ""}`
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [students, shuffleOrder, onlyWithPhoto, searchQuery]);

  const withPhotoCount = useMemo(
    () => students.filter((s) => !!s.photo_url).length,
    [students]
  );

  const handleTogglePractice = () => {
    setPracticeMode((prev) => {
      const next = !prev;
      setRevealedIds(new Set());
      if (!next) setShuffleOrder(null);
      return next;
    });
  };

  const handleShuffle = () => {
    const ids = students.map((s) => s.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setShuffleOrder(ids);
    setRevealedIds(new Set());
  };

  const toggleReveal = (id: number) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getInitials = (st: RosterStudent) => {
    const l = (st.last_name || "").trim().charAt(0).toUpperCase();
    const f = (st.first_name || "").trim().charAt(0).toUpperCase();
    return `${l}${f}` || "?";
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="bg-white border border-neutral-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:shadow-none">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
            O&apos;QUVCHILAR RASMLARI (TABEL RASM)
          </span>
          <h2 className="font-serif font-bold text-2xl text-slate-900 mt-0.5">
            {activeClassObj ? `${activeClassObj.name} sinfi o'quvchilari` : "Sinf o'quvchilari rasmlari"}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Yangi o&apos;qituvchilar uchun o&apos;quvchilarni yuzidan tanish va ismlarini eslab qolish jadvali.
          </p>
        </div>

        {/* Class Selector & Stats */}
        <div className="flex items-center gap-2.5 flex-wrap print:hidden">
          <select
            value={activeClassId}
            onChange={(e) => {
              setActiveClassId(e.target.value);
              if (onSelectClass) onSelectClass(e.target.value);
            }}
            className="bg-slate-50 hover:bg-slate-100 border border-neutral-300 text-slate-900 font-bold px-3 py-2 text-xs sm:text-sm outline-none focus:border-[#1E2B42] cursor-pointer h-10 min-w-[140px]"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} {cls.is_main_teacher ? "(Rahbar)" : ""}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            className="h-10 px-3 bg-slate-100 hover:bg-slate-200 border border-neutral-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Chop etish"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Chop etish</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border border-neutral-200 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          <div className="px-2.5 py-1 bg-slate-100 border border-neutral-200 font-bold text-slate-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Jami: {students.length} nafar</span>
          </div>
          <div className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 font-bold text-indigo-800 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Rasmli: {withPhotoCount} / {students.length}</span>
          </div>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer ml-1">
            <input
              type="checkbox"
              checked={onlyWithPhoto}
              onChange={(e) => setOnlyWithPhoto(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#1E2B42]"
            />
            <span>Faqat rasmlilar</span>
          </label>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ism bo'yicha qidirish..."
              className="bg-slate-50 border border-neutral-300 pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#1E2B42] w-44"
            />
          </div>

          <button
            type="button"
            onClick={handleTogglePractice}
            className={`px-3 py-1.5 text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition ${
              practiceMode
                ? "bg-[#A51C30] text-white border-[#A51C30]"
                : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
            }`}
          >
            {practiceMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{practiceMode ? "Barcha ismlarni ko'rsatish" : "Eslab qolish (Mashq)"}</span>
          </button>

          {practiceMode && (
            <button
              type="button"
              onClick={handleShuffle}
              className="px-3 py-1.5 text-xs font-bold bg-[#1E2B42] hover:bg-slate-800 text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Aralashtirish</span>
            </button>
          )}
        </div>
      </div>

      {practiceMode && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-900 font-medium print:hidden">
          💡 <b>Mashq rejimi yoqilgan:</b> O&apos;quvchining yuziga qarab ismini eslang va tekshirish uchun karta ustiga bosing!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 p-4 text-xs font-semibold text-red-800">
          {error}
        </div>
      )}

      {/* Photo Grid */}
      {loading ? (
        <div className="bg-white border border-neutral-200 p-12 text-center text-xs text-slate-500">
          O&apos;quvchilar yuklanmoqda...
        </div>
      ) : displayedStudents.length === 0 ? (
        <div className="bg-white border border-neutral-200 p-12 text-center text-xs text-slate-500">
          O&apos;quvchilar topilmadi.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayedStudents.map((st, idx) => {
            const isHidden = practiceMode && !revealedIds.has(st.id);
            return (
              <div
                key={st.id}
                onClick={() => {
                  if (practiceMode) {
                    toggleReveal(st.id);
                  } else if (st.photo_url) {
                    setZoomStudent(st);
                  }
                }}
                className="bg-white border border-neutral-200 shadow-xs hover:shadow-md hover:border-slate-400 transition overflow-hidden flex flex-col cursor-pointer group"
              >
                {/* Photo Area */}
                <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden flex items-center justify-center">
                  <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 text-[10px] font-bold bg-black/60 text-white">
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  {st.photo_url ? (
                    <img
                      src={st.photo_url}
                      alt={`${st.last_name} ${st.first_name}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-4">
                      <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-serif font-bold text-xl">
                        {getInitials(st)}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Rasm bog&apos;lanmagan
                      </span>
                    </div>
                  )}
                </div>

                {/* Name Area */}
                <div className="p-3 text-center flex-1 flex flex-col justify-center min-h-[68px] bg-white">
                  {isHidden ? (
                    <div className="py-1.5 px-2 bg-amber-50 border border-dashed border-amber-300 text-[11px] font-bold text-amber-800">
                      Ismni ko&apos;rish uchun bosing
                    </div>
                  ) : (
                    <>
                      <div className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                        {st.last_name} {st.first_name}
                      </div>
                      {st.middle_name && (
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {st.middle_name}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal for Enlarged Photo */}
      {zoomStudent && (
        <div
          onClick={() => setZoomStudent(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-sm w-full border border-neutral-300 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-slate-50">
              <div className="font-bold text-sm text-slate-900">
                {zoomStudent.last_name} {zoomStudent.first_name}
              </div>
              <button
                type="button"
                onClick={() => setZoomStudent(null)}
                className="text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {zoomStudent.photo_url && (
              <img
                src={zoomStudent.photo_url}
                alt={`${zoomStudent.last_name} ${zoomStudent.first_name}`}
                className="w-full max-h-[70vh] object-contain bg-slate-950"
              />
            )}
            <div className="p-4 text-center">
              <div className="font-serif font-bold text-lg text-slate-900">
                {zoomStudent.last_name} {zoomStudent.first_name} {zoomStudent.middle_name || ""}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {activeClassObj?.name || zoomStudent.class_name || ""}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
