"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bookmark, Plus, Trash2, Calendar, Check, FolderPlus, Loader2, Search, ChevronDown } from "lucide-react";
import CustomDialogModal from "./CustomDialogModal";

export interface DateRangePresetItem {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  category?: string;
  created_at?: string;
}

export interface DateRangePresetsProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  token?: string;
  apiUrl?: string;
  category?: string;
  className?: string;
  theme?: "slate" | "indigo" | "lime" | "admin";
  label?: string;
  startLabel?: string;
  endLabel?: string;
}

export const formatDateUZ = (dateStr: string): string => {
  if (!dateStr) return "";
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, "0")}.${m.padStart(2, "0")}.${y}`;
  }
  return dateStr;
};

const safeFetchHeaders = (explicitToken?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const token =
      explicitToken ||
      localStorage.getItem("school_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const schoolId = localStorage.getItem("school_id") || localStorage.getItem("current_school_id");
    if (schoolId) {
      headers["X-School-ID"] = schoolId;
    }
  }
  return headers;
};

export const DateRangePresets: React.FC<DateRangePresetsProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  token,
  apiUrl,
  category = "schedule",
  className = "",
  theme = "slate",
  label = "To'plam (Sana oralig'i shablonlari)",
  startLabel = "Jadval boshlanish sanasi (Start Date)",
  endLabel = "Jadval tugash sanasi (End Date)",
}) => {
  const [presets, setPresets] = useState<DateRangePresetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<number | "">("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; id: number; name: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getEffectiveApiUrl = useCallback(() => {
    if (apiUrl) return apiUrl;
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      return `${window.location.protocol}//${host}:6560`;
    }
    return "http://localhost:6560";
  }, [apiUrl]);

  // Fetch presets from Database
  const fetchPresets = useCallback(async () => {
    setLoading(true);
    const targetUrl = getEffectiveApiUrl();
    try {
      const res = await fetch(`${targetUrl}/api/schools/date-range-presets?category=${category}`, {
        headers: safeFetchHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        setPresets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch date range presets:", err);
    } finally {
      setLoading(false);
    }
  }, [getEffectiveApiUrl, category, token]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  // Sync selected preset dropdown with current startDate & endDate
  useEffect(() => {
    if (!startDate || !endDate) {
      setSelectedPresetId("");
      return;
    }
    const matched = presets.find((p) => p.start_date === startDate && p.end_date === endDate);
    if (matched) {
      setSelectedPresetId(matched.id);
    } else {
      setSelectedPresetId("");
    }
  }, [startDate, endDate, presets]);

  const handleSelectPreset = (idStr: string) => {
    if (!idStr) {
      setSelectedPresetId("");
      return;
    }
    const id = parseInt(idStr, 10);
    const matched = presets.find((p) => p.id === id);
    if (matched) {
      setSelectedPresetId(id);
      onStartDateChange(matched.start_date);
      onEndDateChange(matched.end_date);
    }
  };

  const handleSavePreset = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!presetNameInput.trim()) return;
    if (!startDate || !endDate) {
      setFeedbackMsg({ text: "Iltimos, avval boshlanish va tugash sanalarini kiriting!", type: "error" });
      return;
    }

    const nameToSave = presetNameInput.trim();
    setSaving(true);
    const targetUrl = getEffectiveApiUrl();

    // Optimistic UI update
    const tempId = Date.now();
    const tempPreset: DateRangePresetItem = {
      id: tempId,
      name: nameToSave,
      start_date: startDate,
      end_date: endDate,
      category,
    };
    setPresets((prev) => [tempPreset, ...prev]);
    setSelectedPresetId(tempId);

    try {
      const res = await fetch(`${targetUrl}/api/schools/date-range-presets`, {
        method: "POST",
        headers: safeFetchHeaders(token),
        body: JSON.stringify({
          name: nameToSave,
          start_date: startDate,
          end_date: endDate,
          category,
        }),
      });

      if (res.ok) {
        const savedPreset: DateRangePresetItem = await res.json();
        setPresets((prev) => prev.map((p) => (p.id === tempId ? savedPreset : p)));
        setSelectedPresetId(savedPreset.id);
        setFeedbackMsg({ text: `"${savedPreset.name}" to'plami saqlandi!`, type: "success" });
        setPresetNameInput("");
        setShowSaveModal(false);
      } else {
        setPresets((prev) => prev.filter((p) => p.id !== tempId));
        const errData = await res.json().catch(() => ({}));
        setFeedbackMsg({ text: errData.error || errData.details || "To'plamni saqlashda xatolik yuz berdi", type: "error" });
      }
    } catch (err) {
      setPresets((prev) => prev.filter((p) => p.id !== tempId));
      setFeedbackMsg({ text: "Tarmoq xatoligi. Qayta urinib ko'ring.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const doDeletePreset = async (id: number) => {
    setConfirmDialog(null);
    setDeletingId(id);
    const targetUrl = getEffectiveApiUrl();
    try {
      const res = await fetch(`${targetUrl}/api/schools/date-range-presets/${id}`, {
        method: "DELETE",
        headers: safeFetchHeaders(token),
      });
      if (res.ok) {
        if (selectedPresetId === id) setSelectedPresetId("");
        setPresets((prev) => prev.filter((p) => p.id !== id));
        setFeedbackMsg({ text: "To'plam o'chirildi", type: "success" });
      }
    } catch (err) {
      console.error("Delete preset error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeletePreset = (id: number, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDialog({ isOpen: true, id, name });
  };

  const themeStyles = {
    slate: {
      cardBg: "bg-slate-50 border-slate-200/80",
      inputFocus: "focus:ring-2 focus:ring-[#D4F562]",
      saveBtn: "bg-[#1D1E26] hover:bg-slate-800 text-white shadow-xs",
      iconColor: "text-indigo-600",
    },
    indigo: {
      cardBg: "bg-indigo-50/40 border-indigo-100",
      inputFocus: "focus:ring-2 focus:ring-indigo-500",
      saveBtn: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs",
      iconColor: "text-indigo-600",
    },
    lime: {
      cardBg: "bg-lime-50/60 border-lime-200",
      inputFocus: "focus:ring-2 focus:ring-lime-500",
      saveBtn: "bg-lime-600 hover:bg-lime-700 text-white shadow-xs",
      iconColor: "text-lime-700",
    },
    admin: {
      cardBg: "bg-slate-50 border-slate-200",
      inputFocus: "focus:ring-2 focus:ring-[#1D1E26]",
      saveBtn: "bg-[#1D1E26] hover:bg-slate-800 text-[#D4F562]",
      iconColor: "text-[#1D1E26]",
    },
  }[theme];

  const r2xl = theme === "admin" ? "" : "rounded-2xl";
  const rxl = theme === "admin" ? "" : "rounded-xl";
  const rlg = theme === "admin" ? "" : "rounded-lg";

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Top section: Preset Collection Dropdown Selector & Quick Save */}
      <div className={`p-4 ${r2xl} border transition-all ${themeStyles.cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 tracking-tight select-none">
            <Bookmark className={`w-3.5 h-3.5 ${themeStyles.iconColor} shrink-0`} />
            <span>{label}</span>
            {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
          </label>

          {/* Feedback message toast badge */}
          {feedbackMsg && (
            <div
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center justify-between gap-2 animate-fadeIn ${
                feedbackMsg.type === "success" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              <span>{feedbackMsg.text}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFeedbackMsg(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-black cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Preset Selector Searchable Dropdown */}
        <div className="relative mb-3.5">
          {(() => {
            const selectedObj = presets.find((p) => p.id === selectedPresetId);
            return (
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full bg-white border border-slate-200 text-slate-800 ${rxl} px-3.5 py-2.5 text-xs font-bold cursor-pointer flex items-center justify-between transition select-none shadow-2xs ${themeStyles.inputFocus}`}
              >
                <div className="flex items-center gap-2 overflow-hidden text-slate-700">
                  <Calendar className={`w-4 h-4 ${theme === "admin" ? "text-[#1D1E26]" : "text-indigo-500"} shrink-0`} />
                  <span className="truncate">
                    {selectedObj
                      ? `${selectedObj.name} (${formatDateUZ(selectedObj.start_date)} — ${formatDateUZ(selectedObj.end_date)})`
                      : presets.length === 0
                      ? "Mavjud to'plamlar yo'q (O'zingiz yaratishingiz mumkin)"
                      : "To'plamni tanlang (Mavjud shablonlar)..."}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isDropdownOpen ? (theme === "admin" ? "rotate-180 text-[#1D1E26]" : "rotate-180 text-indigo-600") : ""
                  }`}
                />
              </div>
            );
          })()}

          {/* Expanded Dropdown Panel */}
          {isDropdownOpen && (
            <div className={`absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 ${r2xl} shadow-2xl p-2.5 space-y-2 animate-in fade-in duration-150`}>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={dropdownSearch}
                  onChange={(e) => setDropdownSearch(e.target.value)}
                  placeholder="Shablon nomini qidirish..."
                  className={`w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 ${rxl} text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 ${theme === "admin" ? "focus:ring-[#1D1E26]" : "focus:ring-indigo-500"}`}
                />
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 space-y-1 pr-1">
                {presets.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 text-center">Hali shablonlar mavjud emas</p>
                ) : (
                  (() => {
                    const filtered = presets.filter((p) =>
                      `${p.name} ${p.start_date} ${p.end_date}`
                        .toLowerCase()
                        .includes(dropdownSearch.toLowerCase().trim())
                    );

                    if (filtered.length === 0) {
                      return <p className="text-xs text-slate-400 p-3 text-center">Qidiruv bo'yicha shablon topilmadi</p>;
                    }

                    return filtered.map((p) => {
                      const isSel = selectedPresetId === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPresetId(p.id);
                            onStartDateChange(p.start_date);
                            onEndDateChange(p.end_date);
                            setIsDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between p-2 ${rxl} cursor-pointer transition select-none ${
                            isSel
                              ? theme === "admin"
                                ? "bg-[#1D1E26] text-[#D4F562] font-bold"
                                : "bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-xs truncate font-medium">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({formatDateUZ(p.start_date)} — {formatDateUZ(p.end_date)})
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeletePreset(p.id, p.name, e)}
                            disabled={deletingId === p.id}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Shablonni o'chirish"
                          >
                            {deletingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          )}
        </div>

        {/* Date Inputs Grid & ICON ONLY Save To'plam Button */}
        <div className="flex items-end gap-3 pt-2 border-t border-slate-200/60">
          {/* Start Date */}
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1 truncate">{startLabel}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              required
              className={`w-full bg-white border border-slate-200 text-slate-800 ${rxl} px-3 py-2 text-xs outline-none ${themeStyles.inputFocus} font-bold shadow-2xs`}
            />
          </div>

          {/* End Date */}
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1 truncate">{endLabel}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              required
              className={`w-full bg-white border border-slate-200 text-slate-800 ${rxl} px-3 py-2 text-xs outline-none ${themeStyles.inputFocus} font-bold shadow-2xs`}
            />
          </div>

          {/* Save To'plam Button (ICON ONLY as requested by user) */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!startDate || !endDate) {
                  setFeedbackMsg({ text: "Boshlanish va tugash sanasini tanlang!", type: "error" });
                  return;
                }
                setPresetNameInput("");
                setShowSaveModal(true);
              }}
              className={`w-10 h-[38px] flex items-center justify-center ${rxl} transition cursor-pointer ${themeStyles.saveBtn}`}
              title="To'plam sifatida saqlash"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Save Preset Name Prompt Modal rendered via Portal to prevent HTML form nesting */}
      {showSaveModal && mounted && createPortal(
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === e.currentTarget) setShowSaveModal(false);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md bg-white border border-slate-200 ${r2xl} p-5 shadow-2xl space-y-4 text-slate-900 font-sans`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FolderPlus className={`w-4 h-4 ${theme === "admin" ? "text-[#1D1E26]" : "text-indigo-600"}`} />
                Yangi To'plam sifatida saqlash
              </h4>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSaveModal(false);
                }}
                className={`w-7 h-7 ${theme === "admin" ? "" : "rounded-full"} bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className={`bg-slate-50 p-3 ${rxl} border border-slate-200/80 text-xs space-y-1`}>
                <div className="text-slate-500 font-semibold">Tanlangan sana oralig'i:</div>
                <div className={`font-extrabold ${theme === "admin" ? "text-[#1D1E26]" : "text-indigo-600"} font-mono text-xs`}>
                  {formatDateUZ(startDate)} — {formatDateUZ(endDate)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  To'plam nomi (Masalan: 1-chorak 2027):
                </label>
                <input
                  type="text"
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSavePreset();
                    }
                  }}
                  placeholder="Masalan: 1-chorak 2027 yoki 2-yarim yillik"
                  autoFocus
                  className={`w-full bg-white border border-slate-300 text-slate-800 ${rxl} px-3.5 py-2.5 text-xs outline-none ${theme === "admin" ? "focus:ring-2 focus:ring-[#1D1E26]" : "focus:ring-2 focus:ring-indigo-500"} font-extrabold`}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSaveModal(false);
                  }}
                  className={`px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 ${rxl} transition cursor-pointer`}
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSavePreset(e)}
                  disabled={saving || !presetNameInput.trim()}
                  className={`px-4 py-2 text-xs font-black ${theme === "admin" ? "bg-[#1D1E26] text-[#D4F562] hover:bg-slate-800" : "bg-indigo-600 text-white hover:bg-indigo-700"} ${rxl} transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs`}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <CustomDialogModal
        isOpen={!!confirmDialog?.isOpen}
        type="danger"
        title="To'plamni o'chirish"
        message={`"${confirmDialog?.name}" to'plamini o'chirishni tasdiqlaysizmi?`}
        confirmText="Ha, o'chirish"
        cancelText="Bekor qilish"
        onConfirm={() => confirmDialog && doDeletePreset(confirmDialog.id)}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
};

export default DateRangePresets;
