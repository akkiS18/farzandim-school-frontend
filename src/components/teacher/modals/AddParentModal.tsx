"use client";

import React, { useEffect } from "react";
import { X } from 'lucide-react';
import PasswordInput from '@/components/common/PasswordInput';

interface Student {
  id?: number;
  student_id?: number;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface AddParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  studentsTabList: any[];
  selectedStudentIdForAdd: number | "";
  setSelectedStudentIdForAdd: (val: number | "") => void;
  parentFirstName: string;
  setParentFirstName: (val: string) => void;
  parentLastName: string;
  setParentLastName: (val: string) => void;
  parentMiddleName: string;
  setParentMiddleName: (val: string) => void;
  parentPhone: string;
  setParentPhone: (val: string) => void;
  parentPassport: string;
  setParentPassport: (val: string) => void;
  parentPassword: string;
  setParentPassword: (val: string) => void;
  actionLoading: boolean;
}

export const AddParentModal: React.FC<AddParentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  studentsTabList,
  selectedStudentIdForAdd,
  setSelectedStudentIdForAdd,
  parentFirstName,
  setParentFirstName,
  parentLastName,
  setParentLastName,
  parentMiddleName,
  setParentMiddleName,
  parentPhone,
  setParentPhone,
  parentPassport,
  setParentPassport,
  parentPassword,
  setParentPassword,
  actionLoading,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-white border border-neutral-200 shadow-sm w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold font-serif text-[#1E2B42]">Yangi Vasiyni Bog'lash</h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Ota-onani ro'yxatdan o'tkazish va o'quvchiga biriktirish
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

        <div className="p-6 overflow-y-auto space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                O'quvchini tanlang *
              </label>
              <select
                required
                value={selectedStudentIdForAdd}
                onChange={(e) => setSelectedStudentIdForAdd(Number(e.target.value))}
                className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none cursor-pointer"
              >
                <option value="">-- O'quvchini tanlang --</option>
                {studentsTabList.map((st) => (
                  <option key={st.id || st.student_id} value={st.id || st.student_id}>
                    {st.first_name} {st.last_name} ({st.phone || "Telefon kiritilmagan"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                  Ism *
                </label>
                <input
                  type="text"
                  required
                  value={parentFirstName}
                  onChange={(e) => setParentFirstName(e.target.value)}
                  className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                  placeholder="Masalan: Asror"
                />
              </div>
              <div>
                <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                  Familiya *
                </label>
                <input
                  type="text"
                  required
                  value={parentLastName}
                  onChange={(e) => setParentLastName(e.target.value)}
                  className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                  placeholder="Masalan: Karimov"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                  Otasining ismi (Sharifi)
                </label>
                <input
                  type="text"
                  value={parentMiddleName}
                  onChange={(e) => setParentMiddleName(e.target.value)}
                  className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                  placeholder="Sharifini kiriting"
                />
              </div>
              <div>
                <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                  Telefon *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="new-password" name="off"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                  placeholder="Telefon raqamini kiriting"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                  Pasport
                </label>
                <input
                  type="text"
                  autoComplete="new-password" name="off"
                  value={parentPassport}
                  onChange={(e) => setParentPassport(e.target.value)}
                  className="w-full text-xs border border-neutral-300 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-0 bg-white font-sans text-slate-800 outline-none transition-colors"
                  placeholder="AA1234567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold font-sans text-slate-600 mb-1.5">
                  Parol *
                </label>
                {/* Yandex / Chrome autofill trap: absorbs the "username" autofill so it doesn't leak to Passport */}
                <input type="text" name="fakeusernameremembered" autoComplete="username" className="absolute w-0 h-0 opacity-0 -z-10" tabIndex={-1} aria-hidden="true" />
                <PasswordInput
                  autoComplete="new-password"
                  required
                  value={parentPassword}
                  onChange={(e) => setParentPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-neutral-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold font-sans cursor-pointer transition"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-[#A51C30] hover:bg-[#8a1526] text-white text-xs font-bold font-sans disabled:opacity-50 flex items-center space-x-2 cursor-pointer transition"
              >
                {actionLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-none animate-spin shrink-0"></span>}
                <span>Ota-onani bog'lash</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

