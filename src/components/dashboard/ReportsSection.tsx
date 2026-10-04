import React, { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { ClassItem, UserInfo } from "./types";

interface ReportsSectionProps {
  token: string;
  API_URL: string;
  classes: ClassItem[];
  userInfo: UserInfo | null;
}

export default function ReportsSection({ token, API_URL, classes, userInfo }: ReportsSectionProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownloadSocialPassport = async () => {
    if (!selectedClassId) {
      setError("Iltimos, sinfni tanlang.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const schoolId = typeof window !== "undefined" ? localStorage.getItem("school_id") || "" : "";
      const url = `${API_URL}/api/schools/reports/social-passport?class_id=${selectedClassId}`;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (schoolId) headers["X-School-ID"] = schoolId;

      const res = await fetch(url, { headers });

      if (!res.ok) {
        throw new Error("Hisobotni yuklab olishda xatolik yuz berdi");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const selectedClass = classes.find((c) => c.id.toString() === selectedClassId);
      a.download = `ijtimoiy_pasport_${selectedClass?.name || selectedClassId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans max-w-5xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50">
          <div>
            <h2 className="text-xl font-black text-[#1D1E26] tracking-tight">Hisobotlar</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Maktab bo'yicha barcha hisobotlarni shu yerdan yuklab oling.
            </p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Ijtimoiy Pasport Karta */}
          <div className="bg-white border border-slate-200 rounded-none p-5 flex flex-col h-full hover:border-indigo-300 hover:shadow-md transition">
            <div className="flex items-start space-x-3 mb-4">
              <div className="bg-indigo-50 p-2.5 rounded-none shrink-0 border border-indigo-100">
                <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#1D1E26]">Ijtimoiy pasport</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  Tanlangan sinf o'quvchilarining ota-onalar va yashash manzili haqidagi to'liq jadvali.
                </p>
              </div>
            </div>

            <div className="mt-auto space-y-3 pt-4 border-t border-slate-100">
              {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                  Sinfni tanlang *
                </label>
                <select
                  className="w-full text-sm border border-slate-200 rounded-none px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D1E26] font-bold text-slate-800 transition"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="" disabled>-- Sinfni tanlang --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleDownloadSocialPassport}
                disabled={loading || !selectedClassId}
                className="w-full flex items-center justify-center space-x-2 bg-[#1D1E26] text-[#D4F562] py-2.5 rounded-none font-bold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-[#D4F562] border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Yuklab olish</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Keyingi hisobotlar uchun bo'sh joy */}
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-none p-5 flex flex-col h-full items-center justify-center text-center">
            <div className="bg-slate-200 p-2.5 rounded-full mb-3">
              <FileSpreadsheet className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-500">Tez orada...</h3>
            <p className="text-xs text-slate-400 mt-1">
              Yangi hisobot turlari tez orada qo'shiladi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
