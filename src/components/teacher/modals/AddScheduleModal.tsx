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
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col border border-zinc-200/80 animate-fadeIn text-zinc-900">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#16193E]">Jadval qo'shish</h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              {selectedClubForSchedule.name} to'garagi uchun
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

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
              Hafta kuni *
            </label>
            <select
              value={newScheduleDay}
              onChange={(e) => setNewScheduleDay(Number(e.target.value))}
              className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-bold text-zinc-800 outline-none cursor-pointer"
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
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                Boshlanish vaqti *
              </label>
              <input
                type="time"
                required
                value={newScheduleStartTime}
                onChange={(e) => setNewScheduleStartTime(e.target.value)}
                className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                Tugash vaqti *
              </label>
              <input
                type="time"
                required
                value={newScheduleEndTime}
                onChange={(e) => setNewScheduleEndTime(e.target.value)}
                className="w-full text-xs border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-zinc-50/50 font-mono font-bold text-zinc-800 outline-none"
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
              className="px-5 py-2 bg-[#5B50EC] hover:bg-[#4A3FDB] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
            >
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
