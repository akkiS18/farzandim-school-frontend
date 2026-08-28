"use client";

import React, { useState } from "react";
import { Settings, Save, Lock, LogOut } from "lucide-react";

import api from "@/lib/api";

import PasswordInput from "@/components/common/PasswordInput";

interface TeacherSettingsTabProps {
  token: string;
  API_URL: string;
  userInfo: any;
  setUserInfo: (user: any) => void;
  setToast: (toast: { type: "success" | "error"; message: string } | null) => void;
  onLogoutClick: () => void;
}

export default function TeacherSettingsTab({
  userInfo,
  setUserInfo,
  setToast,
  onLogoutClick,
}: TeacherSettingsTabProps) {
  const [profileFirstName, setProfileFirstName] = useState(userInfo?.first_name || "");
  const [profileLastName, setProfileLastName] = useState(userInfo?.last_name || "");
  const [profileOldPassword, setProfileOldPassword] = useState("");
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const handleUpdateProfile = async () => {
    try {
      setProfileLoading(true);
      await api.put(`/api/schools/teachers/${userInfo?.id}`, {
        first_name: profileFirstName,
        last_name: profileLastName,
      });

      const updatedUser = {
        ...userInfo,
        first_name: profileFirstName,
        last_name: profileLastName,
      };
      setUserInfo(updatedUser);
      localStorage.setItem("school_user", JSON.stringify(updatedUser));
      setToast({ type: "success", message: "Profil ma'lumotlari yangilandi!" });
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Xatolik yuz berdi" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!profileOldPassword || !profileNewPassword || !profileConfirmPassword) {
      setToast({ type: "error", message: "Iltimos, barcha parol maydonlarini to'ldiring!" });
      return;
    }
    if (profileNewPassword !== profileConfirmPassword) {
      setToast({ type: "error", message: "Yangi parollar bir-biriga mos kelmadi!" });
      return;
    }
    if (profileNewPassword.length < 6) {
      setToast({
        type: "error",
        message: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak!",
      });
      return;
    }
    try {
      setProfileLoading(true);
      await api.post("/api/schools/change-password", {
        old_password: profileOldPassword,
        new_password: profileNewPassword,
      });

      setProfileOldPassword("");
      setProfileNewPassword("");
      setProfileConfirmPassword("");
      setToast({ type: "success", message: "Parol muvaffaqiyatli o'zgartirildi!" });
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Xatolik yuz berdi" });
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn pb-36 text-zinc-900">
      <div className="bg-white border border-zinc-200/70 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#16193E] flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              <span>Sozlamalar va Profil</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Shaxsiy ma'lumotlaringizni tahrirlang va tizim sozlamalarini boshqaring.
            </p>
          </div>
        </div>

        {/* Profile info form */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 font-mono">
            Profil ma'lumotlari
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Ismingiz</label>
              <input
                type="text"
                value={profileFirstName}
                onChange={(e) => setProfileFirstName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Familiyangiz</label>
              <input
                type="text"
                value={profileLastName}
                onChange={(e) => setProfileLastName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleUpdateProfile}
            disabled={profileLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{profileLoading ? "Saqlanmoqda..." : "Profilni saqlash"}</span>
          </button>
        </div>

        {/* Password Change form */}
        <div className="border-t border-zinc-100 pt-6 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 font-mono">
            Parolni o'zgartirish
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Eski parol</label>
              <PasswordInput
                placeholder="••••••••"
                value={profileOldPassword}
                onChange={(e) => setProfileOldPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Yangi parol</label>
              <PasswordInput
                placeholder="••••••••"
                value={profileNewPassword}
                onChange={(e) => setProfileNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Yangi parolni tasdiqlash
              </label>
              <PasswordInput
                placeholder="••••••••"
                value={profileConfirmPassword}
                onChange={(e) => setProfileConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleChangePassword}
            disabled={profileLoading}
            className="bg-zinc-800 hover:bg-zinc-900 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Lock className="w-4 h-4" />
            <span>Parolni yangilash</span>
          </button>
        </div>

        {/* System Logout Button Section */}
        <div className="border-t border-zinc-100 pt-6 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-red-600 font-mono">
            Tizimdan Chiqish
          </h3>
          <p className="text-xs text-zinc-500 font-medium">
            Platformadagi sessiyangizni yakunlash va akkauntdan chiqish uchun pastdagi tugmani
            bosing.
          </p>
          <button
            type="button"
            onClick={onLogoutClick}
            className="bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer border border-red-200 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Akkauntdan Chiqish</span>
          </button>
        </div>
      </div>
    </div>
  );
}
