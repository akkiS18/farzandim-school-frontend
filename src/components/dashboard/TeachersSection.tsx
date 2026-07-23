import React, { useState } from "react";
import { TenantUser, UserInfo, ImportResult } from "./types";

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

  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [teacherFirstName, setTeacherFirstName] = useState("");
  const [teacherLastName, setTeacherLastName] = useState("");
  const [teacherMiddleName, setTeacherMiddleName] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacherRole, setTeacherRole] = useState("SUBJECT_TEACHER");
  const [teacherPassword, setTeacherPassword] = useState("password123");

  const [showImportTeachersModal, setShowImportTeachersModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

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

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherFirstName.trim() || !teacherLastName.trim() || !teacherPhone.trim() || !teacherPassword.trim()) {
      alert("Iltimos, barcha majburiy maydonlarni to'ldiring");
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

      alert("O'qituvchi muvaffaqiyatli qo'shildi!");
      
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
        alert("Shablon yuklab olishda xatolik");
      }
    } catch (err) {
      console.error(err);
      alert("Serverga bog'lanishda xatolik");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1D1E26] tracking-tight">O'qituvchilar Ro'yxati</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Maktabning barcha o'qituvchilari va ularning ma'lumotlarini boshqaring.
          </p>
        </div>
        {userInfo?.role === "ADMIN" && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowImportTeachersModal(true)}
              className="bg-[#1D1E26] text-white hover:bg-slate-800 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer"
            >
              Excel orqali yuklash
            </button>
            <button
              onClick={() => setShowAddTeacherModal(true)}
              className="bg-[#D4F562] text-[#1D1E26] font-black text-xs py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
            >
              + O'qituvchi qo'shish
            </button>
          </div>
        )}
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
          placeholder="Ism yoki telefon raqam bo'yicha..."
          value={teacherSearch}
          onChange={(e) => setTeacherSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#D4F562] shadow-xs transition"
        />
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <p className="text-slate-400 text-xs font-medium">O'qituvchilar topilmadi.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-mono">
              <tr>
                <th className="px-6 py-4">T/R</th>
                <th className="px-6 py-4">Ism Familiya</th>
                <th className="px-6 py-4">Telefon</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Qo'shilgan sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
              {filteredTeachers.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="px-6 py-4 font-bold text-[#1D1E26]">
                    {t.first_name} {t.last_name} {t.middle_name && <span className="text-slate-400 font-normal">({t.middle_name})</span>}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500">{t.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${
                      t.role_name === "MAIN_TEACHER"
                        ? "bg-[#ECFCCA] text-[#65A30D]"
                        : "bg-[#E0F2FE] text-[#0284C7]"
                    }`}>
                      {t.role_name === "MAIN_TEACHER" ? "Sinf Rahbari" : "Fan O'qituvchisi"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Teacher */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl my-8 text-[#1D1E26]">
            <h3 className="text-base font-black text-[#1D1E26] mb-1">Yangi O'qituvchi Yaratish</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Yaratilgan o'qituvchini sinf va fanlarga biriktirishingiz mumkin.</p>

            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-2xl mb-4 font-medium">{actionError}</div>
            )}

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Ismi</label>
                  <input
                    type="text"
                    required
                    placeholder="Olim"
                    value={teacherFirstName}
                    onChange={(e) => setTeacherFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Familiyasi</label>
                  <input
                    type="text"
                    required
                    placeholder="Sodiqov"
                    value={teacherLastName}
                    onChange={(e) => setTeacherLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Otang ismi (Ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Valiyevich"
                  value={teacherMiddleName}
                  onChange={(e) => setTeacherMiddleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Telefon raqami</label>
                <input
                  type="text"
                  required
                  placeholder="+998907654321"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Rol (Lavozimi)</label>
                <select
                  value={teacherRole}
                  onChange={(e) => setTeacherRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition cursor-pointer font-bold"
                >
                  <option value="SUBJECT_TEACHER">Fan O'qituvchisi (Subject Teacher)</option>
                  <option value="MAIN_TEACHER">Sinf Rahbari (Main Teacher)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono mb-1.5">Parol (Default: password123)</label>
                <input
                  type="password"
                  required
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#D4F562] transition"
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
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer"
                >
                  {actionLoading ? "Qo'shilmoqda..." : "Qo me'yorida qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Teachers */}
      {showImportTeachersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl my-8 text-[#1D1E26]">
            <h3 className="text-base font-black text-[#1D1E26] mb-1">O'qituvchilarni Excel Orqali Import Qilish</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Excel fayli orqali o'qituvchilar ro'yxatini yuklash.</p>

            <div className="bg-[#E0F2FE] border border-sky-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#0284C7]">Excel shablonini ko'chirib oling</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">O'qituvchilar shablonini yuklab olib, ma'lumotlarni to'ldiring va qayta yuklang.</p>
              </div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="bg-[#0284C7] hover:bg-sky-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs transition cursor-pointer"
              >
                📥 Shablonni Yuklash
              </button>
            </div>

            {importError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-2xl mb-4 font-medium">{importError}</div>
            )}

            {!importResult ? (
              <form onSubmit={handleSheetUpload} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 hover:border-slate-300 transition relative">
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
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading || !selectedFile}
                    className="text-xs bg-[#D4F562] text-[#1D1E26] font-black py-2.5 px-4 rounded-xl shadow-xs hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                  >
                    {importLoading ? "Yuklanmoqda..." : "Faylni yuklash"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 font-mono">
                  <div className="bg-[#ECFCCA] border border-lime-200 text-[#65A30D] rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-bold block">Qabul qilindi</span>
                    <span className="text-2xl font-black">{importResult.imported_count}</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-bold block">Rad etildi</span>
                    <span className="text-2xl font-black">{importResult.failed_count}</span>
                  </div>
                  <div className="bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-bold block">Status</span>
                    <span className="text-xs font-bold block mt-1">
                      {importResult.success ? "Hammasi to'g'ri" : "Xatolar mavjud"}
                    </span>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                    <div className="bg-slate-50 text-slate-400 px-4 py-2 uppercase font-mono font-extrabold text-[10px]">Row-by-Row Error Reports</div>
                    <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto bg-white">
                      {importResult.errors.map((err, i) => (
                        <div key={i} className="px-4 py-2 flex items-start space-x-2">
                          <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">Satr {err.row}</span>
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
                    className="text-xs bg-[#1D1E26] text-white font-bold py-2.5 px-6 rounded-xl transition cursor-pointer"
                  >
                    Tugatish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
