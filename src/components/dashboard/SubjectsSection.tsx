import React, { useState, useEffect } from "react";
import { useDialog } from "../../hooks/useDialog";
import CustomDialogModal from "../CustomDialogModal";
import { Trash2, Plus } from "lucide-react";
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
  const { dialogState, showAlert, showConfirm } = useDialog();
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [subjectNameInput, setSubjectNameInput] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddSubjectModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const safeFetchHeaders = () => {
    const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
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
        body: JSON.stringify({
          name: subjectNameInput.trim(),
          target_levels: selectedLevels,
        }),
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
      setSelectedLevels([]);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (!token) return;
    setDeletingId(id);
    try {
      const response = await fetch(`${API_URL}/api/schools/subjects/${id}`, {
        method: "DELETE",
        headers: safeFetchHeaders(),
      });

      if (response.ok) {
        setSubjects((prev) => prev.filter((s) => s.id !== id));
      } else {
        const data = await response.json();
        showAlert(data.error || "Fanni o'chirishda xatolik yuz berdi");
      }
    } catch {
      showAlert("Server bilan bog'lanishda xatolik");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleLevel = (lvl: number) => {
    setSelectedLevels((prev) =>
      prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]
    );
  };

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-[#1D1E26] select-none">
      {/* ── Unified Header ── */}
      <div className="bg-white border border-slate-100/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Left: Title + Search */}
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
          
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Fanni izlash..."
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 focus:ring-2 focus:ring-[#1D1E26] pl-9 pr-4 py-2 text-xs outline-none transition font-medium"
            />
          </div>
        </div>

        {/* Right: Stats + Action */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <span className="text-xs text-slate-500 font-mono hidden sm:block">
            Jami: <strong className="text-[#1D1E26] font-extrabold">{subjects.length}</strong> ta fan
          </span>
          <button
            onClick={() => {
              setSubjectNameInput("");
              setSelectedLevels([]);
              setActionError("");
              setShowAddSubjectModal(true);
            }}
            className="bg-[#1D1E26] text-[#D4F562] hover:bg-slate-800 font-extrabold text-xs py-2.5 px-4 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Yangi Fan Qo'shish
          </button>
        </div>
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 bg-white">
          <p className="text-slate-400 text-xs font-medium">Fanlar topilmadi.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
              <tr>
                <th className="px-6 py-4 w-16">T/R</th>
                <th className="px-6 py-4">Fan Nomi</th>
                <th className="px-6 py-4">Tegishli Levellar</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
              {filteredSubjects.map((s, idx) => {
                const hasLevels = s.target_levels && s.target_levels.length > 0;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-6 py-4 font-bold text-[#1D1E26]">{s.name}</td>
                    <td className="px-6 py-4">
                      {hasLevels ? (
                        <span className="bg-slate-100 text-[#1D1E26] font-mono text-[11px] font-extrabold px-2.5 py-1">
                          {s.target_levels?.join(", ")}-sinflar
                        </span>
                      ) : (
                        <span className="bg-[#1D1E26] text-[#D4F562] font-mono text-[11px] font-extrabold px-2.5 py-1">
                          Barcha sinflar uchun
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteSubject(s.id)}
                        disabled={deletingId === s.id}
                        title="O'chirish"
                        className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition cursor-pointer inline-flex items-center justify-center disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Subject */}
      {showAddSubjectModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddSubjectModal(false);
              setSubjectNameInput("");
              setSelectedLevels([]);
              setActionError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 p-6 shadow-2xl text-[#1D1E26] space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#1D1E26]">Yangi Fan Qo'shish</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Fan nomini va u o'tiladigan sinf levellarini belgilang.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddSubjectModal(false);
                  setSubjectNameInput("");
                  setSelectedLevels([]);
                  setActionError("");
                }}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3.5 font-medium">{actionError}</div>
            )}

            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Fan Nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Matematika"
                  value={subjectNameInput}
                  onChange={(e) => setSubjectNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#1D1E26] transition font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono">Qaysi sinflarga o'tiladi? (Level)</label>
                  {selectedLevels.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedLevels([])}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline font-semibold cursor-pointer"
                    >
                      Barchasiga ruxsat
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-200/80 max-h-40 overflow-y-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => toggleLevel(lvl)}
                      className={`p-2 text-xs font-bold border transition cursor-pointer ${
                        selectedLevels.includes(lvl)
                          ? "bg-[#1D1E26] text-[#D4F562] border-[#1D1E26]"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {lvl}-sinf
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  {selectedLevels.length === 0
                    ? "Belgilanmasa: barcha sinflar uchun ochiq bo'ladi"
                    : `Faqat: ${selectedLevels.sort((a,b)=>a-b).join(", ")}-sinflarda ko'rinadi`}
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubjectModal(false);
                    setSubjectNameInput("");
                    setSelectedLevels([]);
                    setActionError("");
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#1D1E26] font-extrabold py-2.5 px-4 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-[#1D1E26] text-[#D4F562] hover:bg-slate-800 font-extrabold py-2.5 px-5 transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Dialog Modal */}
      <CustomDialogModal
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        theme="admin"
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
