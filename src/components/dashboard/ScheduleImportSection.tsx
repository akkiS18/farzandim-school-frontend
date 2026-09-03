"use client";

import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import * as XLSX from "xlsx";
import { Download, Upload, Trash2, CheckCircle2, AlertCircle, RefreshCw, X, HelpCircle, Calendar, Sparkles } from "lucide-react";
import { ClassItem } from "./types";

export interface SmartScheduleRowData {
  id: string;
  dayOfWeek: number; // 1-6
  lessonNumber: number; // 1-10
  className: string;
  subjectName: string;
  startDate: string;
  endDate: string;
}

const DAY_NAMES: Record<number, string> = {
  1: "1 (Dushanba)",
  2: "2 (Seshanba)",
  3: "3 (Chorshanba)",
  4: "4 (Payshanba)",
  5: "5 (Juma)",
  6: "6 (Shanba)",
};

export function normalizeClassName(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .toUpperCase()
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, "");
}

const FIELD_LABELS: Record<keyof SmartScheduleRowData, string> = {
  id: "ID",
  dayOfWeek: "Hafta Kuni (1-6)",
  lessonNumber: "Dars Soati (1-10)",
  className: "Sinf Nomi",
  subjectName: "Fan Nomi",
  startDate: "Boshlanish Sanasi",
  endDate: "Tugash Sanasi",
};

interface ScheduleImportSectionProps {
  token: string;
  API_URL: string;
  classes: ClassItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Table Row Component
const ScheduleTableRow = memo(function ScheduleTableRow({
  row,
  idx,
  activeCellField,
  isActiveRow,
  validClassesMap,
  validSubjectsMap,
  onSelectCell,
  onUpdateValue,
  onDeleteRow,
  onDoubleClickSubjectCell,
}: {
  row: SmartScheduleRowData;
  idx: number;
  activeCellField: keyof SmartScheduleRowData | null;
  isActiveRow: boolean;
  validClassesMap: Record<string, boolean>;
  validSubjectsMap: Record<string, boolean>;
  onSelectCell: (id: string, field: keyof SmartScheduleRowData, label: string, rowIdx: number) => void;
  onUpdateValue: (id: string, field: keyof SmartScheduleRowData, val: any) => void;
  onDeleteRow: (id: string) => void;
  onDoubleClickSubjectCell: (subjectName: string, className: string) => void;
}) {
  const fields: { key: keyof SmartScheduleRowData; width: string }[] = [
    { key: "dayOfWeek", width: "w-28" },
    { key: "lessonNumber", width: "w-24" },
    { key: "className", width: "w-28" },
    { key: "subjectName", width: "w-44" },
    { key: "startDate", width: "w-32" },
    { key: "endDate", width: "w-32" },
  ];

  const isClassValid = !row.className || validClassesMap[normalizeClassName(row.className)];
  const isSubjectValid = !row.subjectName || validSubjectsMap[row.subjectName.trim().toLowerCase()];

  return (
    <tr className={`transition ${isActiveRow ? "bg-slate-100" : "hover:bg-slate-50"}`}>
      <td className="px-3 py-2 text-center text-slate-400 font-mono text-[11px] font-bold">{idx + 1}</td>

      {fields.map((f) => {
        const isSelected = isActiveRow && activeCellField === f.key;
        const val = row[f.key] || "";
        const isClassField = f.key === "className";
        const isSubjectField = f.key === "subjectName";
        const hasClassError = isClassField && row.className && !isClassValid;
        const hasSubjectError = isSubjectField && row.subjectName && !isSubjectValid;
        const hasCellError = hasClassError || hasSubjectError;

        let displayVal = String(val);
        if (f.key === "dayOfWeek" && typeof val === "number" && DAY_NAMES[val]) {
          displayVal = DAY_NAMES[val];
        }

        return (
          <td
            key={f.key}
            className={`px-2 py-1.5 cursor-pointer ${f.width}`}
            onClick={() => onSelectCell(row.id, f.key, FIELD_LABELS[f.key], idx)}
            onDoubleClick={() => {
              if (isSubjectField && hasSubjectError) {
                onDoubleClickSubjectCell(row.subjectName, row.className);
              }
            }}
          >
            <div
              className={`relative flex items-center px-2.5 py-1.5 text-xs transition-all ${
                isSelected
                  ? "ring-2 ring-[#1D1E26] bg-white font-medium text-[#1D1E26]"
                  : hasCellError
                  ? "bg-red-500 text-white font-bold animate-pulse"
                  : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-800"
              }`}
            >
              <input
                type="text"
                value={displayVal}
                onChange={(e) => {
                  let rawVal: any = e.target.value;
                  if (f.key === "dayOfWeek" || f.key === "lessonNumber") {
                    const num = parseInt(rawVal.replace(/[^\d]/g, ""), 10);
                    rawVal = isNaN(num) ? "" : num;
                  }
                  onUpdateValue(row.id, f.key, rawVal);
                }}
                className="w-full bg-transparent focus:outline-none text-xs"
              />
              {hasClassError && (
                <span className="ml-1 px-1 py-0.5 bg-white text-red-600 text-[9px] font-extrabold uppercase shrink-0 font-mono">
                  SINF TOPILMADI
                </span>
              )}
              {hasSubjectError && (
                <span
                  title="Ikki marta bosib fanni tizimga qo'shing va biriktiring"
                  className="ml-1 px-1.5 py-0.5 bg-white text-red-600 text-[9px] font-extrabold uppercase shrink-0 cursor-pointer font-mono"
                >
                  FAN TOPILMADI (2x)
                </span>
              )}
            </div>
          </td>
        );
      })}

      <td className="px-2 py-1.5 text-center w-12">
        <button
          type="button"
          onClick={() => onDeleteRow(row.id)}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
          title="Qatorni o'chirish"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
});

export default function ScheduleImportSection({
  token,
  API_URL,
  classes,
  isOpen,
  onClose,
  onSuccess,
}: ScheduleImportSectionProps) {
  const [parsedRows, setParsedRows] = useState<SmartScheduleRowData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Subjects state for missing subject detection
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Add Missing Subject Modal State
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [missingSubjectName, setMissingSubjectName] = useState("");
  const [targetLevels, setTargetLevels] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  // Active Cell State for Formula Bar
  const [activeCell, setActiveCell] = useState<{ id: string; field: keyof SmartScheduleRowData; label: string; rowIdx: number } | null>(null);
  const topInputRef = useRef<HTMLInputElement>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const fetchSubjects = useCallback(async () => {
    if (!token) return;
    setSubjectsLoading(true);
    try {
      const schoolId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      if (schoolId) headers["X-School-ID"] = schoolId;

      const res = await fetch(`${API_URL}/api/schools/subjects`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSubjects(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch subjects:", e);
    } finally {
      setSubjectsLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    if (isOpen) {
      fetchSubjects();
    }
  }, [isOpen, fetchSubjects]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  };

  const validClassesMap = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    classes.forEach((c) => {
      if (c.name) map[normalizeClassName(c.name)] = true;
    });
    return map;
  }, [classes]);

  const validSubjectsMap = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    (subjects || []).forEach((s) => {
      if (s.name) map[s.name.trim().toLowerCase()] = true;
    });
    return map;
  }, [subjects]);

  const handleDoubleClickSubjectCell = (subName: string, clsName: string) => {
    if (!subName || !subName.trim()) return;
    setMissingSubjectName(subName.trim());
    setTargetLevels([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    setShowAddSubjectModal(true);
  };

  const handleCreateMissingSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missingSubjectName.trim()) return;
    setIsAddingSubject(true);

    try {
      const schoolId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      if (schoolId) headers["X-School-ID"] = schoolId;

      const res = await fetch(`${API_URL}/api/schools/subjects`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: missingSubjectName.trim(),
          target_levels: targetLevels,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fanni yaratib bo'lmadi");

      showToast(`"${missingSubjectName.trim()}" fani muvaffaqiyatli yaratildi va tizimga biriktirildi!`, "success");
      setShowAddSubjectModal(false);
      await fetchSubjects();
    } catch (err: any) {
      showToast(err.message || "Fanni yaratishda xatolik yuz berdi", "error");
    } finally {
      setIsAddingSubject(false);
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = async () => {
    try {
      const schoolId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      if (schoolId) headers["X-School-ID"] = schoolId;

      const res = await fetch(`${API_URL}/api/schools/import/template/schedule`, { headers });
      if (!res.ok) throw new Error("Template download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dars_jadvali_shablon.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Excel shablon muvaffaqiyatli yuklab olindi", "success");
    } catch (err) {
      console.error("Failed to download template:", err);
      showToast("Shablonni yuklab olishda xatolik yuz berdi", "error");
    }
  };

  // Clean and transliterate cell values
  const cleanCellValue = (val: any): string => {
    if (val === null || val === undefined) return "";
    let str = String(val).trim();
    if (str.endsWith(".0")) {
      str = str.substring(0, str.length - 2);
    }
    return str;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (!rawData || rawData.length === 0) {
          showToast("Excel fayl bo'sh", "error");
          setIsUploading(false);
          return;
        }

        // Column mapping detection
        let headerRowIdx = -1;
        const colMap: Record<string, number> = {};

        for (let r = 0; r < Math.min(10, rawData.length); r++) {
          const row = rawData[r];
          if (!row) continue;
          const rowStr = row.map((c) => cleanCellValue(c).toLowerCase()).join(" ");

          if (rowStr.includes("hafta") || rowStr.includes("dars") || rowStr.includes("sinf") || rowStr.includes("fan")) {
            headerRowIdx = r;
            row.forEach((cellText: any, colIdx: number) => {
              const text = cleanCellValue(cellText).toLowerCase();
              if (text.includes("hafta")) colMap["dayOfWeek"] = colIdx;
              else if (text.includes("dars")) colMap["lessonNumber"] = colIdx;
              else if (text.includes("sinf")) colMap["className"] = colIdx;
              else if (text.includes("fan")) colMap["subjectName"] = colIdx;
              else if (text.includes("start") || text.includes("boshlanish")) colMap["startDate"] = colIdx;
              else if (text.includes("end") || text.includes("tugash")) colMap["endDate"] = colIdx;
            });
            break;
          }
        }

        const getColIdx = (key: string, defaultIdx: number): number => {
          return colMap[key] !== undefined ? colMap[key] : defaultIdx;
        };

        const idxDay = getColIdx("dayOfWeek", 0);
        const idxLesson = getColIdx("lessonNumber", 1);
        const idxClass = getColIdx("className", 2);
        const idxSubject = getColIdx("subjectName", 3);
        const idxStart = getColIdx("startDate", 4);
        const idxEnd = getColIdx("endDate", 5);

        const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 1;
        const rows: SmartScheduleRowData[] = [];

        for (let r = startRow; r < rawData.length; r++) {
          const rowData = rawData[r];
          if (!rowData || rowData.every((c: any) => cleanCellValue(c) === "")) continue;

          const dayStr = cleanCellValue(rowData[idxDay]);
          const lessonStr = cleanCellValue(rowData[idxLesson]);
          const className = cleanCellValue(rowData[idxClass]);
          const subjectName = cleanCellValue(rowData[idxSubject]);

          if (!className && !subjectName) continue;

          const dayOfWeek = parseInt(dayStr.replace(/[^\d]/g, ""), 10) || 1;
          const lessonNumber = parseInt(lessonStr.replace(/[^\d]/g, ""), 10) || 1;
          const startDate = cleanCellValue(rowData[idxStart]) || "2026-09-01";
          const endDate = cleanCellValue(rowData[idxEnd]) || "2026-10-30";

          rows.push({
            id: `sched_row_${r}_${Date.now()}`,
            dayOfWeek: dayOfWeek >= 1 && dayOfWeek <= 6 ? dayOfWeek : 1,
            lessonNumber: lessonNumber >= 1 && lessonNumber <= 10 ? lessonNumber : 1,
            className: className || "1-A",
            subjectName,
            startDate,
            endDate,
          });
        }

        if (rows.length === 0) {
          showToast("Faylda dars jadvali ma'lumotlari topilmadi", "error");
        } else {
          setParsedRows(rows);
          showToast(`Excel muvaffaqiyatli o'qildi: ${rows.length} ta dars qatori topildi`, "success");
        }
      } catch (err) {
        console.error("Excel parse error:", err);
        showToast("Excel faylni o'qishda xatolik yuz berdi", "error");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUpdateValue = useCallback((id: string, field: keyof SmartScheduleRowData, val: any) => {
    setParsedRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: val };
        }
        return r;
      })
    );
  }, []);

  const handleDeleteRow = useCallback((id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
    setActiveCell((curr) => (curr?.id === id ? null : curr));
  }, []);

  const handleSelectCell = useCallback((id: string, field: keyof SmartScheduleRowData, label: string, rowIdx: number) => {
    setActiveCell({ id, field, label, rowIdx });
  }, []);

  const handleSaveSchedules = async () => {
    if (parsedRows.length === 0) {
      showToast("Saqlash uchun dars jadvali ma'lumotlari mavjud emas", "error");
      return;
    }

    setIsSaving(true);
    try {
      const schoolId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      if (schoolId) headers["X-School-ID"] = schoolId;

      const payload = {
        schedules: parsedRows.map((r) => ({
          day_of_week: r.dayOfWeek,
          lesson_number: r.lessonNumber,
          class_name: r.className,
          subject_name: r.subjectName,
          start_date: r.startDate,
          end_date: r.endDate,
        })),
      };

      const res = await fetch(`${API_URL}/api/schools/import/schedules-smart`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message || "Dars jadvali muvaffaqiyatli yaratildi va saqlandi!", "success");
        setParsedRows([]);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast(data.error || "Dars jadvalini saqlashda ziddiyat yoki xatolik yuz berdi", "error");
      }
    } catch (err) {
      console.error("Batch import schedules error:", err);
      showToast("Server bilan ulanishda xatolik", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const activeRow = activeCell ? parsedRows.find((r) => r.id === activeCell.id) : null;
  const activeVal = activeRow && activeCell ? activeRow[activeCell.field] : "";

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-150 font-sans text-[#1D1E26]">
      <div className="w-full h-full flex flex-col overflow-hidden bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1D1E26] text-[#D4F562] flex items-center justify-center font-extrabold shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1D1E26] leading-tight">Dars Jadvalini Yoppasiga Import Qilish</h2>
              <p className="text-xs text-slate-400 font-medium">
                Excel fayl orqali bir nechta sinf dars jadvallarini yoppasiga yuklang, tahrirlang va saqlang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold text-[#1D1E26] bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Shablonni yuklab olish</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-[#1D1E26] hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Formula / Formula Bar (`fx`) */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 text-xs font-mono text-[#1D1E26] font-extrabold shrink-0">
            <span>fx</span>
            <span className="text-slate-300">|</span>
            <span>{activeCell ? `${activeCell.rowIdx + 1}-qator: ${activeCell.label}` : "Katakni tanlang"}</span>
          </div>

          <input
            ref={topInputRef}
            type="text"
            disabled={!activeCell}
            value={activeVal !== undefined && activeVal !== null ? String(activeVal) : ""}
            onChange={(e) => {
              if (activeCell) {
                let rawVal: any = e.target.value;
                if (activeCell.field === "dayOfWeek" || activeCell.field === "lessonNumber") {
                  const num = parseInt(rawVal.replace(/[^\d]/g, ""), 10);
                  rawVal = isNaN(num) ? "" : num;
                }
                handleUpdateValue(activeCell.id, activeCell.field, rawVal);
              }
            }}
            placeholder={activeCell ? "Qiymatni kiriting..." : "Tahrirlash uchun jadvaldagi katak ustiga bosing..."}
            className="flex-1 px-3 py-1.5 text-xs font-mono bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1D1E26] disabled:bg-slate-100 disabled:text-slate-400"
          />

          <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D1E26] hover:bg-slate-800 text-[#D4F562] text-xs font-extrabold cursor-pointer transition shrink-0">
            <Upload className="w-4 h-4" />
            <span>{isUploading ? "Yuklanmoqda..." : "Excel Yuklash"}</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Content Table Body */}
        <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
          {toast && (
            <div
              className={`mb-4 px-4 py-3 text-xs font-bold flex items-center justify-between ${
                toast.type === "success"
                  ? "bg-emerald-600 text-white"
                  : toast.type === "error"
                  ? "bg-red-600 text-white"
                  : "bg-[#1D1E26] text-[#D4F562]"
              }`}
            >
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {parsedRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-slate-100 text-[#1D1E26] flex items-center justify-center mb-4 border border-slate-200">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-extrabold text-[#1D1E26]">Dars jadvali Excel fayli yuklanmagan</h3>
              <p className="text-xs text-slate-400 max-w-md mt-1 mb-6">
                Yoppasiga dars jadvalini shakllantirish uchun Excel shablonini yuklab oling, to'ldiring va ushbu oynaga yuklang.
              </p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1D1E26] hover:bg-slate-800 text-[#D4F562] text-xs font-extrabold cursor-pointer transition">
                <Upload className="w-4 h-4" />
                <span>Excel Faylini Tanlash</span>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <div className="border border-slate-200 overflow-hidden bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1D1E26] text-[#D4F562] text-[10px] uppercase font-mono font-extrabold tracking-wider border-b border-slate-800">
                    <th className="px-3 py-2.5 text-center w-10">#</th>
                    <th className="px-3 py-2.5 w-28">Hafta kuni</th>
                    <th className="px-3 py-2.5 w-24">Dars soati</th>
                    <th className="px-3 py-2.5 w-28">Sinf</th>
                    <th className="px-3 py-2.5 w-44">Fan Nomi</th>
                    <th className="px-3 py-2.5 w-32">Boshlanish</th>
                    <th className="px-3 py-2.5 w-32">Tugash</th>
                    <th className="px-3 py-2.5 text-center w-12">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((r, idx) => (
                    <ScheduleTableRow
                      key={r.id}
                      row={r}
                      idx={idx}
                      activeCellField={activeCell?.id === r.id ? activeCell.field : null}
                      isActiveRow={activeCell?.id === r.id}
                      validClassesMap={validClassesMap}
                      validSubjectsMap={validSubjectsMap}
                      onSelectCell={handleSelectCell}
                      onUpdateValue={handleUpdateValue}
                      onDeleteRow={handleDeleteRow}
                      onDoubleClickSubjectCell={handleDoubleClickSubjectCell}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            Jami jadval qatorlari: <strong className="text-[#1D1E26] font-extrabold">{parsedRows.length}</strong> ta
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-extrabold text-[#1D1E26] bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSaveSchedules}
              disabled={isSaving || parsedRows.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold text-[#D4F562] bg-[#1D1E26] hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Dars Jadvalini Yaratish va Saqlash</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add Missing Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-6 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 bg-[#1D1E26] text-[#D4F562] flex items-center justify-center shrink-0 font-extrabold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1D1E26]">Yangi Fan Qo'shish</h3>
                  <p className="text-xs text-slate-400 font-medium">Excel dars jadvalidan kiritilgan fanni tizimga qo'shish va biriktirish</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(false)}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer font-bold text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMissingSubject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">
                  Fan Nomi
                </label>
                <input
                  type="text"
                  required
                  value={missingSubjectName}
                  onChange={(e) => setMissingSubjectName(e.target.value)}
                  placeholder="Masalan: Robototexnika"
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-[#1D1E26] focus:outline-none focus:ring-2 focus:ring-[#1D1E26]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono">
                    Qaysi Sinf Levellarida O'tiladi? (Target Levels)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (targetLevels.length === 11) {
                        setTargetLevels([]);
                      } else {
                        setTargetLevels([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
                      }
                    }}
                    className="text-[10px] font-bold text-slate-600 hover:text-[#1D1E26] underline cursor-pointer"
                  >
                    {targetLevels.length === 11 ? "Barchasini bekor qilish" : "Barcha sinflar (1-11)"}
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => {
                    const isChecked = targetLevels.includes(lvl);
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setTargetLevels(targetLevels.filter((l) => l !== lvl));
                          } else {
                            setTargetLevels([...targetLevels, lvl].sort((a, b) => a - b));
                          }
                        }}
                        className={`px-2.5 py-2 text-xs font-bold transition flex items-center justify-center border cursor-pointer ${
                          isChecked
                            ? "bg-[#1D1E26] text-[#D4F562] border-[#1D1E26]"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {lvl}-sinf
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 text-xs font-extrabold text-[#1D1E26] bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isAddingSubject || !missingSubjectName.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1D1E26] hover:bg-slate-800 disabled:opacity-50 text-[#D4F562] text-xs font-extrabold transition cursor-pointer"
                >
                  {isAddingSubject ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Qo'shilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Fanni Tizimga Qo'shish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
