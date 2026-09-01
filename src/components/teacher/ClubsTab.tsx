"use client";

import React from "react";
import { Plus, Pencil, Trash2, MoreVertical, Users, Calendar, Award } from "lucide-react";

interface ClubItem {
  id: number;
  name: string;
  subject_id: number;
  subject_name: string;
  allowed_class_levels?: number[];
  schedules?: any[];
}

interface ClubsTabProps {
  clubs: ClubItem[];
  clubsLoading: boolean;
  openClubMenuId: number | null;
  setOpenClubMenuId: (id: number | null) => void;
  onOpenAddClubModal: () => void;
  onOpenEditClubModal: (club: ClubItem) => void;
  onDeleteClub: (clubId: number) => void;
  onOpenClubStudentsModal: (club: ClubItem) => void;
  onOpenAddScheduleModal: (club: ClubItem) => void;
  onOpenClubGradingModal: (club: ClubItem) => void;
  onDeleteSchedule: (scheduleId: number) => void;
}

export const ClubsTab: React.FC<ClubsTabProps> = ({
  clubs,
  clubsLoading,
  openClubMenuId,
  setOpenClubMenuId,
  onOpenAddClubModal,
  onOpenEditClubModal,
  onDeleteClub,
  onOpenClubStudentsModal,
  onOpenAddScheduleModal,
  onOpenClubGradingModal,
  onDeleteSchedule,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-white border border-zinc-200/70 rounded-none p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-900">
        <div>
          <h3 className="text-sm sm:text-base font-bold font-serif text-[#1E2B42]">To'garaklar (Fan To'garaklari)</h3>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Foydalanuvchilarga o'z fanlaringizdan to'garaklar tashkil qilish va jadvallarni boshqarish
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddClubModal}
            className="bg-[#1E2B42] hover:opacity-90 text-white font-bold text-xs py-2.5 px-4 rounded-none transition cursor-pointer flex items-center space-x-1.5 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi To'garak</span>
          </button>
        </div>
      </div>

      {clubsLoading ? (
        <div className="text-center py-16 bg-white border border-zinc-200/70 rounded-none shadow-sm">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-zinc-200/80 rounded-none">
          <p className="text-sm font-bold text-zinc-800 mb-1">To'garaklar mavjud emas</p>
          <p className="text-xs text-zinc-400 font-mono">
            Siz yaratgan to'garaklar hali yo'q. "Yangi To'garak" tugmasi orqali yaratishingiz mumkin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="bg-white border border-zinc-200/70 rounded-none p-5 sm:p-6 shadow-sm space-y-4 text-zinc-900 relative hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3.5">
                <div className="space-y-1 min-w-0 flex-1 pr-2">
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-none font-mono inline-block">
                    {club.subject_name}
                  </span>
                  <h4 className="text-base font-serif font-bold text-[#1E2B42] truncate">{club.name}</h4>
                  <p className="text-xs text-zinc-500 font-medium">
                    Ruxsat etilgan sinflar:{" "}
                    <b className="text-zinc-800">
                      {club.allowed_class_levels ? club.allowed_class_levels.join(", ") + "-sinflar" : "Barchasi"}
                    </b>
                  </p>
                </div>

                <div className={`relative flex items-center gap-1.5 shrink-0 club-menu-container-${club.id}`}>
                  {/* Desktop Edit & Delete buttons */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenEditClubModal(club)}
                      className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-none transition cursor-pointer flex items-center justify-center shadow-2xs hover:scale-105"
                      title="To'garakni tahrirlash"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteClub(club.id)}
                      className="p-2 sm:p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-none transition cursor-pointer flex items-center justify-center shadow-2xs hover:scale-105"
                      title="To'garakni o'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 3-dots Menu Button (MoreVertical) */}
                  <button
                    type="button"
                    onClick={() => setOpenClubMenuId(openClubMenuId === club.id ? null : club.id)}
                    className={`p-2 sm:p-2.5 rounded-none border transition cursor-pointer flex items-center justify-center shadow-2xs ${
                      openClubMenuId === club.id
                        ? "bg-[#1E2B42] border-indigo-600 text-white shadow-md scale-105"
                        : "bg-zinc-100/90 hover:bg-zinc-200/80 border-zinc-200/80 text-zinc-700 hover:text-zinc-900"
                    }`}
                    title="Boshqa amallar"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu Popup */}
                  {openClubMenuId === club.id && (
                    <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white/95 backdrop-blur-md border border-zinc-200/90 rounded-none shadow-xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 space-y-0.5 font-sans">
                      {/* Mobile-only Edit Option */}
                      <button
                        type="button"
                        onClick={() => onOpenEditClubModal(club)}
                        className="sm:hidden w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 rounded-none transition cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-none bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Pencil className="w-3.5 h-3.5" />
                        </div>
                        <span>To'garakni tahrirlash</span>
                      </button>

                      {/* Option 1: A'zolar va So'rovlar */}
                      <button
                        type="button"
                        onClick={() => onOpenClubStudentsModal(club)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 rounded-none transition cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-none bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <span>To'garak a'zolari</span>
                      </button>

                      {/* Option 2: Jadval qo'shish */}
                      <button
                        type="button"
                        onClick={() => onOpenAddScheduleModal(club)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 rounded-none transition cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-none bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <span>Dars jadvali</span>
                      </button>

                      {/* Option 3: Mashg'ulot jurnali va baholash */}
                      <button
                        type="button"
                        onClick={() => onOpenClubGradingModal(club)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-800 hover:bg-purple-50 hover:text-purple-700 rounded-none transition cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-none bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Award className="w-3.5 h-3.5" />
                        </div>
                        <span>To'garak jurnali & baholash</span>
                      </button>

                      {/* Mobile-only Delete Option */}
                      <div className="sm:hidden border-t border-zinc-100 pt-1 mt-1">
                        <button
                          type="button"
                          onClick={() => onDeleteClub(club.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-none transition cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-none bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </div>
                          <span>To'garakni o'chirish</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule list for the club */}
              <div className="space-y-2.5">
                <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#1E2B42]" />
                  <span>To'garak Jadvali</span>
                </h5>
                {!club.schedules || club.schedules.length === 0 ? (
                  <p className="text-xs text-zinc-400 font-medium italic bg-zinc-50/50 p-3 rounded-none border border-zinc-150">
                    Hali dars jadvali belgilanmagan
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {club.schedules.map((sch: any) => {
                      const days = [
                        "",
                        "Dushanba",
                        "Seshanba",
                        "Chorshanba",
                        "Payshanba",
                        "Juma",
                        "Shanba",
                        "Yakshanba",
                      ];
                      return (
                        <div
                          key={sch.id}
                          className="flex items-center justify-between bg-zinc-50/80 border border-zinc-200/70 p-3 rounded-none text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#1E2B42] block">{days[sch.day_of_week]}</span>
                            <span className="text-[11px] text-zinc-500 font-mono font-medium">
                              {sch.start_time} - {sch.end_time}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteSchedule(sch.id)}
                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-none transition cursor-pointer shrink-0"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubsTab;

