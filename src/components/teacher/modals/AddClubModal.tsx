"use client";

import React from "react";
import { X } from "lucide-react";

interface Subject {
  id: number;
  name: string;
}

interface AddClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newClubName: string;
  setNewClubName: (name: string) => void;
  newClubSubjectId: number | "";
  setNewClubSubjectId: (id: number) => void;
  newClubAllowedLevels: number[];
  setNewClubAllowedLevels: (levels: number[]) => void;
  subjects: Subject[];
  clubsError: string | null;
  clubsSuccess: string | null;
}

export const AddClubModal: React.FC<AddClubModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  newClubName,
  setNewClubName,
  newClubSubjectId,
  setNewClubSubjectId,
  newClubAllowedLevels,
  setNewClubAllowedLevels,
  subjects,
  clubsError,
  clubsSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-none max-w-md w-full shadow-md overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200/80 animate-fadeIn">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#16193E]">Yangi To'garak Yaratish</h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">Fan to'garagini tashkil etish</p>
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

        <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-4">
          {clubsError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-none">
              {clubsError}
            </div>
          )}
          {clubsSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-none">
              {clubsSuccess}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
              To'garak nomi *
            </label>
            <input
              type="text"
              required
              value={newClubName}
              onChange={(e) => setNewClubName(e.target.value)}
              className="w-full text-xs border border-zinc-200 rounded-none px-3.5 py-2.5 focus:ring-2 focus:ring-[#1E2B42] bg-zinc-50/50 font-bold text-zinc-800 outline-none"
              placeholder="Masalan: Yosh Fiziklar"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
              Fan *
            </label>
            <select
              required
              value={newClubSubjectId}
              onChange={(e) => setNewClubSubjectId(Number(e.target.value))}
              className="w-full text-xs border border-zinc-200 rounded-none px-3.5 py-2.5 focus:ring-2 focus:ring-[#1E2B42] bg-zinc-50/50 font-bold text-zinc-800 outline-none cursor-pointer"
            >
              <option value="">-- Fanni tanlang --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
              Ruxsat etilgan sinflar (Level)*
            </label>
            <div className="grid grid-cols-4 gap-2 border border-zinc-200/70 p-3 rounded-none bg-zinc-50/30">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lvl) => {
                const isChecked = newClubAllowedLevels.includes(lvl);
                return (
                  <label key={lvl} className="flex items-center space-x-1.5 text-xs font-bold text-zinc-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewClubAllowedLevels([...newClubAllowedLevels, lvl]);
                        } else {
                          setNewClubAllowedLevels(newClubAllowedLevels.filter((x) => x !== lvl));
                        }
                      }}
                      className="w-3.5 h-3.5 text-[#1E2B42] border-zinc-300 rounded focus:ring-0 cursor-pointer"
                    />
                    <span>{lvl}-sinf</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-none text-xs font-bold cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1E2B42] hover:bg-slate-800 text-white rounded-none text-xs font-bold cursor-pointer shadow-xs"
            >
              Tashkil qilish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

