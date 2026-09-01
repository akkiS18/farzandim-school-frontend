"use client";

import React from "react";
import { X } from "lucide-react";

interface Subject {
  id: number;
  name: string;
}

interface EditClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClub: any;
  editClubName: string;
  setEditClubName: (val: string) => void;
  editClubSubjectId: number | "";
  setEditClubSubjectId: (val: number | "") => void;
  editClubAllowedLevels: number[];
  setEditClubAllowedLevels: (levels: number[]) => void;
  subjects: Subject[];
  actionLoading: boolean;
  actionError: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export const EditClubModal: React.FC<EditClubModalProps> = ({
  isOpen,
  onClose,
  editingClub,
  editClubName,
  setEditClubName,
  editClubSubjectId,
  setEditClubSubjectId,
  editClubAllowedLevels,
  setEditClubAllowedLevels,
  subjects,
  actionLoading,
  actionError,
  onSubmit,
}) => {
  if (!isOpen || !editingClub) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-none max-w-md w-full shadow-md overflow-hidden flex flex-col border border-zinc-200/80 animate-fadeIn text-zinc-900">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#16193E]">To'garakni tahrirlash</h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              To'garak nomi, fani va sinf darajalarini o'zgartirish
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-none bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {actionError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-none">
            {actionError}
          </div>
        )}

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
              To'garak nomi *
            </label>
            <input
              type="text"
              required
              value={editClubName}
              onChange={(e) => setEditClubName(e.target.value)}
              className="w-full text-xs border border-zinc-200 rounded-none px-3.5 py-2.5 focus:ring-2 focus:ring-[#1E2B42] bg-zinc-50/50 font-bold text-zinc-800 outline-none"
              placeholder="Masalan: IT scratch to'garagi"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
              Biriktirilgan fan *
            </label>
            <select
              required
              value={editClubSubjectId}
              onChange={(e) => setEditClubSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full text-xs border border-zinc-200 rounded-none px-3.5 py-2.5 focus:ring-2 focus:ring-[#1E2B42] bg-zinc-50/50 font-bold text-zinc-800 outline-none cursor-pointer"
            >
              <option value="">Fanni tanlang</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
              Ruxsat etilgan sinflar *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => {
                const isSelected = editClubAllowedLevels.includes(lvl);
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setEditClubAllowedLevels(editClubAllowedLevels.filter((l) => l !== lvl));
                      } else {
                        setEditClubAllowedLevels([...editClubAllowedLevels, lvl].sort((a, b) => a - b));
                      }
                    }}
                    className={`py-1.5 px-2 rounded-none text-xs font-extrabold transition cursor-pointer border ${
                      isSelected
                        ? "bg-[#1E2B42] text-white border-[#1E2B42] shadow-xs"
                        : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    {lvl}-sinf
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-none text-xs font-bold cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-[#1E2B42] hover:bg-slate-800 text-white rounded-none text-xs font-bold cursor-pointer shadow-xs"
            >
              {actionLoading ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

