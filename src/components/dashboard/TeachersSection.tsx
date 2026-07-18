import React, { useState } from "react";
import { TenantUser, UserInfo, RowError, ImportResult } from "./types";

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

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherFirstName.trim() || !teacherLastName.trim() || !teacherPhone.trim() || !teacherPassword.trim()) {
      alert("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }
    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`${API_URL}/api/schools/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
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
        headers: { "Authorization": `Bearer ${token}` },
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
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setImportResult(data);
        
        // Refresh teacher list
        const resList = await fetch(`${API_URL}/api/schools/teachers`, {
          headers: { "Authorization": `Bearer ${token}` },
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
        headers: { "Authorization": `Bearer ${token}` },
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">O'qituvchilar Ro'yxati</h1>
          <p className="text-xs text-zinc-500 mt-1">Maktabning barcha o'qituvchilari va ularning ma'lumotlarini boshqaring.</p>
        </div>
        {userInfo?.role === "ADMIN" && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowImportTeachersModal(true)}
              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-indigo-400 font-semibold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
            >
              Excel orqali yuklash
            </button>
            <button
              onClick={() => setShowAddTeacherModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
            >
              + O'qituvchi qo'shish
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm w-full">
        <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500 pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Ism yoki telefon raqam bo'yicha..."
          value={teacherSearch}
          onChange={(e) => setTeacherSearch(e.target.value)}
          className="w-full bg-zinc-950/40 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition"
        />
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800/60 rounded-3xl bg-zinc-950/10">
          <p className="text-zinc-500 text-sm">O'qituvchilar topilmadi.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800/60 bg-[#0d0d12]/30 backdrop-blur-xl">
          <table className="min-w-full divide-y divide-zinc-800/60 text-left">
            <thead className="bg-zinc-900/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">T/R</th>
                <th className="px-6 py-4">Ism Familiya</th>
                <th className="px-6 py-4">Telefon</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Qo'shilgan sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40 text-xs text-zinc-300">
              {filteredTeachers.map((t, idx) => (
                <tr key={t.id} className="hover:bg-zinc-900/10 transition">
                  <td className="px-6 py-4 text-zinc-500 font-mono">{idx + 1}</td>
                  <td className="px-6 py-4 font-semibold text-zinc-200">
                    {t.first_name} {t.last_name} {t.middle_name && <span className="text-zinc-500 font-normal">({t.middle_name})</span>}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-400">{t.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                      t.role_name === "MAIN_TEACHER"
                        ? "bg-indigo-950/40 text-indigo-400 border-indigo-900/20"
                        : "bg-blue-950/40 text-blue-400 border-blue-900/20"
                    }`}>
                      {t.role_name === "MAIN_TEACHER" ? "Sinf Rahbari" : "Fan O'qituvchisi"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 font-mono">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Teacher */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8">
            <h3 className="text-md font-bold text-zinc-200 mb-2">Yangi O'qituvchi Yaratish</h3>
            <p className="text-[11px] text-zinc-500 mb-6">Yaratilgan o'qituvchini istalgan sinf va fanlarga keyinchalik biriktirishingiz mumkin.</p>

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{actionError}</div>
            )}

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Ismi</label>
                  <input
                    type="text"
                    required
                    placeholder="Olim"
                    value={teacherFirstName}
                    onChange={(e) => setTeacherFirstName(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Familiyasi</label>
                  <input
                    type="text"
                    required
                    placeholder="Sodiqov"
                    value={teacherLastName}
                    onChange={(e) => setTeacherLastName(e.target.value)}
                    className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Otang ismi (Ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Valiyevich"
                  value={teacherMiddleName}
                  onChange={(e) => setTeacherMiddleName(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Telefon raqami</label>
                <input
                  type="text"
                  required
                  placeholder="+998907654321"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Rol (Lavozimi)</label>
                <select
                  value={teacherRole}
                  onChange={(e) => setTeacherRole(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800 focus:border-blue-500 text-zinc-100 rounded-xl px-3 py-2.5 text-sm outline-none transition cursor-pointer"
                >
                  <option value="SUBJECT_TEACHER">Fan O'qituvchisi (Subject Teacher)</option>
                  <option value="MAIN_TEACHER">Sinf Rahbari (Main Teacher)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-2">Parol (Default: password123)</label>
                <input
                  type="password"
                  required
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  className="w-full bg-[#181820]/60 border border-zinc-800/80 focus:border-blue-500 text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
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
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? "Qo'shilmoqda..." : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Teachers */}
      {showImportTeachersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0f0f15]/95 border border-zinc-800 rounded-2xl p-6 shadow-2xl my-8">
            <h3 className="text-md font-bold text-zinc-200 mb-2">O'qituvchilarni Excel Orqali Import Qilish</h3>
            <p className="text-[11px] text-zinc-505 mb-6">Excel fayli orqali o'qituvchilar ro'yxatini yuklash.</p>

            <div className="bg-[#4f46e5]/10 border border-[#4f46e5]/20 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-400">Excel shablonini ko'chirib oling</h4>
                <p className="text-[10px] text-zinc-550 mt-0.5">O'qituvchilar shablonini yuklab olib, ma'lumotlarni to'ldiring va qayta yuklang.</p>
              </div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition cursor-pointer"
              >
                📥 Shablonni Yuklash
              </button>
            </div>

            {importError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">{importError}</div>
            )}

            {!importResult ? (
              <form onSubmit={handleSheetUpload} className="space-y-4">
                <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center bg-zinc-950/20 hover:border-zinc-700 transition relative">
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
                    <div className="text-2xl">👨‍🏫</div>
                    <p className="text-sm text-zinc-305">
                      {selectedFile ? selectedFile.name : "Excel shablonini tanlang (.xlsx)"}
                    </p>
                    <p className="text-xs text-zinc-505">Maksimal hajm: 5MB</p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
                  <button
                    type="button"
                    onClick={closeSheetModal}
                    className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading || !selectedFile}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {importLoading ? "Yuklanmoqda..." : "Faylni yuklash"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Qabul qilindi</span>
                    <span className="text-2xl font-bold">{importResult.imported_count}</span>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Rad etildi</span>
                    <span className="text-2xl font-bold">{importResult.failed_count}</span>
                  </div>
                  <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-zinc-500 block">Status</span>
                    <span className="text-xs font-semibold block mt-1">
                      {importResult.success ? "✅ Hammasi to'g'ri" : "⚠️ Xatolar mavjud"}
                    </span>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="border border-zinc-850 rounded-xl overflow-hidden text-xs">
                    <div className="bg-zinc-950/60 text-zinc-400 px-4 py-2 uppercase font-semibold">Row-by-Row Error Reports</div>
                    <div className="divide-y divide-zinc-800 max-h-40 overflow-y-auto bg-zinc-950/10">
                      {importResult.errors.map((err, i) => (
                        <div key={i} className="px-4 py-2 flex items-start space-x-2">
                          <span className="bg-red-950/40 text-red-400 px-1.5 py-0.5 rounded font-mono">Satr {err.row}</span>
                          <span className="mt-0.5 text-zinc-300">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-4 border-t border-zinc-800/60">
                  <button
                    type="button"
                    onClick={closeSheetModal}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-xl transition cursor-pointer"
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
