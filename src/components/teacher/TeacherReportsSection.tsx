"use client";

import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Users,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  UserX,
  GraduationCap,
  Layers,
  Check,
} from "lucide-react";
import api from "@/lib/api";

interface TeacherReportsSectionProps {
  token: string;
  API_URL: string;
  classes: any[];
  subjects: any[];
  selectedClassId: number | string | null;
  onSelectClass?: (classId: number | string) => void;
  schedulePeriods?: any[];
  userInfo?: any;
}

export default function TeacherReportsSection({
  token,
  API_URL,
  classes = [],
  subjects = [],
  selectedClassId,
  onSelectClass,
  schedulePeriods = [],
  userInfo,
}: TeacherReportsSectionProps) {
  // Class selection
  const initialClassId = selectedClassId || (classes.length > 0 ? classes[0].id : "");
  const [reportClassId, setReportClassId] = useState<number | string>(initialClassId);

  // Subject selection for journal: "all" or array of subject IDs
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(["all"]);

  // Date range state for journal
  const defaultDates = useMemo(() => {
    if (schedulePeriods && schedulePeriods.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const active = schedulePeriods.find(
        (p: any) => today >= p.start_date && today <= p.end_date
      );
      if (active) {
        return { start: active.start_date, end: active.end_date };
      }
      return {
        start: schedulePeriods[0].start_date,
        end: schedulePeriods[0].end_date,
      };
    }
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const today = now.toISOString().split("T")[0];
    return { start: firstDay, end: today };
  }, [schedulePeriods]);

  const [startDate, setStartDate] = useState<string>(defaultDates.start);
  const [endDate, setEndDate] = useState<string>(defaultDates.end);

  // Status & loading indicators
  const [isExportingJournal, setIsExportingJournal] = useState(false);
  const [isExportingPassport, setIsExportingPassport] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedClass = useMemo(() => {
    return classes.find((c) => String(c.id) === String(reportClassId));
  }, [classes, reportClassId]);

  // Subject multi-select helpers
  const isAllSubjectsSelected =
    selectedSubjectIds.includes("all") ||
    (subjects.length > 0 && selectedSubjectIds.length === subjects.length);

  const handleSelectAllSubjects = () => {
    setSelectedSubjectIds(["all"]);
    setExportMessage(null);
  };

  const handleClearSubjects = () => {
    if (subjects.length > 0) {
      setSelectedSubjectIds([String(subjects[0].id)]);
    } else {
      setSelectedSubjectIds([]);
    }
    setExportMessage(null);
  };

  const handleToggleAllSubjects = () => {
    if (isAllSubjectsSelected) {
      setSelectedSubjectIds(subjects.length > 0 ? [String(subjects[0].id)] : []);
    } else {
      setSelectedSubjectIds(["all"]);
    }
    setExportMessage(null);
  };

  const handleToggleSubject = (subId: string) => {
    setExportMessage(null);
    if (isAllSubjectsSelected) {
      const remaining = subjects
        .map((s: any) => String(s.id))
        .filter((id: string) => id !== subId);
      setSelectedSubjectIds(remaining);
      return;
    }

    if (selectedSubjectIds.includes(subId)) {
      if (selectedSubjectIds.length === 1) return; // Keep at least one selected
      setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== subId));
    } else {
      const updated = [...selectedSubjectIds, subId];
      if (subjects.length > 0 && updated.length >= subjects.length) {
        setSelectedSubjectIds(["all"]);
      } else {
        setSelectedSubjectIds(updated);
      }
    }
  };

  // Handle Quick Quarter Presets
  const handleSelectPeriod = (period: any) => {
    if (period && period.start_date && period.end_date) {
      setStartDate(period.start_date);
      setEndDate(period.end_date);
      setExportMessage(null);
    }
  };

  // Preset for Current Month
  const handleSelectThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
    setStartDate(start);
    setEndDate(end);
    setExportMessage(null);
  };

  // Preset for Entire School Year
  const handleSelectSchoolYear = () => {
    setStartDate("2026-09-01");
    setEndDate("2027-05-31");
    setExportMessage(null);
  };

  // 1. EXPORT SOCIAL PASSPORT (Ijtimoiy pasport)
  const handleExportSocialPassport = async () => {
    if (!reportClassId) {
      setExportMessage({ type: "error", text: "Iltimos, avval sinfni tanlang." });
      return;
    }

    setIsExportingPassport(true);
    setExportMessage(null);

    const className = selectedClass?.name || `sinf_${reportClassId}`;

    try {
      const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (sId) headers["X-School-ID"] = sId;

      const res = await fetch(
        `${API_URL}/api/schools/reports/social-passport?class_id=${reportClassId}`,
        { headers }
      );

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ijtimoiy_pasport_${className}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setExportMessage({
          type: "success",
          text: `${className} sinfining ijtimoiy pasporti muvaffaqiyatli yuklab olindi!`,
        });
      } else {
        throw new Error("Server ijtimoiy pasport endpointi javob bermadi, mijoz tomonidan yaratilmoqda...");
      }
    } catch (err: any) {
      console.warn("Backend social passport export fallback to client-side:", err);
      // Client-side fallback if backend endpoint fails
      try {
        const studentsData = await api.get(
          `/api/schools/users?role=STUDENT&class_id=${reportClassId}&status=all`
        );
        const studentsList = Array.isArray(studentsData) ? studentsData : [];

        // Filter out students created and immediately deleted by mistake
        const cleanStudents = studentsList.filter((st: any) => {
          const isDel = st.student_is_deleted ?? st.is_deleted ?? false;
          const stDeleted = st.student_deleted_at || st.deleted_at;
          const stEnrollment = st.enrollment_date;
          if (isDel && stDeleted && stEnrollment) {
            const d1 = stDeleted.split("T")[0];
            const d2 = stEnrollment.split("T")[0];
            if (d1 <= d2) return false;
          }
          return true;
        });

        if (cleanStudents.length === 0) {
          setExportMessage({ type: "error", text: "Ushbu sinfda o'quvchilar mavjud emas." });
          setIsExportingPassport(false);
          return;
        }

        const wb = XLSX.utils.book_new();
        const sheetData: any[][] = [];

        // Title
        sheetData.push([`${className} sinf o'quvchilarining ijtimoiy pasporti`]);
        sheetData.push([]);

        // Header
        const headers = [
          "T/r",
          "Sinf",
          "Familiyasi",
          "Ismi",
          "Sharifi",
          "Tug'ilgan sana",
          "Metrika / Pasport",
          "Yashash manzili",
          "Maktabga kirish sanasi",
          "Holati",
        ];
        sheetData.push(headers);

        cleanStudents.forEach((st: any, idx: number) => {
          const bd = st.birthdate ? st.birthdate.split("T")[0] : "";
          const ed = st.enrollment_date ? st.enrollment_date.split("T")[0] : "";
          const isDel = st.student_is_deleted ?? st.is_deleted;
          const delAt = st.student_deleted_at || st.deleted_at;
          const status = isDel ? `Ketgan (${delAt ? delAt.split("T")[0] : ""})` : "Faol";

          sheetData.push([
            idx + 1,
            className,
            st.last_name || "",
            st.first_name || "",
            st.middle_name || "",
            bd,
            st.ina || "",
            st.address || "",
            ed,
            status,
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws["!cols"] = [
          { wch: 5 },
          { wch: 10 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 15 },
          { wch: 18 },
          { wch: 30 },
          { wch: 18 },
          { wch: 18 },
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Ijtimoiy pasport");
        XLSX.writeFile(wb, `ijtimoiy_pasport_${className}.xlsx`);

        setExportMessage({
          type: "success",
          text: `${className} sinfining ijtimoiy pasporti muvaffaqiyatli yuklab olindi!`,
        });
      } catch (fallbackErr: any) {
        setExportMessage({
          type: "error",
          text: fallbackErr.message || "Ijtimoiy pasportni yuklab olishda xatolik yuz berdi.",
        });
      }
    } finally {
      setIsExportingPassport(false);
    }
  };

  // 2. EXPORT JOURNAL (Jurnal yuklab olish — har bir fan alohida sheetda)
  const handleExportJournal = async () => {
    if (!reportClassId) {
      setExportMessage({ type: "error", text: "Iltimos, avval sinfni tanlang." });
      return;
    }
    if (!startDate || !endDate) {
      setExportMessage({ type: "error", text: "Iltimos, boshlanish va tugash sanasini tanlang." });
      return;
    }
    if (startDate > endDate) {
      setExportMessage({ type: "error", text: "Boshlanish sanasi tugash sanasidan katta bo'lishi mumkin emas." });
      return;
    }

    setIsExportingJournal(true);
    setExportMessage(null);

    const className = selectedClass?.name || `sinf_${reportClassId}`;

    try {
      // 1. Fetch all students in class (including transferred/archived) via standard /api/schools/users
      const studentsData = await api.get(
        `/api/schools/users?role=STUDENT&class_id=${reportClassId}&status=all`
      );
      const rawStudents = Array.isArray(studentsData)
        ? studentsData.map((u: any) => ({
            id: u.student_id || u.id,
            student_id: u.student_id || u.id,
            user_id: u.id,
            first_name: u.first_name,
            last_name: u.last_name,
            middle_name: u.middle_name,
            enrollment_date: u.enrollment_date,
            is_deleted: u.student_is_deleted ?? u.is_deleted ?? false,
            deleted_at: u.student_deleted_at || u.deleted_at || null,
            ina: u.ina,
            address: u.address,
            birthdate: u.birthdate,
          }))
        : [];

      if (rawStudents.length === 0) {
        setExportMessage({ type: "error", text: "Ushbu sinfda o'quvchilar topilmadi." });
        setIsExportingJournal(false);
        return;
      }

      // 2. Fetch grades for this class and date interval
      let gradeUrl = `/api/schools/grades?class_id=${reportClassId}&start_date=${startDate}&end_date=${endDate}`;
      if (!isAllSubjectsSelected && selectedSubjectIds.length === 1) {
        gradeUrl += `&subject_id=${selectedSubjectIds[0]}`;
      }

      const gradesData = await api.get(gradeUrl);
      const rawGrades = Array.isArray(gradesData) ? gradesData : [];

      // Exclude behavior grades ("xulqi kerak emas")
      const relevantGrades = rawGrades.filter((g: any) => g.grade_type !== "BEHAVIOR");

      // 3. Filter out phantom/immediately-deleted students ("umuman o'qimagan yani yaratilib birdaniga o'chirib yuborilgan o'quvchilar chiqmasligi kerak edi")
      const studentHasActivity = (stId: any, uId: any) => {
        return relevantGrades.some(
          (g: any) =>
            String(g.student_id) === String(stId) ||
            String(g.student_id) === String(uId) ||
            String(g.user_id) === String(uId)
        );
      };

      const legitimateStudents = rawStudents.filter((st: any) => {
        const stEnrollment = st.enrollment_date ? st.enrollment_date.split("T")[0] : "";
        const stDeleted = st.is_deleted && st.deleted_at ? st.deleted_at.split("T")[0] : "";

        // If enrolled after the report end date, they weren't in school in this period yet
        if (stEnrollment && stEnrollment > endDate) {
          return false;
        }

        // If student was deleted / left:
        if (st.is_deleted) {
          // If left before the report start date, they didn't study in this period
          if (stDeleted && stDeleted < startDate) {
            return false;
          }
          // If deleted_at is <= enrollment_date (created and deleted immediately by mistake)
          if (stDeleted && stEnrollment && stDeleted <= stEnrollment) {
            return false;
          }
          // If student has no grades or attendance marks at all during this period
          if (!studentHasActivity(st.id, st.user_id)) {
            return false;
          }
        }

        return true;
      });

      if (legitimateStudents.length === 0) {
        setExportMessage({
          type: "error",
          text: "Ushbu oraliqda sinfda faol o'quvchilar topilmadi.",
        });
        setIsExportingJournal(false);
        return;
      }

      // Sort alphabetically by last name, first name
      const sortedStudents = [...legitimateStudents].sort((a, b) => {
        const nameA = `${a.last_name || ""} ${a.first_name || ""}`.trim().toLowerCase();
        const nameB = `${b.last_name || ""} ${b.first_name || ""}`.trim().toLowerCase();
        return nameA.localeCompare(nameB, "uz", { numeric: true, sensitivity: "base" });
      });

      // 4. Determine target subjects for sheets
      let targetSubjects: { id: string | number; name: string }[] = [];

      if (isAllSubjectsSelected) {
        // Find subjects that have grades in this period
        const subjectIdsInGrades = new Set(
          relevantGrades.map((g: any) => String(g.subject_id))
        );

        // First add from subjects prop
        targetSubjects = subjects
          .filter((s: any) => subjectIdsInGrades.has(String(s.id)))
          .map((s: any) => ({ id: String(s.id), name: s.name }));

        // Add any subjects found in grades that might not be in the subjects prop
        relevantGrades.forEach((g: any) => {
          const sId = String(g.subject_id);
          if (sId && !targetSubjects.some((ts) => String(ts.id) === sId)) {
            targetSubjects.push({ id: sId, name: g.subject_name || `Fan_${sId}` });
          }
        });

        // If no subjects had grades, fallback to all class subjects
        if (targetSubjects.length === 0) {
          targetSubjects = subjects.map((s: any) => ({ id: String(s.id), name: s.name }));
        }
      } else {
        targetSubjects = selectedSubjectIds.map((sId) => {
          const found = subjects.find((s: any) => String(s.id) === String(sId));
          return { id: String(sId), name: found?.name || `Fan_${sId}` };
        });
      }

      if (targetSubjects.length === 0) {
        setExportMessage({ type: "error", text: "Eksport qilish uchun kamida bitta fan tanlang." });
        setIsExportingJournal(false);
        return;
      }

      // 5. Create Workbook and add each subject as a separate Worksheet
      const wb = XLSX.utils.book_new();
      let totalSheetsAdded = 0;

      for (const sub of targetSubjects) {
        const subGrades = relevantGrades.filter(
          (g: any) => String(g.subject_id) === String(sub.id)
        );

        // Find unique lesson dates for THIS subject
        const datesSet = new Set<string>();
        subGrades.forEach((g: any) => {
          if (g.grade_date) {
            const dStr = typeof g.grade_date === "string" ? g.grade_date.split("T")[0] : "";
            if (dStr && dStr >= startDate && dStr <= endDate) {
              datesSet.add(dStr);
            }
          }
        });
        const sortedDates = Array.from(datesSet).sort();

        // If all subjects were chosen, skip subjects with zero lessons to keep file clean
        if (isAllSubjectsSelected && sortedDates.length === 0) {
          continue;
        }

        const sheetData: any[][] = [];

        // Row 1: Title
        const titleText = `${className} sinfi — ${sub.name} fani jurnali (${startDate} dan ${endDate} gacha)`;
        sheetData.push([titleText]);
        sheetData.push([]); // blank row

        // Handle case where explicitly selected subject had no lessons in this period
        if (sortedDates.length === 0) {
          sheetData.push(["Ushbu oraliqda mazkur fandan darslar yoki baholar o'tilmagan."]);
          sheetData.push([]);
          const ws = XLSX.utils.aoa_to_sheet(sheetData);
          let safeName = sub.name.replace(/[:\\/?*\[\]]/g, "_").trim().slice(0, 31) || `Fan_${sub.id}`;
          let finalName = safeName;
          let c = 1;
          while (wb.SheetNames.includes(finalName)) {
            finalName = `${safeName.slice(0, 27)} (${c++})`;
          }
          XLSX.utils.book_append_sheet(wb, ws, finalName);
          totalSheetsAdded++;
          continue;
        }

        // Format Date Headers (e.g. "02.09", "15.10")
        const formattedDateHeaders = sortedDates.map((d) => {
          const parts = d.split("-");
          if (parts.length === 3) {
            return `${parts[2]}.${parts[1]}`;
          }
          return d;
        });

        const headerRow = [
          "T/r",
          "O'quvchi F.I.SH",
          ...formattedDateHeaders,
          "O'rtacha ball",
          "Jami baholar",
          "Qoldirilgan (NB)",
          "O'quvchi holati",
        ];
        sheetData.push(headerRow);

        // Pre-index grades for this subject
        const gradeMap = new Map<string, { attendance?: any; academic: any[] }>();
        subGrades.forEach((g: any) => {
          const dStr = typeof g.grade_date === "string" ? g.grade_date.split("T")[0] : "";
          if (!dStr) return;
          const key = `${g.student_id}_${dStr}`;
          if (!gradeMap.has(key)) {
            gradeMap.set(key, { academic: [] });
          }
          const item = gradeMap.get(key)!;
          if (g.grade_type === "ATTENDANCE") {
            item.attendance = g;
          } else {
            item.academic.push(g);
          }
        });

        // Rows for each legitimate student
        sortedStudents.forEach((st: any, idx: number) => {
          const stEnrollment = st.enrollment_date ? st.enrollment_date.split("T")[0] : "";
          const stDeleted = st.is_deleted && st.deleted_at ? st.deleted_at.split("T")[0] : "";

          let academicSum = 0;
          let academicCount = 0;
          let totalAbsences = 0;

          const rowValues: any[] = [
            idx + 1,
            `${st.last_name || ""} ${st.first_name || ""} ${st.middle_name || ""}`.trim(),
          ];

          sortedDates.forEach((dateStr) => {
            const isBeforeEnrollment = !!stEnrollment && dateStr < stEnrollment;
            const isAfterLeaving = !!stDeleted && dateStr > stDeleted;

            if (isBeforeEnrollment) {
              rowValues.push("O'qimagan");
              return;
            }
            if (isAfterLeaving) {
              rowValues.push("Ketgan");
              return;
            }

            const entry =
              gradeMap.get(`${st.id}_${dateStr}`) ||
              gradeMap.get(`${st.student_id}_${dateStr}`) ||
              gradeMap.get(`${st.user_id}_${dateStr}`);

            const attVal = entry?.attendance?.value;
            const academicList = entry?.academic || [];

            if (attVal === "-") {
              totalAbsences++;
              rowValues.push("-"); // Absent / NB
              return;
            }

            if (academicList.length > 0) {
              academicList.forEach((ac) => {
                const numVal = Number(ac.numeric_value || ac.value);
                if (!isNaN(numVal) && numVal > 0) {
                  academicSum += numVal;
                  academicCount++;
                }
              });
              const gradeStrings = academicList.map((ac) => ac.value).join(", ");
              rowValues.push(gradeStrings);
              return;
            }

            if (attVal === "+") {
              rowValues.push("+"); // Present, no grade
              return;
            }

            rowValues.push("");
          });

          // Summary columns
          const avg = academicCount > 0 ? (academicSum / academicCount).toFixed(1) : "—";
          rowValues.push(avg);
          rowValues.push(academicCount > 0 ? `${academicCount} ta` : "0");
          rowValues.push(totalAbsences > 0 ? `${totalAbsences} ta` : "0");

          // Status description
          let statusText = "Faol";
          if (st.is_deleted) {
            statusText = `Ketgan (${stDeleted || ""})`;
          } else if (stEnrollment && stEnrollment > startDate) {
            statusText = `Keyin kelgan (${stEnrollment})`;
          }
          rowValues.push(statusText);

          sheetData.push(rowValues);
        });

        // Bottom Summary Statistics Rows
        sheetData.push([]);
        sheetData.push([
          "",
          "JAMI O'QUVCHILAR:",
          `${sortedStudents.length} nafar`,
        ]);
        sheetData.push([
          "",
          "DARSLAR BO'LGAN KUNLAR:",
          `${sortedDates.length} kun`,
        ]);

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        const colWidths = [
          { wch: 5 }, // T/r
          { wch: 28 }, // F.I.SH
          ...sortedDates.map(() => ({ wch: 9 })), // Dates
          { wch: 14 }, // O'rtacha ball
          { wch: 14 }, // Jami baholar
          { wch: 16 }, // Qoldirilgan
          { wch: 18 }, // Holati
        ];
        ws["!cols"] = colWidths;

        let safeName = sub.name.replace(/[:\\/?*\[\]]/g, "_").trim().slice(0, 31) || `Fan_${sub.id}`;
        let finalName = safeName;
        let c = 1;
        while (wb.SheetNames.includes(finalName)) {
          finalName = `${safeName.slice(0, 27)} (${c++})`;
        }

        XLSX.utils.book_append_sheet(wb, ws, finalName);
        totalSheetsAdded++;
      }

      if (totalSheetsAdded === 0) {
        setExportMessage({
          type: "error",
          text: `Tanlangan oraliqda (${startDate} dan ${endDate} gacha) darslar yoki baholar topilmadi.`,
        });
        setIsExportingJournal(false);
        return;
      }

      // Generate filename and trigger download
      const dateRangeStr = `${startDate}_${endDate}`;
      let downloadFileName = "";
      if (totalSheetsAdded === 1) {
        const singleSheetName = wb.SheetNames[0].replace(/\s+/g, "_");
        downloadFileName = `Jurnal_${className}_${singleSheetName}_(${dateRangeStr}).xlsx`;
      } else {
        downloadFileName = `Jurnal_${className}_(${totalSheetsAdded}_ta_fan)_(${dateRangeStr}).xlsx`;
      }

      XLSX.writeFile(wb, downloadFileName);

      setExportMessage({
        type: "success",
        text: `${className} sinfining ${totalSheetsAdded} ta fan bo'yicha jurnali (${sortedStudents.length} nafar o'quvchi) muvaffaqiyatli yuklab olindi!`,
      });
    } catch (err: any) {
      console.error(err);
      setExportMessage({
        type: "error",
        text: err.message || "Jurnalni yuklab olishda xatolik yuz berdi.",
      });
    } finally {
      setIsExportingJournal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* 1. Header Card */}
      <div className="bg-white border border-neutral-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold font-sans text-slate-500 uppercase tracking-widest block">
            O'QITUVCHI HISOBOTLAR BO'LIMI
          </span>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-0.5">
            Hisobotlar va Jurnallarni Yuklab Olish
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Sinf jurnali (baholar va davomat sanalar bo'yicha) hamda ijtimoiy pasport ma'lumotlarini rasmiy Excel formatida yuklab oling.
          </p>
        </div>

        {/* Class Selector Dropdown */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Sinf:
          </label>
          <select
            value={reportClassId}
            onChange={(e) => {
              const val = e.target.value;
              setReportClassId(val);
              if (onSelectClass) onSelectClass(val);
              setExportMessage(null);
            }}
            className="bg-slate-50 hover:bg-slate-100 border border-neutral-300 text-slate-900 font-bold px-3 py-2 text-xs sm:text-sm rounded-none outline-none focus:border-[#1E2B42] cursor-pointer h-10 min-w-[140px]"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} {cls.is_main_teacher ? "(Rahbar)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notification Toast Banner */}
      {exportMessage && (
        <div
          className={`p-4 border rounded-none flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition ${
            exportMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-red-50 text-red-900 border-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {exportMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{exportMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportMessage(null)}
            className="text-slate-400 hover:text-slate-700 font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Grid of Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* REPORT CARD 1: SINF JURNALI */}
        <div className="bg-white border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start gap-3.5 border-b border-neutral-200 pb-4">
              <div className="w-11 h-11 rounded-none bg-rose-50 text-[#A51C30] border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    Sinf Jurnali (Baholar va Davomat)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-[#A51C30]">
                    Sanalar bo'yicha
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Har bir dars sanasi alohida ustun qilib chiqariladi. O'quvchining davomati (`+`, `-`) va qo'yilgan akademik bahosi ko'rsatiladi (xulqi hisoblanmaydi).
                </p>
              </div>
            </div>

            {/* Interval Quick Presets */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                <span>1. Sana oralig'i (Choraklar / Tezkor oraliq):</span>
                <span className="text-[11px] text-slate-400 font-normal">Tugmani bosib tanlang</span>
              </label>

              <div className="flex items-center gap-1.5 flex-wrap">
                {schedulePeriods.map((period: any, idx: number) => {
                  const isActive = startDate === period.start_date && endDate === period.end_date;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPeriod(period)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-none border transition cursor-pointer select-none ${
                        isActive
                          ? "bg-[#1E2B42] text-white border-[#1E2B42] shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-neutral-300"
                      }`}
                    >
                      {idx + 1}-chorak
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={handleSelectThisMonth}
                  className="px-3 py-1.5 text-xs font-bold rounded-none border border-neutral-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                >
                  Shu oy
                </button>

                <button
                  type="button"
                  onClick={handleSelectSchoolYear}
                  className="px-3 py-1.5 text-xs font-bold rounded-none border border-neutral-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                >
                  Butun o'quv yili
                </button>
              </div>
            </div>

            {/* Custom Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Boshlanish sanasi:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setExportMessage(null);
                  }}
                  className="w-full bg-slate-50 border border-neutral-300 px-3 py-2 text-xs font-bold text-slate-800 rounded-none outline-none focus:border-[#1E2B42]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Tugash sanasi:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setExportMessage(null);
                  }}
                  className="w-full bg-slate-50 border border-neutral-300 px-3 py-2 text-xs font-bold text-slate-800 rounded-none outline-none focus:border-[#1E2B42]"
                />
              </div>
            </div>

            {/* Subject Selector (Multiple Sheets Support) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#1E2B42]" />
                  <span>2. Fanlarni tanlang:</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({isAllSubjectsSelected ? "Barcha fanlar" : `${selectedSubjectIds.length} ta fan`})
                  </span>
                </label>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllSubjects}
                    className="text-[#1E2B42] hover:underline font-semibold cursor-pointer"
                  >
                    Barchasini tanlash
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearSubjects}
                    className="text-slate-500 hover:text-slate-800 hover:underline font-semibold cursor-pointer"
                  >
                    Tozalash
                  </button>
                </div>
              </div>

              {/* Subject interactive selector chips */}
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-neutral-300">
                <button
                  type="button"
                  onClick={handleToggleAllSubjects}
                  className={`px-2.5 py-1 text-xs font-bold transition rounded-none cursor-pointer border flex items-center gap-1 ${
                    isAllSubjectsSelected
                      ? "bg-[#1E2B42] text-white border-[#1E2B42] shadow-2xs"
                      : "bg-white text-slate-700 border-neutral-300 hover:bg-slate-100"
                  }`}
                >
                  {isAllSubjectsSelected && <Check className="w-3 h-3" />}
                  <span>Barcha fanlar</span>
                </button>

                {subjects.map((sub: any) => {
                  const isSelected = isAllSubjectsSelected || selectedSubjectIds.includes(String(sub.id));
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleToggleSubject(String(sub.id))}
                      className={`px-2.5 py-1 text-xs font-medium transition rounded-none cursor-pointer border flex items-center gap-1 ${
                        isSelected
                          ? "bg-[#A51C30] text-white border-[#A51C30] font-bold shadow-2xs"
                          : "bg-white text-slate-700 border-neutral-300 hover:bg-slate-100"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{sub.name}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-500 leading-tight">
                💡 <b>Har bir fan alohida sheetda:</b> Bir nechta yoki barcha fanlar tanlansa, har bir fan Excel fayli ichida alohida varaq (sheet) sifatida saqlanadi.
              </p>
            </div>

            {/* Special Feature Notice */}
            <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-none text-[11px] text-amber-900 leading-snug space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>O'quvchilar davomati va holatini ajratib ko'rsatish:</span>
              </div>
              <ul className="list-disc list-inside text-amber-800 space-y-0.5 pl-1">
                <li>Maktabga keyinroq qabul qilingan o'quvchilarning oldingi sanalari <b>"O'qimagan"</b> deb belgilanadi.</li>
                <li>Maktabdan ketgan o'quvchilar uchun ketgan sanasidan keyingi kunlar <b>"Ketgan"</b> deb ajratiladi.</li>
                <li>Dars qoldirganlar <b>"-" (NB)</b> bilan, baho olganlar aniq ballari bilan ko'rsatiladi.</li>
                <li>Umuman o'qimagan (yaratilib o'chirilgan) test yozuvlari hisobotdan avtomatik chetlatiladi.</li>
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportJournal}
            disabled={isExportingJournal}
            className="w-full mt-4 h-11 bg-[#A51C30] hover:bg-[#8B1828] active:scale-98 text-white font-bold text-xs sm:text-sm px-4 rounded-none transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>
              {isExportingJournal
                ? "Jurnal tayyorlanmoqda..."
                : isAllSubjectsSelected
                ? "Barcha fanlar jurnalini yuklab olish (.xlsx)"
                : selectedSubjectIds.length > 1
                ? `${selectedSubjectIds.length} ta fan jurnalini yuklab olish (.xlsx)`
                : "Jurnalni Excelda yuklab olish (.xlsx)"}
            </span>
          </button>
        </div>

        {/* REPORT CARD 2: IJTIMOIY PASPORT */}
        <div className="bg-white border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start gap-3.5 border-b border-neutral-200 pb-4">
              <div className="w-11 h-11 rounded-none bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    Sinf Ijtimoiy Pasporti
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    15 ustunli rasmiy jadval
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Sinf o'quvchilari, ularning ota-onalari, pasport ma'lumotlari, telefon raqamlari va manzillarini o'z ichiga olgan to'liq ijtimoiy pasport.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-neutral-200 rounded-none text-xs text-slate-700 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#1E2B42]" />
                  <span>Jadval tarkibidagi asosiy ustunlar:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="space-y-1">
                    <div>• O'quvchi F.I.SH</div>
                    <div>• Tug'ilgan sana va Manzil</div>
                    <div>• Metrika / Pasport (JSHSHIR)</div>
                    <div>• Maktabga kirish sanasi</div>
                  </div>
                  <div className="space-y-1">
                    <div>• Otasi F.I.Sh va Telefoni</div>
                    <div>• Otasi Pasport seriyasi</div>
                    <div>• Onasi F.I.Sh va Telefoni</div>
                    <div>• Onasi Pasport seriyasi</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-none text-xs text-blue-950 leading-relaxed">
                <span className="font-bold">Eslatma:</span> Ijtimoiy pasport fayli to'g'ridan-to'g'ri Vazirlik va Maktabgacha va maktab ta'limi boshqarmasi standartlariga mos holda shakllantiriladi.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportSocialPassport}
            disabled={isExportingPassport}
            className="w-full mt-4 h-11 bg-[#1E2B42] hover:bg-slate-800 active:scale-98 text-white font-bold text-xs sm:text-sm px-4 rounded-none transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPassport ? "Pasport yuklanmoqda..." : "Ijtimoiy pasportni yuklab olish (.xlsx)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
