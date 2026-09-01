"use client";

import React from "react";
import { X } from "lucide-react";

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClubForSchedule: any;
  newScheduleDay: number;
  setNewScheduleDay: (day: number) => void;
  newScheduleStartTime: string;
  setNewScheduleStartTime: (time: string) => void;
  newScheduleEndTime: string;
  setNewScheduleEndTime: (time: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddScheduleModal: React.FC<AddScheduleModalProps> = ({
  isOpen,
  onClose,
  selectedClubForSchedule,
  newScheduleDay,
  setNewScheduleDay,
  newScheduleStartTime,
  setNewScheduleStartTime,
  newScheduleEndTime,
  setNewScheduleEndTime,
  onSubmit,
}) => {
  if (!isOpen || !selectedClubForSchedule) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 text-slate-900"
    >
      <div className="bg-white rounded-none max-w-sm w-full shadow-md overflow-hidden flex flex-col border border-neutral-200 animate-fadeIn text-slate-900">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-serif font-bold text-slate-900">Jadval qo'shish</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedClubForSchedule.name} to'garagi uchun
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
              Hafta kuni *
            </label>
            <select
              value={newScheduleDay}
              onChange={(e) => setNewScheduleDay(Number(e.target.value))}
              className="w-full text-xs border border-neutral-200 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-1 focus:ring-[#1E2B42] bg-white font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value={1}>Dushanba</option>
              <option value={2}>Seshanba</option>
              <option value={3}>Chorshanba</option>
              <option value={4}>Payshanba</option>
              <option value={5}>Juma</option>
              <option value={6}>Shanba</option>
              <option value={7}>Yakshanba</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                Boshlanish vaqti *
              </label>
              <input
                type="time"
                required
                value={newScheduleStartTime}
                onChange={(e) => setNewScheduleStartTime(e.target.value)}
                className="w-full text-xs border border-neutral-200 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-1 focus:ring-[#1E2B42] bg-white font-mono font-bold text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                Tugash vaqti *
              </label>
              <input
                type="time"
                required
                value={newScheduleEndTime}
                onChange={(e) => setNewScheduleEndTime(e.target.value)}
                className="w-full text-xs border border-neutral-200 rounded-none px-3.5 py-2.5 focus:border-[#1E2B42] focus:ring-1 focus:ring-[#1E2B42] bg-white font-mono font-bold text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-neutral-200 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-none text-xs font-bold cursor-pointer transition mt-2"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1E2B42] hover:bg-slate-700 text-white rounded-none text-xs font-bold cursor-pointer transition mt-2"
            >
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

