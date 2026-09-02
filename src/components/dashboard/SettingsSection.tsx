"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CustomDialogModal from "@/components/CustomDialogModal";

interface SettingsSectionProps {
  token: string;
  API_URL: string;
}

export default function SettingsSection({ token, API_URL }: SettingsSectionProps) {
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Yangi parollar mos kelmadi");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/api/schools/settings/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Parolni o'zgartirib bo'lmadi");
      }

      setSuccess(data.message || "Parol muvaffaqiyatli o'zgartirildi!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("school_token");
    localStorage.removeItem("school_refresh_token");
    localStorage.removeItem("school_id");
    localStorage.removeItem("school_user");
    router.push("/login");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-[#1D1E26]">Sozlamalar</h2>
      </div>

      <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-slate-200/60">
        <h3 className="text-lg font-bold text-[#1D1E26] mb-2">Profil parolini o'zgartirish</h3>
        <p className="text-sm text-slate-500 mb-8 max-w-prose">
          Xavfsizlik maqsadida eski parolingizni kiritib, yangi parol o'rnating. Parolingiz kamida 6 ta belgidan iborat bo'lishi tavsiya etiladi.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-2xl mb-6 font-medium flex items-center space-x-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-[#ECFCCA] border border-lime-200 text-[#65A30D] text-sm p-4 rounded-2xl mb-6 font-bold flex items-center space-x-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Eski Parol</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#D4F562] focus:bg-white transition-all min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Yangi Parol</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#D4F562] focus:bg-white transition-all min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Yangi Parolni Tasdiqlang</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#D4F562] focus:bg-white transition-all min-h-[44px]"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto min-h-[44px] text-sm bg-[#D4F562] hover:bg-[#c2e44f] text-[#1D1E26] font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Yangilanmoqda..." : "Parolni Yangilash"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-red-50/50 rounded-[24px] p-6 sm:p-8 border border-red-100">
        <h3 className="text-lg font-bold text-red-700 mb-2">Tizimdan chiqish</h3>
        <p className="text-sm text-red-600/80 mb-6 max-w-prose">
          Qurilmangizdagi sessiyani yakunlash va akkauntdan chiqish. Keyingi safar kirish uchun profilingiz parolini kiritishingiz kerak bo'ladi.
        </p>
        
        <button
          onClick={() => setShowLogoutModal(true)}
          className="min-h-[44px] text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          Tizimdan chiqish
        </button>
      </div>

      <CustomDialogModal
        isOpen={showLogoutModal}
        type="danger"
        title="Tizimdan chiqish"
        message="Haqiqatan ham tizimdan chiqmoqchimisiz? Keyingi safar qayta tizimga kirish talab qilinadi."
        confirmText="Chiqish"
        cancelText="Bekor qilish"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
