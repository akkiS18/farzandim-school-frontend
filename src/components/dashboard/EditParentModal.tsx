"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "@/lib/api";
import PasswordInput from "@/components/common/PasswordInput";

interface ParentData {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone?: string;
  passport?: string;
}

interface EditParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: ParentData | null;
  onSuccess: () => void;
}

export default function EditParentModal({
  isOpen,
  onClose,
  parent,
  onSuccess,
}: EditParentModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phone, setPhone] = useState("");
  const [passport, setPassport] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (parent) {
      setFirstName(parent.first_name || "");
      setLastName(parent.last_name || "");
      setMiddleName(parent.middle_name || "");
      setPhone(parent.phone || "");
      setPassport(parent.passport || "");
      setPassword("");
      setError("");
      setSuccessMsg("");
    }
  }, [parent, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !parent) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const trimmedPassword = password.trim();
    if (trimmedPassword && trimmedPassword.length < 6) {
      setError("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, any> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        middle_name: middleName.trim() || undefined,
        phone: phone.trim() || undefined,
        passport: passport.trim() || undefined,
      };

      if (trimmedPassword) {
        payload.password = trimmedPassword;
      }

      await api.put(`/api/schools/parents/${parent.id}`, payload);

      setSuccessMsg("Ota-ona ma'lumotlari muvaffaqiyatli yangilandi!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || "Ota-ona ma'lumotlarini yangilashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-white border border-neutral-200 shadow-xl max-w-sm sm:max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold font-serif text-[#1E2B42]">
              Ota-ona ma'lumotlarini tahrirlash
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Barcha kerakli maydonlarni to'ldiring
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-white hover:bg-slate-100 border border-neutral-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto bg-white">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#A51C30] text-xs font-sans">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-sans font-bold">
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                Familiya *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                placeholder="Familiyani kiriting"
              />
            </div>
            <div>
              <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                Ism *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                placeholder="Ismni kiriting"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
              Otasining ismi (sharif)
            </label>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
              placeholder="Otasining ismini kiriting"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                Telefon raqam
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                placeholder="+998901234567"
              />
            </div>
            <div>
              <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                Pasport seriyasi
              </label>
              <input
                type="text"
                value={passport}
                onChange={(e) => setPassport(e.target.value)}
                className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                placeholder="AA1234567"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
              Yangi parol (ixtiyoriy)
            </label>
            {/* Yandex / Chrome autofill trap */}
            <input
              type="text"
              name="fakeusernameremembered"
              autoComplete="username"
              className="absolute w-0 h-0 opacity-0 -z-10"
              tabIndex={-1}
              aria-hidden="true"
            />
            <PasswordInput
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="O'zgartirish shart bo'lmasa bo'sh qoldiring"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold font-sans cursor-pointer transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#A51C30] hover:bg-[#8a1526] text-white text-xs font-bold font-sans disabled:opacity-50 flex items-center space-x-2 cursor-pointer transition"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-none animate-spin shrink-0"></span>
              )}
              <span>Saqlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
