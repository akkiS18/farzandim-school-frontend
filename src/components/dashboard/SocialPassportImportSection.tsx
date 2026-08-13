import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Trash2, CheckCircle2, UserPlus, FileText, X, AlertCircle, Save, RefreshCw, Edit3 } from "lucide-react";
import { UserInfo } from "./types";

interface SocialPassportImportSectionProps {
  token: string;
  API_URL: string;
  userInfo: UserInfo | null;
  onSuccess?: () => void;
}

export interface SmartStudentRowData {
  id: string;
  className: string;
  studentLastName: string;
  studentFirstName: string;
  studentMiddleName: string;
  studentBirthdate: string;
  studentDocumentNo: string;
  address: string;
  fatherFullName: string;
  fatherDocumentNo: string;
  fatherPhone: string;
  motherFullName: string;
  motherDocumentNo: string;
  motherPhone: string;
}

const FIELD_LABELS: Record<keyof SmartStudentRowData, string> = {
  id: "ID",
  className: "Sinf",
  studentLastName: "Familiyasi",
  studentFirstName: "Ismi",
  studentMiddleName: "Sharifi",
  studentBirthdate: "Tug'ilgan sana",
  studentDocumentNo: "Metrika / Pasport",
  address: "Yashash manzili",
  fatherFullName: "Otasi F.I.Sh",
  fatherDocumentNo: "Otasi Pasport",
  fatherPhone: "Otasi Tel",
  motherFullName: "Onasi F.I.Sh",
  motherDocumentNo: "Onasi Pasport",
  motherPhone: "Onasi Tel",
};

// Memoized Individual Table Row Component for Instant Performance
const TableRow = memo(function TableRow({
  row,
  idx,
  activeCellField,
  isActiveRow,
  onSelectCell,
  onUpdateCell,
  onDeleteRow,
}: {
  row: SmartStudentRowData;
  idx: number;
  activeCellField: keyof SmartStudentRowData | null;
  isActiveRow: boolean;
  onSelectCell: (id: string, field: keyof SmartStudentRowData, label: string, rowIdx: number) => void;
  onUpdateCell: (id: string, field: keyof SmartStudentRowData, value: string) => void;
  onDeleteRow: (id: string) => void;
}) {
  const fields: { key: keyof SmartStudentRowData; placeholder: string; width: string; extraStyle?: string }[] = [
    { key: "className", placeholder: "1-A", width: "w-20", extraStyle: "font-bold text-indigo-900" },
    { key: "studentLastName", placeholder: "Familiya", width: "w-32", extraStyle: "font-bold" },
    { key: "studentFirstName", placeholder: "Ism", width: "w-32", extraStyle: "font-bold" },
    { key: "studentMiddleName", placeholder: "-", width: "w-32" },
    { key: "studentBirthdate", placeholder: "-", width: "w-28", extraStyle: "font-mono" },
    { key: "studentDocumentNo", placeholder: "-", width: "w-32", extraStyle: "font-mono" },
    { key: "address", placeholder: "-", width: "w-44" },
    { key: "fatherFullName", placeholder: "-", width: "w-40", extraStyle: "font-semibold" },
    { key: "fatherDocumentNo", placeholder: "-", width: "w-28", extraStyle: "font-mono" },
    { key: "fatherPhone", placeholder: "-", width: "w-32", extraStyle: "font-mono text-indigo-700" },
    { key: "motherFullName", placeholder: "-", width: "w-40", extraStyle: "font-semibold" },
    { key: "motherDocumentNo", placeholder: "-", width: "w-28", extraStyle: "font-mono" },
    { key: "motherPhone", placeholder: "-", width: "w-32", extraStyle: "font-mono text-indigo-700" },
  ];

  return (
    <tr className={`transition ${isActiveRow ? "bg-indigo-50/40" : "hover:bg-indigo-50/20"}`}>
      <td className="px-3 py-2 text-center text-zinc-400 font-mono text-[11px] font-bold">{idx + 1}</td>

      {fields.map((f) => {
        const isSelected = isActiveRow && activeCellField === f.key;
        const val = row[f.key] || "";

        return (
          <td
            key={f.key}
            className={`px-2 py-1.5 cursor-pointer ${f.width}`}
            onClick={() => onSelectCell(row.id, f.key, FIELD_LABELS[f.key], idx)}
          >
            <div
              className={`w-full text-xs rounded-xl px-2.5 py-1.5 transition flex items-center min-h-[32px] truncate ${
                isSelected
                  ? "bg-indigo-600 text-white font-extrabold ring-2 ring-indigo-500 shadow-sm"
                  : val
                  ? "bg-zinc-50 border border-zinc-200/80 text-zinc-800 font-medium hover:border-indigo-300 hover:bg-white"
                  : "bg-zinc-50/50 border border-dashed border-zinc-200 text-zinc-400 italic"
              } ${f.extraStyle || ""}`}
            >
              <span className="truncate">{val || "-"}</span>
            </div>
          </td>
        );
      })}

      <td className="px-3 py-2 text-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRow(row.id);
          }}
          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
          title="O'chirish"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
});

export default function SocialPassportImportSection({
  token,
  API_URL,
  userInfo,
  onSuccess,
}: SocialPassportImportSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<SmartStudentRowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Cell Selection for Excel-style Top Formula/Edit Bar
  const [activeCell, setActiveCell] = useState<{ id: string; field: keyof SmartStudentRowData; label: string; rowIdx: number } | null>(null);
  const topInputRef = useRef<HTMLInputElement>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  };

  // Cyrillic to Uzbek Latin Transliteration Map
  const cyrillicToLatinMap: Record<string, string> = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'J',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'X', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sh', 'Ъ': '\'', 'Ы': 'I', 'Ь': '\'', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'j',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': '\'', 'ы': 'i', 'ь': '\'', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'Қ': 'Q', 'қ': 'q', 'Ғ': 'G\'', 'ғ': 'g\'', 'Ҳ': 'H', 'ҳ': 'h', 'Ў': 'O\'', 'ў': 'o\''
  };

  const transliterate = (text: string): string => {
    if (!text) return "";
    return String(text).split('').map(char => cyrillicToLatinMap[char] || char).join('');
  };

  const cleanCellValue = (val: any): string => {
    if (val === null || val === undefined) return "";
    let str = String(val).trim();
    if (str.endsWith(".0")) {
      str = str.substring(0, str.length - 2);
    }
    return transliterate(str);
  };

  const cleanPhoneNumber = (val: string): string => {
    if (!val) return "";
    let digits = val.replace(/[^\d]/g, "");
    if (digits.length === 9) {
      return "+998" + digits;
    } else if (digits.length === 12 && digits.startsWith("998")) {
      return "+" + digits;
    }
    return val;
  };

  const splitFIO = (fullName: string): { lastName: string; firstName: string; middleName: string } => {
    let clean = fullName.trim();
    clean = clean.replace(/\s*\d{7,}\s*/g, "").trim();

    if (!clean) return { lastName: "", firstName: "", middleName: "" };

    const parts = clean.split(/\s+/);
    const lastName = parts[0] || "";
    const firstName = parts[1] || "";
    const middleName = parts.slice(2).join(" ") || "";
    return { lastName, firstName, middleName };
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    setLoading(true);
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        
        if (rawData.length === 0) {
          showToast("Fayl bo'sh", "error");
          setLoading(false);
          return;
        }

        // Title Class Detection (e.g., "1-A sinf o'quvchilarining ijtimoiy pasporti")
        let titleDetectedClass = "";
        for (let r = 0; r < Math.min(5, rawData.length); r++) {
          const rowText = rawData[r].map((c: any) => cleanCellValue(c)).join(" ");
          const match = rowText.match(/(\d{1,2}\s*[-–—]?\s*[A-ZА-Яa-zа-я])/);
          if (match) {
            titleDetectedClass = match[1].replace(/\s+/g, "").toUpperCase();
            break;
          }
        }

        // Smart Header & Column Detection
        let headerRowIdx = -1;
        let colMap: Record<string, number> = {};

        for (let r = 0; r < Math.min(25, rawData.length); r++) {
          const row = rawData[r].map((c: any) => cleanCellValue(c).toLowerCase());
          
          const hasHeaderKey = row.some((c: string) => 
            c.includes("familiya") || c.includes("ism") || c.includes("f.i.sh") || 
            c.includes("фамилия") || c.includes("укувчи") || c.includes("pasport") || c.includes("metrika")
          );

          if (hasHeaderKey) {
            headerRowIdx = r;
            row.forEach((cellText: string, colIdx: number) => {
              if (cellText.includes("sinf") || cellText.includes("синф")) {
                colMap["className"] = colIdx;
              } else if (cellText.includes("otasining pasport") || cellText.includes("otasi pasport")) {
                colMap["fatherDocumentNo"] = colIdx;
              } else if (cellText.includes("otasining tel") || cellText.includes("otasi tel") || (cellText.includes("otasi") && cellText.includes("tel"))) {
                colMap["fatherPhone"] = colIdx;
              } else if (cellText.includes("otasining") || cellText.includes("otasi") || cellText.includes("отец")) {
                colMap["fatherFullName"] = colIdx;
              } else if (cellText.includes("onasining pasport") || cellText.includes("onasi pasport")) {
                colMap["motherDocumentNo"] = colIdx;
              } else if (cellText.includes("onasining tel") || cellText.includes("onasi tel") || (cellText.includes("onasi") && cellText.includes("tel"))) {
                colMap["motherPhone"] = colIdx;
              } else if (cellText.includes("onasi") || cellText.includes("мать")) {
                colMap["motherFullName"] = colIdx;
              } else if (cellText.includes("tug'ilgan") || cellText.includes("sana") || cellText.includes("рождения")) {
                colMap["studentBirthdate"] = colIdx;
              } else if (cellText.includes("metrika") || cellText.includes("seriya") || cellText.includes("паспорт") || cellText.includes("hujjat")) {
                colMap["studentDocumentNo"] = colIdx;
              } else if (cellText.includes("yashash") || cellText.includes("manzil") || cellText.includes("адрес")) {
                colMap["address"] = colIdx;
              } else if (cellText.includes("familiya") || cellText.includes("ism") || cellText.includes("f.i.sh") || cellText.includes("укувчи")) {
                colMap["studentFullName"] = colIdx;
              }
            });
            break;
          }
        }

        const getColIdx = (key: string, defaultIdx: number): number => {
          return colMap[key] !== undefined ? colMap[key] : defaultIdx;
        };

        const idxClassName = getColIdx("className", 1);
        const idxStudentFIO = getColIdx("studentFullName", 2);
        const idxBirthdate = getColIdx("studentBirthdate", 3);
        const idxStudentDoc = getColIdx("studentDocumentNo", 4);
        const idxAddress = getColIdx("address", 5);
        const idxFatherFIO = getColIdx("fatherFullName", 6);
        const idxFatherDoc = getColIdx("fatherDocumentNo", 7);
        const idxFatherPhone = getColIdx("fatherPhone", 8);
        const idxMotherFIO = getColIdx("motherFullName", 9);
        const idxMotherDoc = getColIdx("motherDocumentNo", 10);
        const idxMotherPhone = getColIdx("motherPhone", 11);

        const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
        const rows: SmartStudentRowData[] = [];

        for (let r = startRow; r < rawData.length; r++) {
          const rowData = rawData[r];
          if (!rowData || rowData.every((c: any) => cleanCellValue(c) === "")) continue;

          const firstCell = cleanCellValue(rowData[0]);
          const secondCell = cleanCellValue(rowData[1]);
          if (firstCell.includes("pasporti") || secondCell.includes("Familiya")) continue;

          const studentFIO = cleanCellValue(rowData[idxStudentFIO]);
          if (!studentFIO || studentFIO.toLowerCase().includes("familiya")) continue;

          const { lastName, firstName, middleName } = splitFIO(studentFIO);
          if (!lastName && !firstName) continue;

          const parsedClass = cleanCellValue(rowData[idxClassName]);
          const finalClass = (parsedClass && parsedClass !== "-" && !/^\d+$/.test(parsedClass)) 
            ? parsedClass 
            : (titleDetectedClass || "1-A");

          const rowItem: SmartStudentRowData = {
            id: Math.random().toString(36).substring(2, 9),
            className: finalClass,
            studentLastName: lastName,
            studentFirstName: firstName,
            studentMiddleName: middleName,
            studentBirthdate: cleanCellValue(rowData[idxBirthdate]),
            studentDocumentNo: cleanCellValue(rowData[idxStudentDoc]),
            address: cleanCellValue(rowData[idxAddress]),
            fatherFullName: cleanCellValue(rowData[idxFatherFIO]),
            fatherDocumentNo: cleanCellValue(rowData[idxFatherDoc]),
            fatherPhone: cleanPhoneNumber(cleanCellValue(rowData[idxFatherPhone])),
            motherFullName: cleanCellValue(rowData[idxMotherFIO]),
            motherDocumentNo: cleanCellValue(rowData[idxMotherDoc]),
            motherPhone: cleanPhoneNumber(cleanCellValue(rowData[idxMotherPhone])),
          };

          rows.push(rowItem);
        }

        setParsedRows(rows);
        if (rows.length > 0) {
          setActiveCell({ id: rows[0].id, field: "studentLastName", label: "Familiyasi", rowIdx: 0 });
        }
        showToast(`${rows.length} ta o'quvchi ma'lumotlari muvaffaqiyatli pars qilindi!`, "success");
      } catch (err) {
        console.error(err);
        showToast("Faylni o'qishda xatolik yuz berdi", "error");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Optimized callbacks
  const handleSelectCell = useCallback((id: string, field: keyof SmartStudentRowData, label: string, rowIdx: number) => {
    setActiveCell({ id, field, label, rowIdx });
    setTimeout(() => {
      if (topInputRef.current) {
        topInputRef.current.focus();
      }
    }, 0);
  }, []);

  const handleUpdateCell = useCallback((id: string, field: keyof SmartStudentRowData, value: string) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const handleDeleteRow = useCallback((id: string) => {
    setParsedRows(prev => prev.filter(r => r.id !== id));
    setActiveCell(prev => prev?.id === id ? null : prev);
    showToast("Qator o'chirildi", "info");
  }, []);

  const handleClearAll = () => {
    setParsedRows([]);
    setFileName("");
    setActiveCell(null);
    showToast("Barcha ma'lumotlar tozalandi", "info");
  };

  const handleBatchSaveToDatabase = async () => {
    if (parsedRows.length === 0) {
      showToast("Saqlash uchun o'quvchilar ro'yxati bo'sh", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        students: parsedRows.map(r => ({
          class_name: r.className,
          student_first_name: r.studentFirstName,
          student_last_name: r.studentLastName,
          student_middle_name: r.studentMiddleName,
          student_birthdate: r.studentBirthdate,
          student_document_no: r.studentDocumentNo,
          address: r.address,
          father_full_name: r.fatherFullName,
          father_document_no: r.fatherDocumentNo,
          father_phone: r.fatherPhone,
          mother_full_name: r.motherFullName,
          mother_document_no: r.motherDocumentNo,
          mother_phone: r.motherPhone,
        }))
      };

      const schoolId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };
      if (schoolId) headers["X-School-ID"] = schoolId;

      const res = await fetch(`${API_URL}/api/schools/import/students-smart`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bazaga saqlashda xatolik yuz berdi");

      showToast(`Muvaffaqiyatli! ${data.imported_count} ta o'quvchi bazaga saqlandi.`, "success");
      setParsedRows([]);
      setFileName("");
      setActiveCell(null);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || "Saqlashda xatolik", "error");
    } finally {
      setSaving(false);
    }
  };

  const activeRowData = activeCell ? parsedRows.find(r => r.id === activeCell.id) : null;
  const activeValue = (activeRowData && activeCell) ? (activeRowData[activeCell.field] || "") : "";

  return (
    <div className="space-y-6 font-sans text-[#16193E]">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center space-x-2 animate-bounce ${
          toast.type === "success" ? "bg-emerald-500 text-white border-emerald-600" :
          toast.type === "error" ? "bg-rose-500 text-white border-rose-600" : "bg-indigo-600 text-white border-indigo-700"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Description Banner */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full text-indigo-700 text-xs font-bold">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ijtimoiy Pasport Importi (Smart)</span>
          </div>
          <h2 className="text-xl font-black text-[#16193E] tracking-tight">
            Excel Ijtimoiy Pasport orqali O'quvchilarni Yuklash
          </h2>
          <p className="text-xs text-zinc-500 font-medium max-w-2xl">
            Excel faylini yuklang. Tizim avtomatik ravishda Krill alifbosidagi ma'lumotlarni Lotinchaga o'tkazadi. Jadvaldagi istalgan katakni bossangiz, yuqoridagi **Excel Tahrirlash Paneli (fx)** da lahzada ko'rinadi va bemalol tahrirlashingiz mumkin.
          </p>
        </div>
      </div>

      {/* Upload Drag & Drop Area (Show if no data parsed yet) */}
      {parsedRows.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-12 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-4 bg-white ${
            isDragging ? "border-indigo-600 bg-indigo-50/50 scale-[1.01]" : "border-zinc-300 hover:border-indigo-400 hover:bg-zinc-50/50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            {loading ? <RefreshCw className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#16193E]">Excel faylini shu yerga tashlang yoki bosing</h3>
            <p className="text-xs text-zinc-400 font-medium mt-1">.xlsx, .xls formatdagi Ijtimoiy pasport va sinf ro'yxatlari</p>
          </div>
          <button
            type="button"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center space-x-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Faylni Tanlash</span>
          </button>
        </div>
      ) : (
        /* 11-COLUMN INTERACTIVE EDITABLE DATA GRID WITH ULTRA-FAST EXCEL EDIT BAR */
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          {/* Top Actions & Summary Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
            <div className="flex items-center space-x-3">
              <span className="bg-indigo-50 text-indigo-700 font-extrabold text-xs px-3.5 py-1.5 rounded-xl border border-indigo-100">
                Topilgan O'quvchilar: {parsedRows.length} ta
              </span>
              {fileName && <span className="text-xs font-semibold text-zinc-400 font-mono">📁 {fileName}</span>}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Boshqa fayl</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Tozalash</span>
              </button>

              <button
                type="button"
                onClick={handleBatchSaveToDatabase}
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-500/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Bazaga saqlash ({parsedRows.length})</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                accept=".xlsx, .xls"
                className="hidden"
              />
            </div>
          </div>

          {/* EXCEL-STYLE STICKY TOP FORMULA / EDIT BAR */}
          <div className="sticky top-2 z-30 bg-gradient-to-r from-indigo-50/95 via-purple-50/95 to-indigo-50/95 backdrop-blur-md border-2 border-indigo-300 rounded-2xl p-3 shadow-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-black text-white bg-indigo-600 px-3 py-1 rounded-xl shadow-xs">
                  fx
                </span>
                <span className="text-xs font-extrabold text-indigo-950 font-mono">
                  {activeCell ? `${activeCell.rowIdx + 1}-Qator • ${activeCell.label}` : "Katakni tanlang"}
                </span>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider hidden sm:inline font-mono">
                ⚡ LAHZALIK TEZ TAHRIRLASH PANELI
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                ref={topInputRef}
                type="text"
                value={activeValue}
                onChange={(e) => {
                  if (activeCell) {
                    handleUpdateCell(activeCell.id, activeCell.field, e.target.value);
                  }
                }}
                disabled={!activeCell}
                placeholder="Jadvaldan xohlagan katakni tanlang va bu yerda keng inputda tahrirlang..."
                className="w-full text-sm font-bold text-zinc-900 bg-white border-2 border-indigo-400 focus:border-indigo-600 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm transition"
              />
            </div>
          </div>

          {/* 11-Column Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-zinc-200/80 shadow-2xs">
            <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead className="bg-zinc-50 text-[10px] font-black text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 font-mono">
                <tr>
                  <th className="px-3 py-3 w-12 text-center">T/R</th>
                  <th className="px-3 py-3 w-20">Sinf</th>
                  <th className="px-3 py-3 w-32">Familiyasi</th>
                  <th className="px-3 py-3 w-32">Ismi</th>
                  <th className="px-3 py-3 w-32">Sharifi</th>
                  <th className="px-3 py-3 w-28">Tug'ilgan sana</th>
                  <th className="px-3 py-3 w-32">Metrika / Pasport</th>
                  <th className="px-3 py-3 w-44">Yashash manzili</th>
                  <th className="px-3 py-3 w-40">Otasi F.I.Sh</th>
                  <th className="px-3 py-3 w-28">Otasi Pasport</th>
                  <th className="px-3 py-3 w-32">Otasi Tel</th>
                  <th className="px-3 py-3 w-40">Onasi F.I.Sh</th>
                  <th className="px-3 py-3 w-28">Onasi Pasport</th>
                  <th className="px-3 py-3 w-32">Onasi Tel</th>
                  <th className="px-3 py-3 w-12 text-center">Amal</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-200/60 text-xs font-medium bg-white">
                {parsedRows.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    row={row}
                    idx={idx}
                    activeCellField={activeCell?.id === row.id ? activeCell.field : null}
                    isActiveRow={activeCell?.id === row.id}
                    onSelectCell={handleSelectCell}
                    onUpdateCell={handleUpdateCell}
                    onDeleteRow={handleDeleteRow}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
