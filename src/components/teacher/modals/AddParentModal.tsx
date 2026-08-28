"use client";

import React from "react";
import { X } from "lucide-react";

interface Student {
  id?: number;
  student_id?: number;
  first_name: string;
  last_name: string;
  phone?: string;
}

import PasswordInput from "@/components/common/PasswordInput";

interface AddParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  studentsTabList: Student[];
  selectedStudentIdForAdd: number | "";
  setSelectedStudentIdForAdd: (id: number) => void;
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
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-zinc-200/80 shadow-2xl rounded-3xl w-full max-w-xl overflow-hidden transition-all transform scale-100 flex flex-col max-h-[85vh] text-zinc-900 animate-fadeIn">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#16193E]">Yangi Ota-onani Bog'lash (Qo'shish)</h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Ota-onani ro'yxatdan o'tkazish va o'quvchiga biriktirish
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                O'quvchini tanlang *
              </label>
              <select
                required
                value={selectedStudentIdForAdd}
                onChange={(e) => setSelectedStudentIdForAdd(Number(e.target.value))}
                className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none cursor-pointer"
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
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Ism *
                </label>
                <input
                  type="text"
                  required
                  value={parentFirstName}
                  onChange={(e) => setParentFirstName(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                  placeholder="Masalan: Asror"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Familiya *
                </label>
                <input
                  type="text"
                  required
                  value={parentLastName}
                  onChange={(e) => setParentLastName(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                  placeholder="Masalan: Karimov"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Otasining ismi (Sharifi)
                </label>
                <input
                  type="text"
                  value={parentMiddleName}
                  onChange={(e) => setParentMiddleName(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none"
                  placeholder="Sharifini kiriting"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Telefon *
                </label>
                <input
                  type="text"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                  placeholder="Telefon raqamini kiriting"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Pasport
                </label>
                <input
                  type="text"
                  value={parentPassport}
                  onChange={(e) => setParentPassport(e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
                  placeholder="AA1234567"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Parol *
                </label>
                <PasswordInput
                  required
                  value={parentPassword}
                  onChange={(e) => setParentPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                {actionLoading && <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
                <span>Ota-onani bog'lash</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
