"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bookmark, Plus, Trash2, Calendar, Check, FolderPlus, Loader2 } from "lucide-react";

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
  theme?: "slate" | "indigo" | "lime";
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
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getEffectiveApiUrl = useCallback(() => {
    if (apiUrl) return apiUrl;
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      return `${window.location.protocol}//${host}:6500`;
    }
    return "http://localhost:6500";
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

  const handleDeletePreset = async (id: number, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`"${name}" to'plamini o'chirishni tasdiqlaysizmi?`)) return;

    setDeletingId(id);
    const targetUrl = getEffectiveApiUrl();
    try {
      const res = await fetch(`${targetUrl}/api/schools/date-range-presets/${id}`, {
        method: "DELETE",
        headers: safeFetchHeaders(token),
      });
      if (res.ok) {
        if (selectedPresetId === id) {
          setSelectedPresetId("");
        }
        setPresets((prev) => prev.filter((p) => p.id !== id));
        setFeedbackMsg({ text: "To'plam o'chirildi", type: "success" });
      }
    } catch (err) {
      console.error("Delete preset error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const themeStyles = {
    slate: {
      cardBg: "bg-slate-50 border-slate-200/80",
      inputFocus: "focus:ring-2 focus:ring-[#D4F562]",
      saveBtn: "bg-[#1D1E26] hover:bg-slate-800 text-white shadow-xs",
    },
    indigo: {
      cardBg: "bg-indigo-50/40 border-indigo-100",
      inputFocus: "focus:ring-2 focus:ring-indigo-500",
      saveBtn: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs",
    },
    lime: {
      cardBg: "bg-lime-50/60 border-lime-200",
      inputFocus: "focus:ring-2 focus:ring-lime-500",
      saveBtn: "bg-lime-600 hover:bg-lime-700 text-white shadow-xs",
    },
  }[theme];

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Top section: Preset Collection Dropdown Selector & Quick Save */}
      <div className={`p-4 rounded-2xl border transition-all ${themeStyles.cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 tracking-tight select-none">
            <Bookmark className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
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

        {/* Preset Selector Dropdown */}
        <div className="relative mb-3.5">
          <select
            value={selectedPresetId}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className={`w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-3.5 pr-9 py-2 text-xs outline-none ${themeStyles.inputFocus} font-extrabold cursor-pointer transition shadow-2xs`}
          >
            <option value="">
              {presets.length === 0 ? "Mavjud to'plamlar yo'q (O'zingiz yaratishingiz mumkin)" : "To'plamni tanlang (Mavjud shablonlar)..."}
            </option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatDateUZ(p.start_date)} — {formatDateUZ(p.end_date)})
              </option>
            ))}
          </select>

          {/* Quick preset chips with delete option */}
          {presets.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto pr-1">
              {presets.map((p) => {
                const isSelected = selectedPresetId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedPresetId(p.id);
                      onStartDateChange(p.start_date);
                      onEndDateChange(p.end_date);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border select-none ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="opacity-75 text-[10px] font-mono">
                      ({formatDateUZ(p.start_date)} - {formatDateUZ(p.end_date)})
                    </span>
                    <button
                      type="button"
                      title="To'plamni o'chirish"
                      onClick={(e) => handleDeletePreset(p.id, p.name, e)}
                      disabled={deletingId === p.id}
                      className={`ml-1 hover:text-red-500 rounded p-0.5 transition cursor-pointer ${
                        isSelected ? "text-indigo-200 hover:text-white" : "text-slate-400"
                      }`}
                    >
                      {deletingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })}
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
              className={`w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs outline-none ${themeStyles.inputFocus} font-bold shadow-2xs`}
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
              className={`w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs outline-none ${themeStyles.inputFocus} font-bold shadow-2xs`}
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
              className={`w-10 h-[38px] flex items-center justify-center rounded-xl transition cursor-pointer ${themeStyles.saveBtn}`}
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
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl space-y-4 text-slate-900 font-sans"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-600" />
                Yangi To'plam sifatida saqlash
              </h4>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSaveModal(false);
                }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <div className="text-slate-500 font-semibold">Tanlangan sana oralig'i:</div>
                <div className="font-extrabold text-indigo-600 font-mono text-xs">
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
                  className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-extrabold"
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
                  className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSavePreset(e)}
                  disabled={saving || !presetNameInput.trim()}
                  className="px-4 py-2 text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
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
    </div>
  );
};

export default DateRangePresets;
