"use client";

import React from "react";
import { X, Award, ClipboardList, History, CalendarDays, Users, Save } from "lucide-react";

interface ClubGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClubForGrading: any;
  clubJournalTab: "grade" | "history";
  setClubJournalTab: (tab: "grade" | "history") => void;
  clubGradingDate: string;
  setClubGradingDate: (date: string) => void;
  onDateChange: (date: string) => void;
  clubGradingLoading: boolean;
  clubGradingStudents: any[];
  setClubGradingStudents: React.Dispatch<React.SetStateAction<any[]>>;
  savingClubGrades: boolean;
  onSaveClubGradesBatch: (e: React.FormEvent) => void;
  clubGradeHistoryLoading: boolean;
  clubGradeHistory: any[];
  fetchHistory: () => void;
}

export const ClubGradingModal: React.FC<ClubGradingModalProps> = ({
  isOpen,
  onClose,
  selectedClubForGrading,
  clubJournalTab,
  setClubJournalTab,
  clubGradingDate,
  setClubGradingDate,
  onDateChange,
  clubGradingLoading,
  clubGradingStudents,
  setClubGradingStudents,
  savingClubGrades,
  onSaveClubGradesBatch,
  clubGradeHistoryLoading,
  clubGradeHistory,
  fetchHistory,
}) => {
  if (!isOpen || !selectedClubForGrading) return null;

  const attendanceBadge = (att: string) => {
    if (att === "PRESENT")
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-none">
          Keldi
        </span>
      );
    if (att === "ABSENT")
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-none">
          Kelmadi
        </span>
      );
    if (att === "EXCUSED")
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-none">
          Sababli
        </span>
      );
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="bg-white rounded-none border border-zinc-200/80 shadow-md w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#16193E] text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <span>To'garak Jurnali va Baholash</span>
            </h3>
            <p className="text-xs text-zinc-400 font-medium">
              {selectedClubForGrading.name} — {selectedClubForGrading.subject_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-none bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-zinc-100 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setClubJournalTab("grade")}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition flex items-center gap-1.5 border-b-2 ${
              clubJournalTab === "grade"
                ? "border-purple-600 text-purple-700 bg-purple-50/60"
                : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Baholash
          </button>
          <button
            type="button"
            onClick={() => {
              setClubJournalTab("history");
              fetchHistory();
            }}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition flex items-center gap-1.5 border-b-2 ${
              clubJournalTab === "history"
                ? "border-purple-600 text-purple-700 bg-purple-50/60"
                : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            O'tgan Mashg'ulotlar
          </button>
        </div>

        {/* Tab: Grading */}
        {clubJournalTab === "grade" && (
          <form onSubmit={onSaveClubGradesBatch} className="p-5 overflow-y-auto space-y-4 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/60 border border-purple-200/60 p-4 rounded-none">
              <div>
                <label className="block text-[10px] font-extrabold text-purple-800 uppercase tracking-wider mb-1.5 font-mono">
                  Mashg'ulot Sanasi
                </label>
                <input
                  type="date"
                  required
                  value={clubGradingDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setClubGradingDate(newDate);
                    onDateChange(newDate);
                  }}
                  className="px-3.5 py-2 bg-white border border-purple-300 rounded-none text-xs font-extrabold text-purple-950 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <span className="text-xs text-purple-700 font-medium max-w-xs bg-purple-50 px-3 py-2 rounded-none border border-purple-200/60">
                Sana tanlang va o'quvchilarning davomati va baholarini kiriting.
              </span>
            </div>

            {clubGradingLoading ? (
              <div className="text-center py-12">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-none animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-zinc-400 font-mono">Yuklanmoqda...</p>
              </div>
            ) : clubGradingStudents.length === 0 ? (
              <div className="p-8 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-none text-zinc-500 text-xs font-medium space-y-1">
                <Users className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                <p className="font-bold text-zinc-800">O'quvchilar topilmadi</p>
                <p>
                  To'garakda hali rasman tasdiqlangan o'quvchilar yo'q. Avval "A'zolar" bo'limidan o'quvchilarni
                  qo'shing.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-zinc-200 rounded-none">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="p-3 font-extrabold text-zinc-500 uppercase tracking-wide text-[10px]">O'quvchi</th>
                      <th className="p-3 text-center font-extrabold text-zinc-500 uppercase tracking-wide text-[10px]">
                        Davomat
                      </th>
                      <th className="p-3 w-24 font-extrabold text-zinc-500 uppercase tracking-wide text-[10px]">Baho</th>
                      <th className="p-3 font-extrabold text-zinc-500 uppercase tracking-wide text-[10px]">Izoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {clubGradingStudents.map((st, idx) => (
                      <tr key={st.student_id} className="hover:bg-purple-50/30 transition">
                        <td className="p-3 font-bold text-zinc-900">
                          {st.student_name}
                          <span className="block text-[10px] text-zinc-400 font-medium">{st.class_name}</span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-zinc-100 p-1 rounded-none">
                            {(["PRESENT", "ABSENT", "EXCUSED"] as const).map((att) => (
                              <button
                                key={att}
                                type="button"
                                onClick={() =>
                                  setClubGradingStudents((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, attendance: att } : item))
                                  )
                                }
                                className={`px-2 py-1 rounded-none text-[10px] font-bold transition cursor-pointer ${
                                  st.attendance === att
                                    ? att === "PRESENT"
                                      ? "bg-emerald-600 text-white"
                                      : att === "ABSENT"
                                      ? "bg-rose-600 text-white"
                                      : "bg-amber-500 text-white"
                                    : "text-zinc-500 hover:text-zinc-900"
                                }`}
                              >
                                {att === "PRESENT" ? "Keldi" : att === "ABSENT" ? "Kelmadi" : "Sababli"}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="—"
                            value={st.score_value}
                            onChange={(e) => {
                              const val = e.target.value;
                              setClubGradingStudents((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, score_value: val } : item))
                              );
                            }}
                            className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-none text-xs font-black text-zinc-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-300 text-center"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Izoh..."
                            value={st.feedback}
                            onChange={(e) => {
                              const val = e.target.value;
                              setClubGradingStudents((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, feedback: val } : item))
                              );
                            }}
                            className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-none text-xs font-medium text-zinc-800 outline-none focus:border-purple-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-none text-xs font-bold hover:bg-zinc-200 transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={savingClubGrades || clubGradingStudents.length === 0}
                className="px-5 py-2 bg-purple-600 text-white rounded-none text-xs font-bold hover:bg-purple-700 transition cursor-pointer shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {savingClubGrades && (
                  <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-none animate-spin"></span>
                )}
                <Save className="w-3.5 h-3.5" />
                <span>Saqlash</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab: History */}
        {clubJournalTab === "history" && (
          <div className="p-5 overflow-y-auto flex-1 space-y-3">
            {clubGradeHistoryLoading ? (
              <div className="text-center py-12">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-none animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-zinc-400 font-mono">Tarix yuklanmoqda...</p>
              </div>
            ) : clubGradeHistory.length === 0 ? (
              <div className="p-10 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-none">
                <History className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                <p className="text-sm font-bold text-zinc-700">O'tgan mashg'ulotlar mavjud emas</p>
                <p className="text-xs text-zinc-400 font-medium mt-1">
                  Hozircha baholangan mashg'ulotlar yo'q yoki API history endpoint mavjud emas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {clubGradeHistory.map((session: any, si: number) => (
                  <div key={si} className="border border-zinc-200 rounded-none overflow-hidden">
                    <div className="bg-purple-50 border-b border-purple-100 px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-purple-800 flex items-center gap-2">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {new Date(session.lesson_date || session.date || "").toLocaleDateString("uz-UZ", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-[10px] font-mono text-purple-600">
                        {session.grades?.length || 0} ta o'quvchi
                      </span>
                    </div>
                    <div className="divide-y divide-zinc-100">
                      {(session.grades || []).map((g: any) => (
                        <div
                          key={g.student_id || g.id}
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50/60 transition text-xs"
                        >
                          <div>
                            <span className="font-bold text-zinc-900">{g.student_name}</span>
                            <span className="text-zinc-400 ml-2 font-medium">{g.class_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {attendanceBadge(g.attendance)}
                            {g.score_value && (
                              <span
                                className={`w-7 h-7 rounded-none flex items-center justify-center text-xs font-black border ${
                                  Number(g.score_value) >= 5
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : Number(g.score_value) >= 4
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : Number(g.score_value) >= 3
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }`}
                              >
                                {g.score_value}
                              </span>
                            )}
                            {g.feedback && (
                              <span className="text-[10px] text-zinc-500 font-medium italic max-w-[120px] truncate">
                                {g.feedback}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

