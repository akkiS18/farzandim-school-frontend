"use client";

import React from "react";
import { MessageSquare, X } from "lucide-react";

interface GradeOption {
  colId: string;
  colName: string;
  value: string;
}

interface GradeCommentItem {
  id: number;
  author_id: number;
  author_name?: string;
  gradeColName?: string;
  gradeVal?: string;
  content: string;
  created_at: string;
}

interface GradeCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudent: any;
  availableGradeOptions: GradeOption[];
  selectedGradeColIds: string[];
  onToggleGradeColId: (colId: string) => void;
  onToggleSelectAllGrades: () => void;
  gradeCommentsLoading: boolean;
  gradeCommentsList: GradeCommentItem[];
  newGradeCommentText: string;
  setNewGradeCommentText: (text: string) => void;
  commentSubmitting: boolean;
  onSubmitComment: (e: React.FormEvent) => void;
}

export default function GradeCommentModal({
  isOpen,
  onClose,
  selectedStudent,
  availableGradeOptions,
  selectedGradeColIds,
  onToggleGradeColId,
  onToggleSelectAllGrades,
  gradeCommentsLoading,
  gradeCommentsList,
  newGradeCommentText,
  setNewGradeCommentText,
  commentSubmitting,
  onSubmitComment,
}: GradeCommentModalProps) {
  if (!isOpen || !selectedStudent || availableGradeOptions.length === 0) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
    >
      <div className="w-full max-w-lg bg-white border border-zinc-200/80 rounded-none p-6 shadow-md text-zinc-900 space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[#1E2B42] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#1E2B42]" />
              <span>Baho bo'yicha izoh / xabar</span>
            </h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              {selectedStudent.first_name} {selectedStudent.last_name}
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

        {/* Grade Selector Multiple Choice Pills */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Qaysi baholar uchun izoh yozilmoqda (Multiple choice):
            </label>
            {availableGradeOptions.length > 1 && (
              <button
                type="button"
                onClick={onToggleSelectAllGrades}
                className="text-[10px] text-[#1E2B42] hover:text-[#A51C30] font-bold transition cursor-pointer"
              >
                {selectedGradeColIds.length === availableGradeOptions.length
                  ? "Barchasini bekor qilish"
                  : "Barchasini tanlash"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableGradeOptions.map((opt) => {
              const isChecked = selectedGradeColIds.includes(opt.colId);
              return (
                <button
                  key={opt.colId}
                  type="button"
                  onClick={() => onToggleGradeColId(opt.colId)}
                  className={`px-3.5 py-2 rounded-none text-xs font-bold transition cursor-pointer flex items-center gap-2.5 border select-none ${
                    isChecked
                      ? "bg-[#A51C30] text-white border-[#A51C30] shadow-xs"
                      : "bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-none flex items-center justify-center text-[10px] font-black border transition ${
                      isChecked
                        ? "bg-white text-[#A51C30] border-white"
                        : "border-zinc-300 bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </div>
                  <span>{opt.colName}:</span>
                  <span
                    className={`px-2 py-0.5 rounded-none text-xs font-mono font-black ${
                      isChecked ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-800"
                    }`}
                  >
                    {opt.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment Thread List */}
        <div className="max-h-56 overflow-y-auto space-y-3 p-1">
          {gradeCommentsLoading ? (
            <div className="py-8 text-center text-xs text-zinc-400 font-mono">
              Izohlar yuklanmoqda...
            </div>
          ) : gradeCommentsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400 italic bg-zinc-50 rounded-none">
              Ushbu baholar uchun hali izoh yozilmagan. Ilk izohni yozing.
            </div>
          ) : (
            gradeCommentsList.map((comm) => (
              <div
                key={comm.id}
                className="p-3 bg-zinc-50 border border-zinc-100 rounded-none text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-zinc-800">
                  <div className="flex items-center gap-2">
                    <span>{comm.author_name || `Foydalanuvchi #${comm.author_id}`}</span>
                    {comm.gradeColName && (
                      <span className="bg-slate-50 text-slate-700 border border-slate-200 px-1.5 py-0.5 text-[9px] rounded-none font-medium">
                        {comm.gradeColName} ({comm.gradeVal})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono font-normal">
                    {new Date(comm.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-zinc-700 leading-relaxed font-medium">{comm.content}</p>
              </div>
            ))
          )}
        </div>

        {/* New Comment Input */}
        <form onSubmit={onSubmitComment} className="pt-2 border-t border-zinc-100 space-y-3">
          <textarea
            required
            rows={2}
            placeholder="Tanlangan baholar bo'yicha izoh yoki ota-onaga bildirishnoma yozing..."
            value={newGradeCommentText}
            onChange={(e) => setNewGradeCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!commentSubmitting && selectedGradeColIds.length > 0 && newGradeCommentText.trim()) {
                  const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                  onSubmitComment(fakeEvent);
                }
              }
            }}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-none p-3 text-xs text-zinc-800 outline-none focus:ring-2 focus:border-[#1E2B42] focus:ring-0 focus:outline-none focus:ring-offset-0 focus:ring-inset font-medium resize-none leading-relaxed"
          ></textarea>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-none text-xs"
            >
              Yopish
            </button>
            <button
              type="submit"
              disabled={commentSubmitting || selectedGradeColIds.length === 0}
              className="px-5 py-2 bg-[#A51C30] hover:bg-[#8a1526] text-white font-bold rounded-none text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {commentSubmitting
                ? "Yuborilmoqda..."
                : `Izoh Qoldirish (${selectedGradeColIds.length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


