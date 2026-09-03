import React, { useState, useEffect } from "react";
import { useDialog } from "../../hooks/useDialog";
import CustomDialogModal from "../CustomDialogModal";
import { Pencil, Trash2, Plus } from "lucide-react";
import { TenantUser, UserInfo, ImportResult } from "./types";

import PasswordInput from "@/components/common/PasswordInput";

interface TeachersSectionProps {
  teachers: TenantUser[];
  token: string;
  API_URL: string;
  userInfo: UserInfo | null;
  setTeachers: React.Dispatch<React.SetStateAction<TenantUser[]>>;
}

export default function TeachersSection({
  teachers,
  token,
  API_URL,
  userInfo,
  setTeachers,
}: TeachersSectionProps) {
  const [teacherSearch, setTeacherSearch] = useState("");
  const { dialogState, showAlert, showConfirm } = useDialog();

  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [teacherFirstName, setTeacherFirstName] = useState("");
  const [teacherLastName, setTeacherLastName] = useState("");
  const [teacherMiddleName, setTeacherMiddleName] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacherRole, setTeacherRole] = useState("SUBJECT_TEACHER");
  const [teacherPassword, setTeacherPassword] = useState("password123");

  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TenantUser | null>(null);
  const [editTeacherFirstName, setEditTeacherFirstName] = useState("");
  const [editTeacherLastName, setEditTeacherLastName] = useState("");
  const [editTeacherMiddleName, setEditTeacherMiddleName] = useState("");
  const [editTeacherPhone, setEditTeacherPhone] = useState("");
  const [editTeacherRole, setEditTeacherRole] = useState("SUBJECT_TEACHER");
  const [editTeacherPassword, setEditTeacherPassword] = useState("");

  const [showDeleteTeacherModal, setShowDeleteTeacherModal] = useState(false);
  const [deletingTeacherId, setDeletingTeacherId] = useState<number | null>(null);

  const [showImportTeachersModal, setShowImportTeachersModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddTeacherModal(false);
        setShowEditTeacherModal(false);
        setShowDeleteTeacherModal(false);
        setShowImportTeachersModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const safeFetchHeaders = () => {
    const sId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
    };
    if (sId) headers["X-School-ID"] = sId;
    return headers;
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherFirstName.trim() || !teacherLastName.trim() || !teacherPhone.trim() || !teacherPassword.trim()) {
      showAlert("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }
    setActionLoading(true);
    setActionError("");

    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(`${API_URL}/api/schools/users`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          first_name: teacherFirstName.trim(),
          last_name: teacherLastName.trim(),
          middle_name: teacherMiddleName.trim() || undefined,
          phone: teacherPhone.trim(),
          role_name: teacherRole,
          password: teacherPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'qituvchini qo'shib bo'lmadi");

      showAlert("O'qituvchi muvaffaqiyatli qo'shildi!");
      
      // Refresh teacher list
      const resList = await fetch(`${API_URL}/api/schools/teachers`, {
        headers: safeFetchHeaders(),
      });
      const dataList = await resList.json();
      if (resList.ok) setTeachers(Array.isArray(dataList) ? dataList : []);

      setShowAddTeacherModal(false);
      setTeacherFirstName("");
      setTeacherLastName("");
      setTeacherMiddleName("");
      setTeacherPhone("");
      setTeacherRole("SUBJECT_TEACHER");
      setTeacherPassword("password123");
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (!editTeacherFirstName.trim() || !editTeacherLastName.trim() || !editTeacherPhone.trim()) {
      showAlert("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }
    setActionLoading(true);
    setActionError("");

    try {
      const headers = safeFetchHeaders();
      headers["Content-Type"] = "application/json";

      const payload: any = {
        first_name: editTeacherFirstName.trim(),
        last_name: editTeacherLastName.trim(),
        middle_name: editTeacherMiddleName.trim() || undefined,
        phone: editTeacherPhone.trim(),
        role: editTeacherRole,
      };
      if (editTeacherPassword.trim()) {
        payload.password = editTeacherPassword.trim();
      }

      const response = await fetch(`${API_URL}/api/schools/teachers/${editingTeacher.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'qituvchi ma'lumotlarini yangilab bo'lmadi");

      // Refresh teacher list
      const resList = await fetch(`${API_URL}/api/schools/teachers`, {
        headers: safeFetchHeaders(),
      });
      const dataList = await resList.json();
      if (resList.ok) setTeachers(Array.isArray(dataList) ? dataList : []);

      setShowEditTeacherModal(false);
      setEditingTeacher(null);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!deletingTeacherId) return;
    setActionLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/schools/teachers/${deletingTeacherId}`, {
        method: "DELETE",
        headers: safeFetchHeaders(),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "O'qituvchini o'chirib bo'lmadi");

      // Refresh teacher list
      const resList = await fetch(`${API_URL}/api/schools/teachers`, {
        headers: safeFetchHeaders(),
      });
      const dataList = await resList.json();
      if (resList.ok) setTeachers(Array.isArray(dataList) ? dataList : []);

      setShowDeleteTeacherModal(false);
      setDeletingTeacherId(null);
    } catch (err: any) {
      showAlert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSheetUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setImportLoading(true);
    setImportError("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/api/schools/import/teachers`, {
        method: "POST",
        headers: safeFetchHeaders(),
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setImportResult(data);
        
        // Refresh teacher list
        const resList = await fetch(`${API_URL}/api/schools/teachers`, {
          headers: safeFetchHeaders(),
        });
        const dataList = await resList.json();
        if (resList.ok) setTeachers(Array.isArray(dataList) ? dataList : []);
      } else {
        setImportError(data.error || "Yuklashda xatolik yuz berdi");
      }
    } catch (err: any) {
      setImportError(err.message || "Fayl yuklashda xatolik");
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`${API_URL}/api/schools/import/template/teachers`, {
        headers: safeFetchHeaders(),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "shablon_o'qituvchilar.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        showAlert("Shablon yuklab olishda xatolik");
      }
    } catch (err) {
      console.error(err);
      showAlert("Serverga bog'lanishda xatolik");
    }
  };

  const closeSheetModal = () => {
    setShowImportTeachersModal(false);
    setSelectedFile(null);
    setImportResult(null);
    setImportError("");
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      `${t.first_name} ${t.last_name}`.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      (t.phone && t.phone.includes(teacherSearch))
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
              placeholder="Ism yoki telefon raqam bo'yicha..."
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 focus:ring-2 focus:ring-[#1D1E26] pl-9 pr-4 py-2 text-xs outline-none transition font-medium"
            />
          </div>
        </div>

        {/* Right: Stats + Actions */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <span className="text-xs text-slate-500 font-mono hidden sm:block">
            Jami: <strong className="text-[#1D1E26] font-extrabold">{teachers.length}</strong> ta
          </span>
          {userInfo?.role === "ADMIN" && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowImportTeachersModal(true)}
                className="bg-[#1D1E26] text-[#D4F562] hover:bg-slate-800 font-extrabold text-xs py-2.5 px-4 transition cursor-pointer"
              >
                Excel orqali yuklash
              </button>
              <button
                onClick={() => setShowAddTeacherModal(true)}
                className="bg-[#1D1E26] text-[#D4F562] hover:bg-slate-800 font-extrabold text-xs py-2.5 px-4 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                O'qituvchi qo'shish
              </button>
            </div>
          )}
        </div>
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 bg-white">
          <p className="text-slate-400 text-xs font-medium">O'qituvchilar topilmadi.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
              <tr>
                <th className="px-6 py-4">T/R</th>
                <th className="px-6 py-4">Ism Familiya</th>
                <th className="px-6 py-4">Telefon</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Qo'shilgan sana</th>
                {userInfo?.role === "ADMIN" && <th className="px-6 py-4 text-right">Amallar</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
              {filteredTeachers.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="px-6 py-4 font-bold text-[#1D1E26]">
                    {t.first_name} {t.last_name} {t.middle_name && <span className="text-slate-400 font-normal">({t.middle_name})</span>}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500 font-bold">{t.phone}</td>
                  <td className="px-6 py-4">
                    {t.role_name === "MAIN_TEACHER" ? (
                      <span className="bg-[#1D1E26] text-[#D4F562] font-extrabold text-[11px] px-2.5 py-1">
                        Sinf Rahbari
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-[#1D1E26] font-mono text-[11px] font-extrabold px-2.5 py-1">
                        Fan O'qituvchisi
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono">{new Date(t.created_at).toLocaleDateString()}</td>
                  {userInfo?.role === "ADMIN" && (
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingTeacher(t);
                          setEditTeacherFirstName(t.first_name);
                          setEditTeacherLastName(t.last_name);
                          setEditTeacherMiddleName(t.middle_name || "");
                          setEditTeacherPhone(t.phone || "");
                          setEditTeacherRole(t.role_name || "SUBJECT_TEACHER");
                          setEditTeacherPassword("");
                          setShowEditTeacherModal(true);
                        }}
                        title="Tahrirlash"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-[#1D1E26] transition cursor-pointer inline-flex items-center justify-center"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingTeacherId(t.id);
                          setShowDeleteTeacherModal(true);
                        }}
                        title="O'chirish"
                        className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition cursor-pointer inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Teacher */}
      {showAddTeacherModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddTeacherModal(false);
              setTeacherFirstName("");
              setTeacherLastName("");
              setTeacherMiddleName("");
              setTeacherPhone("");
              setTeacherRole("SUBJECT_TEACHER");
              setTeacherPassword("password123");
              setActionError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 p-6 shadow-2xl my-8 text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#1D1E26]">Yangi O'qituvchi Yaratish</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Yaratilgan o'qituvchini sinf va fanlarga biriktirishingiz mumkin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddTeacherModal(false);
                  setTeacherFirstName("");
                  setTeacherLastName("");
                  setTeacherMiddleName("");
                  setTeacherPhone("");
                  setTeacherRole("SUBJECT_TEACHER");
                  setTeacherPassword("password123");
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

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Ismi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Olim"
                    value={teacherFirstName}
                    onChange={(e) => setTeacherFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#1D1E26] transition font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Familiyasi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sodiqov"
                    value={teacherLastName}
                    onChange={(e) => setTeacherLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#1D1E26] transition font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Otasining ismi (sharif)</label>
                <input
                  type="text"
                  placeholder="Valiyevich"
                  value={teacherMiddleName}
                  onChange={(e) => setTeacherMiddleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#1D1E26] transition font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Telefon raqami *</label>
                <input
                  type="text"
                  required
                  placeholder="+998907654321"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#1D1E26] transition font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Rol (Lavozimi)</label>
                <select
                  value={teacherRole}
                  onChange={(e) => setTeacherRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#1D1E26] transition cursor-pointer font-bold"
                >
                  <option value="SUBJECT_TEACHER">Fan O'qituvchisi (Subject Teacher)</option>
                  <option value="MAIN_TEACHER">Sinf Rahbari (Main Teacher)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Parol (Default: password123) *</label>
                <PasswordInput
                  required
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTeacherModal(false);
                    setTeacherFirstName("");
                    setTeacherLastName("");
                    setTeacherMiddleName("");
                    setTeacherPhone("");
                    setTeacherRole("SUBJECT_TEACHER");
                    setTeacherPassword("password123");
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
                  {actionLoading ? "Qo'shilmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Teachers */}
      {showImportTeachersModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSheetModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-2xl bg-white border border-slate-200 p-6 shadow-2xl my-8 text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#1D1E26]">O'qituvchilarni Excel Orqali Import Qilish</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Excel fayli orqali o'qituvchilar ro'yxatini yuklash.</p>
              </div>
              <button
                type="button"
                onClick={closeSheetModal}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#1D1E26]">Excel shablonini ko'chirib oling</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">O'qituvchilar shablonini yuklab olib, ma'lumotlarni to'ldiring va qayta yuklang.</p>
              </div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="bg-[#1D1E26] hover:bg-slate-800 text-[#D4F562] text-xs font-extrabold py-2 px-4 transition cursor-pointer"
              >
                Shablonni yuklash
              </button>
            </div>

            {importError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 mb-4 font-medium">{importError}</div>
            )}

            {!importResult ? (
              <form onSubmit={handleSheetUpload} className="space-y-4">
                <div className="border border-dashed border-slate-200 p-8 text-center bg-slate-50/50 hover:border-slate-300 transition relative">
                  <input
                    type="file"
                    required
                    accept=".xlsx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#1D1E26]">
                      {selectedFile ? selectedFile.name : "Excel shablonini tanlang (.xlsx)"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">Maksimal hajm: 5MB</p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeSheetModal}
                    className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#1D1E26] font-extrabold py-2.5 px-4 transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading || !selectedFile}
                    className="text-xs bg-[#1D1E26] text-[#D4F562] hover:bg-slate-800 font-extrabold py-2.5 px-4 transition cursor-pointer disabled:opacity-50"
                  >
                    {importLoading ? "Yuklanmoqda..." : "Faylni yuklash"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 font-mono">
                  <div className="bg-[#1D1E26] text-[#D4F562] p-4 text-center">
                    <span className="text-[10px] font-bold block opacity-80">Qabul qilindi</span>
                    <span className="text-2xl font-black">{importResult.imported_count}</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 text-red-600 p-4 text-center">
                    <span className="text-[10px] font-bold block">Rad etildi</span>
                    <span className="text-2xl font-black">{importResult.failed_count}</span>
                  </div>
                  <div className="bg-slate-100 border border-slate-200 text-slate-700 p-4 text-center">
                    <span className="text-[10px] font-bold block">Status</span>
                    <span className="text-xs font-bold block mt-1">
                      {importResult.success ? "Hammasi to'g'ri" : "Xatolar mavjud"}
                    </span>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="border border-slate-200 overflow-hidden text-xs">
                    <div className="bg-slate-50 text-slate-400 px-4 py-2 uppercase font-mono font-extrabold text-[10px]">Row-by-Row Error Reports</div>
                    <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto bg-white">
                      {importResult.errors.map((err, i) => (
                        <div key={i} className="px-4 py-2 flex items-start space-x-2">
                          <span className="bg-red-50 text-red-600 px-2 py-0.5 font-mono text-[10px] font-bold">Satr {err.row}</span>
                          <span className="mt-0.5 text-slate-700">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeSheetModal}
                    className="text-xs bg-[#1D1E26] text-[#D4F562] hover:bg-slate-800 font-extrabold py-2.5 px-6 transition cursor-pointer"
                  >
                    Tugatish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Edit Teacher */}
      {showEditTeacherModal && editingTeacher && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditTeacherModal(false);
              setEditingTeacher(null);
              setActionError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 p-6 shadow-2xl my-8 text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#1D1E26]">O'qituvchini Tahrirlash</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  O'qituvchi ma'lumotlarini yangilash.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditTeacherModal(false);
                  setEditingTeacher(null);
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

            <form onSubmit={handleEditTeacher} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Ismi *</label>
                  <input
                    type="text"
                    required
                    value={editTeacherFirstName}
                    onChange={(e) => setEditTeacherFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#1D1E26] transition font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Familiyasi *</label>
                  <input
                    type="text"
                    required
                    value={editTeacherLastName}
                    onChange={(e) => setEditTeacherLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#1D1E26] transition font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Otasining ismi (sharif)</label>
                <input
                  type="text"
                  value={editTeacherMiddleName}
                  onChange={(e) => setEditTeacherMiddleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#1D1E26] transition font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Telefon raqami *</label>
                <input
                  type="text"
                  required
                  value={editTeacherPhone}
                  onChange={(e) => setEditTeacherPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#1D1E26] transition font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Rol (Lavozimi)</label>
                <select
                  value={editTeacherRole}
                  onChange={(e) => setEditTeacherRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#1D1E26] transition cursor-pointer font-bold"
                >
                  <option value="SUBJECT_TEACHER">Fan O'qituvchisi (Subject Teacher)</option>
                  <option value="MAIN_TEACHER">Sinf Rahbari (Main Teacher)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Yangi Parol (ixtiyoriy)</label>
                <PasswordInput
                  placeholder="O'zgarishsiz qoldirish uchun bo'sh qo'ying"
                  value={editTeacherPassword}
                  onChange={(e) => setEditTeacherPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditTeacherModal(false);
                    setEditingTeacher(null);
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

      {/* Modal: Delete Teacher */}
      {showDeleteTeacherModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteTeacherModal(false);
              setDeletingTeacherId(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md bg-white border border-slate-200 p-6 shadow-2xl text-[#1D1E26] space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-red-600">O'qituvchini o'chirish</h3>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteTeacherModal(false);
                  setDeletingTeacherId(null);
                }}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Haqiqatan ham ushbu o'qituvchini o'chirmoqchisiz? Barcha sinf va fan biriktiruvlari ham o'chiriladi.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteTeacherModal(false);
                  setDeletingTeacherId(null);
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#1D1E26] font-extrabold py-2.5 px-4 transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDeleteTeacher}
                disabled={actionLoading}
                className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "O'chirilmoqda..." : "O'chirishni tasdiqlash"}
              </button>
            </div>
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
