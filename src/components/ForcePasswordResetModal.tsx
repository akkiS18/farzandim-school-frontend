"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff, ShieldAlert, KeyRound } from "lucide-react";
import api from "@/lib/api";

interface ForcePasswordResetModalProps {
  onSuccess: () => void;
}

export const ForcePasswordResetModal: React.FC<ForcePasswordResetModalProps> = ({ onSuccess }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!oldPassword) {
      setError("Hozirgi vaqtinchalik parol kiritilishi shart");
      return;
    }
    if (newPassword.length < 6) {
      setError("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Yangi parollar bir-biriga mos kelmadi");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/schools/auth/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      });

      // Update local storage user object
      const savedUserStr = localStorage.getItem("school_user");
      if (savedUserStr) {
        const userObj = JSON.parse(savedUserStr);
        userObj.password_reset_required = false;
        localStorage.setItem("school_user", JSON.stringify(userObj));
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Parolni o'zgartirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-100 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 bg-amber-50 border border-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
            <KeyRound className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-lg font-extrabold text-zinc-900 tracking-tight">XAVFSIZLIK TALABI</h2>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
            Siz vaqtinchalik paroldan foydalanmoqdasiz. Tizim xavfsizligini ta'minlash uchun yangi parol o'rnating.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3.5 flex items-start space-x-2.5 text-rose-800">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="text-xs font-bold leading-normal">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Old Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase font-mono tracking-wider">
              Hozirgi vaqtinchalik parol
            </label>
            <div className="relative">
              <input
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Parolni kiriting"
                disabled={loading}
                className="w-full pl-3.5 pr-10 py-3 rounded-2xl border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-zinc-900 placeholder-zinc-400 outline-none transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-3.5 text-zinc-400 hover:text-zinc-600 transition"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase font-mono tracking-wider">
              Yangi parol
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi"
                disabled={loading}
                className="w-full pl-3.5 pr-10 py-3 rounded-2xl border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-zinc-900 placeholder-zinc-400 outline-none transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-3.5 text-zinc-400 hover:text-zinc-600 transition"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase font-mono tracking-wider">
              Yangi parolni tasdiqlang
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Parolni qayta kiriting"
                disabled={loading}
                className="w-full pl-3.5 pr-10 py-3 rounded-2xl border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-zinc-900 placeholder-zinc-400 outline-none transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3.5 text-zinc-400 hover:text-zinc-600 transition"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Parolni Saqlash</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
