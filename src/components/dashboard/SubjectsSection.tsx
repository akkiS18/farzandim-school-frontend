import React, { useState } from "react";
import { SubjectItem } from "./types";

interface SubjectsSectionProps {
  subjects: SubjectItem[];
  token: string;
  API_URL: string;
  setSubjects: React.Dispatch<React.SetStateAction<SubjectItem[]>>;
}

export default function SubjectsSection({
  subjects,
  token,
  API_URL,
  setSubjects,
}: SubjectsSectionProps) {
  const [subjectSearch, setSubjectSearch] = useState("");
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [subjectNameInput, setSubjectNameInput] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectNameInput.trim()) return;
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`${API_URL}/api/schools/subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name: subjectNameInput.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Fanni saqlab bo'lmadi");

      // Refresh list
      const resList = await fetch(`${API_URL}/api/schools/subjects`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const dataList = await resList.json();
      if (resList.ok) setSubjects(Array.isArray(dataList) ? dataList : []);

      setShowAddSubjectModal(false);
      setSubjectNameInput("");
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Fanlar Ma'lumotnomasi</h1>
          <p className="text-xs text-zinc-500 mt-1">Maktabdagi dars fanlari ro'yxatini shakllantiring.</p>
        </div>
        <button
          onClick={() => setShowAddSubjectModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
        >
          + Yangi Fan Qo'shish
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm w-full">
        <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500 pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Fanni izlash..."
          value={subjectSearch}
          onChange={(e) => setSubjectSearch(e.target.value)}
          className="w-full bg-zinc-950/40 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition"
        />
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800/60 rounded-3xl bg-zinc-950/10">
          <p className="text-zinc-500 text-sm">Fanlar topilmadi.</p>
        </div>
      ) : (
        <div className="max-w-xl overflow-hidden rounded-2xl border border-zinc-800/60 bg-[#0d0d12]/30 backdrop-blur-xl">
          <table className="min-w-full divide-y divide-zinc-800/60 text-left">
            <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">T/R</th>
                <th className="px-6 py-4">Fan Nomi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
              {filteredSubjects.map((s, idx) => (
                <tr key={s.id} className="hover:bg-zinc-900/10 transition">
                  <td className="px-6 py-4 text-zinc-500 font-mono">{idx + 1}</td>
                  <td className="px-6 py-4 font-bold text-zinc-200">{s.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Subject */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Yangi Fan Qo'shish</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Tizimga yangi fan nomini kiriting (masalan: Matematika, Ona tili).</p>

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Fan Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Matematika"
                  value={subjectNameInput}
                  onChange={(e) => setSubjectNameInput(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubjectModal(false);
                    setSubjectNameInput("");
                    setActionError("");
                  }}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
