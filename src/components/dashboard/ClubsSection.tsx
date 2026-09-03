"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, MoreVertical, Users, Calendar,
  Award, X, ClipboardList, History, CalendarDays, Save,
} from "lucide-react";

/* ─────────────────────────────────────── TYPES ─────────────────────────── */
interface ClubItem {
  id: number;
  name: string;
  subject_id: number;
  subject_name: string;
  teacher_name?: string;
  allowed_class_levels?: number[];
  schedules?: ScheduleItem[];
}

interface ScheduleItem {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface SubjectItem {
  id: number;
  name: string;
}

interface ClubsSectionProps {
  token: string;
  API_URL: string;
  subjects?: SubjectItem[];
}

/* ───────────────────────── UTILITY: safe fetch headers ─────────────────── */
function makeHeaders(token: string, json = false): Record<string, string> {
  const sId =
    typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
  const h: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (sId) h["X-School-ID"] = sId;
  if (json) h["Content-Type"] = "application/json";
  return h;
}

const DAYS = ["", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN MODAL COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
function AdminModal({
  isOpen, onClose, title, subtitle, maxWidth = "max-w-md", children,
}: {
  isOpen: boolean; onClose: () => void; title: string; subtitle?: string;
  maxWidth?: string; children: React.ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white ${maxWidth} w-full shadow-xl border border-slate-200 flex flex-col max-h-[92vh] rounded-none`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1D1E26] text-white shrink-0">
          <div>
            <h3 className="text-sm font-extrabold tracking-tight">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer rounded-none shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADD CLUB MODAL
═══════════════════════════════════════════════════════════════════════════ */
function AddClubModal({
  isOpen, onClose, onSubmit, name, setName, subjectId, setSubjectId,
  allowedLevels, setAllowedLevels, subjects, error, success,
}: {
  isOpen: boolean; onClose: () => void; onSubmit: (e: React.FormEvent) => void;
  name: string; setName: (v: string) => void;
  subjectId: number | ""; setSubjectId: (v: number | "") => void;
  allowedLevels: number[]; setAllowedLevels: (v: number[]) => void;
  subjects: SubjectItem[]; error: string; success: string;
}) {
  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Yangi To'garak" subtitle="Fan to'garagini tashkil etish">
      <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold">{error}</div>}
        {success && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">{success}</div>}

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            To'garak nomi *
          </label>
          <input
            type="text" required value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: Yosh Fiziklar"
            className="w-full text-sm border border-slate-200 px-3 py-2.5 bg-slate-50 font-medium text-[#1D1E26] outline-none focus:border-[#1D1E26] focus:ring-1 focus:ring-[#1D1E26] rounded-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            Fan *
          </label>
          <select
            required value={subjectId}
            onChange={(e) => setSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full text-sm border border-slate-200 px-3 py-2.5 bg-slate-50 font-medium text-[#1D1E26] outline-none focus:border-[#1D1E26] focus:ring-1 focus:ring-[#1D1E26] rounded-none cursor-pointer"
          >
            <option value="">-- Fanni tanlang --</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Ruxsat etilgan sinflar
          </label>
          <div className="grid grid-cols-4 gap-2 border border-slate-200 p-3 bg-slate-50">
            {[1,2,3,4,5,6,7,8,9,10,11].map((lvl) => {
              const checked = allowedLevels.includes(lvl);
              return (
                <button
                  key={lvl} type="button"
                  onClick={() => setAllowedLevels(
                    checked ? allowedLevels.filter((x) => x !== lvl) : [...allowedLevels, lvl].sort((a,b)=>a-b)
                  )}
                  className={`py-1.5 text-xs font-extrabold border transition rounded-none cursor-pointer ${
                    checked
                      ? "bg-[#1D1E26] text-[#D4F562] border-[#1D1E26]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[#1D1E26] hover:text-[#1D1E26]"
                  }`}
                >
                  {lvl}-sinf
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer rounded-none">
            Bekor qilish
          </button>
          <button type="submit"
            className="px-5 py-2 bg-[#1D1E26] hover:bg-slate-800 text-[#D4F562] text-xs font-extrabold cursor-pointer rounded-none">
            Tashkil qilish
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EDIT CLUB MODAL
═══════════════════════════════════════════════════════════════════════════ */
function EditClubModal({
  isOpen, onClose, onSubmit, name, setName, subjectId, setSubjectId,
  allowedLevels, setAllowedLevels, subjects, loading, error,
}: {
  isOpen: boolean; onClose: () => void; onSubmit: (e: React.FormEvent) => void;
  name: string; setName: (v: string) => void;
  subjectId: number | ""; setSubjectId: (v: number | "") => void;
  allowedLevels: number[]; setAllowedLevels: (v: number[]) => void;
  subjects: SubjectItem[]; loading: boolean; error: string;
}) {
  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="To'garakni tahrirlash" subtitle="Nom, fan va sinf darajalarini o'zgartirish">
      <form onSubmit={onSubmit} className="p-6 space-y-4 overflow-y-auto">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold">{error}</div>}

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            To'garak nomi *
          </label>
          <input
            type="text" required value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: IT scratch to'garagi"
            className="w-full text-sm border border-slate-200 px-3 py-2.5 bg-slate-50 font-medium text-[#1D1E26] outline-none focus:border-[#1D1E26] focus:ring-1 focus:ring-[#1D1E26] rounded-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            Biriktirilgan fan *
          </label>
          <select
            required value={subjectId}
            onChange={(e) => setSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full text-sm border border-slate-200 px-3 py-2.5 bg-slate-50 font-medium text-[#1D1E26] outline-none focus:border-[#1D1E26] focus:ring-1 focus:ring-[#1D1E26] rounded-none cursor-pointer"
          >
            <option value="">Fanni tanlang</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Ruxsat etilgan sinflar
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4,5,6,7,8,9,10,11].map((lvl) => {
              const sel = allowedLevels.includes(lvl);
              return (
                <button
                  key={lvl} type="button"
                  onClick={() => setAllowedLevels(
                    sel ? allowedLevels.filter((l) => l !== lvl) : [...allowedLevels, lvl].sort((a,b)=>a-b)
                  )}
                  className={`py-1.5 text-xs font-extrabold border transition rounded-none cursor-pointer ${
                    sel
                      ? "bg-[#1D1E26] text-[#D4F562] border-[#1D1E26]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[#1D1E26]"
                  }`}
                >
                  {lvl}-sinf
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer rounded-none">
            Bekor qilish
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 bg-[#1D1E26] hover:bg-slate-800 text-[#D4F562] text-xs font-extrabold cursor-pointer rounded-none disabled:opacity-50">
            {loading ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADD SCHEDULE MODAL
═══════════════════════════════════════════════════════════════════════════ */
function AddScheduleModal({
  isOpen, onClose, club, day, setDay, startTime, setStartTime,
  endTime, setEndTime, onSubmit,
}: {
  isOpen: boolean; onClose: () => void; club: ClubItem | null;
  day: number; setDay: (v: number) => void;
  startTime: string; setStartTime: (v: string) => void;
  endTime: string; setEndTime: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (!club) return null;
  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Jadval qo'shish" subtitle={`${club.name} to'garagi uchun`}>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
            Hafta kuni *
          </label>
          <select
            value={day} onChange={(e) => setDay(Number(e.target.value))}
            className="w-full text-sm border border-slate-200 px-3 py-2.5 bg-slate-50 font-medium text-[#1D1E26] outline-none focus:border-[#1D1E26] rounded-none cursor-pointer"
          >
            {DAYS.slice(1).map((d, i) => <option key={i+1} value={i+1}>{d}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Boshlanish *
            </label>
            <input type="time" required value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full text-sm border border-slate-200 px-3 py-2.5 bg-slate-50 font-mono text-[#1D1E26] outline-none focus:border-[#1D1E26] rounded-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Tugash *
            </label>
            <input type="time" required value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full text-sm border border-slate-200 px-3 py-2.5 bg-slate-50 font-mono text-[#1D1E26] outline-none focus:border-[#1D1E26] rounded-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer rounded-none">
            Bekor qilish
          </button>
          <button type="submit"
            className="px-5 py-2 bg-[#1D1E26] hover:bg-slate-800 text-[#D4F562] text-xs font-extrabold cursor-pointer rounded-none">
            Saqlash
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CLUB STUDENTS MODAL
═══════════════════════════════════════════════════════════════════════════ */
function ClubStudentsModalComponent({
  isOpen, onClose, club, students, studentsLoading,
  allStudents, onAdd, onApprove, onRemove,
}: {
  isOpen: boolean; onClose: () => void; club: ClubItem | null;
  students: any[]; studentsLoading: boolean;
  allStudents: any[];
  onAdd: (sid: number) => void;
  onApprove: (sid: number) => void;
  onRemove: (sid: number) => void;
}) {
  const [search, setSearch] = useState("");
  if (!club) return null;

  const memberIds = new Set(students.map((s) => s.student_id));
  const available = allStudents.filter((s) => {
    const id = s.id || s.student_id;
    if (memberIds.has(id)) return false;
    if (!search.trim()) return true;
    const full = `${s.first_name||""} ${s.last_name||""} ${s.middle_name||""}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="A'zolar va So'rovlar" subtitle={`${club.name} to'garagi`} maxWidth="max-w-xl">
      <div className="p-5 overflow-y-auto space-y-5 flex-1">
        {/* Add student */}
        <div className="bg-slate-50 border border-slate-200 p-4 space-y-3">
          <h4 className="text-[10px] font-extrabold text-[#1D1E26] uppercase tracking-widest">
            To'g'ridan-to'g'ri qo'shish
          </h4>
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism-familiya bo'yicha qidirish..."
              className="bg-transparent text-xs font-medium text-[#1D1E26] outline-none w-full placeholder:text-slate-400"
            />
          </div>
          <div className="max-h-40 overflow-y-auto border border-slate-200 bg-white divide-y divide-slate-100">
            {available.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 text-center italic">
                {search.trim() ? "Topilmadi" : "Barcha o'quvchilar a'zo"}
              </p>
            ) : available.map((st) => (
              <div key={st.id || st.student_id}
                className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 transition">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1D1E26]">{st.first_name} {st.last_name}</span>
                  {st.class_name && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-100 text-[#1D1E26] border border-slate-200 font-mono">
                      {st.class_name}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onAdd(st.student_id || st.id)}
                  className="bg-[#1D1E26] hover:bg-slate-800 text-[#D4F562] font-extrabold text-[10px] px-3 py-1 cursor-pointer rounded-none">
                  + Qo'shish
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Members list */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-extrabold text-[#1D1E26] uppercase tracking-widest">
            To'garakdagilar ro'yxati
          </h4>
          {studentsLoading ? (
            <div className="text-center py-6">
              <div className="w-5 h-5 border-2 border-[#1D1E26] border-t-transparent animate-spin mx-auto" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 italic bg-slate-50 border border-dashed border-slate-200">
              Hozircha a'zolar yoki so'rovlar mavjud emas.
            </p>
          ) : (
            <div className="border border-slate-200 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs bg-white">
                <thead className="bg-[#1D1E26] text-[10px] font-extrabold text-[#D4F562] uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-2.5">F.I.SH</th>
                    <th className="px-4 py-2.5">Sinfi</th>
                    <th className="px-4 py-2.5">Holati</th>
                    <th className="px-4 py-2.5 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((cs) => (
                    <tr key={cs.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-2.5 font-bold text-[#1D1E26]">{cs.student_name}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">{cs.class_name}</td>
                      <td className="px-4 py-2.5">
                        {cs.status === "PENDING" ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-extrabold">
                            Kutilmoqda
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold">
                            A'zo ✓
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-1.5">
                        {cs.status === "PENDING" && (
                          <button onClick={() => onApprove(cs.student_id)}
                            className="text-[10px] bg-[#1D1E26] text-[#D4F562] font-extrabold py-1 px-2.5 cursor-pointer rounded-none hover:bg-slate-800">
                            Tasdiqlash
                          </button>
                        )}
                        <button onClick={() => onRemove(cs.student_id)}
                          className="text-[10px] bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-bold py-1 px-2.5 cursor-pointer rounded-none">
                          {cs.status === "PENDING" ? "Rad etish" : "Chiqarish"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <div className="px-5 py-3 border-t border-slate-100 text-right shrink-0">
        <button onClick={onClose}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer rounded-none">
          Yopish
        </button>
      </div>
    </AdminModal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CLUB GRADING MODAL
═══════════════════════════════════════════════════════════════════════════ */
function ClubGradingModalComponent({
  isOpen, onClose, club, tab, setTab, date, setDate, onDateChange,
  gradingLoading, gradingStudents, setGradingStudents, saving,
  onSave, historyLoading, history, fetchHistory,
}: {
  isOpen: boolean; onClose: () => void; club: ClubItem | null;
  tab: "grade" | "history"; setTab: (t: "grade" | "history") => void;
  date: string; setDate: (d: string) => void; onDateChange: (d: string) => void;
  gradingLoading: boolean; gradingStudents: any[];
  setGradingStudents: React.Dispatch<React.SetStateAction<any[]>>;
  saving: boolean; onSave: (e: React.FormEvent) => void;
  historyLoading: boolean; history: any[]; fetchHistory: () => void;
}) {
  if (!club) return null;
  return (
    <AdminModal isOpen={isOpen} onClose={onClose}
      title="To'garak Jurnali va Baholash"
      subtitle={`${club.name} — ${club.subject_name}`}
      maxWidth="max-w-3xl"
    >
      {/* Tabs */}
      <div className="flex items-center gap-0 px-5 pt-4 pb-0 border-b border-slate-100 bg-white shrink-0">
        {([
          { id: "grade", label: "Baholash", Icon: ClipboardList },
          { id: "history", label: "O'tgan Mashg'ulotlar", Icon: History },
        ] as const).map(({ id, label, Icon }) => (
          <button key={id} type="button"
            onClick={() => {
              setTab(id);
              if (id === "history") fetchHistory();
            }}
            className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition ${
              tab === id
                ? "border-[#1D1E26] text-[#1D1E26]"
                : "border-transparent text-slate-500 hover:text-[#1D1E26] hover:bg-slate-50"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Grade Tab */}
      {tab === "grade" && (
        <form onSubmit={onSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                Mashg'ulot Sanasi
              </label>
              <input type="date" required value={date}
                onChange={(e) => { setDate(e.target.value); onDateChange(e.target.value); }}
                className="px-3 py-2 bg-white border border-slate-200 text-xs font-extrabold text-[#1D1E26] outline-none focus:border-[#1D1E26] rounded-none"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium max-w-xs bg-white px-3 py-2 border border-slate-200">
              Sana tanlang va davomatni kiriting.
            </span>
          </div>

          {gradingLoading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-mono">Yuklanmoqda...</p>
            </div>
          ) : gradingStudents.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 space-y-1">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-[#1D1E26] text-sm">O'quvchilar topilmadi</p>
              <p className="text-xs text-slate-500">
                To'garakda tasdiqlangan o'quvchilar yo'q. "A'zolar" bo'limidan qo'shing.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#1D1E26] text-[#D4F562]">
                  <tr>
                    <th className="p-3 text-[10px] font-extrabold uppercase tracking-widest">O'quvchi</th>
                    <th className="p-3 text-center text-[10px] font-extrabold uppercase tracking-widest">Davomat</th>
                    <th className="p-3 w-20 text-[10px] font-extrabold uppercase tracking-widest">Baho</th>
                    <th className="p-3 text-[10px] font-extrabold uppercase tracking-widest">Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {gradingStudents.map((st, idx) => (
                    <tr key={st.student_id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-bold text-[#1D1E26]">
                        {st.student_name}
                        <span className="block text-[10px] text-slate-400 font-medium">{st.class_name}</span>
                      </td>
                      <td className="p-3">
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-1">
                          {(["PRESENT", "ABSENT", "EXCUSED"] as const).map((att) => (
                            <button key={att} type="button"
                              onClick={() => setGradingStudents((prev) =>
                                prev.map((item, i) => i === idx ? { ...item, attendance: att } : item)
                              )}
                              className={`px-2 py-1 text-[10px] font-bold transition cursor-pointer rounded-none ${
                                st.attendance === att
                                  ? att === "PRESENT" ? "bg-emerald-600 text-white"
                                  : att === "ABSENT" ? "bg-rose-600 text-white"
                                  : "bg-amber-500 text-white"
                                  : "text-slate-500 hover:text-[#1D1E26] hover:bg-white"
                              }`}
                            >
                              {att === "PRESENT" ? "Keldi" : att === "ABSENT" ? "Kelmadi" : "Sababli"}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <input type="text" placeholder="—" value={st.score_value}
                          onChange={(e) => setGradingStudents((prev) =>
                            prev.map((item, i) => i === idx ? { ...item, score_value: e.target.value } : item)
                          )}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 text-xs font-black text-center text-[#1D1E26] outline-none focus:border-[#1D1E26] rounded-none"
                        />
                      </td>
                      <td className="p-3">
                        <input type="text" placeholder="Izoh..." value={st.feedback}
                          onChange={(e) => setGradingStudents((prev) =>
                            prev.map((item, i) => i === idx ? { ...item, feedback: e.target.value } : item)
                          )}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 text-xs text-[#1D1E26] outline-none focus:border-[#1D1E26] rounded-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer rounded-none">
              Bekor qilish
            </button>
            <button type="submit"
              disabled={saving || gradingStudents.length === 0}
              className="px-5 py-2 bg-[#1D1E26] text-[#D4F562] text-xs font-extrabold hover:bg-slate-800 cursor-pointer rounded-none disabled:opacity-50 flex items-center gap-2">
              {saving && <span className="w-3.5 h-3.5 border border-[#D4F562] border-t-transparent animate-spin" />}
              <Save className="w-3.5 h-3.5" />
              <span>Saqlash</span>
            </button>
          </div>
        </form>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {historyLoading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-mono">Tarix yuklanmoqda...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200">
              <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-[#1D1E26]">O'tgan mashg'ulotlar mavjud emas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((session: any, si: number) => (
                <div key={si} className="border border-slate-200 overflow-hidden">
                  <div className="bg-[#1D1E26] px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#D4F562] flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {new Date(session.lesson_date || session.date || "").toLocaleDateString("uz-UZ", {
                        weekday: "long", day: "numeric", month: "long", year: "numeric"
                      })}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {session.grades?.length || 0} ta o'quvchi
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {(session.grades || []).map((g: any) => (
                      <div key={g.student_id || g.id}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition text-xs">
                        <div>
                          <span className="font-bold text-[#1D1E26]">{g.student_name}</span>
                          <span className="text-slate-400 ml-2">{g.class_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {g.attendance === "PRESENT" && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[9px] font-extrabold">Keldi</span>
                          )}
                          {g.attendance === "ABSENT" && (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[9px] font-extrabold">Kelmadi</span>
                          )}
                          {g.attendance === "EXCUSED" && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[9px] font-extrabold">Sababli</span>
                          )}
                          {g.score_value && (
                            <span className={`w-7 h-7 flex items-center justify-center text-xs font-black border rounded-none ${
                              Number(g.score_value) >= 5 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : Number(g.score_value) >= 4 ? "bg-blue-50 text-blue-700 border-blue-200"
                              : Number(g.score_value) >= 3 ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>{g.score_value}</span>
                          )}
                          {g.feedback && (
                            <span className="text-[10px] text-slate-500 italic max-w-[120px] truncate">{g.feedback}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminModal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIRM DIALOG
═══════════════════════════════════════════════════════════════════════════ */
function ConfirmDialog({
  isOpen, title, message, onConfirm, onCancel,
}: {
  isOpen: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 shadow-xl max-w-sm w-full rounded-none">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-[#1D1E26]">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">{message}</p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4">
          <button onClick={onCancel}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer rounded-none">
            Bekor qilish
          </button>
          <button onClick={onConfirm}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer rounded-none">
            Ha, o'chirish
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════════════════ */
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-5 py-3 shadow-xl border text-sm font-bold rounded-none animate-fadeIn ${
      type === "success" ? "bg-[#1D1E26] text-[#D4F562] border-[#D4F562]/30" : "bg-rose-600 text-white border-rose-500"
    }`}>
      <span>{message}</span>
      <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 cursor-pointer"><X className="w-4 h-4" /></button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN ClubsSection
═══════════════════════════════════════════════════════════════════════════ */
export default function ClubsSection({ token, API_URL, subjects = [] }: ClubsSectionProps) {
  /* ── core data ── */
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  /* ── dropdown menu ── */
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  /* ── Add Club ── */
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addSubjectId, setAddSubjectId] = useState<number | "">("");
  const [addLevels, setAddLevels] = useState<number[]>([]);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  /* ── Edit Club ── */
  const [showEdit, setShowEdit] = useState(false);
  const [editingClub, setEditingClub] = useState<ClubItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubjectId, setEditSubjectId] = useState<number | "">("");
  const [editLevels, setEditLevels] = useState<number[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  /* ── Schedule ── */
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleClub, setScheduleClub] = useState<ClubItem | null>(null);
  const [schedDay, setSchedDay] = useState(1);
  const [schedStart, setSchedStart] = useState("14:00");
  const [schedEnd, setSchedEnd] = useState("15:30");

  /* ── Students modal ── */
  const [showStudents, setShowStudents] = useState(false);
  const [studentsClub, setStudentsClub] = useState<ClubItem | null>(null);
  const [clubStudents, setClubStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  /* ── Grading modal ── */
  const [showGrading, setShowGrading] = useState(false);
  const [gradingClub, setGradingClub] = useState<ClubItem | null>(null);
  const [gradingTab, setGradingTab] = useState<"grade" | "history">("grade");
  const [gradingDate, setGradingDate] = useState(new Date().toISOString().split("T")[0]);
  const [gradingStudents, setGradingStudents] = useState<any[]>([]);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  /* ── Confirm dialog ── */
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({
    open: false, title: "", message: "", onConfirm: () => {},
  });

  /* ── Toast ── */
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  /* ────────────── helpers ────────────── */
  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
  }, []);

  /* ────────────── fetch clubs ────────────── */
  const fetchClubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schools/clubs`, { headers: makeHeaders(token) });
      if (res.ok) {
        const data = await res.json();
        setClubs(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token, API_URL]);

  /* ────────────── fetch all students for search ────────────── */
  const fetchAllStudents = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/schools/students`, { headers: makeHeaders(token) });
      if (res.ok) {
        const data = await res.json();
        setAllStudents(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error(e); }
  }, [token, API_URL]);

  useEffect(() => {
    if (token) { fetchClubs(); fetchAllStudents(); }
  }, [fetchClubs, fetchAllStudents, token]);

  /* close dropdown on outside click */
  useEffect(() => {
    if (openMenuId === null) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.club-menu-${openMenuId}`)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

  /* ────────────── subjects fetch if not passed ────────────── */
  const [localSubjects, setLocalSubjects] = useState<SubjectItem[]>([]);
  useEffect(() => {
    if (subjects.length > 0) { setLocalSubjects(subjects); return; }
    fetch(`${API_URL}/api/schools/subjects`, { headers: makeHeaders(token) })
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setLocalSubjects(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [subjects, token, API_URL]);
  const allSubjects = subjects.length > 0 ? subjects : localSubjects;

  /* ────────────── create club ────────────── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addSubjectId) {
      setAddError("To'garak nomi va fanni kiriting"); return;
    }
    setAddError(""); setAddSuccess("");
    try {
      const res = await fetch(`${API_URL}/api/schools/clubs`, {
        method: "POST", headers: makeHeaders(token, true),
        body: JSON.stringify({ name: addName.trim(), subject_id: Number(addSubjectId), allowed_class_levels: addLevels }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Xatolik");
      setAddSuccess("To'garak muvaffaqiyatli yaratildi");
      setAddName(""); setAddSubjectId(""); setAddLevels([]);
      fetchClubs();
      setTimeout(() => setShowAdd(false), 1500);
    } catch (err: any) { setAddError(err.message); }
  };

  /* ────────────── edit club ────────────── */
  const openEdit = (club: ClubItem) => {
    setEditingClub(club);
    setEditName(club.name);
    setEditSubjectId(club.subject_id);
    setEditLevels(club.allowed_class_levels || []);
    setEditError("");
    setShowEdit(true);
    setOpenMenuId(null);
  };
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub) return;
    setEditLoading(true); setEditError("");
    try {
      const res = await fetch(`${API_URL}/api/schools/clubs/${editingClub.id}`, {
        method: "PUT", headers: makeHeaders(token, true),
        body: JSON.stringify({ name: editName, subject_id: Number(editSubjectId), allowed_class_levels: editLevels }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Xatolik");
      showToast("success", "To'garak yangilandi!");
      setShowEdit(false); fetchClubs();
    } catch (err: any) { setEditError(err.message); }
    finally { setEditLoading(false); }
  };

  /* ────────────── delete club ────────────── */
  const handleDelete = (clubId: number) => {
    setOpenMenuId(null);
    setConfirm({
      open: true,
      title: "To'garakni o'chirish",
      message: "Haqiqatan ham ushbu to'garakni o'chirmoqchimisiz? Barcha a'zolar va jadvallar bekor qilinadi.",
      onConfirm: async () => {
        setConfirm((p) => ({ ...p, open: false }));
        try {
          const res = await fetch(`${API_URL}/api/schools/clubs/${clubId}`, {
            method: "DELETE", headers: makeHeaders(token),
          });
          if (!res.ok) throw new Error();
          showToast("success", "To'garak o'chirildi!");
          fetchClubs();
        } catch { showToast("error", "O'chirishda xatolik yuz berdi"); }
      },
    });
  };

  /* ────────────── schedule ────────────── */
  const openSchedule = (club: ClubItem) => {
    setScheduleClub(club); setSchedDay(1); setSchedStart("14:00"); setSchedEnd("15:30");
    setShowSchedule(true); setOpenMenuId(null);
  };
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleClub) return;
    try {
      const res = await fetch(`${API_URL}/api/schools/clubs/${scheduleClub.id}/schedules`, {
        method: "POST", headers: makeHeaders(token, true),
        body: JSON.stringify({ day_of_week: Number(schedDay), start_time: schedStart, end_time: schedEnd }),
      });
      if (!res.ok) throw new Error();
      showToast("success", "Jadval qo'shildi!"); setShowSchedule(false); fetchClubs();
    } catch { showToast("error", "Jadval qo'shishda xatolik"); }
  };
  const handleDeleteSchedule = (schId: number) => {
    setConfirm({
      open: true, title: "Jadvalni o'chirish", message: "Ushbu jadvalni o'chirmoqchimisiz?",
      onConfirm: async () => {
        setConfirm((p) => ({ ...p, open: false }));
        try {
          await fetch(`${API_URL}/api/schools/clubs/schedules/${schId}`, {
            method: "DELETE", headers: makeHeaders(token),
          });
          showToast("success", "Jadval o'chirildi!"); fetchClubs();
        } catch { showToast("error", "Xatolik yuz berdi"); }
      },
    });
  };

  /* ────────────── students ────────────── */
  const fetchClubStudents = async (clubId: number) => {
    setStudentsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schools/clubs/${clubId}/students`, { headers: makeHeaders(token) });
      if (res.ok) setClubStudents(await res.json());
    } catch { } finally { setStudentsLoading(false); }
  };
  const openStudents = (club: ClubItem) => {
    setStudentsClub(club); setClubStudents([]); fetchClubStudents(club.id);
    setShowStudents(true); setOpenMenuId(null);
  };
  const handleAddStudent = async (sid: number) => {
    if (!studentsClub) return;
    try {
      const res = await fetch(`${API_URL}/api/schools/clubs/${studentsClub.id}/add-student`, {
        method: "POST", headers: makeHeaders(token, true), body: JSON.stringify({ student_id: sid }),
      });
      if (!res.ok) throw new Error();
      showToast("success", "O'quvchi qo'shildi!"); fetchClubStudents(studentsClub.id);
    } catch { showToast("error", "Qo'shishda xatolik"); }
  };
  const handleApproveStudent = async (sid: number) => {
    if (!studentsClub) return;
    try {
      const res = await fetch(`${API_URL}/api/schools/clubs/${studentsClub.id}/approve-student`, {
        method: "POST", headers: makeHeaders(token, true), body: JSON.stringify({ student_id: sid }),
      });
      if (!res.ok) throw new Error();
      showToast("success", "Tasdiqlandi!"); fetchClubStudents(studentsClub.id);
    } catch { showToast("error", "Tasdiqlashda xatolik"); }
  };
  const handleRemoveStudent = (sid: number) => {
    setConfirm({
      open: true, title: "O'quvchini chiqarish", message: "Ushbu o'quvchini to'garakdan chiqarmoqchimisiz?",
      onConfirm: async () => {
        setConfirm((p) => ({ ...p, open: false }));
        if (!studentsClub) return;
        try {
          await fetch(`${API_URL}/api/schools/clubs/${studentsClub.id}/remove-student`, {
            method: "DELETE", headers: makeHeaders(token, true),
            body: JSON.stringify({ student_id: sid }),
          });
          showToast("success", "O'quvchi chiqarildi!"); fetchClubStudents(studentsClub.id);
        } catch { showToast("error", "Xatolik yuz berdi"); }
      },
    });
  };

  /* ────────────── grading ────────────── */
  const fetchGradingData = async (clubId: number, dateStr: string) => {
    setGradingLoading(true);
    try {
      const [stRes, grRes] = await Promise.all([
        fetch(`${API_URL}/api/schools/clubs/${clubId}/students`, { headers: makeHeaders(token) }),
        fetch(`${API_URL}/api/schools/clubs/${clubId}/grades?date=${dateStr}`, { headers: makeHeaders(token) }),
      ]);
      const stData = stRes.ok ? await stRes.json() : [];
      const grData = grRes.ok ? await grRes.json() : [];
      const approved = (stData as any[]).filter((s) => s.status === "APPROVED");
      const gradesMap = new Map((grData as any[]).map((g) => [g.student_id, g]));
      setGradingStudents(approved.map((st) => {
        const ex = gradesMap.get(st.student_id);
        return {
          student_id: st.student_id, student_name: st.student_name, class_name: st.class_name,
          attendance: ex ? ex.attendance : "PRESENT",
          score_value: ex ? ex.score_value : "",
          feedback: ex ? ex.feedback : "",
        };
      }));
    } catch { } finally { setGradingLoading(false); }
  };
  const openGrading = (club: ClubItem) => {
    setGradingClub(club); setGradingTab("grade");
    const today = new Date().toISOString().split("T")[0];
    setGradingDate(today); setGradingStudents([]); setHistory([]);
    fetchGradingData(club.id, today);
    setShowGrading(true); setOpenMenuId(null);
  };
  const handleSaveGrades = async (e: React.FormEvent) => {
    e.preventDefault(); if (!gradingClub) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/schools/clubs/${gradingClub.id}/grades`, {
        method: "POST", headers: makeHeaders(token, true),
        body: JSON.stringify({
          lesson_date: gradingDate,
          grades: gradingStudents.map((st) => ({
            student_id: st.student_id, attendance: st.attendance,
            score_value: st.score_value, feedback: st.feedback,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      showToast("success", "Baholar saqlandi!"); setShowGrading(false);
    } catch { showToast("error", "Saqlashda xatolik yuz berdi"); }
    finally { setSaving(false); }
  };
  const fetchHistory = async () => {
    if (!gradingClub) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schools/clubs/${gradingClub.id}/grades/history`, { headers: makeHeaders(token) });
      if (res.ok) setHistory(await res.json());
    } catch { } finally { setHistoryLoading(false); }
  };

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* ── Header ── */}
      <div className="bg-white border border-slate-100/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 font-mono">
            Maktabdagi barcha fan to'garaklari ro'yxati va boshqaruvi
          </p>
        </div>
        <button
          onClick={() => { setAddName(""); setAddSubjectId(""); setAddLevels([]); setAddError(""); setAddSuccess(""); setShowAdd(true); }}
          className="bg-[#1D1E26] hover:bg-slate-800 text-[#D4F562] text-xs font-extrabold px-4 py-2.5 flex items-center gap-2 cursor-pointer shrink-0 transition"
        >
          <Plus className="w-4 h-4" />
          Yangi To'garak
        </button>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="text-center py-16 bg-white border border-slate-100/80">
          <div className="w-6 h-6 border-2 border-[#1D1E26] border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-mono">Yuklanmoqda...</p>
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200">
          <div className="w-14 h-14 bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <p className="text-sm font-extrabold text-[#1D1E26] mb-1">To'garaklar mavjud emas</p>
          <p className="text-xs text-slate-400">"Yangi To'garak" tugmasi orqali yaratishingiz mumkin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clubs.map((club) => (
            <div key={club.id}
              className="bg-white border border-slate-100/80 p-5 space-y-4 hover:shadow-md transition relative">
              {/* Club header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="space-y-1 min-w-0 flex-1 pr-2">
                  <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 font-mono inline-block">
                    {club.subject_name}
                  </span>
                  <h4 className="text-sm font-extrabold text-[#1D1E26] truncate">{club.name}</h4>
                  {club.teacher_name && (
                    <p className="text-xs text-slate-400 font-medium">
                      O'qituvchi: <span className="font-bold text-slate-600">{club.teacher_name}</span>
                    </p>
                  )}
                  <p className="text-xs text-slate-400 font-medium">
                    Sinflar:{" "}
                    <span className="font-bold text-slate-600">
                      {club.allowed_class_levels && club.allowed_class_levels.length > 0
                        ? club.allowed_class_levels.join(", ") + "-sinflar"
                        : "Barchasi"}
                    </span>
                  </p>
                </div>

                {/* Actions */}
                <div className={`relative flex items-center gap-1.5 shrink-0 club-menu-${club.id}`}>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <button onClick={() => openEdit(club)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#1D1E26] cursor-pointer flex items-center justify-center transition"
                      title="Tahrirlash">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(club.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 cursor-pointer flex items-center justify-center transition"
                      title="O'chirish">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === club.id ? null : club.id)}
                    className={`p-2 border cursor-pointer flex items-center justify-center transition ${
                      openMenuId === club.id
                        ? "bg-[#1D1E26] border-[#1D1E26] text-[#D4F562]"
                        : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-[#1D1E26]"
                    }`}
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown */}
                  {openMenuId === club.id && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 shadow-xl z-40 p-1 space-y-0.5">
                      {/* mobile edit */}
                      <button onClick={() => openEdit(club)}
                        className="sm:hidden w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#1D1E26] hover:bg-slate-50 cursor-pointer">
                        <div className="w-7 h-7 bg-slate-100 text-[#1D1E26] flex items-center justify-center shrink-0"><Pencil className="w-3.5 h-3.5" /></div>
                        <span>Tahrirlash</span>
                      </button>

                      <button onClick={() => openStudents(club)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#1D1E26] hover:bg-slate-50 cursor-pointer">
                        <div className="w-7 h-7 bg-slate-100 text-[#1D1E26] flex items-center justify-center shrink-0"><Users className="w-3.5 h-3.5" /></div>
                        <span>To'garak a'zolari</span>
                      </button>

                      <button onClick={() => openSchedule(club)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#1D1E26] hover:bg-slate-50 cursor-pointer">
                        <div className="w-7 h-7 bg-slate-100 text-[#1D1E26] flex items-center justify-center shrink-0"><Calendar className="w-3.5 h-3.5" /></div>
                        <span>Dars jadvali</span>
                      </button>

                      <button onClick={() => openGrading(club)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#1D1E26] hover:bg-slate-50 cursor-pointer">
                        <div className="w-7 h-7 bg-slate-100 text-[#1D1E26] flex items-center justify-center shrink-0"><Award className="w-3.5 h-3.5" /></div>
                        <span>Jurnal & Baholash</span>
                      </button>

                      <div className="sm:hidden border-t border-slate-100 pt-1 mt-1">
                        <button onClick={() => handleDelete(club.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer">
                          <div className="w-7 h-7 bg-rose-100 text-rose-600 flex items-center justify-center shrink-0"><Trash2 className="w-3.5 h-3.5" /></div>
                          <span>O'chirish</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule list */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#1D1E26]" /> To'garak Jadvali
                </h5>
                {!club.schedules || club.schedules.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 border border-slate-200">
                    Hali dars jadvali belgilanmagan
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {club.schedules.map((sch) => (
                      <div key={sch.id}
                        className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 text-xs">
                        <div>
                          <span className="font-extrabold text-[#1D1E26] block">{DAYS[sch.day_of_week]}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {sch.start_time} - {sch.end_time}
                          </span>
                        </div>
                        <button onClick={() => handleDeleteSchedule(sch.id)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 transition cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ MODALS ══ */}
      <AddClubModal
        isOpen={showAdd} onClose={() => setShowAdd(false)} onSubmit={handleCreate}
        name={addName} setName={setAddName}
        subjectId={addSubjectId} setSubjectId={setAddSubjectId}
        allowedLevels={addLevels} setAllowedLevels={setAddLevels}
        subjects={allSubjects} error={addError} success={addSuccess}
      />

      <EditClubModal
        isOpen={showEdit} onClose={() => setShowEdit(false)} onSubmit={handleEdit}
        name={editName} setName={setEditName}
        subjectId={editSubjectId} setSubjectId={setEditSubjectId}
        allowedLevels={editLevels} setAllowedLevels={setEditLevels}
        subjects={allSubjects} loading={editLoading} error={editError}
      />

      <AddScheduleModal
        isOpen={showSchedule} onClose={() => setShowSchedule(false)} club={scheduleClub}
        day={schedDay} setDay={setSchedDay}
        startTime={schedStart} setStartTime={setSchedStart}
        endTime={schedEnd} setEndTime={setSchedEnd}
        onSubmit={handleAddSchedule}
      />

      <ClubStudentsModalComponent
        isOpen={showStudents} onClose={() => setShowStudents(false)} club={studentsClub}
        students={clubStudents} studentsLoading={studentsLoading}
        allStudents={allStudents}
        onAdd={handleAddStudent} onApprove={handleApproveStudent} onRemove={handleRemoveStudent}
      />

      <ClubGradingModalComponent
        isOpen={showGrading} onClose={() => setShowGrading(false)} club={gradingClub}
        tab={gradingTab} setTab={setGradingTab}
        date={gradingDate} setDate={setGradingDate}
        onDateChange={(d) => { if (gradingClub) fetchGradingData(gradingClub.id, d); }}
        gradingLoading={gradingLoading} gradingStudents={gradingStudents}
        setGradingStudents={setGradingStudents} saving={saving} onSave={handleSaveGrades}
        historyLoading={historyLoading} history={history} fetchHistory={fetchHistory}
      />

      <ConfirmDialog
        isOpen={confirm.open} title={confirm.title} message={confirm.message}
        onConfirm={confirm.onConfirm} onCancel={() => setConfirm((p) => ({ ...p, open: false }))}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
