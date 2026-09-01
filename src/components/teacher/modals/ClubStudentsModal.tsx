"use client";

import React from "react";
import { X } from "lucide-react";

interface ClubStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClubForStudents: any;
  searchStudentTerm: string;
  setSearchStudentTerm: (term: string) => void;
  filteredToDirectAdd: any[];
  onAddDirectStudent: (studentId: number) => void;
  clubStudentsLoading: boolean;
  clubStudents: any[];
  onApproveStudent: (studentId: number) => void;
  onRemoveStudent: (studentId: number) => void;
}

export const ClubStudentsModal: React.FC<ClubStudentsModalProps> = ({
  isOpen,
  onClose,
  selectedClubForStudents,
  searchStudentTerm,
  setSearchStudentTerm,
  filteredToDirectAdd,
  onAddDirectStudent,
  clubStudentsLoading,
  clubStudents,
  onApproveStudent,
  onRemoveStudent,
}) => {
  if (!isOpen || !selectedClubForStudents) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-none max-w-xl w-full shadow-md overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200/80 animate-fadeIn text-zinc-900">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#16193E]">A'zolar va Qo'shilish So'rovlari</h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              {selectedClubForStudents.name} to'garagi
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

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-900">
          {/* Direct Add Student Section */}
          <div className="bg-zinc-50 border border-zinc-200/70 rounded-none p-4 space-y-3">
            <h4 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wide">
              To'g'ridan-to'g'ri o'quvchi qo'shish
            </h4>
            <div className="flex items-center gap-2 bg-white border border-zinc-200/80 rounded-none px-3.5 py-2">
              <span className="text-zinc-400 text-xs">🔍</span>
              <input
                type="text"
                value={searchStudentTerm}
                onChange={(e) => setSearchStudentTerm(e.target.value)}
                placeholder="Ism-familiya bo'yicha qidirish..."
                className="bg-transparent border-none text-xs text-zinc-800 font-bold outline-none w-full focus:ring-0"
              />
            </div>

            <div className="max-h-44 overflow-y-auto border border-zinc-200/70 rounded-none bg-white divide-y divide-zinc-100">
              {filteredToDirectAdd.length === 0 ? (
                <p className="text-xs text-zinc-400 p-3 italic text-center">
                  {searchStudentTerm.trim()
                    ? "Qidiruv bo'yicha o'quvchi topilmadi"
                    : "Barcha o'quvchilar ushbu to'garakka a'zo bo'lgan"}
                </p>
              ) : (
                filteredToDirectAdd.map((st) => (
                  <div
                    key={st.id || st.student_id}
                    className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50/20 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-800">
                        {st.first_name} {st.last_name}
                      </span>
                      {st.class_name && (
                        <span className="px-2 py-0.5 rounded-none text-[10px] font-extrabold bg-slate-50 text-[#1E2B42] font-mono border border-slate-200">
                          {st.class_name}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddDirectStudent(st.student_id || st.id)}
                      className="bg-[#1E2B42] hover:bg-slate-800 text-white font-bold text-[10px] py-1 px-3 rounded-none transition cursor-pointer shadow-xs"
                    >
                      + Qo'shish
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* List of current requests & members */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wide">
              To'garakdagilar ro'yxati
            </h4>
            {clubStudentsLoading ? (
              <div className="text-center py-6">
                <div className="w-6 h-6 border-2 border-[#1E2B42] border-t-transparent rounded-none animate-spin mx-auto mb-1"></div>
                <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
              </div>
            ) : clubStudents.length === 0 ? (
              <p className="text-xs text-zinc-400 italic text-center py-6 bg-zinc-50 border border-dashed border-zinc-200 rounded-none">
                Hozircha a'zolar yoki so'rovlar mavjud emas.
              </p>
            ) : (
              <div className="border border-zinc-200/70 rounded-none overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-200/70 text-left text-xs bg-white">
                  <thead className="bg-[#fafafa] text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">F.I.SH</th>
                      <th className="px-4 py-2.5">Sinfi</th>
                      <th className="px-4 py-2.5">Holati</th>
                      <th className="px-4 py-2.5 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {clubStudents.map((cs) => (
                      <tr key={cs.id} className="hover:bg-zinc-50/50 transition">
                        <td className="px-4 py-2.5 font-bold text-zinc-900">{cs.student_name}</td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-zinc-500">{cs.class_name}</td>
                        <td className="px-4 py-2.5">
                          {cs.status === "PENDING" ? (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-none text-[10px] font-extrabold">
                              Kutilmoqda (Ariza)
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-none text-[10px] font-extrabold">
                              A'zo ✓
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right space-x-2">
                          {cs.status === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => onApproveStudent(cs.student_id)}
                              className="text-[10px] bg-[#1E2B42] hover:bg-slate-800 text-white font-bold py-1 px-2.5 rounded-none transition cursor-pointer"
                            >
                              Tasdiqlash
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onRemoveStudent(cs.student_id)}
                            className="text-[10px] bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-bold py-1 px-2.5 rounded-none transition cursor-pointer"
                          >
                            {cs.status === "PENDING" ? "Rad etish" : "Chiqarish"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-3 border-t border-zinc-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-none text-xs font-bold cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};

