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

  const safeFetchHeaders = () => {
    const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
    };
    if (sId) headers["X-School-ID"] = sId;
    return headers;
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectNameInput.trim()) return;
    setActionLoading(true);
    setActionError("");

    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(`${API_URL}/api/schools/subjects`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: subjectNameInput.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Fanni saqlab bo'lmadi");

      // Refresh list
      const resList = await fetch(`${API_URL}/api/schools/subjects`, {
        headers: safeFetchHeaders(),
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
    <div className="space-y-6 font-sans text-[#1D1E26] select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1D1E26] tracking-tight">Fanlar Ma'lumotnomasi</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Maktabdagi dars fanlari ro'yxatini shakllantiring.</p>
        </div>
        <button
          onClick={() => setShowAddSubjectModal(true)}
          className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
        >
          + Yangi Fan Qo'shish
        </button>
      </div>

      {/* Search Bar Input */}
      <div className="relative max-w-sm w-full">
        <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Fanni izlash..."
          value={subjectSearch}
          onChange={(e) => setSubjectSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#D4F562] shadow-xs transition"
        />
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <p className="text-slate-400 text-xs font-medium">Fanlar topilmadi.</p>
        </div>
      ) : (
        <div className="max-w-2xl overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
              <tr>
                <th className="px-6 py-4 w-20">T/R</th>
                <th className="px-6 py-4">Fan Nomi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
              {filteredSubjects.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="px-6 py-4 font-bold text-[#1D1E26]">{s.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Subject */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl text-[#1D1E26]">
            <h3 className="text-base font-black text-[#1D1E26] mb-1">Yangi Fan Qo'shish</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Tizimga yangi fan nomini kiriting (masalan: Matematika, Ona tili).</p>

            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-2xl mb-4 font-medium">{actionError}</div>
            )}

            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Fan Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Matematika"
                  value={subjectNameInput}
                  onChange={(e) => setSubjectNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubjectModal(false);
                    setSubjectNameInput("");
                    setActionError("");
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
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
