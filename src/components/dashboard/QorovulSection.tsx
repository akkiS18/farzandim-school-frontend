"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ScanFace,
  Settings2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Link2,
  Unlink,
  Search,
  Sparkles,
  Check,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface QorovulType {
  id: number;
  name: string;
  shortName: string;
  deleted: boolean;
}

interface QorovulSettings {
  configured: boolean;
  username: string;
  has_password: boolean;
  organization_id?: number | null;
  organization_name?: string;
  student_type_id?: number | null;
  is_enabled: boolean;
  total_students: number;
  mapped_students: number;
  qorovul_types?: QorovulType[];
}

interface MatchSuggestion {
  person_id: number;
  confidence: number;
  same_class: boolean;
  reason: string;
}

interface FarzandimStudentItem {
  student_id: number;
  first_name: string;
  last_name: string;
  middle_name: string;
  class_id: number;
  class_name: string;
  ina: string;
  qorovul_person_id?: number | null;
  qorovul_photo_url?: string | null;
  suggestion?: MatchSuggestion | null;
}

interface QorovulPerson {
  id: number;
  firstname: string;
  lastname: string;
  middlename?: string | null;
  directionId: number;
  directionName: string;
  typeId: number;
  typeName: string;
  photoUrl?: string | null;
  phoneNumber?: string;
}

interface QorovulSectionProps {
  token: string;
  API_URL: string;
  classes: any[];
}

export default function QorovulSection({ token, API_URL, classes = [] }: QorovulSectionProps) {
  const [settings, setSettings] = useState<QorovulSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [showSettingsForm, setShowSettingsForm] = useState(false);

  // Settings form fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [studentTypeId, setStudentTypeId] = useState<string>("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Mapping data
  const [students, setStudents] = useState<FarzandimStudentItem[]>([]);
  const [qPersons, setQPersons] = useState<QorovulPerson[]>([]);
  const [loadingMapping, setLoadingMapping] = useState(false);

  // Local manual draft selections: student_id -> chosen qorovul_person_id (string)
  const [draftSelections, setDraftSelections] = useState<Record<number, string>>({});
  // Checked students for Admin manual batch confirm
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [savingRowId, setSavingRowId] = useState<number | null>(null);
  const [savingBatch, setSavingBatch] = useState(false);

  // Filters
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "unmapped" | "suggested" | "mapped">("unmapped");
  const [searchQuery, setSearchQuery] = useState("");

  // Banner message
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    if (typeof window !== "undefined") {
      const sId = localStorage.getItem("school_id");
      if (sId) h["X-School-ID"] = sId;
    }
    return h;
  }, [token]);

  const qPersonById = useMemo(() => {
    const map = new Map<number, QorovulPerson>();
    qPersons.forEach((p) => map.set(p.id, p));
    return map;
  }, [qPersons]);

  const mappedQorovulIds = useMemo(() => {
    const set = new Set<number>();
    students.forEach((s) => {
      if (s.qorovul_person_id) set.add(s.qorovul_person_id);
    });
    return set;
  }, [students]);

  const fetchMappingData = useCallback(async () => {
    setLoadingMapping(true);
    try {
      const res = await fetch(`${API_URL}/api/schools/qorovul/mapping-data`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Qorovul ma'lumotlarini yuklab bo'lmadi");

      const stList: FarzandimStudentItem[] = data.students || [];
      const qpList: QorovulPerson[] = data.qorovul_persons || [];
      setStudents(stList);
      setQPersons(qpList);

      // Pre-fill dropdown drafts with algorithm suggestions (NOT saved automatically!)
      const nextDrafts: Record<number, string> = {};
      stList.forEach((st) => {
        if (!st.qorovul_person_id && st.suggestion?.person_id) {
          nextDrafts[st.student_id] = String(st.suggestion.person_id);
        }
      });
      setDraftSelections(nextDrafts);
      setCheckedIds(new Set());
    } catch (err: any) {
      setBanner({ type: "error", text: err.message });
    } finally {
      setLoadingMapping(false);
    }
  }, [API_URL, authHeaders]);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch(`${API_URL}/api/schools/qorovul/settings`, {
        headers: authHeaders,
      });
      const data: QorovulSettings = await res.json();
      if (!res.ok) throw new Error((data as any).error || "Sozlamalarni yuklab bo'lmadi");

      setSettings(data);
      setUsername(data.username || "");
      setStudentTypeId(data.student_type_id ? String(data.student_type_id) : "");
      setShowSettingsForm(!data.configured);

      if (data.configured) {
        fetchMappingData();
      }
    } catch (err: any) {
      setBanner({ type: "error", text: err.message });
    } finally {
      setLoadingSettings(false);
    }
  }, [API_URL, authHeaders, fetchMappingData]);

  useEffect(() => {
    if (token) fetchSettings();
  }, [token, fetchSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setBanner(null);
    try {
      const payload: any = {
        username: username.trim(),
        password: password,
        is_enabled: true,
      };
      if (studentTypeId) {
        payload.student_type_id = Number(studentTypeId);
      }

      const res = await fetch(`${API_URL}/api/schools/qorovul/settings`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ulanishda xatolik yuz berdi");

      setPassword("");
      setShowSettingsForm(false);
      setBanner({
        type: "success",
        text: `Qorovul muvaffaqiyatli ulandi! Tashkilot: ${data.organization_name || username}`,
      });
      await fetchSettings();
    } catch (err: any) {
      setBanner({ type: "error", text: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  // Manual single-row save or unmap
  const handleMapSingle = async (studentId: number, personId: number | null) => {
    setSavingRowId(studentId);
    setBanner(null);
    try {
      const qp = personId ? qPersonById.get(personId) : null;
      const res = await fetch(`${API_URL}/api/schools/qorovul/students/${studentId}/map`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          qorovul_person_id: personId,
          qorovul_photo_url: qp?.photoUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Saqlashda xatolik");

      setStudents((prev) =>
        prev.map((s) =>
          s.student_id === studentId
            ? {
                ...s,
                qorovul_person_id: personId,
                qorovul_photo_url: qp?.photoUrl || null,
                suggestion: personId ? null : s.suggestion,
              }
            : s
        )
      );
      setCheckedIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
      if (!personId) {
        setDraftSelections((prev) => {
          const next = { ...prev };
          delete next[studentId];
          return next;
        });
      }
      setBanner({ type: "success", text: data.message });
    } catch (err: any) {
      setBanner({ type: "error", text: err.message });
    } finally {
      setSavingRowId(null);
    }
  };

  // Manual batch confirm for explicitly checked rows
  const handleBatchConfirm = async () => {
    const mappings: { student_id: number; qorovul_person_id: number; qorovul_photo_url?: string | null }[] = [];
    const seenQIds = new Set<number>();

    for (const stId of Array.from(checkedIds)) {
      const chosenStr = draftSelections[stId];
      if (!chosenStr) continue;
      const qId = Number(chosenStr);
      if (seenQIds.has(qId)) {
        setBanner({
          type: "error",
          text: `Tanlangan qatorlarda bitta Qorovul ID (${qId}) ikki marta tanlangan. Iltimos, tekshiring.`,
        });
        return;
      }
      seenQIds.add(qId);
      const qp = qPersonById.get(qId);
      mappings.push({
        student_id: stId,
        qorovul_person_id: qId,
        qorovul_photo_url: qp?.photoUrl || null,
      });
    }

    if (mappings.length === 0) {
      setBanner({ type: "error", text: "Tasdiqlash uchun mos Qorovul o'quvchisi tanlangan qatorlarni belgilang." });
      return;
    }

    setSavingBatch(true);
    setBanner(null);
    try {
      const res = await fetch(`${API_URL}/api/schools/qorovul/students/map-batch`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ mappings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ommaviy saqlashda xatolik");

      setBanner({ type: "success", text: data.message });
      await fetchMappingData();
    } catch (err: any) {
      setBanner({ type: "error", text: err.message });
    } finally {
      setSavingBatch(false);
    }
  };

  const uniqueClassNames = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.class_name) set.add(s.class_name);
    });
    return Array.from(set);
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((st) => {
      if (filterClass !== "all" && st.class_name !== filterClass) return false;
      if (filterStatus === "mapped" && !st.qorovul_person_id) return false;
      if (filterStatus === "unmapped" && st.qorovul_person_id) return false;
      if (filterStatus === "suggested" && (st.qorovul_person_id || !st.suggestion)) return false;
      if (q) {
        const full = `${st.last_name} ${st.first_name} ${st.middle_name} ${st.ina} ${st.class_name}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [students, filterClass, filterStatus, searchQuery]);

  const mappedCount = useMemo(() => students.filter((s) => !!s.qorovul_person_id).length, [students]);
  const suggestedCount = useMemo(() => students.filter((s) => !s.qorovul_person_id && !!s.suggestion).length, [students]);

  const normCls = (s: string) =>
    (s || "").toLowerCase().replace("sinf", "").replace(/[\s-]/g, "");

  const toggleCheckRow = (studentId: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const checkVisibleHighConfidence = () => {
    const next = new Set(checkedIds);
    filteredStudents.forEach((st) => {
      if (!st.qorovul_person_id && draftSelections[st.student_id] && st.suggestion && st.suggestion.confidence >= 85) {
        next.add(st.student_id);
      }
    });
    setCheckedIds(next);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fadeIn">
      {/* Header & Connection Status */}
      <div className="bg-white border border-neutral-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
            <ScanFace className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-900">
                Qorovul (Face ID) Integratsiyasi
              </h2>
              {settings?.configured ? (
                <span className="text-[11px] font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Ulangan: {settings.organization_name || settings.username}
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200">
                  Ulanmagan
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              O&apos;quvchilarni Qorovul tizimidagi Face ID profillari bilan bog&apos;lash. Algoritm mos nomzodlarni tavsiya qiladi, yakuniy tasdiqlash faqat maktab admini tomonidan qo&apos;lda bajariladi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {settings?.configured && (
            <button
              type="button"
              onClick={fetchMappingData}
              disabled={loadingMapping}
              className="px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-neutral-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingMapping ? "animate-spin" : ""}`} />
              <span>Yangilash</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSettingsForm((v) => !v)}
            className="px-3 py-2 text-xs font-bold bg-[#1D1E26] hover:bg-slate-800 text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Sozlamalar</span>
            {showSettingsForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {banner && (
        <div
          className={`p-3.5 border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold ${
            banner.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-red-50 text-red-900 border-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{banner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-slate-400 hover:text-slate-700 font-bold px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Settings Form (Admin Only) */}
      {showSettingsForm && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white border border-neutral-200 p-5 shadow-xs space-y-4"
        >
          <h3 className="font-bold text-sm text-slate-900 border-b border-neutral-200 pb-2">
            Qorovul.uz API ulanish sozlamalari (Faqat maktab admini uchun)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                Qorovul Login (Username)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="masalan: ibrat_maktab"
                className="w-full bg-slate-50 border border-neutral-300 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#1D1E26]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                Qorovul Parol {settings?.has_password ? "(o'zgartirish uchun kiriting)" : ""}
              </label>
              <input
                type="password"
                required={!settings?.has_password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={settings?.has_password ? "••••••••" : "Parolni kiriting"}
                className="w-full bg-slate-50 border border-neutral-300 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#1D1E26]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                O&apos;quvchilar turi (Qorovul Type)
              </label>
              <select
                value={studentTypeId}
                onChange={(e) => setStudentTypeId(e.target.value)}
                className="w-full bg-slate-50 border border-neutral-300 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#1D1E26]"
              >
                <option value="">Avtomatik aniqlash (O&apos;quvchilar)</option>
                {(settings?.qorovul_types || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (ID: {t.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 bg-[#A51C30] hover:bg-[#8B1828] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? "Tekshirilmoqda..." : "Ulanishni tekshirish va saqlash"}
            </button>
          </div>
        </form>
      )}

      {/* Mapping Workspace */}
      {settings?.configured && (
        <div className="bg-white border border-neutral-200 shadow-xs">
          {/* Stats & Controls Bar */}
          <div className="p-4 border-b border-neutral-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                Bog&apos;langan: {mappedCount} / {students.length}
              </div>
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 font-bold">
                Tavsiya bor: {suggestedCount}
              </div>
              <div className="px-3 py-1.5 bg-slate-100 border border-neutral-200 text-slate-700 font-semibold">
                Qorovulda: {qPersons.length} ta o&apos;quvchi
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="bg-slate-50 border border-neutral-300 px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="all">Barcha sinflar</option>
                {uniqueClassNames.map((cn) => (
                  <option key={cn} value={cn}>
                    {cn}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-slate-50 border border-neutral-300 px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="all">Barchasi</option>
                <option value="unmapped">Bog&apos;lanmaganlar</option>
                <option value="suggested">Tavsiya borlar</option>
                <option value="mapped">Bog&apos;langanlar</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="O'quvchi qidirish..."
                  className="bg-slate-50 border border-neutral-300 pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#1D1E26] w-44"
                />
              </div>
            </div>
          </div>

          {/* Manual Review Action Bar */}
          {filterStatus !== "mapped" && (
            <div className="px-4 py-2.5 bg-slate-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Algoritm tavsiyalarini ko&apos;zdan kechiring, kerak bo&apos;lsa ro&apos;yxatdan to&apos;g&apos;risini tanlang va qo&apos;lda <b>Tasdiqlash</b> tugmasini bosing.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={checkVisibleHighConfidence}
                  className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold cursor-pointer"
                >
                  85%+ tavsiyalarni belgilash
                </button>
                {checkedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleBatchConfirm}
                    disabled={savingBatch}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>
                      {savingBatch ? "Saqlanmoqda..." : `Tanlanganlarni tasdiqlash (${checkedIds.size})`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Table */}
          {loadingMapping || loadingSettings ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Qorovul ma&apos;lumotlari yuklanmoqda...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Tanlangan filtr bo&apos;yicha o&apos;quvchilar topilmadi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-neutral-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-3 w-10 text-center">✓</th>
                    <th className="py-2.5 px-3">Farzandim o&apos;quvchisi</th>
                    <th className="py-2.5 px-3">Qorovul (Face ID) profili</th>
                    <th className="py-2.5 px-3 w-36 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredStudents.map((st) => {
                    const isMapped = !!st.qorovul_person_id;
                    const mappedPerson = st.qorovul_person_id ? qPersonById.get(st.qorovul_person_id) : null;
                    const chosenStr = draftSelections[st.student_id] || "";
                    const chosenPerson = chosenStr ? qPersonById.get(Number(chosenStr)) : null;
                    const isChecked = checkedIds.has(st.student_id);

                    // Sort Qorovul options: same-class unmapped first, then other unmapped
                    const sameClassOptions: QorovulPerson[] = [];
                    const otherClassOptions: QorovulPerson[] = [];
                    if (!isMapped) {
                      const stClsNorm = normCls(st.class_name);
                      qPersons.forEach((qp) => {
                        if (mappedQorovulIds.has(qp.id)) return;
                        if (normCls(qp.directionName) === stClsNorm) {
                          sameClassOptions.push(qp);
                        } else {
                          otherClassOptions.push(qp);
                        }
                      });
                    }

                    return (
                      <tr key={st.student_id} className={isMapped ? "bg-emerald-50/20" : "hover:bg-slate-50/70"}>
                        <td className="py-3 px-3 text-center">
                          {!isMapped && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!chosenStr}
                              onChange={() => toggleCheckRow(st.student_id)}
                              className="w-4 h-4 accent-emerald-600 cursor-pointer disabled:opacity-30"
                            />
                          )}
                          {isMapped && <Check className="w-4 h-4 text-emerald-600 mx-auto" />}
                        </td>

                        {/* Farzandim Student */}
                        <td className="py-3 px-3 align-top">
                          <div className="font-bold text-slate-900">
                            {st.last_name} {st.first_name} {st.middle_name}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span className="px-1.5 py-0.5 bg-slate-100 border border-neutral-200 font-bold text-slate-700">
                              {st.class_name || "Sinfsiz"}
                            </span>
                            {st.ina && <span className="font-mono">{st.ina}</span>}
                          </div>
                        </td>

                        {/* Qorovul Candidate / Mapped Info */}
                        <td className="py-3 px-3 align-top">
                          {isMapped ? (
                            <div className="flex items-center gap-3">
                              {(st.qorovul_photo_url || mappedPerson?.photoUrl) ? (
                                <img
                                  src={st.qorovul_photo_url || mappedPerson?.photoUrl || ""}
                                  alt=""
                                  className="w-9 h-9 object-cover border border-emerald-300 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                                  ID
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-emerald-900">
                                  {mappedPerson
                                    ? `${mappedPerson.lastname} ${mappedPerson.firstname}`
                                    : `Qorovul ID: ${st.qorovul_person_id}`}
                                </div>
                                <div className="text-[11px] text-emerald-700">
                                  {mappedPerson?.directionName || ""} • ID: {st.qorovul_person_id}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                {chosenPerson?.photoUrl && (
                                  <img
                                    src={chosenPerson.photoUrl}
                                    alt=""
                                    className="w-8 h-8 object-cover border border-neutral-300 shrink-0"
                                  />
                                )}
                                <select
                                  value={chosenStr}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftSelections((prev) => ({
                                      ...prev,
                                      [st.student_id]: val,
                                    }));
                                    if (!val && checkedIds.has(st.student_id)) {
                                      toggleCheckRow(st.student_id);
                                    }
                                  }}
                                  className="w-full max-w-md bg-white border border-neutral-300 px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-[#1D1E26]"
                                >
                                  <option value="">— Qorovul o&apos;quvchisini tanlang —</option>
                                  {sameClassOptions.length > 0 && (
                                    <optgroup label={`Shu sinf (${st.class_name}) — ${sameClassOptions.length} ta`}>
                                      {sameClassOptions.map((qp) => (
                                        <option key={qp.id} value={qp.id}>
                                          {qp.lastname} {qp.firstname} ({qp.directionName}) [ID:{qp.id}]
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {otherClassOptions.length > 0 && (
                                    <optgroup label={`Boshqa sinflar — ${otherClassOptions.length} ta`}>
                                      {otherClassOptions.map((qp) => (
                                        <option key={qp.id} value={qp.id}>
                                          {qp.lastname} {qp.firstname} ({qp.directionName}) [ID:{qp.id}]
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>

                              {/* Algorithm Suggestion Hint */}
                              {st.suggestion ? (
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span
                                    className={`px-1.5 py-0.5 font-bold ${
                                      st.suggestion.confidence >= 85
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {st.suggestion.confidence}% mos
                                  </span>
                                  <span className="text-slate-500">{st.suggestion.reason}</span>
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-400">
                                  Algoritm aniq moslik topmadi — qo&apos;lda tanlang
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Action Button */}
                        <td className="py-3 px-3 text-right align-top">
                          {isMapped ? (
                            <button
                              type="button"
                              disabled={savingRowId === st.student_id}
                              onClick={() => handleMapSingle(st.student_id, null)}
                              className="px-2.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                              <span>Uzish</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={!chosenStr || savingRowId === st.student_id}
                              onClick={() => handleMapSingle(st.student_id, Number(chosenStr))}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-[#1D1E26] hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              <span>{savingRowId === st.student_id ? "..." : "Tasdiqlash"}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
